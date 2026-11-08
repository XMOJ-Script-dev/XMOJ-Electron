import { fetchUpstream } from './_upstream.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';
const XMOJ_HOSTS = ['www.xmoj.tech', 'xmoj.tech'];

export async function getPublicPage(request: Request, path: string, label: string) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const upstream = await fetchUpstream(new URL(path, XMOJ_ORIGIN), {
      headers: { Accept: 'text/html' },
      signal: request.signal
    }, XMOJ_HOSTS);

    if (!upstream.ok || !upstream.headers.get('content-type')?.includes('text/html')) {
      return Response.json({ error: label }, {
        status: 502,
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    return Response.json({ html: await upstream.text(), serverTime: Date.now() }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (caught) {
    console.error('[api/public-page] upstream request failed', caught);
    return Response.json({ error: label }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}
