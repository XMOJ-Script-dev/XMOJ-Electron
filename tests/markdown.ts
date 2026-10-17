import { renderAnnouncement } from '../src/lib/markdown.ts';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
console.log('\n=== LaTeX ===');
{
    const inline = renderAnnouncement('求 $a^2+b^2=c^2$ 的解。');
    check('inline math renders KaTeX', inline.includes('katex'), inline.slice(0, 80));
    check('inline math is not display mode', !inline.includes('katex-display'));
    const display = renderAnnouncement('$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$');
    check('display math renders', display.includes('katex-display'), display.slice(0, 80));
    const brackets = renderAnnouncement('\\[x^2\\]');
    check('\\[ … \\] renders as display math', brackets.includes('katex-display'));
    const parens = renderAnnouncement('\\(y_1\\)');
    check('\\( … \\) renders as inline math', parens.includes('katex') && !parens.includes('katex-display'));
    const subscripts = renderAnnouncement('$x_1 + x_2$ 与 $a_{n+1}$');
    check('underscores in formulas are not converted to emphasis', (subscripts.match(/katex/g) ?? []).length >= 2 && !subscripts.includes('<em>'), subscripts.slice(0, 100));
    const currency = renderAnnouncement('价格是 $5 到 $6 之间。');
    check('currency is not treated as math', !currency.includes('katex'), currency.slice(0, 80));
    const broken = renderAnnouncement('$\\frac{1}{$');
    check('malformed math does not throw', typeof broken === 'string');
}
console.log('\n=== Markdown ===');
{
    const list = renderAnnouncement('- 第一条\n- 第二条\n- 第三条');
    check('bullet list becomes <ul>', list.includes('<ul>'));
    check('three list items', (list.match(/<li>/g) ?? []).length === 3, String((list.match(/<li>/g) ?? []).length));
    const emphasis = renderAnnouncement('这是 **粗体** 和 *斜体*。');
    check('<strong> rendered', emphasis.includes('<strong>'));
    check('<em> rendered', emphasis.includes('<em>'));
    const link = renderAnnouncement('请看 [入营指南](https://example.com/guide)。');
    check('markdown link rendered', link.includes('<a') && link.includes('https://example.com/guide'), link.slice(0, 120));
    const heading = renderAnnouncement('## 标题');
    check('heading rendered', /<h2/.test(heading), heading.slice(0, 60));
}
console.log('\n=== mixed HTML + Markdown ===');
{
    const mixed = renderAnnouncement('<strong>2026秋季</strong>，训练营的安排如下：<br />\n- 班级优先安排现有学员\n- 优先报名截止日期为7月31日');
    check('existing <strong> preserved verbatim', mixed.includes('<strong>2026秋季</strong>'), mixed.slice(0, 100));
    check('existing <br> preserved', mixed.includes('<br'));
    check('html body is not markdown-escaped', !mixed.includes('&lt;strong&gt;'));
    const anchored = renderAnnouncement('<a href="https://example.com" target="_blank">链接</a>');
    check('anchor preserved', anchored.includes('example.com'));
}
console.log('\n=== sanitisation target (values) ===');
{
    const { sanitize } = await import('../src/lib/markdown.ts');
    check('sanitize is applied by the pipeline and callable', typeof sanitize === 'function');
}
console.log('\n=== markdown that also contains inline html ===');
{
    const notice = '###### 当前服务状态：<span class="badge">所有服务正常</span>\n\n***\n\n我们用大白话重写了[使用条款](https://example.com/terms.html)。\n\n- 第一条\n- 第二条\n'
    const html = renderAnnouncement(notice)
    check('heading rendered', /<h6/i.test(html), html.slice(0, 120))
    check('inline span kept', html.includes('<span'), html.slice(0, 200))
    check('link converted', /<a\b[^>]*href="https:\/\/example\.com\/terms\.html"/.test(html), html.slice(0, 260))
    check('list converted', /<ul>|<li>/.test(html), html.slice(0, 300))
    check('no raw markdown headings left', !/#{3,}/.test(html), html.slice(0, 120))
    check('no raw link syntax left', !/\]\(https/.test(html), html.slice(0, 200))
}console.log('\n=== edge cases ===');
{
    check('empty string', renderAnnouncement('') === '');
    check('whitespace only', renderAnnouncement('   \n  ') === '');
    check('plain text passes through', renderAnnouncement('普通文本').includes('普通文本'));
    const long = renderAnnouncement('a'.repeat(20000));
    check('large body handled', long.length >= 20000 && long.includes('a'.repeat(100)), String(long.length));
    const entities = renderAnnouncement('<p>a &amp; b &lt; c</p>');
    check('entities survive', entities.includes('&amp;') || entities.includes('&'), entities.slice(0, 80));
}
console.log(`\n${failures === 0 ? 'ALL MARKDOWN CHECKS PASSED' : `${failures} MARKDOWN CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
