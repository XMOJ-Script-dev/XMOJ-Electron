import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestGet, md5 } from '../functions/api/avatar.ts';
import { createWebSessionCookie, webSessionEnv } from './web-auth-fixture.mjs';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('MD5 uses UTF-8 bytes and matches known email-avatar digests', () => {
  assert.equal(md5(''), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(md5('abc'), '900150983cd24fb0d6963f7d28e17f72');
  assert.equal(md5('test@example.com'), '55502f40dc8b7c769880b10874abc9d0');
});

test('other accounts never expose an email-derived digest', async () => {
  let requested;
  globalThis.fetch = async url => {
    requested = String(url);
    return new Response('<input name="email" value="Test@Example.com">', {
      headers: { 'Content-Type': 'text/html' },
    });
  };

  const response = await onRequestGet({
    request: new Request('https://webxmoj.example/api/avatar?username=testuser'),
    env: {},
  });
  assert.equal(response.status, 200);
  assert.equal(requested, 'https://www.xmoj.tech/userinfo.php?user=testuser');
  assert.deepEqual(await response.json(), { avatar: null });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('other accounts use the avatar URL published on the profile page', async () => {
  globalThis.fetch = async () => new Response(
    '<img class="avatar" src="https://cravatar.cn/avatar/55502f40dc8b7c769880b10874abc9d0?size=80">',
    { headers: { 'Content-Type': 'text/html' } },
  );

  const response = await onRequestGet({
    request: new Request('https://webxmoj.example/api/avatar?username=testuser'),
    env: {},
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    avatar: {
      hash: '55502f40dc8b7c769880b10874abc9d0',
      url: 'https://cravatar.cn/avatar/55502f40dc8b7c769880b10874abc9d0?size=80',
    },
  });
});

test('own account still resolves the email digest', async () => {
  const cookie = await createWebSessionCookie();
  let requested;
  globalThis.fetch = async (url, init) => {
    requested = { url: String(url), cookie: new Headers(init.headers).get('Cookie') };
    return new Response('<input name="email" value="Test@Example.com">', {
      headers: { 'Content-Type': 'text/html' },
    });
  };

  const response = await onRequestGet({
    request: new Request('https://webxmoj.example/api/avatar', {
      headers: { Cookie: `__Host-xmoj-session=${cookie}` },
    }),
    env: webSessionEnv,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(requested, {
    url: 'https://www.xmoj.tech/modifypage.php',
    cookie: 'PHPSESSID=test-session-id',
  });
  assert.deepEqual(await response.json(), {
    avatar: {
      hash: '55502f40dc8b7c769880b10874abc9d0',
      url: 'https://cravatar.cn/avatar/55502f40dc8b7c769880b10874abc9d0?retro=1&s=160',
    },
  });
});

test('avatar lookup rejects invalid names and does not request upstream', async () => {
  let contacted = false;
  globalThis.fetch = async () => {
    contacted = true;
    return new Response('');
  };
  const response = await onRequestGet({
    request: new Request('https://webxmoj.example/api/avatar?username=%0A'),
    env: {},
  });
  assert.equal(response.status, 400);
  assert.equal(contacted, false);
});
