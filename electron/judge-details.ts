import { parse } from 'node-html-parser';
import type { JudgeDetails, JudgeTest } from '../src/shared/types.ts';

export function parseJudgeDetails(html: string): JudgeDetails {
    const tests: JudgeTest[] = [];
    const status: Record<number, string> = {
        0: 'Pending',
        1: 'Pending',
        2: 'Compiling',
        3: 'Running',
        4: 'AC',
        5: 'PE',
        6: 'WA',
        7: 'TLE',
        8: 'MLE',
        9: 'OLE',
        10: 'RE',
        11: 'CE',
        12: 'Compile OK',
        13: 'Testing',
        14: 'Skipped',
        15: 'Ignored',
    };
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
                        tests.push({
                            name: String(task.i ?? tests.length + 1),
                            group,
                            status: status[Number(task.s)] ?? String(task.s ?? 'Unknown'),
                            timeMs: Number(task.t) || 0,
                            memoryKb: Number(task.m) || 0,
                            score: typeof task.sc === 'number' ? task.sc : null,
                        });
                    };
                    for (const task of Array.isArray(data.tasks) ? data.tasks : []) {
                        if (data.st === 0) add(task, null);
                        else for (const test of Array.isArray(task.t) ? task.t : []) add(test, `子任务 ${task.i} · ${task.s} 分`);
                    }
                } catch {
                }
                break;
            }
        }
    }
    tests.sort((a, b) => (a.group ?? '').localeCompare(b.group ?? '', undefined, { numeric: true }) ||
        a.name.localeCompare(b.name, undefined, { numeric: true }));
    const root = parse(html);
    const diagnostic = root.querySelectorAll('pre')
        .filter(node => !node.closest('#tpl'))
        .map(node => node.textContent.trim())
        .filter(Boolean)
        .join('\n\n');
    return { tests, diagnostic };
}
