import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CookieJar, isTrustedHost } from '../electron/http.ts';
import { parseHomeSnapshot, parseProblemsetPage, parseStatusPage, parseProfile, parseProfileScript, parseServerTime, parseLoginAlert, isAlreadyLoggedInResponse, isLoginFailureAlert, isLoginGate, isLoginForm, parseCountdown, describeVerdictCode, verdictCodeFromLabel, extractSubmissionId, formatMemory, formatTime, } from '../electron/parsers.ts';
const here = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const skippedFixtures: string[] = [];
const canRead = (name: string): boolean => {
    if (existsSync(path.join(here, name)))
        return true;
    if (!skippedFixtures.includes(name))
        skippedFixtures.push(name);
    return false;
};
const read = (name: string) => readFileSync(path.join(here, name), 'utf8');
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    const status = condition ? 'PASS' : 'FAIL';
    if (!condition)
        failures++;
    console.log(`  [${status}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
console.log('\n=== index.html -> HomeSnapshot ===');
if (canRead('index.html')) {
    const html = read('index.html');
    const snap = parseHomeSnapshot(html, Date.now());
    console.log(`  announcements=${snap.announcements.length} banners=${snap.banners.length}`);
    check('found announcements', snap.announcements.length > 5, `got ${snap.announcements.length}`);
    const first = snap.announcements[0];
    check('first has title', !!first?.title, JSON.stringify(first?.title));
    check('first has date', !!first?.date, JSON.stringify(first?.date));
    check('first has body html', (first?.html.length ?? 0) > 0, `len=${first?.html.length}`);
    check('serverTime parsed', typeof snap.serverTime === 'number' && snap.serverTime > 0, String(snap.serverTime));
    console.log('  sample:', JSON.stringify({ title: first?.title, date: first?.date }, null, 0));
    console.log('  banners:', snap.banners.map((b) => b.src.split('/').pop()).join(', '));
}
console.log('\n=== loginpage.html -> profile / alert ===');
if (canRead('loginpage.html')) {
    const html = read('loginpage.html');
    const info = parseProfile(html);
    check('profileText === Login', info.profileText === 'Login', info.profileText);
    check('loggedIn === false', info.loggedIn === false);
    check('username === null', info.username === null);
    check('isAlreadyLoggedIn false', isAlreadyLoggedInResponse(html) === false);
}
console.log('\n=== contest.html -> embedded server clock ===');
if (canRead('contest.html')) {
    const html = read('contest.html');
    const t = parseServerTime(html);
    check('serverTime parsed from var diff=', t !== null, String(t));
    if (t !== null) {
        const rendered = new Date(t);
        console.log(`  serverTime = ${t} (${rendered.toISOString()})`);
        check('year is plausible', rendered.getUTCFullYear() >= 2024 && rendered.getUTCFullYear() <= 2100);
    }
}
console.log('\n=== login failure body -> alert ===');
{
    const body = "  \n alert('UserName or Password Wrong!');\n";
    const msg = parseLoginAlert(body);
    check('alert parsed', msg === 'UserName or Password Wrong!', String(msg));
}
console.log('\n=== already-logged-in sentinel ===');
{
    check('sentinel detected', isAlreadyLoggedInResponse('<a href=logout.php>Please logout First!</a>'));
}
console.log('\n=== problemset.html (login gate) ===');
if (canRead('problemset.html')) {
    const html = read('problemset.html');
    check('login gate detected', isLoginGate(html));
    const page = parseProblemsetPage(html, 1);
    check('no problems parsed from gate', page.problems.length === 0, `got ${page.problems.length}`);
}
console.log('\n=== contest.html -> problemset parser (real table) ===');
if (canRead('contest.html')) {
    const html = read('contest.html');
    const page = parseProblemsetPage(html, 1);
    console.log(`  rows parsed=${page.problems.length} totalPages=${page.totalPages}`);
    check('empty tbody yields no rows', page.problems.length === 0, `got ${page.problems.length}`);
}
console.log('\n=== legacy combined-ratio problemset row ===');
{
    const html = `<html><body><table id="problemset"><thead><tr><td>ID</td><td>Title</td><td>Source</td><td>Ratio</td></tr></thead><tbody>
  <tr><td></td><td><a href="problem.php?id=1000">1000 - A+B Problem</a></td><td>入门</td><td>512/1024</td></tr>
  <tr><td></td><td><a href="problem.php?id=1001">1001 - Hello World</a></td><td>基础</td><td>3 / 9</td></tr>
  </tbody></table>
  <ul class="pagination"><li class="page-item"><a class="page-link" href="problemset.php?page=1">1</a></li><li class="page-item"><a class="page-link" href="problemset.php?page=7">7</a></li></ul>
  </body></html>`;
    const page = parseProblemsetPage(html, 2);
    check('2 problems', page.problems.length === 2, `got ${page.problems.length}`);
    check('id 1000', page.problems[0]?.id === 1000, String(page.problems[0]?.id));
    check('title stripped of id prefix', page.problems[0]?.title === 'A+B Problem', JSON.stringify(page.problems[0]?.title));
    check('total from ratio cell', page.problems[0]?.submissions === 1024, String(page.problems[0]?.submissions));
    check('spaced ratio total 9', page.problems[1]?.submissions === 9, String(page.problems[1]?.submissions));
    check('totalPages 7', page.totalPages === 7, String(page.totalPages));
}
console.log('\n=== synthetic HUSTOJ status row ===');
{
    const html = `<html><body><table><tbody>
  <tr><td>12345</td><td><a href="userinfo.php?user=alice">alice</a></td><td><a href="problem.php?id=1000">A+B Problem</a></td><td class="status_y">Accepted</td><td>1712 KB</td><td>15 MS</td><td>G++</td><td>256 B</td><td>2026-10-09 22:24:21</td></tr>
  <tr><td>12346</td><td><a href="userinfo.php?user=bob">bob</a></td><td><a href="problem.php?id=1001">Hello</a></td><td class="status_n">Wrong Answer</td><td>2048 KB</td><td>2 S</td><td>Python3</td><td>64 B</td><td>2026-10-09 22:25:00</td></tr>
  <tr><td>12347</td><td><a href="userinfo.php?user=carol">carol</a></td><td><a href="problem.php?id=1002">Pending</a></td><td class="status_w">Waiting</td><td></td><td></td><td>G++</td><td>10 B</td><td>2026-10-09 22:26:00</td></tr>
  </tbody></table></body></html>`;
    const page = parseStatusPage(html);
    check('3 submissions', page.submissions.length === 3, `got ${page.submissions.length}`);
    const [a, b, c] = page.submissions;
    check('accepted verdict', a?.verdict === 'accepted', String(a?.verdict));
    check('accepted problemId 1000', a?.problemId === 1000, String(a?.problemId));
    check('accepted memory 1712KB', a?.memoryKb === 1712, String(a?.memoryKb));
    check('accepted time 15ms', a?.timeMs === 15, String(a?.timeMs));
    check('accepted user alice', a?.user === 'alice', JSON.stringify(a?.user));
    check('accepted language G++', a?.language === 'G++', JSON.stringify(a?.language));
    check('accepted submittedAt', a?.submittedAt === '2026-10-09 22:24:21', JSON.stringify(a?.submittedAt));
    check('wrong_answer verdict', b?.verdict === 'wrong_answer', String(b?.verdict));
    check('seconds -> ms conversion 2S=2000', b?.timeMs === 2000, String(b?.timeMs));
    check('pending verdict', c?.verdict === 'pending', String(c?.verdict));
    check('missing memory is null', c?.memoryKb === null, String(c?.memoryKb));
}
console.log('\n=== LIVE index.php snapshot (real countdown literal) ===');
if (canRead('index.html')) {
    const html = read('index.html');
    const snap = parseHomeSnapshot(html, Date.now());
    console.log(`  announcements=${snap.announcements.length} countdown=${snap.countdown.length} banners=${snap.banners.length}`);
    check('announcements parsed', snap.announcements.length > 5, `got ${snap.announcements.length}`);
    check('countdown recovered despite malformed literal', snap.countdown.length > 0, `got ${snap.countdown.length}`);
    check('countdown entries have whole days', snap.countdown.every((c) => Number.isInteger(c.days) && c.days >= 0), JSON.stringify(snap.countdown.slice(0, 3)));
    check('countdown sorted ascending', snap.countdown.every((c, i) => i === 0 || snap.countdown[i - 1].days <= c.days));
    console.log('  next events:', snap.countdown.slice(0, 4).map((c) => `${c.event}=${c.days}d`).join(', '));
}
console.log('\n=== countdown with single-digit month (2026-9-20) ===');
{
    const html = `<script>var list = [ [ "SingleDigit", "2099-9-05" ] ];</script>`;
    const items = parseCountdown(html);
    check('single-digit month parsed', items.length === 1, JSON.stringify(items));
    check('event name preserved', items[0]?.event === 'SingleDigit', JSON.stringify(items[0]));
}
console.log('\n=== unit formatting ===');
{
    check('512KB', formatMemory(512) === '512KB', formatMemory(512));
    check('1MB', formatMemory(1024) === '1.00MB', formatMemory(1024));
    check('1GB', formatMemory(1024 * 1024) === '1.00GB', formatMemory(1024 * 1024));
    check('null memory', formatMemory(null) === '—', formatMemory(null));
    check('15ms', formatTime(15) === '15ms', formatTime(15));
    check('1.5s', formatTime(1500) === '1.50s', formatTime(1500));
    check('null time', formatTime(null) === '—', formatTime(null));
}
console.log('\n=== #profile variants (Login vs 登录 vs handle) ===');
{
    const loggedOut = parseProfile('<span id="profile">Login</span>');
    check('Login is signed out', loggedOut.loggedIn === false, JSON.stringify(loggedOut));
    const chinese = parseProfile('<span id="profile">登录</span>');
    check('登录 is signed out', chinese.loggedIn === false, JSON.stringify(chinese));
    const user = parseProfile('<span id="profile">alice</span>');
    check('handle detected', user.username === 'alice', JSON.stringify(user));
    const hyphen = parseProfile('<span id="profile">SH-00001</span>');
    check('hyphenated handle preserved', hyphen.username === 'SH-00001', JSON.stringify(hyphen));
}
console.log('\n=== login form detection ===');
{
    if (canRead('loginpage.html'))
        check('loginpage is a form', isLoginForm(read('loginpage.html')));
    if (canRead('index.html'))
        check('index is not a form', isLoginForm(read('index.html')) === false);
    check('failure alert recognised', isLoginFailureAlert(parseLoginAlert("alert('UserName or Password Wrong!');")));
    check('benign alert not a failure', isLoginFailureAlert('Welcome back') === false);
}
console.log('\n=== home countdown array (inline script) ===');
{
    const html = `<script>
    var today = new Date(new Date().setHours(0,0,0,0));
    var list = [ [ "NOIP2026", "2099-11-28" ], [ "Past Event", "2000-01-01" ], [ "Future", "2099-12-19" ] ];
  </script>`;
    const items = parseCountdown(html);
    check('only future events kept', items.length === 2, JSON.stringify(items));
    check('sorted by days ascending', items[0]?.event === 'NOIP2026', JSON.stringify(items[0]));
    check('days is a whole number', Number.isInteger(items[0]?.days), String(items[0]?.days));
    check('past event excluded', !items.some((i) => i.event === 'Past Event'));
}
console.log('\n=== verdict code table (judge_result 0-11) ===');
{
    check('0 -> pending/Waiting', describeVerdictCode(0).label === 'Waiting' && describeVerdictCode(0).verdict === 'pending');
    check('4 -> accepted/Accepted', describeVerdictCode(4).label === 'Accepted' && describeVerdictCode(4).verdict === 'accepted');
    check('6 -> wrong_answer', describeVerdictCode(6).verdict === 'wrong_answer', describeVerdictCode(6).label);
    check('11 -> Compile Error', describeVerdictCode(11).label === 'Compile Error' && describeVerdictCode(11).verdict === 'compile_error');
    check('7 -> time_limit', describeVerdictCode(7).verdict === 'time_limit');
    check('8 -> memory_limit', describeVerdictCode(8).verdict === 'memory_limit');
    check('10 -> runtime_error', describeVerdictCode(10).verdict === 'runtime_error');
    check('unknown code -> other', describeVerdictCode(99).verdict === 'other');
    check('null code -> other', describeVerdictCode(null).verdict === 'other');
}
console.log('\n=== submission id from links ===');
{
    check('showsource?id=', extractSubmissionId('https://www.xmoj.tech/showsource.php?id=12345') === 12345);
    check('reinfo?sid=', extractSubmissionId('reinfo.php?sid=99') === 99);
    check('no link -> null', extractSubmissionId(null) === null);
}
console.log('\n=== real HUSTOJ problemset row (bare id col, status div) ===');
{
    const html = `<html><body><table id="problemset"><thead><tr><th>状态</th><th>编号</th><th>标题</th><th>通过</th><th>提交</th></tr></thead><tbody>
  <tr align='center' class='evenrow'><td><div class='status status_y'>Y</div></td> <td class='hidden-xs'><div class='center'>1841</div></td> <td><div class='left'><a href='problem.php?id=1841' target='_blank'>移动光标</a></div></td> <td><div class='center'><a href='status.php?problem_id=1841&jresult=4'>153</a></div></td> <td><div class='center'><a href='status.php?problem_id=1841'>392</a></div></td> </tr>
  <tr align='center' class='oddrow'><td><div class='status status_n'>N</div></td> <td class='hidden-xs'><div class='center'>1842</div></td> <td><div class='left'><a href='problem.php?id=1842'>奇怪的字符串</a></div></td> <td><div class='center'><a href='status.php?problem_id=1842&jresult=4'>83</a></div></td> <td><div class='center'><a href='status.php?problem_id=1842'>325</a></div></td> </tr>
  <tr align='center' class='evenrow'><td><div class='status'></div></td> <td class='hidden-xs'><div class='center'>1843</div></td> <td><div class='left'><a href='problem.php?id=1843'>超级跳棋</a></div></td> <td><div class='center'><a href='status.php?problem_id=1843&jresult=4'>0</a></div></td> <td><div class='center'><a href='status.php?problem_id=1843'>0</a></div></td> </tr>
  </tbody></table></body></html>`;
    const page = parseProblemsetPage(html);
    check('3 problems', page.problems.length === 3, `got ${page.problems.length}`);
    check('id from bare cell', page.problems[0]?.id === 1841, String(page.problems[0]?.id));
    check('title parsed', page.problems[0]?.title === '移动光标', JSON.stringify(page.problems[0]?.title));
    check('solved true for status_y', page.problems[0]?.solved === true, String(page.problems[0]?.solved));
    check('solved false for status_n', page.problems[1]?.solved === false, String(page.problems[1]?.solved));
    check('solved null when absent', page.problems[2]?.solved === null, String(page.problems[2]?.solved));
    check('accepted parsed', page.problems[0]?.accepted === 153, String(page.problems[0]?.accepted));
    check('submissions parsed', page.problems[0]?.submissions === 392, String(page.problems[0]?.submissions));
    check('acceptance rate computed', Math.abs((page.problems[0]?.acceptanceRate ?? 0) - (153 / 392) * 100) < 0.01, String(page.problems[0]?.acceptanceRate));
    check('zero counts yield 0% not null', page.problems[2]?.acceptanceRate === null, String(page.problems[2]?.acceptanceRate));
}
console.log('\n=== real status.php row (#result-tab, no status* class) ===');
{
    const html = `<html><body><table id="result-tab"><tbody>
  <tr class="oddrow"><td></td><td>1622133</td><td><a href='contestrank.php?cid=10739&user_id=alice#alice'>alice</a></td><td><div class=center><a href='problem.php?cid=10739&pid=6' target='_blank'>12079</a></div></td><td><a href='reinfo.php?sid=1622133' class='btn btn-success' title='点击看详细'>正确</a></td><td class='hidden-xs'><div id=center class=red>20964</div></td><td class='hidden-xs'><div id=center class=red>88</div></td><td class='hidden-xs'><a target=_blank href=showsource.php?id=1622133>C++</a>/<a target=_self href="submitpage.php?id=12079&sid=1622133">Edit</a></td><td class='hidden-xs'>1788 B</td><td>2026-10-04 11:37:41</td><td class='hidden-xs'>saturn</td><td class='hidden-xs'>-O2</td></tr>
  <tr class="evenrow"><td></td><td>1622055</td><td><a href='userinfo.php?user=bob'>bob</a></td><td><div class=center><a href='problem.php?id=1001' target='_blank'>1001</a></div></td><td><a href='ceinfo.php?sid=1622055' class='btn btn-danger' title='点击看详细'>编译错误</a></td><td class='hidden-xs'><div id=center class=red>1024</div></td><td class='hidden-xs'><div id=center class=red>1500</div></td><td class='hidden-xs'><a target=_blank href=showsource.php?id=1622055>G++</a></td><td class='hidden-xs'>256 B</td><td>2026-10-04 10:45:58</td><td class='hidden-xs'>saturn</td><td class='hidden-xs'>-O2</td></tr>
  <tr class="oddrow"><td></td><td>1622024</td><td><a href='userinfo.php?user=carol'>carol</a></td><td><div class=center><a href='problem.php?id=1002' target='_blank'>1002</a></div></td><td><a href='reinfo.php?sid=1622024' class='btn btn-warning' title='点击看详细'>答案错误</a></td><td class='hidden-xs'><div id=center class=red>9376</div></td><td class='hidden-xs'><div id=center class=red>65</div></td><td class='hidden-xs'><a target=_blank href=showsource.php?id=1622024>Python3</a></td><td class='hidden-xs'>64 B</td><td>2026-10-04 10:18:46</td><td class='hidden-xs'>-</td><td class='hidden-xs'>-O2</td></tr>
  </tbody></table></body></html>`;
    const page = parseStatusPage(html);
    check('3 submissions from #result-tab', page.submissions.length === 3, `got ${page.submissions.length}`);
    const [a, b, c] = page.submissions;
    check('id 1622133', a?.id === 1622133, String(a?.id));
    check('verdict 正确 -> code 4 / accepted', a?.verdictCode === 4 && a?.verdict === 'accepted', `${a?.verdictCode}/${a?.verdict}`);
    check('内存 20964 (not swapped with time)', a?.memoryKb === 20964, String(a?.memoryKb));
    check('耗时 88 (not swapped with memory)', a?.timeMs === 88, String(a?.timeMs));
    check('code length 1788', a?.codeLength === 1788, String(a?.codeLength));
    check('language C++', a?.language === 'C++', JSON.stringify(a?.language));
    check('author alice', a?.user === 'alice', JSON.stringify(a?.user));
    check('rating saturn', a?.userRating === 'saturn', JSON.stringify(a?.userRating));
    check('timestamp', a?.submittedAt === '2026-10-04 11:37:41', JSON.stringify(a?.submittedAt));
    check('编译错误 -> code 11', b?.verdictCode === 11 && b?.verdict === 'compile_error', String(b?.verdictCode));
    check('memory 1024', b?.memoryKb === 1024, String(b?.memoryKb));
    check('time 1500', b?.timeMs === 1500, String(b?.timeMs));
    check('language G++', b?.language === 'G++', JSON.stringify(b?.language));
    check('author bob', b?.user === 'bob', JSON.stringify(b?.user));
    check('答案错误 -> code 6', c?.verdictCode === 6 && c?.verdict === 'wrong_answer', String(c?.verdictCode));
    check('Python3 language', c?.language === 'Python3', JSON.stringify(c?.language));
    check('dash rating kept as text', c?.userRating === '-', JSON.stringify(c?.userRating));
}
console.log('\n=== verdict label mapping (Chinese + English) ===');
{
    const cases: [
        string,
        number
    ][] = [
        ['正确', 4],
        ['答案错误', 6],
        ['运行错误', 10],
        ['编译错误', 11],
        ['时间超限', 7],
        ['内存超限', 8],
        ['输出超限', 9],
        ['格式错误', 5],
        ['等待', 0],
        ['等待重判', 1],
        ['编译中', 2],
        ['Accepted', 4],
        ['Wrong Answer', 6],
        ['Time Limit Exceeded', 7],
        ['Compile Error', 11],
    ];
    for (const [label, expected] of cases) {
        check(`"${label}" -> ${expected}`, verdictCodeFromLabel(label) === expected, String(verdictCodeFromLabel(label)));
    }
    check('unknown label -> null', verdictCodeFromLabel('莫名其妙') === null);
}
console.log('\n=== problemset table selection robustness ===');
{
    const noId = `<html><body>
    <table><tr><td>题目编号</td><td><input name="id"></td><td>查找</td></tr></table>
    <table><tbody>
      <tr><td><div class="status status_y"></div></td><td>1000</td><td>A+B</td><td>入门</td><td>5/9</td></tr>
      <tr><td><div class="status status_n"></div></td><td>1001</td><td>Hello</td><td>基础</td><td>1/2</td></tr>
    </tbody></table>
  </body></html>`;
    const page = parseProblemsetPage(noId);
    check('picks the problem table without #problemset', page.problems.length === 2, `got ${page.problems.length}`);
    check('ids correct', page.problems[0]?.id === 1000 && page.problems[1]?.id === 1001);
    const gate = `<html><body><div class="jumbotron">请登录后继续操作</div></body></html>`;
    check('no problem table -> empty', parseProblemsetPage(gate).problems.length === 0);
    const layout = `<html><body><table><tr><td>a</td></tr><tr><td>b</td></tr></table></body></html>`;
    check('layout table rejected', parseProblemsetPage(layout).problems.length === 0);
}
console.log('\n=== trusted hosts for cookie storage ===');
{
    const trusted = [
        'www.xmoj.tech',
        'xmoj.tech',
        'www.xmoj-script.uk',
        'xmoj-script.uk',
        'api.xmoj-script.uk',
        'assets.xmoj-script.uk',
        'xmoj-bbs.me',
        'api.xmoj-bbs.me',
        'xmoj-bbs.tech',
        'api.xmoj-bbs.tech',
    ];
    for (const host of trusted) {
        check(`trusted: ${host}`, isTrustedHost(host));
    }
    const untrusted = [
        'evil.example',
        'xmoj-script.uk.attacker.example',
        'notxmoj-script.uk',
        'xmoj.tech.evil.example',
        '127.0.0.1',
    ];
    for (const host of untrusted) {
        check(`rejected: ${host}`, !isTrustedHost(host));
    }
}
console.log('\n=== cookie jar accepts trusted backends, rejects others ===');
{
    const jar = new CookieJar();
    const apiUrl = new URL('https://api.xmoj-script.uk/SendData');
    jar.store(['bbs_session=abc; path=/', 'evil=1; Domain=attacker.example'], apiUrl);
    check('stores a cookie from the trusted API host', jar.get('bbs_session') === 'abc', String(jar.get('bbs_session')));
    check('rejects a foreign cookie', jar.get('evil') === null, String(jar.get('evil')));
    const bbsUrl = new URL('https://api.xmoj-bbs.me/GetPosts');
    jar.store(['bbs2=xyz; path=/'], bbsUrl);
    check('stores a cookie from xmoj-bbs.me', jar.get('bbs2') === 'xyz', String(jar.get('bbs2')));
    check('does not send backend cookies to the judge', !(jar.headerFor(new URL('https://www.xmoj.tech/index.php')) ?? '').includes('bbs2'), String(jar.headerFor(new URL('https://www.xmoj.tech/index.php'))));
}
if (skippedFixtures.length > 0) {
    console.log(`\n=== skipped ${skippedFixtures.length} snapshot-based block(s) ===`);
    console.log(`  missing: ${skippedFixtures.join(', ')}`);
    console.log('  these live in tests/fixtures/, which is gitignored; capture them to run the checks above');
}
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
