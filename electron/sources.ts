import { zipSync, strToU8 } from 'fflate';
import { XMOJ_ORIGIN, type AcCodeEntry, type ExportResult, } from '../src/shared/types.ts';
import type { HttpClient } from './http.ts';
import { isLoginGate, parseStatusPage } from './parsers.ts';
import { parse } from 'node-html-parser';
import type { JudgeDetails, JudgeTest } from '../src/shared/types.ts';
export function parseJudgeDetails(html: string): JudgeDetails {
    const tests: JudgeTest[] = [];
    const status: Record<number, string> = { 0: 'Pending', 1: 'Pending', 2: 'Compiling', 3: 'Running', 4: 'AC', 5: 'PE', 6: 'WA', 7: 'TLE', 8: 'MLE', 9: 'OLE', 10: 'RE', 11: 'CE', 12: 'Compile OK', 13: 'Testing', 14: 'Skipped', 15: 'Ignored' };
    const start = /\bvar\s+json\s*=\s*/.exec(html);
    if (start) {
        const offset = start.index + start[0].length;
        let depth = 0, quoted = false, escaped = false;
        for (let i = offset; i < html.length; i++) {
            const c = html[i];
            if (quoted) {
                if (escaped) escaped = false;
                else if (c === '\\') escaped = true;
                else if (c === '"') quoted = false;
            } else if (c === '"') quoted = true;
            else if (c === '{') depth++;
            else if (c === '}' && --depth === 0) {
                try {
                    const data = JSON.parse(html.slice(offset, i + 1));
                    const add = (task: Record<string, unknown>, group: string | null) => {
                        if (!task || typeof task !== 'object') return;
                        tests.push({ name: String(task.i ?? tests.length + 1), group, status: status[Number(task.s)] ?? String(task.s ?? 'Unknown'), timeMs: Number(task.t) || 0, memoryKb: Number(task.m) || 0, score: typeof task.sc === 'number' ? task.sc : null });
                    };
                    for (const task of Array.isArray(data.tasks) ? data.tasks : []) {
                        if (data.st === 0) add(task, null);
                        else for (const test of Array.isArray(task.t) ? task.t : []) add(test, `子任务 ${task.i} · ${task.s} 分`);
                    }
                } catch {}
                break;
            }
        }
    }
    tests.sort((a, b) => (a.group ?? '').localeCompare(b.group ?? '', undefined, { numeric: true }) || a.name.localeCompare(b.name, undefined, { numeric: true }));
    const root = parse(html);
    const diagnostic = root.querySelectorAll('pre').filter(node => !node.closest('#tpl')).map(node => node.textContent.trim()).filter(Boolean).join('\n\n');
    return { tests, diagnostic };
}
export async function fetchJudgeDetails(http: HttpClient, solutionId: number): Promise<JudgeDetails> {
    const response = await http.get(`${XMOJ_ORIGIN}/reinfo.php?sid=${solutionId}`);
    return parseJudgeDetails(response.body);
}
export async function findAcceptedSubmissionId(http: HttpClient, problemId: number, user: string): Promise<number | null> {
    for await (const submission of acceptedSubmissions(http, problemId, user)) return submission.id;
    return null;
}
async function* acceptedSubmissions(http: HttpClient, problemId: number, user: string) {
    const query = new URLSearchParams({
        problem_id: String(problemId),
        jresult: '4',
    });
    if (user)
        query.set('user_id', user);
    const seen = new Set<number>();
    const cursors = new Set<number>();
    for (let index = 0; index < 200; index++) {
        const response = await http.get(`${XMOJ_ORIGIN}/status.php?${query.toString()}`);
        if (response.status !== 200) throw new Error(`查询 AC 记录失败：HTTP ${response.status}`);
        if (isLoginGate(response.body)) throw new Error('登录已失效，请重新登录后导出');
        const page = parseStatusPage(response.body);
        for (const submission of page.submissions) {
            if (seen.has(submission.id)) continue;
            seen.add(submission.id);
            if (submission.verdict === 'accepted' && (submission.problemId === null || submission.problemId === problemId) && (!user || !submission.user || submission.user === user)) yield submission;
        }
        const next = page.paging.nextTop;
        if (!page.submissions.length || next === null || cursors.has(next)) break;
        cursors.add(next);
        query.set('top', String(next));
        if (page.paging.nextPrevTop !== null) query.set('prevtop', String(page.paging.nextPrevTop));
    }
}
export async function fetchSource(http: HttpClient, solutionId: number): Promise<string | null> {
    const response = await http.get(`${XMOJ_ORIGIN}/getsource.php?id=${solutionId}`);
    if (response.status !== 200)
        return null;
    const text = response.body.replace(/^\s*<!--\s*not[- ]cached\s*-->\s*\r?\n?/i, '').replace(/\r?\n?<!--\s*not[- ]cached\s*-->\s*$/i, '');
    if (/<html|<body|<!DOCTYPE/i.test(text))
        return null;
    return text;
}
export function extensionForLanguage(language: string): string {
    const value = language.toLowerCase();
    if (value.includes('python'))
        return 'py';
    if (value.includes('javascript') || value.includes('node'))
        return 'js';
    if (value.includes('java'))
        return 'java';
    if (value.includes('pascal'))
        return 'pas';
    if (value.includes('c++') || value.includes('g++') || value === 'cpp')
        return 'cpp';
    if (value.includes('c#') || value.includes('csharp'))
        return 'cs';
    if (/^c(?:\d+)?$/.test(value) || value.includes('gcc'))
        return 'c';
    return 'txt';
}
export interface ExportOptions {
    problemIds?: number[];
    languages?: string[];
    user: string;
    onProgress?: (done: number, total: number, current: { problemId: number }) => void;
}
export async function collectAcCode(http: HttpClient, problemIds: number[], options: ExportOptions): Promise<{
    entries: AcCodeEntry[];
    skipped: number[];
}> {
    const entries: AcCodeEntry[] = [];
    const skipped: number[] = [];
    let firstFailure: unknown = null;
    problemIds = [...new Set(problemIds.filter(id => Number.isSafeInteger(id) && id > 0))];
    for (let index = 0; index < problemIds.length; index++) {
        const problemId = problemIds[index];
        try {
            let entry: AcCodeEntry | null = null;
            for await (const submission of acceptedSubmissions(http, problemId, options.user)) {
                const language = submission.language || 'C++';
                if (options.languages && !options.languages.some(selected => extensionForLanguage(selected) === extensionForLanguage(language))) continue;
                const source = await fetchSource(http, submission.id);
                if (source === null || !source.trim()) continue;
                entry = { problemId, solutionId: submission.id, language, source };
                break;
            }
            if (entry) entries.push(entry);
            else skipped.push(problemId);
        }
        catch (error) {
            firstFailure ??= error;
            skipped.push(problemId);
        }
        finally {
            options.onProgress?.(index + 1, problemIds.length, { problemId });
            await new Promise((resolve) => setTimeout(resolve, 120));
        }
    }
    if (!entries.length && firstFailure) throw new Error(`导出失败：${firstFailure instanceof Error ? firstFailure.message : String(firstFailure)}`);
    return { entries, skipped };
}
export function buildArchive(entries: AcCodeEntry[]): Uint8Array {
    const files: Record<string, Uint8Array> = {};
    const used = new Map<string, number>();
    for (const entry of entries) {
        const base = `${entry.problemId}.${extensionForLanguage(entry.language)}`;
        const count = (used.get(base) ?? 0) + 1;
        used.set(base, count);
        const name = count === 1 ? base : `${entry.problemId}_${count}.${extensionForLanguage(entry.language)}`;
        files[name] = strToU8(entry.source);
    }
    return zipSync(files, { level: 6 });
}
export async function exportAcCode(http: HttpClient, problemIds: number[], targetPath: string, options: ExportOptions): Promise<ExportResult> {
    const { entries, skipped } = await collectAcCode(http, problemIds, options);
    if (entries.length === 0) {
        return { written: 0, skipped, path: null, bytes: 0 };
    }
    const archive = buildArchive(entries);
    const { writeFile } = await import('node:fs/promises');
    await writeFile(targetPath, archive);
    return { written: entries.length, skipped, path: targetPath, bytes: archive.byteLength };
}
