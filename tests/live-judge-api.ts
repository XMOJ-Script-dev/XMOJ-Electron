import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpClient } from '../electron/http.ts';
import { fetchContestDetail, fetchContestList, fetchNavInfo, userExists, } from '../electron/judge-api.ts';
import { XMOJ_ORIGIN } from '../src/shared/types.ts';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
const here = path.dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(path.join(here, 'account.txt'), 'utf8');
const fields: Record<string, string> = {};
for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_]+)\s*[:=]\s*(.+?)\s*$/);
    if (m)
        fields[m[1].toLowerCase()] = m[2];
}
const user = fields.username!;
const http = new HttpClient();
await http.post(`${XMOJ_ORIGIN}/login.php`, {
    user_id: user,
    password: fields.password!,
    submit: '登录',
});
console.log(`signed in as ${user[0]}***${user.at(-1)}`);
console.log('\n=== /api/nav ===');
{
    const result = await fetchNavInfo(http);
    check('nav returned JSON', result.ok, result.error ?? '');
    if (result.data) {
        check('reports loggedIn', result.data.loggedIn === true);
        check('userId matches the account', result.data.userId === user, result.data.userId);
        check('nick present', typeof result.data.nick === 'string', result.data.nick);
        check('lang present', typeof result.data.lang === 'string', result.data.lang);
        console.log(`    nick=${JSON.stringify(result.data.nick)} admin=${result.data.isAdmin} lang=${result.data.lang}`);
    }
}
console.log('\n=== /api/contest/list ===');
{
    const result = await fetchContestList(http, 1);
    check('list returned JSON', result.ok, result.error ?? '');
    if (result.data) {
        check('has contests', result.data.list.length > 0, `${result.data.list.length}`);
        check('total is large', result.data.total > 10, `${result.data.total}`);
        check('pagination fields present', result.data.totalPages > 0, `pages=${result.data.totalPages}`);
        const first = result.data.list[0];
        check('entries have ids and titles', first.contestId > 0 && first.title.length > 0);
        check('entries have time windows', Boolean(first.startTime && first.endTime), `${first.startTime} → ${first.endTime}`);
        console.log(`    total=${result.data.total} pages=${result.data.totalPages} first=${JSON.stringify(first)}`);
        const second = await fetchContestList(http, 2);
        check('page 2 differs from page 1', second.ok && second.data !== null && second.data.list[0]?.contestId !== first.contestId, String(second.data?.list[0]?.contestId));
    }
}
console.log('\n=== /api/contest/{cid}/A ===');
{
    const list = await fetchContestList(http, 1);
    const contestId = list.data?.list[0]?.contestId;
    check('found a contest to inspect', Boolean(contestId), String(contestId));
    if (contestId) {
        const detail = await fetchContestDetail(http, contestId);
        check('detail returned JSON', detail.ok, detail.error ?? '');
        if (detail.data) {
            check('contest matches', detail.data.contest.contestId === contestId);
            check('problems parsed', detail.data.problems.length > 0, `${detail.data.problems.length}`);
            const first = detail.data.problems[0];
            check('problems carry labels', typeof first.num === 'string' && first.num.length > 0, first.num);
            check('problems carry ids', typeof first.problemId === 'number', String(first.problemId));
            check('problems carry titles', first.title.length > 0, first.title);
            console.log(`    ${detail.data.contest.title} :: ${detail.data.problems.length} problems, myRole=${detail.data.myRole}`);
            console.log(`    first: ${JSON.stringify(first)}`);
        }
    }
}
console.log('\n=== user existence ===');
{
    const self = await userExists(http, user);
    check('existing user is detected', self === true, String(self));
    const missing = await userExists(http, '__definitely_not_a_user_xyz__');
    check('unknown user is detected', missing === false, String(missing));
    const blank = await userExists(http, '   ');
    check('blank name is not a user', blank === false, String(blank));
    const admin = await userExists(http, 'admin');
    check('admin is detected', admin === true, String(admin));
}
console.log(`\n${failures === 0 ? 'ALL JUDGE API CHECKS PASSED' : `${failures} JUDGE API CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
