export function htmlToMarkdown(source: string): string {
    function normalizeProse(value: string): string {
        let fence = '', blank = false;
        const lines: string[] = [];
        for (const line of value.replace(/\r\n?/g, '\n').split('\n')) {
            const marker = line.match(/^\s*(`{3,}|~{3,})/);
            if (marker) {
                if (!fence) fence = marker[1];
                else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = '';
                lines.push(line.trimStart()); blank = false; continue;
            }
            if (fence) { lines.push(line); continue; }
            const normalized = /^\s*(?:[-*+] |\d+[.)] )/.test(line) ? line.trimEnd() : line.trim();
            if (normalized || !blank) lines.push(normalized);
            blank = !normalized;
        }
        return lines.join('\n').trim();
    }
    if (!/<\/?[a-z][\s\S]*>/i.test(source)) return normalizeProse(source);
    const root = document.createElement('div');
    root.innerHTML = source;
    root.querySelectorAll('script,style,.hidden,.lang_en,.copy-btn').forEach(node => node.remove());
    const code: string[] = [];
    function convert(node: Node, depth = 0): string {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = (node.textContent ?? '').replace(/[\t\r\n \u00a0]+/g, ' ');
            const previous = node.previousSibling;
            const blockBoundary = !previous || /^(BR|P|DIV|SECTION|H[1-6]|UL|OL|PRE|TABLE|HR|BLOCKQUOTE)$/.test(previous.nodeName);
            return blockBoundary ? text.trimStart() : text;
        }
        if (!(node instanceof Element)) return '';
        const children = () => [...node.childNodes].map(child => convert(child, depth)).join('');
        switch (node.tagName.toLowerCase()) {
            case 'br': return '\n';
            case 'pre': {
                const text = (node.textContent ?? '').replace(/\r\n?/g, '\n').replace(/^\n|\n$/g, '');
                const fence = '`'.repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map(m => m[0].length + 1)));
                code.push(`${fence}\n${text}\n${fence}`);
                return `\n\n\u0000CODE${code.length - 1}\u0000\n\n`;
            }
            case 'code': return '`' + (node.textContent ?? '') + '`';
            case 'strong': case 'b': return `**${children().trim()}**`;
            case 'em': case 'i': return `*${children().trim()}*`;
            case 'a': return `[${children().trim()}](${node.getAttribute('href') ?? ''})`;
            case 'img': return `![${node.getAttribute('alt') ?? ''}](${node.getAttribute('src') ?? ''})`;
            case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': return `\n\n${'#'.repeat(Number(node.tagName[1]))} ${children().trim()}\n\n`;
            case 'p': case 'div': case 'section': return `\n\n${children().trim()}\n\n`;
            case 'hr': return '\n\n---\n\n';
            case 'blockquote': return '\n\n' + children().trim().split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
            case 'ul': case 'ol': return '\n\n' + [...node.children].filter(child => child.tagName === 'LI').map((child, index) => {
                const body = [...child.childNodes].map(n => convert(n, depth + 1)).join('').trim();
                return `${'  '.repeat(depth)}${node.tagName === 'OL' ? `${index + 1}.` : '-'} ${body}`;
            }).join('\n') + '\n\n';
            case 'table': {
                const rows = [...node.querySelectorAll('tr')].map(row => [...row.querySelectorAll('th,td')].map(cell => convert(cell, depth).trim().replace(/\n+/g, ' ').replace(/\|/g, '\\|')));
                if (!rows.length) return '';
                return '\n\n' + rows.flatMap((row, index) => [`| ${row.join(' | ')} |`, ...(index === 0 ? [`| ${row.map(() => '---').join(' | ')} |`] : [])]).join('\n') + '\n\n';
            }
            default: return children();
        }
    }
    let markdown = normalizeProse([...root.childNodes].map(node => convert(node)).join(''));
    markdown = markdown.replace(/\u0000CODE(\d+)\u0000/g, (_, index: string) => code[Number(index)] ?? '');
    return markdown.trim();
}
