const XMOJ_ORIGIN = 'https://www.xmoj.tech';

export async function getPublicPage(request: Request, path: string, label: string) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const upstream = await fetch(new URL(path, XMOJ_ORIGIN), {
      headers: { Accept: 'text/html' },
      redirect: 'manual',
      signal: request.signal
    });

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
  } catch {
    return Response.json({ error: label }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}
