import { parseProblemsetPage } from '../../electron/parsers.ts';
import { fetchUpstream } from './_upstream.ts';
import { authorizeJudgeSession } from './_judge.ts';
import type { PagesEnv } from './session.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';
const MAX_PAGES = 40;
const PAGE_DELAY_MS = 100;
const CACHE_TTL_SECONDS = 60;
const CACHE_ORIGIN = 'https://cache.xmoj.local';

interface PagesContext {
  request: Request;
  env: PagesEnv;
}

function cacheStorage(): Cache | null {
  if (typeof caches === 'undefined') return null;
  return (caches as unknown as { default?: Cache }).default ?? null;
}

async function cacheKeyFor(username: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`problemset:${username}`));
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return `${CACHE_ORIGIN}/problemset/${hex}`;
}

async function readCachedProblems(username: string): Promise<string | null> {
  const cache = cacheStorage();
  if (!cache) return null;
  try {
    const hit = await cache.match(await cacheKeyFor(username));
    return hit ? await hit.text() : null;
  } catch {
    return null;
  }
}

async function writeCachedProblems(username: string, body: string): Promise<void> {
  const cache = cacheStorage();
  if (!cache) return;
  try {
    await cache.put(await cacheKeyFor(username), new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${CACHE_TTL_SECONDS}`,
      },
    }));
  } catch {
    return;
  }
}

function error(message: string, status: number): Response {
  return Response.json({ error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  const search = new URL(request.url).searchParams.get('search')?.trim() ?? '';
  if (search.length > 100) return error('搜索内容过长', 400);
  const authorization = await authorizeJudgeSession(request, env);
  if ('response' in authorization) return authorization.response;

  const cached = search ? null : await readCachedProblems(authorization.session.username);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  try {
    const problems = [];
    let totalPages = 1;
    for (let page = 1; page <= Math.min(totalPages, MAX_PAGES); page += 1) {
      const url = new URL('/problemset.php', XMOJ_ORIGIN);
      url.searchParams.set('page', String(page));
      if (search) url.searchParams.set('search', search);
      const response = await fetchUpstream(url, {
        headers: { Accept: 'text/html', Cookie: `PHPSESSID=${authorization.session.sessionId}` },
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

    const payload = JSON.stringify({
      problems,
      page: 1,
      totalPages: Math.max(1, Math.ceil(problems.length / 20)),
    });
    if (!search) await writeCachedProblems(authorization.session.username, payload);
    return new Response(payload, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return error('暂时无法读取题库', 502);
  }
}
