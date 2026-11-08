import { parseContestRank } from '../../electron/rank.ts';
import { fetchUpstream } from './_upstream.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';

interface PagesContext {
  request: Request;
}

export async function onRequestGet({ request }: PagesContext): Promise<Response> {
  const input = new URL(request.url).searchParams;
  const rawId = input.get('id') ?? '';
  const oi = input.get('oi') === 'true';
  if (!/^\d{1,10}$/.test(rawId) || Number(rawId) < 1) {
    return Response.json({ error: '无效的比赛编号' }, { status: 400 });
  }
  const path = oi ? 'contestrank-oi.php' : 'contestrank-correct.php';
  const upstreamUrl = new URL(`/${path}`, XMOJ_ORIGIN);
  upstreamUrl.searchParams.set('cid', rawId);
  try {
    const response = await fetchUpstream(upstreamUrl, {
      headers: { Accept: 'text/html' },
      signal: request.signal,
    }, ['www.xmoj.tech', 'xmoj.tech']);
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return Response.json({ error: '暂时无法读取比赛排名' }, {
        status: 502,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    return Response.json(parseContestRank(await response.text(), Number(rawId), oi), {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
    });
  } catch {
    return Response.json({ error: '暂时无法读取比赛排名' }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
