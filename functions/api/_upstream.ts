const MAX_REDIRECTS = 5;

export async function fetchUpstream(
  input: string | URL,
  init: RequestInit,
  allowedHosts: readonly string[],
): Promise<Response> {
  let url = new URL(input);
  let method = init.method ?? 'GET';
  let body = init.body;
  let headers = new Headers(init.headers);

  for (let redirects = 0; ; redirects += 1) {
    if (url.protocol !== 'https:' || !allowedHosts.includes(url.hostname)) {
      throw new Error('上游重定向目标不受信任');
    }

    const response = await fetch(url, { ...init, method, body, headers, redirect: 'manual' });
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
      headers = new Headers(headers);
      headers.delete('Content-Type');
      headers.delete('Content-Length');
    }
    url = destination;
  }
}
