import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestGet as contestDetail } from '../functions/api/contest-detail.ts';
import { onRequestGet as contestList } from '../functions/api/contest-list.ts';
import { onRequestGet as contestRank } from '../functions/api/contest-rank.ts';
import { onRequestGet as profile } from '../functions/api/profile.ts';
import { createWebSessionCookie, judgeSessionResponse, webSessionEnv } from './web-auth-fixture.mjs';

const originalFetch = globalThis.fetch;
const origin = 'https://webxmoj.example';

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('contest list limits page numbers and uses the fixed API', async () => {
  const cookie = await createWebSessionCookie();
  let fetchedUrl;
  globalThis.fetch = async (url, init) => {
    fetchedUrl = String(url);
    if (fetchedUrl.endsWith('/loginpage.php')) return judgeSessionResponse(init);
    assert.equal(new Headers(init.headers).get('Cookie'), 'PHPSESSID=test-session-id');
    return new Response(JSON.stringify({ list: [], total: 0, totalPages: 1, pageNum: 2, pageSize: 20 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const response = await contestList({
    request: new Request(`${origin}/api/contest-list?page=2`, {
      headers: { Cookie: `__Host-xmoj-session=${cookie}` },
    }),
    env: webSessionEnv,
  });
  assert.equal(response.status, 200);
  assert.equal(fetchedUrl, 'https://www.xmoj.tech/api/contest/list?pageNum=2');

  const invalid = await contestList({
    request: new Request(`${origin}/api/contest-list?page=101`),
    env: webSessionEnv,
  });
  assert.equal(invalid.status, 400);
});

test('contest detail validates the ID and maps public problem data', async () => {
  const cookie = await createWebSessionCookie();
  let fetchedUrl;
  globalThis.fetch = async (url, init) => {
    fetchedUrl = String(url);
    if (fetchedUrl.endsWith('/loginpage.php')) return judgeSessionResponse(init);
    assert.equal(new Headers(init.headers).get('Cookie'), 'PHPSESSID=test-session-id');
    return new Response(JSON.stringify({
      contest: { contestId: 12, title: 'Contest' },
      problems: [{ num: 'a', problemId: '123', title: 'Sample', myStatus: 'AC' }],
      myRole: null,
      canExport: false,
      submitUrl: null,
    }), { headers: { 'Content-Type': 'application/json' } });
  };
  const response = await contestDetail({
    request: new Request(`${origin}/api/contest-detail?id=12`, {
      headers: { Cookie: `__Host-xmoj-session=${cookie}` },
    }),
    env: webSessionEnv,
  });
  const detail = await response.json();
  assert.equal(response.status, 200);
  assert.equal(fetchedUrl, 'https://www.xmoj.tech/api/contest/12/A');
  assert.deepEqual(detail.problems[0], {
    num: 'A', problemId: 123, title: 'Sample', status: 'AC',
  });
});

test('contest detail identifies an expired upstream session', async () => {
  const cookie = await createWebSessionCookie();
  globalThis.fetch = async url => String(url).endsWith('/loginpage.php')
    ? new Response('请登录后继续操作')
    : new Response('请登录后继续操作', { headers: { 'Content-Type': 'text/html' } });
  const response = await contestDetail({
    request: new Request(`${origin}/api/contest-detail?id=12`, {
      headers: { Cookie: `__Host-xmoj-session=${cookie}` },
    }),
    env: webSessionEnv,
  });
  assert.equal(response.status, 401);
});

test('contest rank uses the fixed rank path and parses rows', async () => {
  const cookie = await createWebSessionCookie();
  let fetchedUrl;
  globalThis.fetch = async (url, init) => {
    fetchedUrl = String(url);
    if (fetchedUrl.endsWith('/loginpage.php')) return judgeSessionResponse(init);
    assert.equal(new Headers(init.headers).get('Cookie'), 'PHPSESSID=test-session-id');
    return new Response('<h2>Contest</h2><table><tr><th>Rank</th><th>User</th><th>Nick</th><th>Solved</th><th>Score</th></tr></table>', {
      headers: { 'Content-Type': 'text/html' },
    });
  };
  const response = await contestRank({
    request: new Request(`${origin}/api/contest-rank?id=12&oi=true`, {
      headers: { Cookie: `__Host-xmoj-session=${cookie}` },
    }),
    env: webSessionEnv,
  });
  const rank = await response.json();
  assert.equal(response.status, 200);
  assert.equal(fetchedUrl, 'https://www.xmoj.tech/contestrank-oi.php?cid=12');
  assert.equal(rank.contestId, 12);
  assert.equal(rank.oi, true);
});

test('contest routes reject anonymous requests before contacting XMOJ', async () => {
  let fetched = false;
  globalThis.fetch = async () => {
    fetched = true;
    return new Response('');
  };
  for (const [handler, path] of [
    [contestList, '/api/contest-list?page=1'],
    [contestDetail, '/api/contest-detail?id=12'],
    [contestRank, '/api/contest-rank?id=12'],
  ]) {
    const response = await handler({
      request: new Request(`${origin}${path}`),
      env: webSessionEnv,
    });
    assert.equal(response.status, 401);
  }
  assert.equal(fetched, false);
});

test('profile username is encoded and control characters are rejected', async () => {
  let fetchedUrl;
  globalThis.fetch = async url => {
    fetchedUrl = String(url);
    return new Response('<div class="container"><h1>alice</h1></div>', {
      headers: { 'Content-Type': 'text/html' },
    });
  };
  const response = await profile({
    request: new Request(`${origin}/api/profile?username=${encodeURIComponent('alice&other=1')}`),
  });
  assert.equal(response.status, 200);
  assert.equal(fetchedUrl, 'https://www.xmoj.tech/userinfo.php?user=alice%26other%3D1');

  const invalid = await profile({
    request: new Request(`${origin}/api/profile?username=${encodeURIComponent('a\nb')}`),
  });
  assert.equal(invalid.status, 400);
});
