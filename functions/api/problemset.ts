import { parseProblemsetPage } from '../../electron/parsers.ts';
import { fetchUpstream } from './_upstream.ts';
import { authorizeJudgeSession } from './_judge.ts';
import type { PagesEnv } from './session.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';
const MAX_PAGES = 40;
const PAGE_CONCURRENCY = 6;
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
    const fetchPage = async (page: number) => {
      const url = new URL('/problemset.php', XMOJ_ORIGIN);
      url.searchParams.set('page', String(page));
      if (search) url.searchParams.set('search', search);
      const response = await fetchUpstream(url, {
        headers: { Accept: 'text/html', Cookie: `PHPSESSID=${authorization.session.sessionId}` },
        signal: request.signal,
      }, ['www.xmoj.tech', 'xmoj.tech']);
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        throw new Error('暂时无法读取题库');
      }
      return parseProblemsetPage(await response.text(), page);
    };

    const first = await fetchPage(1);
    const problems = [...first.problems];
    const totalPages = Math.max(1, Math.min(first.totalPages ?? 1, MAX_PAGES));
    const pending: number[] = [];
    if (first.problems.length) {
      for (let page = 2; page <= totalPages; page += 1) pending.push(page);
    }
    for (let index = 0; index < pending.length; index += PAGE_CONCURRENCY) {
      const batch = await Promise.all(
        pending.slice(index, index + PAGE_CONCURRENCY).map(fetchPage),
      );
      for (const parsed of batch) problems.push(...parsed.problems);
      if (batch.some(parsed => parsed.problems.length === 0)) break;
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
