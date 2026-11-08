import { parseAccountEmail } from '../../electron/parsers.ts';
import { readSession, type PagesEnv } from './session.ts';
import { fetchUpstream } from './_upstream.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';
const XMOJ_HOSTS = ['www.xmoj.tech', 'xmoj.tech'];

export function md5(value: string): string {
  const input = new TextEncoder().encode(value);
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, (input.length * 8) >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(input.length * 8 / 0x1_0000_0000), true);

  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const constants = Array.from({ length: 64 }, (_, index) =>
    Math.floor(Math.abs(Math.sin(index + 1)) * 0x1_0000_0000) >>> 0);
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = Array.from({ length: 16 }, (_, index) => view.getUint32(offset + index * 4, true));
    let a = a0, b = b0, c = c0, d = d0;
    for (let index = 0; index < 64; index += 1) {
      let f: number, word: number;
      if (index < 16) {
        f = (b & c) | (~b & d);
        word = index;
      } else if (index < 32) {
        f = (d & b) | (~d & c);
        word = (5 * index + 1) % 16;
      } else if (index < 48) {
        f = b ^ c ^ d;
        word = (3 * index + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        word = (7 * index) % 16;
      }
      const sum = (a + f + constants[index] + words[word]) >>> 0;
      const rotated = (sum << shifts[index]) | (sum >>> (32 - shifts[index]));
      [a, b, c, d] = [d, (b + rotated) >>> 0, b, c];
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return [a0, b0, c0, d0]
    .flatMap(word => [0, 8, 16, 24].map(shift => (word >>> shift) & 0xff))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

interface PagesContext {
  request: Request;
  env: PagesEnv;
}

export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  const url = new URL(request.url);
  const requestedUsername = url.searchParams.get('username')?.trim() ?? '';
  if (requestedUsername.length > 128 || /[\u0000-\u001f\u007f]/.test(requestedUsername)) {
    return Response.json({ error: '用户名无效' }, { status: 400 });
  }

  const session = await readSession(request, env);
  const ownAccount = Boolean(session && (!requestedUsername || requestedUsername === session.username));
  const username = ownAccount ? session!.username : requestedUsername;
  if (!username) return Response.json({ avatar: null }, { headers: { 'Cache-Control': 'no-store' } });

  const profileUrl = new URL(ownAccount ? '/modifypage.php' : '/userinfo.php', XMOJ_ORIGIN);
  if (!ownAccount) profileUrl.searchParams.set('user', username);
  try {
    const response = await fetchUpstream(profileUrl, {
      headers: {
        Accept: 'text/html',
        ...(ownAccount ? { Cookie: `PHPSESSID=${session!.sessionId}` } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    }, XMOJ_HOSTS);
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return Response.json({ avatar: null }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const email = parseAccountEmail(await response.text());
    if (!email) return Response.json({ avatar: null }, { headers: { 'Cache-Control': 'no-store' } });

    const hash = md5(email.trim().toLowerCase());
    const avatarUrl = new URL(`/avatar/${hash}`, 'https://cravatar.cn');
    avatarUrl.searchParams.set('retro', '1');
    avatarUrl.searchParams.set('s', '160');
    if (ownAccount && url.searchParams.has('cacheBust')) {
      avatarUrl.searchParams.set('_', String(Date.now()));
    }
    return Response.json({ avatar: { hash, url: avatarUrl.href } }, {
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (error) {
    console.error('[api/avatar] profile request failed', error);
    return Response.json({ avatar: null }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
