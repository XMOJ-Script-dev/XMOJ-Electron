import { parseStatusPage } from '../../electron/parsers.ts';
import { fetchUpstream } from './_upstream.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';

interface PagesContext {
  request: Request;
}

function error(message: string, status: number): Response {
  return Response.json({ error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function onRequestGet({ request }: PagesContext): Promise<Response> {
  const input = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const [source, target] of [
    ['user', 'user_id'],
    ['problemId', 'problem_id'],
    ['result', 'jresult'],
    ['language', 'language'],
    ['top', 'top'],
    ['prevTop', 'prevtop'],
  ] as const) {
    const value = input.get(source)?.trim();
    if (!value) continue;
    if (source === 'problemId' || source === 'top' || source === 'prevTop') {
      if (!/^\d{1,12}$/.test(value)) return error(`无效的 ${source} 参数`, 400);
    } else if (value.length > 100) {
      return error(`筛选条件过长`, 400);
    }
    query.set(target, value);
  }

  try {
    const upstreamUrl = new URL('/status.php', XMOJ_ORIGIN);
    upstreamUrl.search = query.toString();
    const response = await fetchUpstream(upstreamUrl, {
      headers: { Accept: 'text/html' },
      signal: request.signal,
    }, ['www.xmoj.tech', 'xmoj.tech']);
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return error('暂时无法读取评测记录', 502);
    }
    return Response.json(parseStatusPage(await response.text()), {
      headers: { 'Cache-Control': 'public, max-age=15, s-maxage=30', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return error('暂时无法读取评测记录', 502);
  }
}
