import { app, BrowserWindow } from 'electron';
import { build } from 'esbuild';
import { mkdtempSync, readFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const tempRoot = process.platform === 'win32' && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode') : app.getPath('temp');
app.setPath('userData', mkdtempSync(path.join(tempRoot, 'markdown-dom-')));
app.whenReady().then(async () => {
const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } });
win.webContents.on('console-message', event => console.log(`[renderer] ${event.message}`));
try {
    const bundle = await build({ entryPoints: ['src/lib/markdown.ts'], bundle: true, write: false, format: 'iife', globalName: 'MarkdownTest', platform: 'browser' });
    await win.loadURL('data:text/html,<!doctype html><html><head></head><body></body></html>');
    await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
    const css = readFileSync('src/components/AnnouncementBody.vue', 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
    await win.webContents.executeJavaScript(`document.head.appendChild(Object.assign(document.createElement('style'), {textContent: ':root { --muted-foreground: #666; --border: #ddd; --muted: #eee; --background: white; color: #111; } body { margin: 16px; }' + ${JSON.stringify(css)}}))`);
    const source = [
        '::::warning[父容器]{open}',
        ':::info[子容器 <img src=x onerror="window.pwned=1">]{onclick="window.pwned=1"}',
        '**内容** $x_1$',
        ':::',
        '::::',
        '',
        '::::align{right}', '右侧', '', '## 标题', '',
        '- 列表', '', ':::align{center}', '居中', ':::', '::::', '',
        ':::epigraph[——作者]', '题记。', ':::', '',
        '::cute-table{tuack=2}', '',
        '| A | B | C |', '| --- | --- | --- |', '| a | < | c |', '| ^ | ^ | d |', '',
        '```cpp lines=2', '/* first', 'second */', 'int x = 1;', '```', '',
        '<script>window.pwned=1</script><a href="javascript:window.pwned=1">恶意链接</a>',
    ].join('\n');
    const result = await win.webContents.executeJavaScript(`(() => {
        document.body.innerHTML = '<main class="announcement-body"></main>';
        const root = document.querySelector('main');
        root.innerHTML = MarkdownTest.renderAnnouncement(${JSON.stringify(source)}, 'markdown');
        const details = root.querySelectorAll('details');
        const inner = details[1];
        const before = inner.open;
        inner.querySelector('summary').click();
        const after = inner.open;
        const cell = root.querySelector('tbody td');
        const code = root.querySelector('pre code');
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code); selection.removeAllRanges(); selection.addRange(range);
        const selectedCode = selection.toString(); selection.removeAllRanges();
        const epigraph = root.querySelector('.markdown-epigraph');
        const keyword = code.querySelector('.token.keyword');
        const lightKeyword = getComputedStyle(keyword).color;
        document.documentElement.classList.add('dark');
        const darkKeyword = getComputedStyle(keyword).color;
        document.documentElement.classList.remove('dark');
        return {
            details: details.length, outerOpen: details[0].open, before, after,
            math: !!root.querySelector('.katex'), strong: !!inner.querySelector('strong'),
            right: getComputedStyle(root.querySelector('.markdown-align-right > p')).textAlign,
            heading: getComputedStyle(root.querySelector('h2')).textAlign,
            center: getComputedStyle(root.querySelector('.markdown-align-center > p')).textAlign,
            list: getComputedStyle(root.querySelector('li')).textAlign,
            epigraph: root.querySelector('figcaption').textContent,
            epigraphBody: getComputedStyle(epigraph.querySelector('p')).textAlign,
            epigraphFont: getComputedStyle(epigraph.querySelector('p')).fontStyle,
            epigraphWidth: Math.abs(epigraph.getBoundingClientRect().width / root.getBoundingClientRect().width - 0.4) < 0.01,
            epigraphRule: getComputedStyle(epigraph.querySelector('figcaption')).borderTopStyle,
            rowspan: cell.rowSpan, colspan: cell.colSpan,
            verticalAlign: getComputedStyle(cell).verticalAlign,
            divider: parseFloat(getComputedStyle(root.querySelector('col.table-divider')).borderLeftWidth) > parseFloat(getComputedStyle(root.querySelector('col:not(:first-child)')).borderLeftWidth),
            noCellBorders: getComputedStyle(cell).borderLeftStyle === 'none',
            noOuterSideBorders: getComputedStyle(root.querySelector('table')).borderLeftStyle === 'none',
            code: code.innerText, selectedCode, lines: code.querySelectorAll('.code-line').length,
            noLineBreakNodes: [...code.childNodes].every(n => n.nodeType === Node.ELEMENT_NODE),
            lightKeyword, darkKeyword,
            highlights: code.querySelectorAll('.code-line-highlight').length,
            token: !!code.querySelector('.token.keyword'),
            injected: !!root.querySelector('script, [onclick], [onerror], a[href^="javascript:"]') || !!window.pwned,
            placeholders: root.textContent.includes('\\u0000'),
        };
    })()`);
    assert.deepEqual(result, {
        details: 2, outerOpen: true, before: false, after: true,
        math: true, strong: true, right: 'right', heading: 'right', center: 'center', list: 'start',
        epigraph: '——作者', rowspan: 2, colspan: 2, divider: true,
        epigraphBody: 'left', epigraphFont: 'normal', epigraphWidth: true, epigraphRule: 'solid',
        verticalAlign: 'middle', noCellBorders: true, noOuterSideBorders: true,
        code: '/* first\nsecond */\nint x = 1;', selectedCode: '/* first\nsecond */\nint x = 1;', lines: 3, highlights: 1, token: true,
        noLineBreakNodes: true, lightKeyword: 'rgb(124, 58, 237)', darkKeyword: 'rgb(196, 181, 253)',
        injected: false, placeholders: false,
    });
    const extra = await win.webContents.executeJavaScript(`(() => {
        const root = document.querySelector('main');
        root.innerHTML = MarkdownTest.renderAnnouncement('| A | B |\\n| --- | --- |\\n| merged | a |\\n| ^ | b |', 'markdown');
        const merged = root.querySelector('[rowspan]');
        const plainMerged = getComputedStyle(merged).verticalAlign;
        const textRange = document.createRange(); textRange.selectNodeContents(merged);
        const textBounds = textRange.getBoundingClientRect(), cellBounds = merged.getBoundingClientRect();
        const centered = Math.abs((textBounds.top + textBounds.bottom) / 2 - (cellBounds.top + cellBounds.bottom) / 2) < 2;
        root.innerHTML = MarkdownTest.renderAnnouncement('\`\`\`plain\\na\\n\\nb\\n\\n\`\`\`', 'markdown');
        const code = root.querySelector('code');
        const selection = getSelection(), range = document.createRange();
        range.selectNodeContents(code); selection.removeAllRanges(); selection.addRange(range);
        const selected = selection.toString(); selection.removeAllRanges();
        return { plainMerged, centered, selected, lines: code.querySelectorAll('.code-line').length };
    })()`);
    assert.deepEqual(extra, { plainMerged: 'middle', centered: true, selected: 'a\n\nb\n', lines: 4 });
    const overflow = await win.webContents.executeJavaScript(`(() => {
        const root = document.querySelector('main');
        root.style.width = '240px';
        const source = '\`\`\`plain lines=1-2\\nshort\\n' + 'long code '.repeat(80) + '\\n\`\`\`';
        root.innerHTML = MarkdownTest.renderAnnouncement(source, 'markdown');
        const pre = root.querySelector('pre'), code = pre.querySelector('code');
        const highlights = [...code.querySelectorAll('.code-line-highlight')];
        pre.scrollLeft = pre.scrollWidth;
        const end = pre.getBoundingClientRect().right - parseFloat(getComputedStyle(pre).paddingRight);
        return {
            scrolls: pre.scrollLeft > 0,
            fillsContent: highlights.every(line => Math.abs(line.getBoundingClientRect().width - code.getBoundingClientRect().width) < 1),
            coversScrolledEnd: highlights.every(line => line.getBoundingClientRect().right >= end - 1),
            colored: highlights.every(line => getComputedStyle(line).backgroundColor !== 'rgba(0, 0, 0, 0)'),
        };
    })()`);
    assert.deepEqual(overflow, { scrolls: true, fillsContent: true, coversScrolledEnd: true, colored: true });
    const borders = await win.webContents.executeJavaScript(`(() => {
        const root = document.querySelector('main');
        root.style.width = '';
        const table = '| A | B | C | D |\\n| --- | --- | --- | --- |\\n| a | < | c | d |\\n| ^ | ^ | e | f |';
        const results = [];
        for (const x of [1, 2, 3, 4]) {
            root.innerHTML = MarkdownTest.renderAnnouncement('::cute-table{tuack=' + x + '}\\n\\n' + table, 'markdown');
            const headers = [...root.querySelectorAll('th')];
            results.push({
                left: x === 4 || parseFloat(getComputedStyle(headers[x]).borderLeftWidth) > 2,
                right: parseFloat(getComputedStyle(headers[x - 1]).borderRightWidth) > 2,
                correctColumn: x === 4 || headers[x].classList.contains('table-divider'),
                merged: x !== 2 || parseFloat(getComputedStyle(root.querySelector('td[colspan]')).borderRightWidth) > 2,
            });
        }
        return results;
    })()`);
    assert.deepEqual(borders, Array.from({ length: 4 }, () => ({ left: true, right: true, correctColumn: true, merged: true })));
    console.log('Markdown DOM checks passed: sanitization, callout interaction, layout, merged tables and highlighted code.');
    app.exit(0);
} catch (error) {
    console.error(error);
    app.exit(1);
}
});
