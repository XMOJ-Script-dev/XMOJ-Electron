import DOMPurify from 'dompurify';
import katex from 'katex';
import { markdown } from './markdown-extensions.ts';
const PLACEHOLDER = '\u0000MATH';
export function renderMath(tex: string, displayMode: boolean): string {
    try {
        return katex.renderToString(tex, {
            displayMode,
            throwOnError: false,
            strict: false,
            trust: false,
            output: 'html',
        });
    }
    catch {
        return displayMode ? `$$${tex}$$` : `$${tex}$`;
    }
}
export function extractMath(input: string, store: string[]): string {
    const stash = (tex: string, displayMode: boolean): string => {
        store.push(renderMath(tex.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' '), displayMode));
        return `${PLACEHOLDER}${store.length - 1}\u0000`;
    };
    let output = input;
    output = output.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex: string) => stash(tex, true));
    output = output.replace(/\\\[([\s\S]+?)\\\]/g, (_m, tex: string) => stash(tex, true));
    output = output.replace(/\\\(([\s\S]+?)\\\)/g, (_m, tex: string) => stash(tex, false));
    output = output.replace(/\$(?!\s)([^$\n]+?)(?<!\s)\$/g, (_m, tex: string) => stash(tex, false));
    return output;
}
export function restoreMath(html: string, store: string[]): string {
    const pattern = new RegExp(`${PLACEHOLDER}(\\d+)\u0000`, 'g');
    return html.replace(pattern, (_m, index: string) => store[Number(index)] ?? '');
}
export function sanitize(html: string): string {
    return DOMPurify.sanitize(html, {
        ADD_ATTR: ['target', 'rel'],
        ADD_TAGS: [
            'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub',
            'mfrac', 'msqrt', 'mtext', 'mspace', 'mover', 'munder', 'mtable', 'mtr',
            'mtd', 'menclose', 'mstyle', 'mpadded', 'mphantom', 'ms', 'mroot',
            'svg', 'path', 'line', 'g', 'use', 'defs',
        ],
    });
}
function looksLikeMarkdown(source: string): boolean {
    if (/`+[^`\n]+`+/.test(source))
        return true;
    if (/(^|\n)\s{0,3}(?:~{3,}|`{3,}|:{2,}[a-z])/.test(source))
        return true;
    if (/(^|\n)\s{0,3}#{1,6}\s/.test(source))
        return true;
    if (/(^|\n)\s{0,3}([-*+]|\d+\.)\s+/.test(source))
        return true;
    if (/(^|\n)\s{0,3}(>|```|\|)/.test(source))
        return true;
    if (/(^|[^*])\*\*[^*\n]+\*\*/.test(source))
        return true;
    if (/(^|\n)\s*(-{3,}|\*{3,})\s*(\n|$)/.test(source))
        return true;
    if (/\]\([^)\s]+\)/.test(source))
        return true;
    return false;
}
export function renderAnnouncement(source: string, mode: 'auto' | 'markdown' = 'auto'): string {
    if (!source.trim())
        return '';
    const code: string[] = [];
    const protectedSource = source.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>|<code\b[^>]*>[\s\S]*?<\/code>|^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[~`]*[ \t]*(?=\n|$)|(?![\s\S]))|(`+)[\s\S]*?\2/gim, block => {
        code.push(block);
        return `\u0000CODE${code.length - 1}\u0000`;
    });
    const math: string[] = [];
    const withoutMath = extractMath(protectedSource, math).replace(/\u0000CODE(\d+)\u0000/g, (_, index: string) => code[Number(index)] ?? '');
    let html: string;
    if (mode === 'markdown') {
        html = markdown.parse(withoutMath, { async: false }) as string;
    }
    else if (looksLikeMarkdown(withoutMath) && !/<(?:p|table|ul|ol|pre)\b/i.test(protectedSource)) {
        html = markdown.parse(withoutMath, { async: false }) as string;
    }
    else {
        html = withoutMath;
    }
    return sanitize(restoreMath(html, math));
}
