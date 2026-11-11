import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestGet as problem } from '../functions/api/problem.ts';
import { onRequestGet as problemset } from '../functions/api/problemset.ts';
import { onRequestGet as status } from '../functions/api/status.ts';
import { createWebSessionCookie, judgeSessionResponse, webSessionEnv } from './web-auth-fixture.mjs';

const originalFetch = globalThis.fetch;
const origin = 'https://webxmoj.example';

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('problemset uses a bounded search and fixed upstream origin', async () => {
  const cookie = await createWebSessionCookie();
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push(String(url));
    if (String(url).endsWith('/loginpage.php')) return judgeSessionResponse(init);
    assert.equal(new Headers(init.headers).get('Cookie'), 'PHPSESSID=test-session-id');
    return new Response(
      '<table id="problemset"><tbody><tr><td>1</td><td><a href="/problem.php?id=100">100 - Sample</a></td><td></td></tr></tbody></table>',
      { headers: { 'Content-Type': 'text/html' } },
    );
  };
  const response = await problemset({
    request: new Request(`${origin}/api/problemset?search=sample&url=https://attacker.example`, {
      headers: { Cookie: `__Host-xmoj-session=${cookie}` },
    }),
    env: webSessionEnv,
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(requests, [
    'https://www.xmoj.tech/loginpage.php',
    'https://www.xmoj.tech/problemset.php?page=1&search=sample',
  ]);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(result.problems[0].id, 100);
});

test('problemset reuses the short-lived cache without contacting upstream', async () => {
  const store = new Map();
  globalThis.caches = {
    default: {
      async match(key) {
        return store.get(String(key))?.clone();
      },
      async put(key, response) {
        store.set(String(key), response.clone());
      },
    },
  };
  try {
    const cookie = await createWebSessionCookie();
    let scrapedPages = 0;
    globalThis.fetch = async (url, init) => {
      if (String(url).endsWith('/loginpage.php')) return judgeSessionResponse(init);
      scrapedPages += 1;
      return new Response(
        '<table id="problemset"><tbody><tr><td>1</td><td><a href="/problem.php?id=100">100 - Sample</a></td><td></td></tr></tbody></table>',
        { headers: { 'Content-Type': 'text/html' } },
      );
    };
    const send = () => problemset({
      request: new Request(`${origin}/api/problemset`, {
        headers: { Cookie: `__Host-xmoj-session=${cookie}` },
      }),
      env: webSessionEnv,
    });
    const first = await send();
    const second = await send();

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(second.headers.get('Content-Type'), 'application/json');
    assert.equal(scrapedPages, 1);
    assert.deepEqual(await second.json(), await first.json());
  }
  finally {
    delete globalThis.caches;
  }
});

test('oversized problemset searches are rejected before upstream access', async () => {
  let fetched = false;
  globalThis.fetch = async () => {
    fetched = true;
    return new Response('');
  };
  const response = await problemset({
    request: new Request(`${origin}/api/problemset?search=${'x'.repeat(101)}`),
    env: webSessionEnv,
  });
  assert.equal(response.status, 400);
  assert.equal(fetched, false);
});

test('problem endpoint validates ids and uses the fixed resource path', async () => {
  const cookie = await createWebSessionCookie();
  let fetched = false;
  const invalid = await problem({
    request: new Request(`${origin}/api/problem?id=1e8`),
    env: webSessionEnv,
  });
  assert.equal(invalid.status, 400);

  globalThis.fetch = async (url, init) => {
    fetched = true;
    if (String(url).endsWith('/loginpage.php')) return judgeSessionResponse(init);
    assert.equal(new Headers(init.headers).get('Cookie'), 'PHPSESSID=test-session-id');
    return new Response('<html><body></body></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  };
  const valid = await problem({
    request: new Request(`${origin}/api/problem?id=123&url=https://attacker.example`, {
      headers: { Cookie: `__Host-xmoj-session=${cookie}` },
    }),
    env: webSessionEnv,
  });
  assert.equal(valid.status, 200);
  assert.equal(fetched, true);
});

test('status filters are encoded to the fixed public status page', async () => {
  const cookie = await createWebSessionCookie();
  let fetchedUrl;
  globalThis.fetch = async (url, init) => {
    fetchedUrl = String(url);
    if (fetchedUrl.endsWith('/loginpage.php')) return judgeSessionResponse(init);
    assert.equal(new Headers(init.headers).get('Cookie'), 'PHPSESSID=test-session-id');
    return new Response('<html><body></body></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  };
  const response = await status({
    request: new Request(`${origin}/api/status?user=alice%26url%3Dattacker&top=12`, {
      headers: { Cookie: `__Host-xmoj-session=${cookie}` },
    }),
    env: webSessionEnv,
  });
  assert.equal(response.status, 200);
  assert.equal(fetchedUrl, 'https://www.xmoj.tech/status.php?user_id=alice%26url%3Dattacker&top=12');
});

test('protected XMOJ data routes reject anonymous requests before contacting upstream', async () => {
  let fetched = false;
  globalThis.fetch = async () => {
    fetched = true;
    return new Response('');
  };
  for (const [handler, path] of [
    [problemset, '/api/problemset'],
    [problem, '/api/problem?id=1'],
    [status, '/api/status?top=1'],
  ]) {
    const response = await handler({
      request: new Request(`${origin}${path}`),
      env: webSessionEnv,
    });
    assert.equal(response.status, 401);
    assert.match((await response.json()).error, /登录/);
  }
  assert.equal(fetched, false);
});
