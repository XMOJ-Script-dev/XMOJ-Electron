import { parseUserProfile } from '../../electron/profile.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';

interface PagesContext {
  request: Request;
}

export async function onRequestGet({ request }: PagesContext): Promise<Response> {
  const username = new URL(request.url).searchParams.get('username')?.trim() ?? '';
  if (!username || username.length > 128 || /[\u0000-\u001f\u007f]/.test(username)) {
    return Response.json({ error: '无效的用户名' }, { status: 400 });
  }
  const upstreamUrl = new URL('/userinfo.php', XMOJ_ORIGIN);
  upstreamUrl.searchParams.set('user', username);
  try {
    const response = await fetch(upstreamUrl, {
      headers: { Accept: 'text/html' },
      redirect: 'manual',
      signal: request.signal,
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return Response.json({ error: '暂时无法读取用户主页' }, {
        status: 502,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    return Response.json(parseUserProfile(await response.text(), username), {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
    });
  } catch {
    return Response.json({ error: '暂时无法读取用户主页' }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
