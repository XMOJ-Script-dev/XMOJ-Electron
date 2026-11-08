import { XMOJ_ORIGIN } from '../../src/shared/types.ts';
import { isAlreadyLoggedInResponse, isLoginGate } from '../../electron/parsers.ts';
import { readSession, type PagesEnv, type SessionEnvelope } from './session.ts';
import { parseJudgeDetails } from '../../electron/judge-details.ts';
import { fetchUpstream } from './_upstream.ts';

export async function verifiedJudgeSession(request: Request, env: PagesEnv) {
  const session = await readSession(request, env);
  if (!session) return null;
  const response = await fetchUpstream(`${XMOJ_ORIGIN}/loginpage.php`, {
    headers: { Cookie: `PHPSESSID=${session.sessionId}`, Accept: 'text/html' },
    signal: AbortSignal.timeout(20_000),
  }, ['www.xmoj.tech', 'xmoj.tech']);
  if (!response.ok) return null;
  const html = await response.text();
  return isAlreadyLoggedInResponse(html) && !isLoginGate(html) ? session : null;
}

export async function authorizeJudgeSession(
  request: Request,
  env: PagesEnv,
): Promise<{ session: SessionEnvelope } | { response: Response }> {
  const session = await readSession(request, env);
  if (!session) {
    return { response: Response.json({ error: '请先登录后再访问此页面' }, { status: 401 }) };
  }
  try {
    const verified = await verifiedJudgeSession(request, env);
    if (verified) return { session: verified };
    return { response: Response.json({ error: '登录状态已失效，请重新登录' }, { status: 401 }) };
  } catch (error) {
    console.error('[api/judge-session] verification failed', error);
    return { response: Response.json({ error: '暂时无法验证 XMOJ 登录状态' }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    }) };
  }
}

export async function getSource(request: Request, env: PagesEnv): Promise<Response> {
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isSafeInteger(id) || id < 1 || id > 1_000_000_000) {
    return Response.json({ error: '评测编号无效' }, { status: 400 });
  }
  const session = await verifiedJudgeSession(request, env).catch(() => null);
  if (!session) return Response.json({ error: '登录状态已失效，请重新登录' }, { status: 401 });
  try {
    const upstream = await fetchUpstream(`${XMOJ_ORIGIN}/getsource.php?id=${id}`, {
      headers: { Cookie: `PHPSESSID=${session.sessionId}`, Accept: 'text/plain, text/html' },
      signal: AbortSignal.timeout(20_000),
    }, ['www.xmoj.tech', 'xmoj.tech']);
    if (!upstream.ok) return Response.json({ source: null }, { headers: { 'Cache-Control': 'no-store' } });
    const raw = await upstream.text();
    if (new TextEncoder().encode(raw).byteLength > 512_000) {
      return Response.json({ error: '源码内容过大' }, { status: 413 });
    }
    const source = raw.replace(/^\s*<!--\s*not[- ]cached\s*-->\s*\r?\n?/i, '').replace(/\r?\n?<!--\s*not[- ]cached\s*-->\s*$/i, '');
    if (/<html|<body|<!DOCTYPE/i.test(source)) return Response.json({ source: null }, { headers: { 'Cache-Control': 'no-store' } });
    return Response.json({ source }, {
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return Response.json({ error: '无法读取提交源码' }, { status: 502 });
  }
}

export async function getSourceDetails(request: Request, env: PagesEnv): Promise<Response> {
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isSafeInteger(id) || id < 1 || id > 1_000_000_000) {
    return Response.json({ error: '评测编号无效' }, { status: 400 });
  }
  const session = await verifiedJudgeSession(request, env).catch(() => null);
  if (!session) return Response.json({ error: '登录状态已失效，请重新登录' }, { status: 401 });
  try {
    const upstream = await fetchUpstream(`${XMOJ_ORIGIN}/reinfo.php?sid=${id}`, {
      headers: { Cookie: `PHPSESSID=${session.sessionId}`, Accept: 'text/html' },
      signal: AbortSignal.timeout(20_000),
    }, ['www.xmoj.tech', 'xmoj.tech']);
    if (!upstream.ok) return Response.json({ error: '无法读取测试点详情' }, { status: 502 });
    const html = await upstream.text();
    if (new TextEncoder().encode(html).byteLength > 1_000_000) {
      return Response.json({ error: '评测详情过大' }, { status: 413 });
    }
    if (isLoginGate(html)) return Response.json({ error: '登录状态已失效，请重新登录' }, { status: 401 });
    return Response.json(parseJudgeDetails(html), {
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return Response.json({ error: '无法读取测试点详情' }, { status: 502 });
  }
}
