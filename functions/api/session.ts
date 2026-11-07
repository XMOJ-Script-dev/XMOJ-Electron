import { isAlreadyLoggedInResponse, isLoginFailureAlert, isLoginGate, parseLoginAlert, parseProfile } from '../../electron/parsers.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';
const COOKIE_NAME = '__Host-xmoj-session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const COOKIE_OPTIONS = 'Path=/; HttpOnly; Secure; SameSite=Lax';

interface SessionEnvelope {
  sessionId: string;
  username: string;
  expiresAt: number;
}

interface PagesEnv {
  XMOJ_SESSION_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: PagesEnv;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array {
  const normalised = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalised + '='.repeat((4 - normalised.length % 4) % 4));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function getKey(env: PagesEnv): Promise<CryptoKey> {
  if (!env.XMOJ_SESSION_KEY) throw new Error('网页版会话服务尚未配置');
  let raw: Uint8Array;
  try {
    raw = Uint8Array.from(atob(env.XMOJ_SESSION_KEY), char => char.charCodeAt(0));
  } catch {
    throw new Error('网页版会话密钥配置无效');
  }
  if (raw.length !== 32) throw new Error('网页版会话密钥配置无效');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function seal(env: PagesEnv, payload: SessionEnvelope): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await getKey(env),
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  return encodeBase64Url(result);
}

async function unseal(env: PagesEnv, value: string): Promise<SessionEnvelope | null> {
  try {
    const bytes = decodeBase64Url(value);
    if (bytes.length < 29 || bytes.length > 4096) return null;
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.subarray(0, 12) },
      await getKey(env),
      bytes.subarray(12),
    );
    const payload = JSON.parse(new TextDecoder().decode(plaintext)) as SessionEnvelope;
    if (
      typeof payload.sessionId !== 'string' ||
      !/^[A-Za-z0-9._~-]{1,256}$/.test(payload.sessionId) ||
      typeof payload.username !== 'string' ||
      !payload.username ||
      typeof payload.expiresAt !== 'number' ||
      payload.expiresAt <= Date.now()
    ) return null;
    return payload;
  } catch {
    return null;
  }
}

function sessionCookie(request: Request): string | null {
  const cookies = request.headers.get('Cookie') ?? '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([A-Za-z0-9_-]+)(?:;|$)`));
  return match?.[1] ?? null;
}

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

function emptySession() {
  return {
    authenticated: false,
    user: null,
    sessionId: null,
    verifiedAt: null,
    rememberedUsername: null,
    canSilentLogin: false,
  };
}

function clearCookie(): string {
  return `${COOKIE_NAME}=; ${COOKIE_OPTIONS}; Max-Age=0`;
}

function isSameOriginMutation(request: Request): boolean {
  return request.headers.get('Origin') === new URL(request.url).origin;
}

function upstreamCookie(sessionId: string): string {
  return `PHPSESSID=${sessionId}`;
}

async function verifySession(request: Request, env: PagesEnv): Promise<Response> {
  const sealed = sessionCookie(request);
  if (!sealed) return json(emptySession());
  const session = await unseal(env, sealed);
  if (!session) return json(emptySession(), 401, { 'Set-Cookie': clearCookie() });

  const upstream = await fetch(`${XMOJ_ORIGIN}/loginpage.php`, {
    headers: { Cookie: upstreamCookie(session.sessionId), Accept: 'text/html' },
    redirect: 'manual',
  }).catch(() => null);
  if (!upstream?.ok) return json(emptySession(), 401, { 'Set-Cookie': clearCookie() });
  const html = await upstream.text();
  if (!isAlreadyLoggedInResponse(html) || isLoginGate(html)) {
    return json(emptySession(), 401, { 'Set-Cookie': clearCookie() });
  }

  return json({
    ...emptySession(),
    authenticated: true,
    user: { username: session.username, isAdmin: false, email: null },
    verifiedAt: Date.now(),
  });
}

async function login(request: Request, env: PagesEnv): Promise<Response> {
  if (!isSameOriginMutation(request)) return json({ error: 'Invalid request origin' }, 403);
  let body: { username?: unknown; password?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: '请求内容过大' }, 413);
    body = JSON.parse(raw) as typeof body;
  } catch {
    return json({ error: '登录请求格式无效' }, 400);
  }
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || username.length > 128 || !password || password.length > 1024) {
    return json({ error: '请输入有效的用户名和密码' }, 400);
  }

  try {
    await getKey(env);
    const response = await fetch(`${XMOJ_ORIGIN}/login.php`, {
      method: 'POST',
      headers: {
        Accept: 'text/html',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        user_id: username,
        password,
        return_url: '',
        submit: '登录',
      }),
      redirect: 'manual',
    });
    const setCookies = response.headers.getSetCookie?.() ?? [response.headers.get('set-cookie') ?? ''];
    const sessionId = setCookies
      .map(value => value.match(/(?:^|,\s*)PHPSESSID=([^;,\s]+)/)?.[1])
      .find((value): value is string => Boolean(value && /^[A-Za-z0-9._~-]{1,256}$/.test(value)));
    const html = await response.text();
    const alert = parseLoginAlert(html);
    if (isLoginFailureAlert(alert)) return json({ error: alert }, 401);
    if (!sessionId) return json({ error: '登录失败：服务器未下发会话 Cookie' }, 401);

    const verification = await fetch(`${XMOJ_ORIGIN}/loginpage.php`, {
      headers: { Cookie: upstreamCookie(sessionId), Accept: 'text/html' },
      redirect: 'manual',
    });
    const verificationHtml = await verification.text();
    if (!verification.ok || !isAlreadyLoggedInResponse(verificationHtml) || isLoginGate(verificationHtml)) {
      return json({ error: '登录状态未能确认，请检查用户名与密码' }, 401);
    }

    const profileResponse = await fetch(`${XMOJ_ORIGIN}/index.php`, {
      headers: { Cookie: upstreamCookie(sessionId), Accept: 'text/html' },
      redirect: 'manual',
    });
    const profile = profileResponse.ok ? parseProfile(await profileResponse.text()) : null;
    const authenticatedUsername = profile?.username || username;
    const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
    const cookieValue = await seal(env, { sessionId, username: authenticatedUsername, expiresAt });
    return json({
      ok: true,
      state: {
        ...emptySession(),
        authenticated: true,
        user: { username: authenticatedUsername, isAdmin: false, email: null },
        verifiedAt: Date.now(),
      },
    }, 200, {
      'Set-Cookie': `${COOKIE_NAME}=${cookieValue}; ${COOKIE_OPTIONS}; Max-Age=${SESSION_TTL_SECONDS}`,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : '登录服务暂不可用' }, 503);
  }
}

async function logout(request: Request, env: PagesEnv): Promise<Response> {
  if (!isSameOriginMutation(request)) return json({ error: 'Invalid request origin' }, 403);
  const sealed = sessionCookie(request);
  if (sealed) {
    const session = await unseal(env, sealed);
    if (session) {
      await fetch(`${XMOJ_ORIGIN}/logout.php`, {
        headers: { Cookie: upstreamCookie(session.sessionId) },
        redirect: 'manual',
      }).catch(() => undefined);
    }
  }
  return json(emptySession(), 200, { 'Set-Cookie': clearCookie() });
}

export async function onRequest({ request, env }: PagesContext): Promise<Response> {
  if (request.method === 'GET') return verifySession(request, env);
  if (request.method === 'POST') return login(request, env);
  if (request.method === 'DELETE') return logout(request, env);
  return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST, DELETE' });
}
