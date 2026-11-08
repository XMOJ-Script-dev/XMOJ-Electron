import { XMOJ_ORIGIN } from '../../src/shared/types.ts';

interface PagesContext {
  request: Request;
}

export async function onRequestGet({ request }: PagesContext): Promise<Response> {
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const username = new URL(request.url).searchParams.get('username')?.trim() ?? '';
  if (!username || username.length > 128 || /[\u0000-\u001f\u007f]/.test(username)) {
    return Response.json({ error: '用户名无效' }, { status: 400 });
  }
  try {
    const upstream = await fetch(`${XMOJ_ORIGIN}/userinfo.php?user=${encodeURIComponent(username)}`, {
      headers: { Accept: 'text/html' },
      redirect: 'manual',
      signal: AbortSignal.timeout(20_000),
    });
    if (!upstream.ok || !upstream.headers.get('content-type')?.includes('text/html')) {
      return Response.json({ error: '无法验证用户名' }, { status: 502 });
    }
    const html = await upstream.text();
    const exists = !/用户不存在|不存在此用户|No such user|查无此人/i.test(html) &&
      /#statics|已解决|Solved/i.test(html);
    return Response.json({ exists }, {
      headers: { 'Cache-Control': 'private, max-age=60', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return Response.json({ error: '无法验证用户名' }, { status: 502 });
  }
}
