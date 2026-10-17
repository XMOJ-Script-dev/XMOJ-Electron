import { decodeEntities, parseProblemCards, parseProblemDetail } from '../electron/problems.ts';
import { parseSolvedProblems, parseUserProfile } from '../electron/profile.ts';
import { parseContestRank } from '../electron/rank.ts';
import { normalizeAssetUrls, sanitizeHtml } from '../electron/parsers.ts';
import { parse as parseHtml } from 'node-html-parser';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
console.log('\n=== entity decoding ===');
{
    check('decodes < and >', decodeEntities('a &lt; b &gt; c') === 'a < b > c');
    check('decodes quotes', decodeEntities('&quot;x&quot;') === '"x"');
    check('decodes nbsp to a space', decodeEntities('a&nbsp;b') === 'a b');
    check('double-escaped stays escaped once', decodeEntities('&amp;lt;') === '&lt;', decodeEntities('&amp;lt;'));
}
console.log('\n=== asset URL normalisation (item 15) ===');
{
    const html = '<img src="/upload/image/a.png"><a href="/uploads/doc.pdf">d</a>';
    const out = normalizeAssetUrls(html);
    check('root-relative src is absolutised', out.includes('src="https://www.xmoj.tech/upload/image/a.png"'), out);
    check('root-relative href is absolutised', out.includes('href="https://www.xmoj.tech/uploads/doc.pdf"'));
    const untouched = normalizeAssetUrls('<img src="https://cdn.example/a.png"><img src="data:image/png;base64,AA">');
    check('absolute URLs are left alone', untouched.includes('https://cdn.example/a.png'));
    check('data URIs are left alone', untouched.includes('data:image/png;base64,AA'));
    check('sanitizeHtml normalises as well', sanitizeHtml('<img src="/upload/x.png">').includes('https://www.xmoj.tech/upload/x.png'));
    check('script tags are still stripped', !sanitizeHtml('<script>alert(1)</script>ok').includes('alert'));
}
console.log('\n=== problem cards: sample wrappers (item 2) ===');
{
    const html = `
    <div class="jumbotron">
      <center><h2>1841: 移动光标</h2>
      <h3><span class=green>输入文件: </span>cursor.in&nbsp;&nbsp;<span class=green>输出文件: </span>cursor.out&nbsp;&nbsp;<span class=green>时间限制: </span>2 Sec&nbsp;&nbsp;<span class=green>内存限制: </span>256 MB</h3></center>
      <div class='cnt-row'><div class='cnt-row-head title'>样例输入输出</div><div class='cnt-row-body'>
        <div class='data-sample'><div class='in-out'><div class='in-out-item'><pre class='content'><span class=sampledata>5 2
1 1</span></pre></div><div class='in-out-item'><pre class='content'><span class=sampledata>9</span></pre></div></div>
        <div><div class='title'>样例说明 #1</div><div class='content lang_cn'><p>因为 $k=2$。</p></div></div></div></div></div>
      <div class='cnt-row'><div class='cnt-row-head title'>数据范围</div><div class='cnt-row-body'><div class='content lang_cn'><p>对于 $100\\%$ 的数据。</p></div></div></div>
    </div>`;
    const detail = parseProblemDetail(html, 1841);
    const sampleCard = detail.cards.find((card) => card.isSamples);
    check('two cards parsed', detail.cards.length === 2, String(detail.cards.length));
    check('sample card detected', Boolean(sampleCard));
    check('inputs decoded', sampleCard?.samples[0]?.input === '5 2\n1 1', JSON.stringify(sampleCard?.samples[0]?.input));
    check('outputs decoded', sampleCard?.samples[0]?.output === '9', JSON.stringify(sampleCard?.samples[0]?.output));
    check('no <span class=sampledata> text remains', !/sampledata|<\/?span/.test(sampleCard?.html ?? ''), JSON.stringify(sampleCard?.html));
    check('the explanation survives', /k=2/.test(sampleCard?.html ?? ''), JSON.stringify(sampleCard?.html));
    check('title has no id prefix', detail.title === '移动光标', detail.title);
    check('file names parsed', detail.inputName === 'cursor' && detail.outputName === 'cursor');
    check('info header parsed', detail.meta.some((m) => m.label === '时间限制' && m.value.startsWith('2')), JSON.stringify(detail.meta));
}
console.log('\n=== problem cards: bare sampledata spans ===');
{
    const html = `<div class="jumbotron"><center><h2>9: x</h2></center>
    <div class='cnt-row'><div class='cnt-row-head title'>样例输入输出</div><div class='cnt-row-body'>
    <div class='data-sample'><pre><span class=sampledata>abba</span><span class=sampledata>7</span></pre></div>
    </div></div></div>`;
    const card = parseProblemDetail(html, 9).cards.find((c) => c.isSamples);
    check('input from first span', card?.samples[0]?.input === 'abba', JSON.stringify(card?.samples[0]));
    check('output from second span', card?.samples[0]?.output === '7', JSON.stringify(card?.samples[0]));
}
console.log('\n=== parseProblemCards tolerates a card with no body ===');
{
    const root = parseHtml("<div class='cnt-row'><div class='cnt-row-head'>only head</div></div>");
    const cards = parseProblemCards(root as never);
    check('card without a body is skipped', cards.length === 0, String(cards.length));
}
console.log('\n=== contest ranking table ===');
{
    const html = `<h2>OI Mode RankList -- 测试赛</h2>
    <table>
      <tr><th>Rank</th><th>User</th><th>Nick</th><th>Solved</th><th>Mark</th><th>A</th><th>B</th></tr>
      <tr><td>1</td><td>alice</td><td>Alice</td><td>2</td><td>200</td>
        <td style="background-color:#53ff53">100</td><td>100</td></tr>
      <tr><td>Winner</td><td>bob</td><td>Bob</td><td>1</td><td>100</td>
        <td style="background-color:#ff0000">50</td><td></td></tr>
    </table>`;
    const rank = parseContestRank(html, 10739, true);
    check('title stripped of the prefix', rank.title === '测试赛', rank.title);
    check('headers parsed', JSON.stringify(rank.headers) === '["A","B"]', JSON.stringify(rank.headers));
    check('two rows parsed', rank.rows.length === 2, String(rank.rows.length));
    const first = rank.rows[0];
    check('rank number parsed', first.rank === 1, String(first.rank));
    check('user and nick', first.userId === 'alice' && first.nick === 'Alice');
    check('solved and score', first.solved === 2 && first.score === 200, `${first.solved}/${first.score}`);
    check('full-score cell flagged', first.cells[0].accepted === true, JSON.stringify(first.cells));
    check('both problem cells kept', first.cells.length === 2, JSON.stringify(first.cells));
    const second = rank.rows[1];
    check('badge rank becomes rankText', second.rank === null && second.rankText === 'Winner', JSON.stringify({ r: second.rank, t: second.rankText }));
    check('partial score is not accepted', second.cells[0].accepted === false, JSON.stringify(second.cells[0]));
    check('empty cell kept as empty', second.cells[1].text === '', JSON.stringify(second.cells[1]));
    const empty = parseContestRank('<html><body>nothing</body></html>', 1, true);
    check('missing table yields an empty rank', empty.rows.length === 0 && empty.headers.length === 0);
}
console.log('\n=== user profile script emitter ===');
{
    const html = `<div class="container">
      <h2>liushangchen--zsTree</h2>
      Solved Problems List 解决257
      <script>function p(id,c){document.write("<a href='problem.php?id="+id+"'>"+id+"</a>");}
      p(1021,12);p(1219,3);p(1220,6);p(1021,12);</script>
    </div>`;
    const problems = parseSolvedProblems(html);
    check('emitted calls parsed', problems.length === 3, String(problems.length));
    check('duplicates collapsed', problems.length === new Set(problems.map((p) => p.id)).size);
    check('attempts captured', problems[0].attempts === 12, String(problems[0].attempts));
    check('urls are absolute', problems[0].url.startsWith('https://www.xmoj.tech/problem.php?id='), problems[0].url);
    const profile = parseUserProfile(html, 'liushangchen');
    check('nick parsed', profile.nick === 'zsTree', profile.nick);
    check('solved total parsed', profile.solvedTotal === 257, String(profile.solvedTotal));
    check('profile url built', profile.profileUrl.includes('user=liushangchen'), profile.profileUrl);
    check('page without the emitter yields none', parseSolvedProblems('<p>hi</p>').length === 0);
}
console.log(`\n${failures === 0 ? 'ALL NATIVE VIEW CHECKS PASSED' : `${failures} NATIVE VIEW CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
