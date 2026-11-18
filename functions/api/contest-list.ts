import { fetchUpstream } from './_upstream.ts';
import { authorizeJudgeSession } from './_judge.ts';
import type { PagesEnv } from './session.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';

interface PagesContext {
  request: Request;
  env: PagesEnv;
}

export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  const rawPage = new URL(request.url).searchParams.get('page') ?? '1';
  if (!/^\d{1,3}$/.test(rawPage) || Number(rawPage) < 1 || Number(rawPage) > 100) {
    return Response.json({ error: '无效的比赛页码' }, { status: 400 });
  }
  const authorization = await authorizeJudgeSession(request, env);
  if ('response' in authorization) return authorization.response;
  const upstreamUrl = new URL('/api/contest/list', XMOJ_ORIGIN);
  upstreamUrl.searchParams.set('pageNum', rawPage);
  try {
    const response = await fetchUpstream(upstreamUrl, {
      headers: { Accept: 'application/json', Cookie: `PHPSESSID=${authorization.session.sessionId}` },
      signal: request.signal,
    }, ['www.xmoj.tech', 'xmoj.tech']);
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
      return Response.json({ error: '暂时无法读取比赛列表' }, {
        status: 502,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    return Response.json(await response.json(), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return Response.json({ error: '暂时无法读取比赛列表' }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
