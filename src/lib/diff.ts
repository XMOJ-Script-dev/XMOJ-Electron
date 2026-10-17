import type { DiffLine } from '@/shared/types';
export function splitLines(source: string): string[] {
    const normalised = source.replace(/\r\n?/g, '\n');
    const lines = normalised.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '')
        lines.pop();
    return lines;
}
function lcsTable(left: string[], right: string[]): Uint32Array {
    const rows = left.length + 1;
    const cols = right.length + 1;
    const table = new Uint32Array(rows * cols);
    for (let i = left.length - 1; i >= 0; i--) {
        for (let j = right.length - 1; j >= 0; j--) {
            table[i * cols + j] =
                left[i] === right[j]
                    ? table[(i + 1) * cols + (j + 1)] + 1
                    : Math.max(table[(i + 1) * cols + j], table[i * cols + (j + 1)]);
        }
    }
    return table;
}
export function diffLines(leftSource: string, rightSource: string): DiffLine[] {
    const left = splitLines(leftSource);
    const right = splitLines(rightSource);
    const cols = right.length + 1;
    const table = lcsTable(left, right);
    const result: DiffLine[] = [];
    let i = 0;
    let j = 0;
    let leftNo = 1;
    let rightNo = 1;
    while (i < left.length && j < right.length) {
        if (left[i] === right[j]) {
            result.push({ kind: 'equal', left: leftNo++, right: rightNo++, text: left[i] });
            i++;
            j++;
        }
        else if (table[(i + 1) * cols + j] >= table[i * cols + (j + 1)]) {
            result.push({ kind: 'removed', left: leftNo++, right: null, text: left[i] });
            i++;
        }
        else {
            result.push({ kind: 'added', left: null, right: rightNo++, text: right[j] });
            j++;
        }
    }
    while (i < left.length) {
        result.push({ kind: 'removed', left: leftNo++, right: null, text: left[i] });
        i++;
    }
    while (j < right.length) {
        result.push({ kind: 'added', left: null, right: rightNo++, text: right[j] });
        j++;
    }
    return result;
}
export function summariseDiff(lines: DiffLine[]): {
    added: number;
    removed: number;
    equal: number;
} {
    let added = 0;
    let removed = 0;
    let equal = 0;
    for (const line of lines) {
        if (line.kind === 'added')
            added++;
        else if (line.kind === 'removed')
            removed++;
        else
            equal++;
    }
    return { added, removed, equal };
}
