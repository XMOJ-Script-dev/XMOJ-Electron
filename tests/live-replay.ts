import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { HttpClient } from '../electron/http.ts';
import { fetchContestReplay } from '../electron/replay.ts';
const fields = Object.fromEntries(readFileSync('tests/account.txt','utf8').split(/\r?\n/).flatMap(line=>{const m=line.match(/^\s*(\w+)\s*[:=]\s*(.+?)\s*$/);return m?[[m[1].toLowerCase(),m[2]]]:[]}));
const http = new HttpClient();
await http.post('https://www.xmoj.tech/login.php',{user_id:fields.username,password:fields.password,submit:'登录'});
const replay = await fetchContestReplay(http,10865);
assert.ok(replay.videos.length);
for (const video of replay.videos) {
    assert.ok(video.sources.length);
    const response = await fetch(video.sources[0].url, { headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(20000) });
    console.log('Media check:', new URL(video.sources[0].url).hostname, new URL(video.sources[0].url).protocol, response.status);
    await response.body?.cancel();
    assert.ok(response.ok, `Media HTTP ${response.status}`);
    console.log('Verified authorized replay:', video.sources.length, 'MP4 qualities;', 'media host:', new URL(video.sources[0].url).hostname, '; type:', response.headers.get('content-type'));
}
