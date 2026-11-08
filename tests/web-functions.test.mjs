import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestGet as getHome } from '../functions/api/home.ts';
import { onRequestGet as getMonthly } from '../functions/api/monthly.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('home endpoint fetches only the fixed public XMOJ URL', async () => {
  let fetchedUrl;
  globalThis.fetch = async (url, options) => {
    fetchedUrl = String(url);
    assert.equal(options.redirect, 'manual');
    return new Response('<html>home</html>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  };

  const response = await getHome({
    request: new Request('https://webxmoj.example/api/home?url=https://attacker.example')
  });

  assert.equal(fetchedUrl, 'https://www.xmoj.tech/');
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).html, '<html>home</html>');
  assert.match(response.headers.get('Cache-Control'), /s-maxage=300/);
});

test('monthly endpoint uses the fixed public route', async () => {
  let fetchedUrl;
  globalThis.fetch = async (url) => {
    fetchedUrl = String(url);
    return new Response('<html>monthly</html>', {
      headers: { 'Content-Type': 'text/html' }
    });
  };

  const response = await getMonthly({
    request: new Request('https://webxmoj.example/api/monthly')
  });

  assert.equal(fetchedUrl, 'https://www.xmoj.tech/open_contest.php');
  assert.deepEqual((await response.json()).html, '<html>monthly</html>');
});

test('upstream failures and redirects are not exposed as successful pages', async () => {
  globalThis.fetch = async () => new Response(null, {
    status: 302,
    headers: { Location: 'https://attacker.example' }
  });

  const response = await getHome({
    request: new Request('https://webxmoj.example/api/home')
  });

  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { error: '暂时无法读取小明 OJ 首页' });
});

test('public page proxy follows HTTPS redirects only between trusted XMOJ hosts', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), redirect: options.redirect });
    if (requests.length === 1) {
      return new Response(null, { status: 301, headers: { Location: 'https://xmoj.tech/' } });
    }
    return new Response('<html>canonical</html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  };

  const response = await getHome({
    request: new Request('https://webxmoj.example/api/home'),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).html, '<html>canonical</html>');
  assert.deepEqual(requests, [
    { url: 'https://www.xmoj.tech/', redirect: 'manual' },
    { url: 'https://xmoj.tech/', redirect: 'manual' },
  ]);
});

test('unsupported methods are rejected without contacting XMOJ', async () => {
  let fetched = false;
  globalThis.fetch = async () => {
    fetched = true;
    return new Response('');
  };

  const response = await getHome({
    request: new Request('https://webxmoj.example/api/home', { method: 'POST' })
  });

  assert.equal(response.status, 405);
  assert.equal(fetched, false);
});
