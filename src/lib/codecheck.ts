export type CheckSeverity = 'error' | 'warning';
export interface CodeIssue {
    severity: CheckSeverity;
    label: string;
    message: string;
    suggestion?: string;
}
export interface CodeCheckOptions {
    inputName?: string | null;
    outputName?: string | null;
    languageId?: number;
}
function usesFreopenFor(source: string, fileName: string): boolean {
    const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`freopen\\s*\\(\\s*["'][^"']*${escaped}[^"']*["']\\s*,`, 'i');
    return pattern.test(source);
}
export function buildFreopenSnippet(inputName: string, outputName: string): string {
    return [
        `    freopen("${inputName}.in", "r", stdin);`,
        `    freopen("${outputName}.out", "w", stdout);`,
    ].join('\n');
}
export function checkSource(source: string, options: CodeCheckOptions = {}): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const { inputName, outputName, languageId = 1 } = options;
    const code = source ?? '';
    if (!code.trim()) {
        issues.push({
            severity: 'error',
            label: '空代码',
            message: '代码为空，无法提交。',
        });
        return issues;
    }
    const isCStyle = languageId === 0 || languageId === 1;
    const needsFileIo = Boolean(inputName);
    if (isCStyle && needsFileIo && inputName) {
        const outName = outputName || inputName;
        const hasInput = usesFreopenFor(code, `${inputName}.in`);
        const hasOutput = usesFreopenFor(code, `${outName}.out`);
        if (!hasInput || !hasOutput) {
            const missing = !hasInput && !hasOutput ? '输入与输出' : !hasInput ? '输入' : '输出';
            issues.push({
                severity: 'error',
                label: '文件输入输出',
                message: `此题需要文件输入输出（输入 ${inputName}.in，输出 ${outName}.out），` +
                    `当前代码缺少${missing}的 freopen 调用。`,
                suggestion: buildFreopenSnippet(inputName, outName),
            });
        }
    }
    if (isCStyle) {
        if (/\b(int|void)\s+mian\s*\(/.test(code)) {
            issues.push({
                severity: 'error',
                label: '可能的拼写错误',
                message: '检测到 `mian`，疑似把 `main` 拼错了。',
            });
        }
        const opens = (code.match(/\{/g) ?? []).length;
        const closes = (code.match(/\}/g) ?? []).length;
        if (opens !== closes) {
            issues.push({
                severity: 'warning',
                label: '括号不匹配',
                message: `花括号数量不一致。`,
            });
        }
        const usesStdio = /\b(scanf|printf|freopen)\s*\(/.test(code);
        const includesCStdio = /#\s*include\s*<\s*cstdio\s*>/.test(code);
        const includesStdio = /#\s*include\s*<\s*stdio\.h\s*>/.test(code);
        if (usesStdio && !includesCStdio && !includesStdio && !/#\s*include\s*<\s*bits\/stdc\+\+\.h\s*>/.test(code)) {
            issues.push({
                severity: 'warning',
                label: '缺少头文件',
                message: '使用了 scanf/printf/freopen，但没有包含 <cstdio> 或 <stdio.h>。',
            });
        }
    }
    if (languageId === 1 && /\bgets\s*\(/.test(code)) {
        issues.push({
            severity: 'warning',
            label: '不安全的函数',
            message: '`gets` 在较新的标准中已被移除，建议改用 `fgets` 或 `cin.getline`。',
        });
    }
    return issues;
}
export function parseProblemFileNames(html: string): {
    inputName: string | null;
    outputName: string | null;
} {
    const input = html.match(/输入文件\s*[:：]\s*<\/span>\s*([\w.-]+)/i)?.[1] ?? null;
    const output = html.match(/输出文件\s*[:：]\s*<\/span>\s*([\w.-]+)/i)?.[1] ?? null;
    const strip = (value: string | null) => value ? value.replace(/\.(in|out|txt)$/i, '') : null;
    return { inputName: strip(input), outputName: strip(output) };
}
