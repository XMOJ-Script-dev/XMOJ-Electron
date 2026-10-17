import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseProblemsetPage, parseStatusPage, parseProfileScript } from '../electron/parsers.ts';
import { parseHomeSnapshot } from '../electron/parsers.ts';
import { parseProblemDetail } from '../electron/problems.ts';
const here = path.dirname(fileURLToPath(import.meta.url));
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
function load(name: string): string | null {
    const file = path.join(here, name);
    if (!existsSync(file)) {
        console.log(`  (missing ${name} — run tests/userscript-harness.mjs with --dump=)`);
        return null;
    }
    return readFileSync(file, 'utf8');
}
console.log('\n=== problemset.php: userscript-enhanced DOM ===');
{
    const html = load('rendered-problemset.html');
    if (html) {
        const page = parseProblemsetPage(html);
        console.log(`  rows parsed=${page.problems.length} totalPages=${page.totalPages}`);
        check('parsed rows', page.problems.length > 0, String(page.problems.length));
        check('ids look like problem ids', page.problems.every((p) => p.id > 0), page.problems.slice(0, 5).map((p) => p.id).join(','));
        check('titles are non-empty and free of the id prefix', page.problems.every((p) => p.title.length > 0 && !/^\d+\s*[-–—:.]/.test(p.title)), JSON.stringify(page.problems.slice(0, 3).map((p) => p.title)));
        check('solved flags parsed', page.problems.filter((p) => p.solved !== null).length > 0, `${page.problems.filter((p) => p.solved === true).length} solved`);
        check('accepted/submissions parsed', page.problems.filter((p) => p.submissions !== null).length === page.problems.length, page.problems.slice(0, 3).map((p) => `${p.accepted}/${p.submissions}`).join(' '));
        console.log('  first 3:', JSON.stringify(page.problems.slice(0, 3)));
    }
}
console.log('\n=== status.php: userscript-enhanced DOM ===');
{
    const html = load('rendered-status.html');
    if (html) {
        const page = parseStatusPage(html);
        console.log(`  rows parsed=${page.submissions.length}`);
        check('parsed rows', page.submissions.length > 0, String(page.submissions.length));
        check('solution ids parsed', page.submissions.every((s) => s.id > 0), page.submissions.slice(0, 5).map((s) => s.id).join(','));
        check('verdicts resolved', page.submissions.every((s) => s.verdict !== 'other'), [...new Set(page.submissions.map((s) => s.verdictLabel))].join('|'));
        check('memory/time parsed', page.submissions.some((s) => s.memoryKb !== null && s.timeMs !== null), page.submissions.slice(0, 3).map((s) => `${s.memoryKb}KB/${s.timeMs}ms`).join(' '));
        check('languages parsed', page.submissions.some((s) => s.language !== ''), [...new Set(page.submissions.map((s) => s.language))].join(','));
        console.log('  first 3:', JSON.stringify(page.submissions.slice(0, 3)));
    }
}
console.log('\n=== problem.php: userscript-enhanced DOM ===');
{
    const html = load('rendered-problem.html');
    if (html) {
        const detail = parseProblemDetail(html, 1841);
        console.log(`  title=${JSON.stringify(detail.title)} time=${detail.timeLimitMs} mem=${detail.memoryLimitKb} io=${detail.inputName}`);
        check('title parsed', detail.title.length > 0 && !/^\d+\s*[:：]/.test(detail.title), detail.title);
        check('file names parsed', detail.inputName === 'cursor', String(detail.inputName));
        check('time limit parsed', detail.timeLimitMs !== null, String(detail.timeLimitMs));
    }
}
console.log('\n=== index.php: userscript-enhanced DOM ===');
{
    const html = load('rendered-home.html');
    if (html) {
        const snap = parseHomeSnapshot(html, Date.now());
        console.log(`  announcements=${snap.announcements.length} countdown=${snap.countdown.length} banners=${snap.banners.length}`);
        check('announcements parsed', snap.announcements.length > 0, String(snap.announcements.length));
        check('announcement titles are non-empty', snap.announcements.every((a) => a.title.length > 0), JSON.stringify(snap.announcements.slice(0, 2).map((a) => a.title)));
        check('announcement bodies carry HTML', snap.announcements.some((a) => a.html.length > 0), String(snap.announcements[0]?.html.length ?? 0));
        check('countdown parsed', snap.countdown.length > 0, JSON.stringify(snap.countdown.slice(0, 3)));
        check('countdown days are whole and non-negative', snap.countdown.every((c) => Number.isInteger(c.days) && c.days >= 0));
    }
}
console.log('\n=== userscript profile script ===');
{
    const scripts = load('rendered-profile-js.txt');
    if (scripts) {
        const info = parseProfileScript(scripts);
        check('handle extracted', Boolean(info.username), String(info.username));
    }
}
console.log(`\n${failures === 0 ? 'COMPARISON PASSED' : `${failures} COMPARISON CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
