import { parseProblemsetPage } from '../../electron/parsers.ts';
import { fetchUpstream } from './_upstream.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';
const MAX_PAGES = 40;
const PAGE_DELAY_MS = 100;

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
  const search = new URL(request.url).searchParams.get('search')?.trim() ?? '';
  if (search.length > 100) return error('搜索内容过长', 400);

  try {
    const problems = [];
    let totalPages = 1;
    for (let page = 1; page <= Math.min(totalPages, MAX_PAGES); page += 1) {
      const url = new URL('/problemset.php', XMOJ_ORIGIN);
      url.searchParams.set('page', String(page));
      if (search) url.searchParams.set('search', search);
      const response = await fetchUpstream(url, {
        headers: { Accept: 'text/html' },
        signal: request.signal,
      }, ['www.xmoj.tech', 'xmoj.tech']);
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        return error('暂时无法读取题库', 502);
      }
      const parsed = parseProblemsetPage(await response.text(), page);
      problems.push(...parsed.problems);
      if (page === 1) totalPages = Math.max(1, Math.min(parsed.totalPages ?? 1, MAX_PAGES));
      if (!parsed.problems.length) break;
      if (page < totalPages) await new Promise(resolve => setTimeout(resolve, PAGE_DELAY_MS));
    }

    return Response.json({
      problems,
      page: 1,
      totalPages: Math.max(1, Math.ceil(problems.length / 20)),
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return error('暂时无法读取题库', 502);
  }
}
