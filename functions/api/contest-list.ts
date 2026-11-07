const XMOJ_ORIGIN = 'https://www.xmoj.tech';

interface PagesContext {
  request: Request;
}

export async function onRequestGet({ request }: PagesContext): Promise<Response> {
  const rawPage = new URL(request.url).searchParams.get('page') ?? '1';
  if (!/^\d{1,3}$/.test(rawPage) || Number(rawPage) < 1 || Number(rawPage) > 100) {
    return Response.json({ error: '无效的比赛页码' }, { status: 400 });
  }
  const upstreamUrl = new URL('/api/contest/list', XMOJ_ORIGIN);
  upstreamUrl.searchParams.set('pageNum', rawPage);
  try {
    const response = await fetch(upstreamUrl, {
      headers: { Accept: 'application/json' },
      redirect: 'manual',
      signal: request.signal,
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
      return Response.json({ error: '暂时无法读取比赛列表' }, {
        status: 502,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    return Response.json(await response.json(), {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
    });
  } catch {
    return Response.json({ error: '暂时无法读取比赛列表' }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
