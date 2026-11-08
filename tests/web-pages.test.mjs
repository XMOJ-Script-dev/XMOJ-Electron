import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestGet as source } from '../functions/api/source.ts';
import { onRequestGet as sourceDetails } from '../functions/api/source-details.ts';
import { onRequestGet as userExists } from '../functions/api/user-exists.ts';

const originalFetch = globalThis.fetch;
const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(17)));
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
    sessionId: 'private-session-id',
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

test('source and judge-detail routes require a live session and use fixed upstream paths', async () => {
  const sealed = await createSessionCookie();
  const requests = [];
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    requests.push(target);
    if (target.endsWith('/loginpage.php')) {
      assert.equal(init.headers.Cookie, 'PHPSESSID=private-session-id');
      return new Response('<a href=logout.php>Please logout First!</a>');
    }
    if (target.endsWith('/getsource.php?id=431')) return new Response('print(1)');
    if (target.endsWith('/reinfo.php?sid=431')) {
      return new Response('<script>var json={"st":0,"tasks":[{"i":1,"s":4,"t":15,"m":128}]};</script>');
    }
    throw new Error(`Unexpected URL: ${target}`);
  };
  const request = (path) => new Request(`${origin}${path}`, {
    headers: { Cookie: `__Host-xmoj-session=${sealed}` },
  });
  const sourceResult = await source({ request: request('/api/source?id=431'), env });
  assert.equal(sourceResult.status, 200);
  assert.deepEqual(await sourceResult.json(), { source: 'print(1)' });

  const detailsResult = await sourceDetails({ request: request('/api/source-details?id=431'), env });
  assert.equal(detailsResult.status, 200);
  assert.deepEqual(await detailsResult.json(), {
    tests: [{ name: '1', group: null, status: 'AC', timeMs: 15, memoryKb: 128, score: null }],
    diagnostic: '',
  });
  assert.deepEqual(requests, [
    'https://www.xmoj.tech/loginpage.php',
    'https://www.xmoj.tech/getsource.php?id=431',
    'https://www.xmoj.tech/loginpage.php',
    'https://www.xmoj.tech/reinfo.php?sid=431',
  ]);
});

test('source routes reject invalid IDs before upstream requests', async () => {
  const sealed = await createSessionCookie();
  let contactedUpstream = false;
  globalThis.fetch = async () => {
    contactedUpstream = true;
    throw new Error('must not fetch');
  };
  const response = await source({
    request: new Request(`${origin}/api/source?id=not-an-id`, {
      headers: { Cookie: `__Host-xmoj-session=${sealed}` },
    }),
    env,
  });
  assert.equal(response.status, 400);
  assert.equal(contactedUpstream, false);
});

test('user existence lookup encodes names and rejects control characters', async () => {
  let requested;
  globalThis.fetch = async url => {
    requested = String(url);
    return new Response('<div id="statics">Solved</div>', {
      headers: { 'Content-Type': 'text/html' },
    });
  };
  const result = await userExists({
    request: new Request(`${origin}/api/user-exists?username=${encodeURIComponent('user name')}`),
  });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { exists: true });
  assert.equal(requested, 'https://www.xmoj.tech/userinfo.php?user=user%20name');

  const invalid = await userExists({
    request: new Request(`${origin}/api/user-exists?username=${encodeURIComponent('bad\nname')}`),
  });
  assert.equal(invalid.status, 400);
});
