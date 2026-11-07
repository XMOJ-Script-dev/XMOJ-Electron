import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SessionManager } from '../electron/session.ts';
import { XMOJ_ORIGIN } from '../src/shared/types.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, 'live-dump');
mkdirSync(outDir, { recursive: true });

function readCredentials(): { username: string; password: string } {
    const raw = readFileSync(path.join(here, 'account.txt'), 'utf8');
    const fields: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_]+)\s*[:=]\s*(.+?)\s*$/);
        if (match) fields[match[1].toLowerCase()] = match[2];
    }
    const username = fields.username ?? fields.user ?? fields.user_id;
    const password = fields.password ?? fields.pass;
    if (!username || !password) throw new Error('tests/account.txt 需要包含 Username 与 Password');
    return { username, password };
}

const { username, password } = readCredentials();
const session = new SessionManager();
const result = await session.login(username, password, false);
if (!result.ok) {
    console.error('login failed:', result.message);
    process.exit(1);
}
console.log('login ok');

const pages: Record<string, string> = {
    'index': '/index.php',
    'problemset': '/problemset.php',
    'status': '/status.php',
    'contests': '/contest.php',
    'rank': '/rank.php',
    'problem-1': '/problem.php?id=1',
    'userinfo-self': `/userinfo.php?user=${encodeURIComponent(username)}`,
    'submitpage': '/submitpage.php',
    'recent-contest': '/recent-contest.php',
    'faqs': '/faqs.php',
    'balloon': '/balloon.php',
    'export-ac': '/export_ac_code.php',
};
for (const problemId of ['1000', '1001']) {
    pages[`problem-${problemId}`] = `/problem.php?id=${problemId}`;
}
for (const [name, route] of Object.entries(pages)) {
    try {
        const response = await session.http.get(`${XMOJ_ORIGIN}${route}`);
        writeFileSync(path.join(outDir, `${name}.html`), response.body, 'utf8');
        console.log(`dumped ${name} (${route}) ${response.body.length} bytes`);
    } catch (error) {
        console.log(`FAILED ${name} (${route}): ${String(error).slice(0, 120)}`);
    }
}
console.log('done');
