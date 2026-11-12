export const webSessionKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(23)));
export const webSessionEnv = { XMOJ_SESSION_KEY: webSessionKey };

export async function createWebSessionCookie(username = 'testuser', sessionId = 'test-session-id') {
  const key = Uint8Array.from(atob(webSessionKey), char => char.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(JSON.stringify({
    sessionId,
    username,
    expiresAt: Date.now() + 60_000,
  }));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, payload));
  const bytes = new Uint8Array(iv.length + encrypted.length);
  bytes.set(iv);
  bytes.set(encrypted, iv.length);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function judgeSessionResponse(init, sessionId = 'test-session-id') {
  assertCookie(init, `PHPSESSID=${sessionId}`);
  return new Response('<a href=logout.php>Please logout First!</a>');
}

function assertCookie(init, expected) {
  const headers = new Headers(init.headers);
  if (headers.get('Cookie') !== expected) {
    throw new Error(`Expected upstream session Cookie ${expected}`);
  }
}
