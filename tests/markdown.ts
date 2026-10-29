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
console.log('\n=== Luogu editor syntax ===');
{
    for (const kind of ['info', 'success', 'warning', 'error']) {
        const closed = renderAnnouncement(`:::${kind}[提示 **标题**]\n内容 $x_1$\n:::`);
        check(`${kind} is collapsed by default`, closed.includes(`callout-${kind}"`) && !closed.includes(' open'));
        check(`${kind} title and math render`, closed.includes('<strong>标题</strong>') && closed.includes('katex'));
        const open = renderAnnouncement(`:::${kind}[展开]{open}\n内容\n:::`, 'markdown');
        check(`${kind} supports open`, /<details[^>]+ open>/.test(open));
    }
    const nested = renderAnnouncement(':::::warning[父容器]\n\n::::success[子容器]{open}\n:::error[孙容器]{open}\n内容\n:::\n::::\n\n结束\n:::::');
    check('three nested callouts render', (nested.match(/<details/g) ?? []).length === 3 && !nested.includes(':::'));
    const align = renderAnnouncement('::::align{right}\n## 右侧\n\n:::align{center}\n居中\n:::\n\n右侧\n::::');
    check('alignment directives nest', align.includes('markdown-align-right') && align.includes('markdown-align-center') && align.includes('<h2>右侧</h2>'));
    const epigraph = renderAnnouncement(':::epigraph[——**otto**]\n大家好啊。\n:::');
    check('epigraph renders attribution', epigraph.includes('markdown-epigraph') && epigraph.includes('<figcaption>——<strong>otto</strong></figcaption>'));
    const linkedTitle = renderAnnouncement(':::info[查看 [帮助](https://example.com)]\n内容\n:::', 'markdown');
    check('links in directive titles', linkedTitle.includes('<summary>查看 <a href="https://example.com">帮助</a></summary>'));
    const table = '| A | B | C |\n| :-: | --: | --- |\n| a | < | x |\n| ^ | ^ | y |\n| ^ | ^ | z |';
    const merged = renderAnnouncement(table, 'markdown');
    check('rectangular colspan and rowspan', merged.includes('rowspan="3" colspan="2"') && !merged.includes('>^<'));
    check('table alignment preserved', merged.includes('text-align:center') && merged.includes('text-align:right'));
    const malformed = renderAnnouncement('|1|2|3|4|5|\n|:-:|:-:|:-:|:-:|:-:|\n|a|<|<|^|<|\n|^|a|<|^|<|\n|^|>|a|^|<|\n|<|<|<|a|<|', 'markdown');
    check('malformed merge markers do not throw', malformed.includes('<table') && malformed.includes('colspan="3"'));
    for (const style of ['three', 'tuack', 'tuack=2']) {
        const styled = renderAnnouncement(`::cute-table{${style}}\n\n${table}\n\n后续段落`, 'markdown');
        check(`cute-table ${style}`, styled.includes(`cute-table-${style.split('=')[0]}`) && !styled.includes('::cute-table') && styled.includes('后续段落'));
        if (style.includes('=')) check('tuack divider position', styled.includes('class="table-divider"'));
    }
    const isolated = renderAnnouncement(`::cute-table{three}\n\n${table}\n\n${table}`, 'markdown');
    check('table directive affects only next table', (isolated.match(/cute-table-three/g) ?? []).length === 1 && (isolated.match(/<table/g) ?? []).length === 2);
    const unknown = renderAnnouncement(':::unknown[保留]\n内容\n:::', 'markdown');
    check('unknown directives stay readable', unknown.includes(':::unknown') && unknown.includes('内容'), unknown);
    const unclosed = renderAnnouncement(':::info[未闭合]\n内容', 'markdown');
    check('unclosed directive stays readable', unclosed.includes(':::info') && unclosed.includes('内容'), unclosed);
}
console.log('\n=== Code fences ===');
{
    const code = renderAnnouncement('```cpp lines=2-3,5\nint x = 1;\n/* multiline\ncomment */\n$x$\nreturn 0;\n```', 'markdown');
    check('Prism syntax highlighting', code.includes('token keyword'));
    check('code line numbers', code.includes('data-line="5"'));
    check('specified code lines highlighted', (code.match(/class="code-line code-line-highlight"/g) ?? []).length === 3);
    check('math inside code stays literal', code.includes('$x$') && !code.includes('katex'));
    const tilde = renderAnnouncement('~~~py\nprint("$x$")\n~~~');
    check('tilde fences and Python alias', tilde.includes('language-py') && tilde.includes('token string') && !tilde.includes('katex'));
    const long = renderAnnouncement('````plain\n```\n:::info[test]\n$x$\n:::join\n````', 'markdown');
    check('long fences protect directives and math', !long.includes('<details') && !long.includes('katex') && long.includes(':::info'));
    const inline = renderAnnouncement('``$x$ `literal` ``', 'markdown');
    check('multi-backtick code spans protect math', inline.includes('<code>$x$ `literal` </code>') && !inline.includes('katex'));
    const autoInline = renderAnnouncement('公式源码 `$x_1$`');
    check('auto mode still renders inline code', autoInline.includes('<code>$x_1$</code>') && !autoInline.includes('katex'));
    const nested = renderAnnouncement(':::info[code]{open}\n```plain\n:::\n```\n末尾\n:::', 'markdown');
    check('closing directive inside code is literal', nested.includes('data-line="1">:::') && nested.includes('末尾') && nested.includes('</details>'));
    for (const language of ['plain', 'unknown', 'constructor', '__proto__']) {
        const plain = renderAnnouncement(`\`\`\`${language}\n<script>$x$</script>\n\`\`\``, 'markdown');
        check(`safe fallback for ${language}`, /&lt;script(?:&gt;|>)/.test(plain) && !plain.includes('token ') && !plain.includes('katex'), plain);
    }
    const auto = renderAnnouncement('```cpp\n#include <bits/stdc++.h>\n```');
    check('auto mode escapes code HTML', /&lt;bits\/stdc\+\+\.h(?:&gt;|>)/.test(auto) && !auto.includes('<bits'), auto);
    const htmlCode = renderAnnouncement('```html\n<p>$x$</p>\n```');
    check('code HTML does not interfere with auto detection', htmlCode.includes('<pre><code') && !htmlCode.includes('katex'));
    const blankLine = renderAnnouncement('```plain\na\n\n```', 'markdown');
    check('trailing blank code lines preserved', blankLine.includes('data-line="2"'));
}
console.log(`\n${failures === 0 ? 'ALL MARKDOWN CHECKS PASSED' : `${failures} MARKDOWN CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
