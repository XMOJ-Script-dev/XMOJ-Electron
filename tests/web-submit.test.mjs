import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestPost } from '../functions/api/submit.ts';

const originalFetch = globalThis.fetch;
const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(11)));
const env = { XMOJ_SESSION_KEY: key };
const origin = 'https://webxmoj.example';

async function createSessionCookie() {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    Uint8Array.from(atob(key), char => char.charCodeAt(0)),
    'AES-GCM',
    false,
    ['encrypt'],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(JSON.stringify({
    sessionId: 'session123',
    username: 'testuser',
    expiresAt: Date.now() + 60_000,
  }));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, payload));
  const bytes = new Uint8Array(iv.length + ciphertext.length);
  bytes.set(iv);
  bytes.set(ciphertext, iv.length);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('submission requires same-origin and a sealed session', async () => {
  let contactedUpstream = false;
  globalThis.fetch = async () => {
    contactedUpstream = true;
    throw new Error('must not fetch');
  };
  const crossOrigin = await onRequestPost({
    request: new Request(`${origin}/api/submit`, {
      method: 'POST',
      headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId: 1000, languageId: 1, source: 'code' }),
    }),
    env,
  });
  assert.equal(crossOrigin.status, 403);
  const unauthenticated = await onRequestPost({
    request: new Request(`${origin}/api/submit`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId: 1000, languageId: 1, source: 'code' }),
    }),
    env,
  });
  assert.equal(unauthenticated.status, 401);
  assert.equal(contactedUpstream, false);
});

test('submission verifies the session and forwards only validated form fields', async () => {
  const sealed = await createSessionCookie();
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith('/loginpage.php')) {
      assert.equal(init.headers.Cookie, 'PHPSESSID=session123');
      return new Response('<a href=logout.php>Please logout First!</a>');
    }
    if (String(url).endsWith('/submit.php')) {
      assert.equal(init.headers.Cookie, 'PHPSESSID=session123');
      assert.deepEqual(Object.fromEntries(new URLSearchParams(String(init.body))), {
        language: '7',
        source: 'print(1)',
        id: '1000',
        enable_O2: 'on',
      });
      return new Response('<a href="status.php?id=431">submission</a>');
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const response = await onRequestPost({
    request: new Request(`${origin}/api/submit`, {
      method: 'POST',
      headers: {
        Origin: origin,
        Cookie: `__Host-xmoj-session=${sealed}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problemId: 1000,
        languageId: 7,
        source: 'print(1)',
        enableO2: true,
        unexpected: 'ignored',
      }),
    }),
    env,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, solutionId: 431, message: '提交成功' });
  assert.equal(requests.length, 2);
});

test('submission rejects oversized source and invalid problem IDs', async () => {
  const sealed = await createSessionCookie();
  let contactedUpstream = false;
  globalThis.fetch = async () => {
    contactedUpstream = true;
    throw new Error('must not fetch');
  };
  for (const payload of [
    { problemId: 0, languageId: 1, source: 'code' },
    { problemId: 1000, languageId: 1, source: 'x'.repeat(512_001) },
  ]) {
    const response = await onRequestPost({
      request: new Request(`${origin}/api/submit`, {
        method: 'POST',
        headers: {
          Origin: origin,
          Cookie: `__Host-xmoj-session=${sealed}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }),
      env,
    });
    assert.equal(response.status, 400);
  }
  assert.equal(contactedUpstream, false);
});
