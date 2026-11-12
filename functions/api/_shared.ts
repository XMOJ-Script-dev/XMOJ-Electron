import { fetchUpstream } from './_upstream.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';
const XMOJ_HOSTS = ['www.xmoj.tech', 'xmoj.tech'];
const CACHE_TTL_SECONDS = 60;
const CACHE_ORIGIN = 'https://cache.xmoj.local';

interface CachedPage {
  html: string;
  storedAt: number;
}

function cacheStorage(): Cache | null {
  if (typeof caches === 'undefined') return null;
  return (caches as unknown as { default?: Cache }).default ?? null;
}

function cacheKey(path: string): string {
  return `${CACHE_ORIGIN}/public${path === '/' ? '/index.html' : path}`;
}

async function readCachedPage(path: string): Promise<CachedPage | null> {
  const cache = cacheStorage();
  if (!cache) return null;
  try {
    const hit = await cache.match(cacheKey(path));
    if (!hit) return null;
    const page = JSON.parse(await hit.text()) as CachedPage;
    if (!page || typeof page.html !== 'string' || typeof page.storedAt !== 'number') return null;
    return page;
  } catch {
    return null;
  }
}

async function writeCachedPage(path: string, page: CachedPage): Promise<void> {
  const cache = cacheStorage();
  if (!cache) return;
  try {
    await cache.put(cacheKey(path), new Response(JSON.stringify(page), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${CACHE_TTL_SECONDS}`
      }
    }));
  } catch {
    return;
  }
}

function failure(label: string): Response {
  return Response.json({ error: label }, {
    status: 502,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export async function getPublicPage(request: Request, path: string, label: string) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, {
      status: 405,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  try {
    let page = await readCachedPage(path);
    if (!page) {
      const upstream = await fetchUpstream(new URL(path, XMOJ_ORIGIN), {
        headers: { Accept: 'text/html' },
        signal: request.signal
      }, XMOJ_HOSTS);

      if (!upstream.ok || !upstream.headers.get('content-type')?.includes('text/html')) {
        return failure(label);
      }

      page = { html: await upstream.text(), storedAt: Date.now() };
      await writeCachedPage(path, page);
    }

    const now = Date.now();
    return Response.json({
      html: page.html,
      serverTime: now,
      htmlAgeMs: Math.max(0, now - page.storedAt)
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (caught) {
    console.error('[api/public-page] upstream request failed', caught);
    return failure(label);
  }
}
