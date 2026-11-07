import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequest } from '../functions/api/session.ts';

const originalFetch = globalThis.fetch;
const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));
const env = { XMOJ_SESSION_KEY: key };
const origin = 'https://webxmoj.example';

async function createSessionCookie() {
  const rawKey = Uint8Array.from(atob(key), char => char.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(JSON.stringify({
    sessionId: 'abc123',
    username: 'testuser',
    expiresAt: Date.now() + 60000,
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

test('login seals upstream PHPSESSID in a Secure HttpOnly cookie only', async () => {
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith('/login.php')) {
      assert.deepEqual(Object.fromEntries(new URLSearchParams(String(init.body))), {
        user_id: 'testuser',
        password: 'dummy-password',
        return_url: '',
        submit: '登录',
      });
      return new Response('login accepted', {
        headers: { 'Set-Cookie': 'PHPSESSID=abc123; Path=/; Secure; HttpOnly' },
      });
    }
    if (String(url).endsWith('/loginpage.php')) {
      assert.equal(init.headers.Cookie, 'PHPSESSID=abc123');
      return new Response('<a href=logout.php>Please logout First!</a>');
    }
    if (String(url).endsWith('/index.php')) {
      return new Response('<div id="profile">testuser</div>');
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const response = await onRequest({
    request: new Request(`${origin}/api/session`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'dummy-password' }),
    }),
    env,
  });
  const result = await response.json();
  const setCookie = response.headers.get('Set-Cookie');

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.state.user.username, 'testuser');
  assert.equal(result.state.sessionId, null);
  assert.match(setCookie, /^__Host-xmoj-session=/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.doesNotMatch(JSON.stringify(result), /abc123|dummy-password/);
  assert.equal(requests.length, 3);

  const cookieValue = setCookie.match(/__Host-xmoj-session=([^;]+)/)[1];
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), 'https://www.xmoj.tech/loginpage.php');
    assert.equal(init.headers.Cookie, 'PHPSESSID=abc123');
    return new Response('<a href=logout.php>Please logout First!</a>');
  };
  const verified = await onRequest({
    request: new Request(`${origin}/api/session`, {
      headers: { Cookie: `__Host-xmoj-session=${cookieValue}` },
    }),
    env,
  });
  const verifiedState = await verified.json();
  assert.equal(verifiedState.authenticated, true);
  assert.equal(verifiedState.user.username, 'testuser');
  assert.equal(verifiedState.sessionId, null);
});

test('session mutations require a same-origin request', async () => {
  let contactedUpstream = false;
  globalThis.fetch = async () => {
    contactedUpstream = true;
    throw new Error('must not fetch');
  };
  const response = await onRequest({
    request: new Request(`${origin}/api/session`, {
      method: 'POST',
      headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'victim', password: 'guess' }),
    }),
    env,
  });
  assert.equal(response.status, 403);
  assert.equal(contactedUpstream, false);
});

test('logout invalidates upstream session and clears browser cookie', async () => {
  let logoutCookie;
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), 'https://www.xmoj.tech/logout.php');
    logoutCookie = init.headers.Cookie;
    return new Response('', { status: 200 });
  };
  const cookieValue = await createSessionCookie();
  const response = await onRequest({
    request: new Request(`${origin}/api/session`, {
      method: 'DELETE',
      headers: { Origin: origin, Cookie: `__Host-xmoj-session=${cookieValue}` },
    }),
    env,
  });
  assert.equal(response.status, 200);
  assert.equal(logoutCookie, 'PHPSESSID=abc123');
  assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
});
