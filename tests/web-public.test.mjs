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

test('problemset cache is scoped per account so solved flags cannot leak between users', async () => {
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
    const alice = await createWebSessionCookie('alice', 'alice-session');
    const bob = await createWebSessionCookie('bob', 'bob-session');
    const page = statusClass => '<table id="problemset"><tbody><tr><td>1</td>'
      + '<td><a href="/problem.php?id=100">100 - Sample</a></td>'
      + `<td><div class="status ${statusClass}"></div></td></tr></tbody></table>`;
    let scrapedPages = 0;
    globalThis.fetch = async (url, init) => {
      const cookie = new Headers(init.headers).get('Cookie') ?? '';
      if (String(url).endsWith('/loginpage.php')) {
        return judgeSessionResponse(init, cookie.replace('PHPSESSID=', ''));
      }
      scrapedPages += 1;
      return new Response(page(cookie === 'PHPSESSID=alice-session' ? 'status_y' : 'status_n'), {
        headers: { 'Content-Type': 'text/html' },
      });
    };
    const send = cookie => problemset({
      request: new Request(`${origin}/api/problemset`, {
        headers: { Cookie: `__Host-xmoj-session=${cookie}` },
      }),
      env: webSessionEnv,
    });

    const aliceFirst = await (await send(alice)).json();
    const bobFirst = await (await send(bob)).json();
    const aliceAgain = await (await send(alice)).json();

    assert.equal(aliceFirst.problems[0].solved, true);
    assert.equal(bobFirst.problems[0].solved, false);
    assert.equal(aliceAgain.problems[0].solved, true);
    assert.equal(scrapedPages, 2);
  }
  finally {
    delete globalThis.caches;
  }
});

test('problemset scrapes the remaining pages concurrently', async () => {
  const cookie = await createWebSessionCookie();
  const pages = [];
  let inFlight = 0;
  let peak = 0;
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    if (target.endsWith('/loginpage.php')) return judgeSessionResponse(init);
    assert.equal(new Headers(init.headers).get('Cookie'), 'PHPSESSID=test-session-id');
    const page = Number(new URL(target).searchParams.get('page'));
    pages.push(page);
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await new Promise(resolve => setTimeout(resolve, 15));
    inFlight -= 1;
    const id = 100 + page;
    return new Response(
      '<table id="problemset"><tbody><tr><td>1</td>'
      + `<td><a href="/problem.php?id=${id}">${id} - Sample ${page}</a></td><td></td></tr></tbody></table>`
      + '<ul class="pagination"><li><a>1</a></li><li><a>2</a></li><li><a>3</a></li></ul>',
      { headers: { 'Content-Type': 'text/html' } },
    );
  };
  const response = await problemset({
    request: new Request(`${origin}/api/problemset`, {
      headers: { Cookie: `__Host-xmoj-session=${cookie}` },
    }),
    env: webSessionEnv,
  });

  assert.equal(response.status, 200);
  assert.deepEqual(pages.sort((left, right) => left - right), [1, 2, 3]);
  assert.ok(peak >= 2, `expected concurrent page fetches, peak in-flight was ${peak}`);
  assert.equal((await response.json()).problems.length, 3);
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
