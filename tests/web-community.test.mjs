import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestPost } from '../functions/api/community.ts';

const originalFetch = globalThis.fetch;
const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(13)));
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

test('community actions require same-origin, a live session, and an allowlisted action', async () => {
  let contactedUpstream = false;
  globalThis.fetch = async () => {
    contactedUpstream = true;
    throw new Error('must not fetch');
  };
  const badOrigin = await onRequestPost({
    request: new Request(`${origin}/api/community`, {
      method: 'POST',
      headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'GetBoards', data: {} }),
    }),
    env,
  });
  assert.equal(badOrigin.status, 403);

  const unsupported = await onRequestPost({
    request: new Request(`${origin}/api/community`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'Login', data: {} }),
    }),
    env,
  });
  assert.equal(unsupported.status, 400);

  const unauthenticated = await onRequestPost({
    request: new Request(`${origin}/api/community`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'GetBoards', data: {} }),
    }),
    env,
  });
  assert.equal(unauthenticated.status, 401);
  assert.equal(contactedUpstream, false);
});

test('community board read keeps the judge session and community token server-side', async () => {
  const sealed = await createSessionCookie();
  const requests = [];
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    requests.push({ target, init, body: init.body ? JSON.parse(String(init.body)) : null });
    if (target.endsWith('/loginpage.php')) {
      assert.equal(init.headers.Cookie, 'PHPSESSID=private-session-id');
      return new Response('<a href=logout.php>Please logout First!</a>');
    }
    if (target.endsWith('/Login')) {
      assert.deepEqual(requests.at(-1).body.Authentication, {
        SessionID: 'private-session-id',
        Username: 'testuser',
      });
      return Response.json({ Success: true, Data: { Token: 'community-private-token' } });
    }
    if (target.endsWith('/GetBoards')) {
      assert.deepEqual(requests.at(-1).body.Authentication, { Token: 'community-private-token' });
      assert.equal(init.headers['XMOJ-UserID'], 'testuser');
      return Response.json({ Success: true, Data: { Boards: [{ BoardID: 1, BoardName: '讨论区' }] } });
    }
    throw new Error(`Unexpected URL: ${target}`);
  };

  const response = await onRequestPost({
    request: new Request(`${origin}/api/community`, {
      method: 'POST',
      headers: {
        Origin: origin,
        Cookie: `__Host-xmoj-session=${sealed}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'GetBoards', data: {} }),
    }),
    env,
  });
  assert.equal(response.status, 200, JSON.stringify(requests.map(({ target }) => target)));
  const result = await response.json();
  assert.deepEqual(result, {
    Success: true,
    Data: { Boards: [{ BoardID: 1, BoardName: '讨论区' }] },
  });
  assert.doesNotMatch(JSON.stringify(result), /private-session-id|community-private-token/);
  assert.equal(requests.length, 3);
});

test('community mutations validate their payload before contacting upstream', async () => {
  const sealed = await createSessionCookie();
  let contactedUpstream = false;
  globalThis.fetch = async () => {
    contactedUpstream = true;
    throw new Error('must not fetch');
  };
  for (const input of [
    { action: 'NewPost', data: { BoardID: 1, Title: 'title', Content: 'body', ProblemID: 0 } },
    { action: 'DeletePost', data: { PostID: '1' } },
    { action: 'UploadImage', data: { Image: 'https://attacker.example/image' } },
  ]) {
    const response = await onRequestPost({
      request: new Request(`${origin}/api/community`, {
        method: 'POST',
        headers: {
          Origin: origin,
          Cookie: `__Host-xmoj-session=${sealed}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      }),
      env,
    });
    assert.equal(response.status, 400);
  }
  assert.equal(contactedUpstream, false);
});

test('community message send uses a fresh server-side token', async () => {
  const sealed = await createSessionCookie();
  const requests = [];
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    const body = init.body ? JSON.parse(String(init.body)) : null;
    requests.push({ target, body });
    if (target.endsWith('/loginpage.php')) return new Response('<a href=logout.php>Please logout First!</a>');
    if (target.endsWith('/Login')) return Response.json({ Success: true, Data: { Token: 'private-token' } });
    if (target.endsWith('/SendMail')) {
      assert.deepEqual(body.Data, { ToUser: 'friend', Content: 'hello' });
      assert.deepEqual(body.Authentication, { Token: 'private-token' });
      return Response.json({ Success: true, Data: {} });
    }
    throw new Error(`Unexpected URL: ${target}`);
  };
  const response = await onRequestPost({
    request: new Request(`${origin}/api/community`, {
      method: 'POST',
      headers: {
        Origin: origin,
        Cookie: `__Host-xmoj-session=${sealed}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'SendMail', data: { ToUser: 'friend', Content: 'hello' } }),
    }),
    env,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { Success: true, Data: {} });
  assert.equal(requests.length, 3);
});

test('all supported community actions pass their bounded payload schemas', async () => {
  const sealed = await createSessionCookie();
  const cases = [
    ['GetBoards', {}],
    ['GetPosts', { BoardID: -1, Page: 1, ProblemID: 0 }],
    ['GetPost', { PostID: 2, Page: 1 }],
    ['GetPostCount', { ProblemID: 1 }],
    ['NewPost', { BoardID: 1, Title: 'title', Content: 'body', ProblemID: 0, CaptchaSecretKey: 'turnstile-token' }],
    ['NewReply', { PostID: 2, Content: 'reply', CaptchaSecretKey: 'turnstile-token' }],
    ['DeletePost', { PostID: 2 }],
    ['DeleteReply', { ReplyID: 3 }],
    ['EditReply', { ReplyID: 3, Content: 'edited' }],
    ['GetMailList', {}],
    ['GetMail', { OtherUser: 'friend' }],
    ['SendMail', { ToUser: 'friend', Content: 'hello' }],
    ['GetMailMentionList', {}],
    ['GetBBSMentionList', {}],
    ['ReadMailMention', { MentionID: 4 }],
    ['ReadBBSMention', { MentionID: 5 }],
    ['GetStdList', {}],
    ['GetStd', { ProblemID: 1 }],
    ['UploadStd', { ProblemID: 1 }],
    ['UploadImage', { Image: `data:image/png;base64,${'A'.repeat(32)}` }],
    ['GetBadge', { UserID: 'friend' }],
    ['LastOnline', { Username: 'friend' }],
    ['GetUserSettings', {}],
    ['SetUserSettings', { Settings: { theme: 'dark', count: 2 } }],
  ];
  const called = new Set();
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    if (target.endsWith('/loginpage.php')) return new Response('<a href=logout.php>Please logout First!</a>');
    if (target.endsWith('/Login')) return Response.json({ Success: true, Data: { Token: 'server-only-token' } });
    const action = target.split('/').at(-1);
    called.add(action);
    return Response.json({ Success: true, Data: {} });
  };
  for (const [action, data] of cases) {
    const response = await onRequestPost({
      request: new Request(`${origin}/api/community`, {
        method: 'POST',
        headers: {
          Origin: origin,
          Cookie: `__Host-xmoj-session=${sealed}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      }),
      env,
    });
    assert.equal(response.status, 200, `${action}: ${await response.clone().text()}`);
  }
  assert.equal(called.size, cases.length);
});
