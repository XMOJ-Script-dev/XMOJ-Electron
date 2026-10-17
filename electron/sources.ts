import { zipSync, strToU8 } from 'fflate';
import { XMOJ_ORIGIN, type AcCodeEntry, type ExportResult, } from '../src/shared/types.ts';
import type { HttpClient } from './http.ts';
import { parseStatusPage } from './parsers.ts';
export async function findAcceptedSubmissionId(http: HttpClient, problemId: number, user: string): Promise<number | null> {
    const query = new URLSearchParams({
        problem_id: String(problemId),
        jresult: '4',
    });
    if (user)
        query.set('user_id', user);
    const response = await http.get(`${XMOJ_ORIGIN}/status.php?${query.toString()}`);
    const page = parseStatusPage(response.body);
    const accepted = page.submissions.find((s) => s.verdict === 'accepted');
    return accepted?.id ?? null;
}
export async function fetchSource(http: HttpClient, solutionId: number): Promise<string | null> {
    const response = await http.get(`${XMOJ_ORIGIN}/getsource.php?id=${solutionId}`);
    if (response.status !== 200)
        return null;
    const text = response.body;
    if (/<html|<body|<!DOCTYPE/i.test(text))
        return null;
    return text;
}
export function extensionForLanguage(language: string): string {
    const value = language.toLowerCase();
    if (value.includes('python'))
        return 'py';
    if (value.includes('java'))
        return 'java';
    if (value.includes('pascal'))
        return 'pas';
    if (value.includes('c++') || value.includes('g++') || value === 'cpp')
        return 'cpp';
    if (value.includes('c#') || value.includes('csharp'))
        return 'cs';
    if (value.includes('javascript') || value.includes('node'))
        return 'js';
    if (value === 'c' || value.includes('gcc'))
        return 'c';
    return 'txt';
}
export interface ExportOptions {
    problemIds?: number[];
    languages?: string[];
    user: string;
    onProgress?: (done: number, total: number, current: AcCodeEntry) => void;
}
export async function collectAcCode(http: HttpClient, problemIds: number[], options: ExportOptions): Promise<{
    entries: AcCodeEntry[];
    skipped: number[];
}> {
    const entries: AcCodeEntry[] = [];
    const skipped: number[] = [];
    for (let index = 0; index < problemIds.length; index++) {
        const problemId = problemIds[index];
        try {
            const solutionId = await findAcceptedSubmissionId(http, problemId, options.user);
            if (solutionId === null) {
                skipped.push(problemId);
                continue;
            }
            const source = await fetchSource(http, solutionId);
            if (source === null || !source.trim()) {
                skipped.push(problemId);
                continue;
            }
            const language = await languageOfSolution(http, problemId, options.user, solutionId);
            if (options.languages?.length &&
                !options.languages.some((l) => language.toLowerCase().includes(l.toLowerCase()))) {
                skipped.push(problemId);
                continue;
            }
            const entry: AcCodeEntry = { problemId, solutionId, language, source };
            entries.push(entry);
            options.onProgress?.(index + 1, problemIds.length, entry);
        }
        catch {
            skipped.push(problemId);
        }
        await new Promise((resolve) => setTimeout(resolve, 120));
    }
    return { entries, skipped };
}
async function languageOfSolution(http: HttpClient, problemId: number, user: string, solutionId: number): Promise<string> {
    const query = new URLSearchParams({
        problem_id: String(problemId),
        jresult: '4',
    });
    if (user)
        query.set('user_id', user);
    const response = await http.get(`${XMOJ_ORIGIN}/status.php?${query.toString()}`);
    const page = parseStatusPage(response.body);
    return page.submissions.find((s) => s.id === solutionId)?.language || 'C++';
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
