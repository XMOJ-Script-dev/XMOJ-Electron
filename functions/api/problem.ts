import { parseLanguages, parseProblemDetail } from '../../electron/problems.ts';
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
  const rawId = new URL(request.url).searchParams.get('id') ?? '';
  if (!/^\d{1,10}$/.test(rawId)) return error('无效的题目编号', 400);
  const problemId = Number(rawId);
  if (!Number.isSafeInteger(problemId) || problemId < 1 || problemId > 1_000_000_000) {
    return error('无效的题目编号', 400);
  }

  try {
    const problemUrl = new URL('/problem.php', XMOJ_ORIGIN);
    problemUrl.searchParams.set('id', String(problemId));
    const response = await fetchUpstream(problemUrl, {
      headers: { Accept: 'text/html' },
      signal: request.signal,
    }, ['www.xmoj.tech', 'xmoj.tech']);
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return error('暂时无法读取题目', 502);
    }

    const detail = parseProblemDetail(await response.text(), problemId);
    try {
      const submitUrl = new URL('/submitpage.php', XMOJ_ORIGIN);
      submitUrl.searchParams.set('id', String(problemId));
      const submitPage = await fetchUpstream(submitUrl, {
        headers: { Accept: 'text/html' },
        signal: request.signal,
      }, ['www.xmoj.tech', 'xmoj.tech']);
      if (submitPage.ok && submitPage.headers.get('content-type')?.includes('text/html')) {
        detail.languages = parseLanguages(await submitPage.text());
      }
    } catch {
      detail.languages = [];
    }

    return Response.json(detail, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return error('暂时无法读取题目', 502);
  }
}
