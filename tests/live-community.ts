import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpClient } from '../electron/http.ts';
import { CommunityApi, createMemoryTokenStore } from '../electron/community.ts';
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
const http = new HttpClient();
const login = await http.post(`${XMOJ_ORIGIN}/login.php`, {
    user_id: fields.username!,
    password: fields.password!,
    submit: '登录',
});
const sessionId = http.jar.get('PHPSESSID');
check('judge login succeeded and yielded a session id', Boolean(sessionId), sessionId ? 'present' : 'missing');
if (!sessionId) {
    process.exit(1);
}
const credentials = { sessionId, username: fields.username! };
const tokens = createMemoryTokenStore();
const api = new CommunityApi(http, tokens);
console.log('\n=== token acquisition via Login ===');
{
    const boards = await api.call<{
        Boards: unknown[];
    }>('GetBoards', {}, credentials);
    check('token minted and stored', Boolean(tokens.get(credentials.username)), tokens.get(credentials.username) ? 'present' : 'absent');
    check('GetBoards succeeded', boards.Success === true, boards.Success ? '' : String(boards.Message));
    const list = (boards.Data as {
        Boards?: unknown[];
    } | undefined)?.Boards;
    check('GetBoards returned a Boards array', Array.isArray(list), Array.isArray(list) ? `${list.length} boards` : 'not an array');
    if (Array.isArray(list) && list.length) {
        const first = list[0] as Record<string, unknown>;
        check('board entries use BoardID/BoardName', 'BoardID' in first && 'BoardName' in first, Object.keys(first).join(','));
        console.log('    first board:', JSON.stringify({ BoardID: first.BoardID, BoardName: first.BoardName }));
    }
}
console.log('\n=== unauthenticated action works without a token ===');
{
    const fresh = new CommunityApi(http, createMemoryTokenStore());
    const notice = await fresh.getNotice(credentials);
    check('GetNotice answered', typeof notice.Success === 'boolean', `Success=${notice.Success}`);
}
console.log('\n=== posts listing ===');
{
    const result = await api.getPosts(credentials, -1, 1);
    check('GetPosts succeeded', result.Success === true, result.Success ? '' : String(result.Message));
    const posts = (result.Data as {
        Posts?: unknown[];
    } | undefined)?.Posts;
    const pageCount = (result.Data as {
        PageCount?: number;
    } | undefined)?.PageCount;
    check('Posts is an array', Array.isArray(posts), Array.isArray(posts) ? `${posts.length} posts` : 'not an array');
    check('PageCount is a number', typeof pageCount === 'number', String(pageCount));
    if (Array.isArray(posts) && posts.length) {
        const first = posts[0] as Record<string, unknown>;
        console.log('    first post keys:', Object.keys(first).join(','));
        check('PostID present', 'PostID' in first, String(first.PostID));
        check('Title present', 'Title' in first);
    }
}
console.log('\n=== mail list ===');
{
    const result = await api.getMailList(credentials);
    check('GetMailList succeeded', result.Success === true, result.Success ? '' : String(result.Message));
    const list = (result.Data as {
        MailList?: unknown[];
    } | undefined)?.MailList;
    check('MailList is an array', Array.isArray(list), Array.isArray(list) ? `${list.length} threads` : 'not an array');
    if (Array.isArray(list) && list.length) {
        const first = list[0] as Record<string, unknown>;
        console.log('    first thread keys:', Object.keys(first).join(','));
    }
}
console.log('\n=== mention lists (used for notifications) ===');
{
    const bbs = await api.getBbsMentionList(credentials);
    check('GetBBSMentionList succeeded', bbs.Success === true, bbs.Success ? '' : String(bbs.Message));
    const bbsList = (bbs.Data as {
        MentionList?: unknown[];
    } | undefined)?.MentionList;
    check('BBS MentionList is an array', Array.isArray(bbsList), Array.isArray(bbsList) ? `${bbsList.length}` : 'not an array');
    const mail = await api.getMailMentionList(credentials);
    check('GetMailMentionList succeeded', mail.Success === true, mail.Success ? '' : String(mail.Message));
    const mailList = (mail.Data as {
        MentionList?: unknown[];
    } | undefined)?.MentionList;
    check('Mail MentionList is an array', Array.isArray(mailList), Array.isArray(mailList) ? `${mailList.length}` : 'not an array');
}
console.log('\n=== token reuse: a cached token must be accepted ===');
{
    const reused = new CommunityApi(http, tokens);
    const boards = await reused.call<{
        Boards: unknown[];
    }>('GetBoards', {}, credentials);
    check('cached token still works', boards.Success === true, boards.Success ? '' : String(boards.Message));
}
console.log('\n=== a bogus token must not be reported as success ===');
{
    const bad = new CommunityApi(http, createMemoryTokenStore());
    bad.reset(credentials);
    const result = await bad.call('GetBoards', {}, { sessionId: 'not-a-real-session', username: 'nobody' });
    check('bogus credentials do not yield Success', result.Success === false, `Success=${result.Success}`);
    check('an error message is provided', Boolean(result.Message), String(result.Message ?? '').slice(0, 40));
    console.log('    message:', JSON.stringify(result.Message ?? '').slice(0, 80));
}
console.log(`\n${failures === 0 ? 'ALL LIVE COMMUNITY CHECKS PASSED' : `${failures} LIVE COMMUNITY CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
