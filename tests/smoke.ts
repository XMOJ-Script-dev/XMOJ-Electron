import { CookieJar, HttpClient, parseSetCookie } from '../electron/http.ts';
import { SessionManager } from '../electron/session.ts';
import { parseHomeSnapshot, parseProblemsetPage } from '../electron/parsers.ts';
import { XMOJ_ORIGIN } from '../src/shared/types.ts';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
console.log('\n=== cookie jar: domain & path scoping ===');
{
    const jar = new CookieJar();
    const url = new URL('https://www.xmoj.tech/index.php');
    jar.store([
        'PHPSESSID=abc123; path=/; HttpOnly',
        'evil=1; Domain=attacker.example',
        'exact=1; Domain=www.xmoj.tech; path=/',
        'parent=1; Domain=xmoj.tech; path=/',
    ], url);
    check('accepts judge cookie', jar.get('PHPSESSID') === 'abc123', String(jar.get('PHPSESSID')));
    check('rejects foreign domain', jar.get('evil') === null, String(jar.get('evil')));
    check('accepts exact-host cookie', jar.get('exact') === '1', String(jar.get('exact')));
    check('accepts the apex-domain cookie', jar.get('parent') === '1', String(jar.get('parent')));
    const other = new URL('https://example.com/');
    check('does not send cookies to other hosts', jar.headerFor(other) === null, String(jar.headerFor(other)));
    check('sends PHPSESSID to the judge', (jar.headerFor(url) ?? '').includes('PHPSESSID=abc123'), String(jar.headerFor(url)));
    jar.store(['PHPSESSID=gone; path=/; Max-Age=0'], url);
    check('expired cookie removed', jar.get('PHPSESSID') === null, String(jar.get('PHPSESSID')));
}
console.log('\n=== parseSetCookie attributes ===');
{
    const parsed = parseSetCookie('a=b; Path=/x; HttpOnly; Secure; Max-Age=60', new URL('https://www.xmoj.tech/'));
    check('value', parsed?.value === 'b', String(parsed?.value));
    check('path', parsed?.path === '/x', String(parsed?.path));
    check('httpOnly', parsed?.httpOnly === true);
    check('secure', parsed?.secure === true);
    check('max-age becomes expiry', (parsed?.expires ?? 0) > Date.now() / 1000);
}
console.log('\n=== live: GET index.php + parse ===');
{
    const http = new HttpClient();
    const response = await http.get(`${XMOJ_ORIGIN}/index.php`);
    check('HTTP 200', response.status === 200, String(response.status));
    check('PHPSESSID issued by server', http.jar.get('PHPSESSID') !== null, String(http.jar.get('PHPSESSID')));
    const snapshot = parseHomeSnapshot(response.body, response.serverTime);
    check('announcements parsed', snapshot.announcements.length > 0, `got ${snapshot.announcements.length}`);
    check('serverTime is sane', snapshot.serverTime > Date.parse('2024-01-01'), new Date(snapshot.serverTime).toISOString());
    check('countdown parsed', snapshot.countdown.length > 0, `got ${snapshot.countdown.length}`);
    console.log('  next events:', snapshot.countdown.slice(0, 3).map((c) => `${c.event}=${c.days}d`).join(', ') || '(none)');
}
console.log('\n=== live: gated pages return the login gate ===');
{
    const http = new HttpClient();
    const problemset = await http.get(`${XMOJ_ORIGIN}/problemset.php`);
    const problems = parseProblemsetPage(problemset.body).problems;
    check('anonymous problemset yields 0 rows', problems.length === 0, `got ${problems.length}`);
}
console.log('\n=== session manager: persist, verify, failed login ===');
{
    const session = new SessionManager();
    await session.load();
    const initial = session.snapshot();
    check('starts unauthenticated', initial.authenticated === false, JSON.stringify(initial.authenticated));
    const bad = await session.login('__dsh_smoke_nonexistent__', 'not-a-real-password', false);
    check('bogus login fails', bad.ok === false, JSON.stringify(bad.message));
    check('failure message surfaced from alert()', /wrong|invalid|incorrect|错误/i.test(bad.message ?? ''), JSON.stringify(bad.message));
    check('no session after failure', session.snapshot().authenticated === false);
    const empty = await session.login('', '', false);
    check('empty credentials rejected', empty.ok === false, JSON.stringify(empty.message));
    const verified = await session.verify();
    check('verify() safe without cookie', verified.authenticated === false);
}
console.log('\n=== session manager: remember-me round-trip (stubbed safeStorage) ===');
{
    const session = new SessionManager();
    await session.load();
    await session.login('alice', 'secret', true);
    const state = session.snapshot();
    check('failed login stores no credential', state.rememberedUsername === null, JSON.stringify(state.rememberedUsername));
    check('canSilentLogin false after failure', state.canSilentLogin === false, String(state.canSilentLogin));
}
console.log(`\n${failures === 0 ? 'ALL SMOKE CHECKS PASSED' : `${failures} SMOKE CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
