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
    return { username: fields.username ?? fields.user ?? fields.user_id, password: fields.password ?? fields.pass };
}

const { username, password } = readCredentials();
const session = new SessionManager();
const result = await session.login(username, password, false);
if (!result.ok) { console.error('login failed:', result.message); process.exit(1); }

const pages: Record<string, string> = {
    'downloads': '/downloads.php',
    'news-detail': '/news_detail.php?news_id=1195',
    'open-contest': '/open_contest.php',
    'contest-10786': '/contest.php?cid=10786',
    'contestrank-10786': '/contestrank.php?cid=10786',
    'conteststatus-10786': '/conteststatus.php?cid=10786',
    'problemset-p2': '/problemset.php?page=2',
};
for (const [name, route] of Object.entries(pages)) {
    try {
        const response = await session.http.get(`${XMOJ_ORIGIN}${route}`);
        writeFileSync(path.join(outDir, `${name}.html`), response.body, 'utf8');
        console.log(`dumped ${name} ${response.body.length} bytes`);
    } catch (error) {
        console.log(`FAILED ${name}: ${String(error).slice(0, 120)}`);
    }
}
