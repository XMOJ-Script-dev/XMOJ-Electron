import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SessionManager } from '../electron/session.ts';
import { parseProblemsetPage, parseStatusPage, parseProfileScript, isLoginGate, isLoginForm, } from '../electron/parsers.ts';
import { XMOJ_ORIGIN } from '../src/shared/types.ts';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
function mask(value: string): string {
    if (value.length <= 2)
        return '*'.repeat(value.length);
    return `${value[0]}${'*'.repeat(Math.max(1, value.length - 2))}${value.at(-1)}`;
}
const here = path.dirname(fileURLToPath(import.meta.url));
function readCredentials(): {
    username: string;
    password: string;
} {
    const raw = readFileSync(path.join(here, 'account.txt'), 'utf8');
    const fields: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_]+)\s*[:=]\s*(.+?)\s*$/);
        if (match)
            fields[match[1].toLowerCase()] = match[2];
    }
    const username = fields.username ?? fields.user ?? fields.user_id;
    const password = fields.password ?? fields.pass;
    if (!username || !password) {
        throw new Error('tests/account.txt 需要包含 Username 与 Password 两行');
    }
    return { username, password };
}
const { username, password } = readCredentials();
const passwordBytes = Buffer.byteLength(password, 'utf8');
console.log('\n=== credentials loaded (redacted) ===');
console.log(`  username: ${mask(username)} (${username.length} chars)`);
console.log(`  password: <redacted> (${passwordBytes} bytes)`);
const report: string[] = [`username_masked=${mask(username)}`, `password_bytes=${passwordBytes}`];
const session = new SessionManager();
await session.load();
console.log('\n=== login ===');
const result = await session.login(username, password, true);
check('login succeeded', result.ok, result.ok ? '' : String(result.message));
if (!result.ok) {
    console.log(`  server said: ${result.message}`);
    console.log('  (no secrets printed)');
    process.exit(1);
}
const state = session.snapshot();
check('snapshot reports authenticated', state.authenticated === true);
check('resolved a username', Boolean(state.user?.username), state.user ? mask(state.user.username) : 'none');
check('session id present', Boolean(state.sessionId), state.sessionId ? `${state.sessionId.length} chars` : 'none');
check('remembered username stored', Boolean(state.rememberedUsername), state.rememberedUsername ? mask(state.rememberedUsername) : 'none');
check('canSilentLogin true (remember=true)', state.canSilentLogin === true);
report.push(`authenticated=${state.authenticated}`);
report.push(`resolved_username_masked=${state.user ? mask(state.user.username) : 'none'}`);
report.push(`resolved_username_len=${state.user?.username.length ?? 0}`);
report.push(`is_admin=${state.user?.isAdmin ?? false}`);
report.push(`remembered_matches_input=${state.rememberedUsername === username}`);
console.log('\n=== authenticated index.php ===');
const home = await session.http.get(`${XMOJ_ORIGIN}/index.php`);
check('index.php is not a login form', !isLoginForm(home.body));
const scriptSrc = home.body.match(/<script[^>]+src\s*=\s*["']?([^"'\s>]*profile\.php[^"'\s>]*)["']?/i)?.[1];
check('index.php references the profile script', Boolean(scriptSrc), scriptSrc ?? 'none');
if (scriptSrc) {
    const script = await session.http.get(new URL(scriptSrc, XMOJ_ORIGIN).href);
    const info = parseProfileScript(script.body);
    check('profile script yields a handle', info.username !== null, info.username ? mask(info.username) : 'null');
    check('profile script handle matches login username', info.username === username);
    report.push(`profile_script_match=${info.username === username}`);
}
console.log('\n=== authenticated problemset.php ===');
const problemsetResponse = await session.http.get(`${XMOJ_ORIGIN}/problemset.php`);
check('problemset is not gated', !isLoginGate(problemsetResponse.body));
const problemset = parseProblemsetPage(problemsetResponse.body);
check('parsed at least one problem', problemset.problems.length > 0, `got ${problemset.problems.length}`);
check('problem ids are positive', problemset.problems.every((p) => Number.isInteger(p.id) && p.id > 0));
check('problem titles non-empty', problemset.problems.every((p) => p.title.length > 0));
check('solved flag is populated for at least one row', problemset.problems.some((p) => p.solved !== null), `solved=${problemset.problems.filter((p) => p.solved === true).length}/${problemset.problems.length}`);
check('ratio parsed for at least one row', problemset.problems.some((p) => p.submissions !== null), `withRatio=${problemset.problems.filter((p) => p.submissions !== null).length}`);
check('accepted count parses below total', problemset.problems.some((p) => p.accepted !== null && p.submissions !== null && p.accepted <= p.submissions), `accepted=${problemset.problems.filter((p) => p.accepted !== null).length}`);
check('every row has a real numeric id and title', problemset.problems.every((p) => p.id > 0 && p.title.length > 0 && !/Problem ID|Keywords/i.test(p.title)), `first=${problemset.problems[0]?.id}/${problemset.problems[0]?.title}`);
report.push(`problemset_rows=${problemset.problems.length}`);
report.push(`problemset_totalPages=${problemset.totalPages}`);
report.push(`problemset_solved_true=${problemset.problems.filter((p) => p.solved === true).length}`);
report.push(`problemset_solved_false=${problemset.problems.filter((p) => p.solved === false).length}`);
report.push(`problemset_solved_null=${problemset.problems.filter((p) => p.solved === null).length}`);
report.push(`problemset_title_sample=${problemset.problems.slice(0, 3).map((p) => p.title).join(' | ')}`);
report.push(`problemset_id_sample=${problemset.problems.slice(0, 5).map((p) => p.id).join(',')}`);
{
    const rows = problemsetResponse.body.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    const bodyRows = rows.filter((r) => /problemset|problem\.php/i.test(r)).slice(0, 3);
    report.push(`problemset_body_row_sample=${bodyRows.map((r) => r.replace(/\s+/g, ' ').slice(0, 700)).join(' ;; ')}`);
}
console.log('\n=== authenticated status.php ===');
const statusResponse = await session.http.get(`${XMOJ_ORIGIN}/status.php`);
check('status is not gated', !isLoginGate(statusResponse.body));
const status = parseStatusPage(statusResponse.body);
check('parsed at least one submission', status.submissions.length > 0, `got ${status.submissions.length}`);
check('submission ids positive', status.submissions.every((s) => Number.isInteger(s.id) && s.id > 0));
check('verdict codes resolved', status.submissions.some((s) => s.verdictCode !== null), status.submissions
    .slice(0, 5)
    .map((s) => s.verdictLabel)
    .join(','));
check('problem ids parsed', status.submissions.some((s) => s.problemId !== null));
check('languages parsed', status.submissions.some((s) => s.language !== ''), status.submissions.slice(0, 5).map((s) => s.language || '-').join(','));
check('timestamps parsed', status.submissions.some((s) => s.submittedAt !== ''));
check('memory parsed for some row', status.submissions.some((s) => s.memoryKb !== null));
check('time parsed for some row', status.submissions.some((s) => s.timeMs !== null));
check('users parsed', status.submissions.some((s) => s.user !== ''));
check('first page advertises a next cursor', status.paging.nextTop !== null, `nextTop=${status.paging.nextTop}`);
if (status.paging.nextTop !== null) {
    const nextQuery = new URLSearchParams({ top: String(status.paging.nextTop) });
    if (status.paging.nextPrevTop !== null) {
        nextQuery.set('prevtop', String(status.paging.nextPrevTop));
    }
    const nextResponse = await session.http.get(`${XMOJ_ORIGIN}/status.php?${nextQuery}`);
    const next = parseStatusPage(nextResponse.body);
    const firstIds = new Set(status.submissions.map((s) => s.id));
    const overlap = next.submissions.filter((s) => firstIds.has(s.id)).length;
    check('cursor page returns rows', next.submissions.length > 0, `rows=${next.submissions.length}`);
    check('cursor page advances to older submissions', next.submissions[0].id < status.submissions[0].id, `${next.submissions[0].id} < ${status.submissions[0].id}`);
    check('cursor page overlaps by at most the boundary row', overlap <= 1, `overlap=${overlap}`);
    check('cursor page exposes a back cursor', next.paging.prevTop !== null, `prevTop=${next.paging.prevTop}`);
    if (next.paging.prevTop !== null) {
        const back = parseStatusPage((await session.http.get(`${XMOJ_ORIGIN}/status.php?top=${next.paging.prevTop}`)).body);
        check('back cursor returns to the first page', back.submissions[0]?.id === status.submissions[0].id, `${back.submissions[0]?.id} vs ${status.submissions[0].id}`);
    }
    report.push(`next_page_rows=${next.submissions.length} overlap=${overlap}`);
    report.push(`next_page_prevTop=${next.paging.prevTop}`);
}
report.push(`status_rows=${status.submissions.length}`);
report.push(`status_paging_nextTop=${status.paging.nextTop}`);
report.push(`status_paging_prevTop=${status.paging.prevTop}`);
report.push(`status_verdict_labels=${[...new Set(status.submissions.map((s) => s.verdictLabel))].join('|')}`);
report.push(`status_memory_present=${status.submissions.filter((s) => s.memoryKb !== null).length}`);
report.push(`status_time_present=${status.submissions.filter((s) => s.timeMs !== null).length}`);
report.push(`status_rating_sample=${status.submissions.slice(0, 3).map((s) => s.userRating ?? '-').join(',')}`);
report.push(`status_sample=${status.submissions
    .slice(0, 4)
    .map((s) => `#${s.id} p${s.problemId} ${s.verdictLabel} ${s.memoryKb ?? '-'}KB ${s.timeMs ?? '-'}ms ${s.language || '-'} user=${s.user || '-'} at=${s.submittedAt || '-'}`)
    .join(' ;; ')}`);
{
    const rows = statusResponse.body.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    const bodyRows = rows.filter((r) => /showsource|reinfo|status\d/i.test(r)).slice(0, 3);
    report.push(`status_body_row_sample=${bodyRows.map((r) => r.replace(/\s+/g, ' ').slice(0, 900)).join(' ;; ')}`);
}
console.log('\n=== logout ===');
const afterLogout = await session.logout();
check('logout clears the session', afterLogout.authenticated === false);
const afterLogoutPage = await session.http.get(`${XMOJ_ORIGIN}/loginpage.php`);
check('loginpage.php shows the form again', isLoginForm(afterLogoutPage.body));
report.push(`logout_cleared=${afterLogout.authenticated === false}`);
writeFileSync(path.join(here, 'live-login-report.txt'), report.join('\n') + '\n', 'utf8');
console.log(`\n  report written to tests/live-login-report.txt (no secrets)`);
console.log(`\n${failures === 0 ? 'ALL LIVE LOGIN CHECKS PASSED' : `${failures} LIVE CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
