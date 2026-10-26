import DOMPurify from 'dompurify';
import katex from 'katex';
import { marked } from 'marked';
marked.setOptions({ gfm: true, breaks: true });
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
const TAG_PATTERN = /<\/?[a-z][^<>]*>/gi;
function shieldHtml(source: string, store: string[]): string {
    return source.replace(TAG_PATTERN, (tag) => {
        store.push(tag);
        return `\u0000HTML${store.length - 1}\u0000`;
    });
}
export function renderAnnouncement(source: string, mode: 'auto' | 'markdown' = 'auto'): string {
    if (!source.trim())
        return '';
    const code: string[] = [];
    const protectedSource = source.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>|<code\b[^>]*>[\s\S]*?<\/code>|```[^\n]*\n[\s\S]*?```|`[^`\n]+`/gi, block => {
        const html = block.startsWith('<') ? block : block.startsWith('```') ? marked.parse(block, { async: false }) as string : marked.parseInline(block, { async: false }) as string;
        code.push(html);
        return `\u0000CODE${code.length - 1}\u0000`;
    });
    const math: string[] = [];
    const withoutMath = extractMath(protectedSource, math);
    let html: string;
    if (mode === 'markdown') {
        html = marked.parse(withoutMath, { async: false }) as string;
    }
    else if (looksLikeMarkdown(withoutMath) && !/<(?:p|table|ul|ol|pre)\b/i.test(withoutMath)) {
        const tags: string[] = [];
        const shielded = shieldHtml(withoutMath, tags);
        const parsed = marked.parse(shielded, { async: false }) as string;
        html = parsed.replace(/\u0000HTML(\d+)\u0000/g, (_m, index: string) => tags[Number(index)] ?? '');
    }
    else {
        html = withoutMath;
    }
    html = html.replace(/<p>\s*\u0000CODE(\d+)\u0000\s*<\/p>/g, (match, index: string) => /^<pre\b/i.test(code[Number(index)] ?? '') ? code[Number(index)] : match);
    return sanitize(restoreMath(html, math).replace(/\u0000CODE(\d+)\u0000/g, (_, index: string) => code[Number(index)] ?? ''));
}
