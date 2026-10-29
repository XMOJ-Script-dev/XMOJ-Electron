import { Marked, type Tokens } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-json.js';

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const markdown = new Marked({ gfm: true, breaks: true });

function renderCode({ text, lang }: Tokens.Code): string {
    const info = (lang ?? '').trim();
    const language = info.split(/\s+/)[0] || 'cpp';
    const grammar = Object.prototype.hasOwnProperty.call(Prism.languages, language) && typeof Prism.languages[language] === 'object' ? Prism.languages[language] : undefined;
    const highlighted = grammar ? Prism.highlight(text, grammar, language) : escapeHtml(text);
    const ranges = (info.match(/(?:^|\s)lines=([\d,-]+)/)?.[1] ?? '').split(',').map(range => range.split('-').map(Number));
    // Balance token spans across lines (e.g. a multiline C++ comment).
    // Block lines supply copied line breaks without selectable newline nodes;
    // empty lines need a <br> so selection preserves intentional blank lines.
    const spans: string[] = [];
    const numbered = highlighted.split('\n').map((content, index) => {
        const prefix = spans.join('');
        for (const tag of content.match(/<span\b[^>]*>|<\/span>/g) ?? []) {
            if (tag === '</span>') spans.pop();
            else spans.push(tag);
        }
        const active = ranges.some(([start, end = start]) => index + 1 >= start && index + 1 <= end);
        return `<span class="code-line${active ? ' code-line-highlight' : ''}" data-line="${index + 1}">${prefix}${content || '<br>'}${'</span>'.repeat(spans.length)}</span>`;
    }).join('');
    const safeLanguage = /^[\w-]+$/.test(language) ? ` class="language-${language}"` : '';
    return `<pre><code${safeLanguage}>${numbered}</code></pre>\n`;
}

type Cell = { source: Tokens.TableCell; row: number; col: number; rowspan: number; colspan: number };
function renderTable(table: Tokens.Table, inline: (tokens: Tokens.TableCell['tokens']) => string, style = '', dividers: number[] = []): string {
    const rows = [table.header, ...table.rows];
    const grid: Cell[][] = rows.map((row, r) => row.map((source, col) => ({ source, row: r, col, rowspan: 1, colspan: 1 })));
    // Only merge rectangular regions. Invalid markers remain ordinary cell text.
    for (let r = 1; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const cell = grid[r][c];
            if (cell.source.text.trim() === '<' && c > 0) {
                const left = grid[r][c - 1];
                if (left.source.text.trim() !== '^' && left.source.text.trim() !== '<') {
                    left.colspan++;
                    grid[r][c] = left;
                }
            }
        }
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].source.text.trim() !== '^' || r === 1) continue;
            const above = grid[r - 1][c];
            if (above.col !== c || above.source.text.trim() === '^' || above.source.text.trim() === '<') continue;
            const width = above.colspan;
            if (grid[r].slice(c, c + width).length !== width || !grid[r].slice(c, c + width).every(cell => cell.source.text.trim() === '^')) continue;
            above.rowspan++;
            for (let i = c; i < c + width; i++) grid[r][i] = above;
        }
    }
    const output = grid.map((row, r) => `<tr>${row.map((cell, c) => {
        if (cell.row !== r || cell.col !== c) return '';
        const tag = r === 0 ? 'th' : 'td';
        const span = `${cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ''}${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ''}`;
        const align = cell.source.align ? ` style="text-align:${cell.source.align}"` : '';
        const borders = style === 'tuack' ? [
            dividers.includes(c) ? 'table-divider' : '',
            dividers.includes(c + cell.colspan) ? 'table-divider-end' : '',
        ].filter(Boolean).join(' ') : '';
        return `<${tag}${span}${align}${borders ? ` class="${borders}"` : ''}>${inline(cell.source.tokens)}</${tag}>`;
    }).join('')}</tr>`);
    // Column borders must remain continuous even through cells with row/col spans.
    const columns = style === 'tuack' ? `<colgroup>${table.header.map((_, c) => `<col${dividers.includes(c) ? ' class="table-divider"' : ''}>`).join('')}</colgroup>` : '';
    return `<table${style ? ` class="cute-table cute-table-${style}"` : ''}>${columns}<thead>${output[0]}</thead><tbody>${output.slice(1).join('')}</tbody></table>\n`;
}

markdown.use({
    renderer: {
        code: renderCode,
        table(token) { return renderTable(token, tokens => this.parser.parseInline(tokens)); },
    },
    extensions: [{
        name: 'luoguDirective',
        level: 'block',
        start(source) {
            const index = source.match(/^ {0,3}(?:\:{3,}(?:info|success|warning|error|align|epigraph)|::cute-table)\b/m)?.index;
            // Marked probes paragraphs starting one character in. Do not split
            // a rejected (e.g. unclosed) directive after its first colon.
            return index !== undefined && index > 0 ? index : undefined;
        },
        tokenizer(source) {
            const leaf = /^ {0,3}::cute-table(?:\{([^}\n]*)\})?[ \t]*(?:\n|$)/.exec(source);
            if (leaf) {
                const rest = source.slice(leaf[0].length).replace(/^\n+/, '');
                const blank = rest.search(/\n[ \t]*\n/);
                const table = this.lexer.blockTokens(blank < 0 ? rest : rest.slice(0, blank))[0];
                if (table?.type !== 'table') return;
                const attributes = leaf[1] ?? '';
                const tuack = /(?:^|\s)tuack(?:=(?:"([\d,]+)"|'([\d,]+)'|([\d,]+)))?(?=\s|$)/.exec(attributes);
                const style = tuack ? 'tuack' : /(?:^|\s)three(?:\s|$)/.test(attributes) ? 'three' : '';
                const dividers = (tuack?.[1] ?? tuack?.[2] ?? tuack?.[3] ?? '').split(',').map(Number).filter(n => n > 0);
                const raw = source.slice(0, source.length - rest.length + table.raw.length);
                return { type: 'luoguDirective', raw, table, style, dividers };
            }
            const opening = /^ {0,3}(:{3,})(info|success|warning|error|align|epigraph)(?:\[((?:\\.|[^\[\]\\\n]|\[(?:\\.|[^\]\\\n])*\])*)\])?(?:\{([^}\n]*)\})?[ \t]*(?:\n|$)/.exec(source);
            if (!opening) return;
            const lines = source.slice(opening[0].length).split(/(?<=\n)/);
            let length = opening[0].length;
            let body = '';
            let fence = '';
            for (const line of lines) {
                length += line.length;
                const codeFence = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
                if (fence) {
                    if (new RegExp(`^ {0,3}${fence[0]}{${fence.length},}[ \\t]*$`).test(line.trimEnd())) fence = '';
                }
                else if (codeFence) fence = codeFence;
                else if (new RegExp(`^ {0,3}:{${opening[1].length},}[ \\t]*$`).test(line.trimEnd())) {
                    return {
                        type: 'luoguDirective', raw: source.slice(0, length), kind: opening[2],
                        label: this.lexer.inlineTokens(opening[3] ?? ''), attributes: opening[4] ?? '',
                        tokens: this.lexer.blockTokens(body),
                    };
                }
                body += line;
            }
        },
        renderer(token) {
            if (token.table) return renderTable(token.table, tokens => this.parser.parseInline(tokens), token.style, token.dividers);
            const body = this.parser.parse(token.tokens ?? []);
            const label = this.parser.parseInline(token.label);
            if (token.kind === 'align') {
                const align = /(?:^|\s)(left|center|right)(?:\s|$)/.exec(token.attributes)?.[1] ?? 'left';
                return `<div class="markdown-align markdown-align-${align}">${body}</div>\n`;
            }
            if (token.kind === 'epigraph') return `<figure class="markdown-epigraph">${body}${label ? `<figcaption>${label}</figcaption>` : ''}</figure>\n`;
            const open = /(?:^|\s)open(?:\s|$)/.test(token.attributes) ? ' open' : '';
            return `<details class="markdown-callout callout-${token.kind}"${open}><summary>${label || token.kind}</summary><div class="callout-content">${body}</div></details>\n`;
        },
    }],
});
