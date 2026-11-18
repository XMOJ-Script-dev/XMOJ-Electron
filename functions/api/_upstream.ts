const MAX_REDIRECTS = 5;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 XMOJ-Electron';

function requestHeaders(input: HeadersInit): HeadersInit {
  if (input instanceof Headers) {
    const headers = new Headers(input);
    if (!headers.has('User-Agent')) headers.set('User-Agent', USER_AGENT);
    return headers;
  }
  if (Array.isArray(input)) {
    const headers = new Headers(input);
    if (!headers.has('User-Agent')) headers.set('User-Agent', USER_AGENT);
    return headers;
  }
  const headers = input as Record<string, string>;
  if (Object.keys(headers).some(name => name.toLowerCase() === 'user-agent')) return headers;
  return { ...headers, 'User-Agent': USER_AGENT };
}

export async function fetchUpstream(
  input: string | URL,
  init: RequestInit,
  allowedHosts: readonly string[],
): Promise<Response> {
  let url = new URL(input);
  let method = init.method ?? 'GET';
  let body = init.body;
  let headers = requestHeaders(init.headers ?? {});

  for (let redirects = 0; ; redirects += 1) {
    if (url.protocol !== 'https:' || !allowedHosts.includes(url.hostname)) {
      throw new Error('上游重定向目标不受信任');
    }

    let response: Response;
    try {
      response = await fetch(url, { ...init, method, body, headers, redirect: 'manual' });
    } catch (error) {
      console.error(`[xmoj-upstream] ${url.hostname}${url.pathname} request failed`, error);
      throw error;
    }
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    if (redirects >= MAX_REDIRECTS) throw new Error('上游重定向次数过多');

    const location = response.headers.get('Location');
    if (!location) return response;

    const destination = new URL(location, url);
    if (destination.protocol !== 'https:' || !allowedHosts.includes(destination.hostname)) {
      throw new Error('上游重定向目标不受信任');
    }

    if ((response.status === 301 || response.status === 302 || response.status === 303) &&
      method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
      method = 'GET';
      body = undefined;
      const redirectedHeaders = new Headers(headers);
      redirectedHeaders.delete('Content-Type');
      redirectedHeaders.delete('Content-Length');
      headers = redirectedHeaders;
    }
    await response.body?.cancel();
    url = destination;
  }
}
