import { XMOJ_ORIGIN } from '../src/shared/types.ts';
const TRUSTED_HOSTS = new Set([
    new URL(XMOJ_ORIGIN).hostname,
    'xmoj.tech',
    'xmoj-script.uk',
    'www.xmoj-script.uk',
    'api.xmoj-script.uk',
    'assets.xmoj-script.uk',
    'xmoj-bbs.me',
    'api.xmoj-bbs.me',
    'xmoj-bbs.tech',
    'api.xmoj-bbs.tech',
]);
export function isTrustedHost(host: string): boolean {
    const normalised = host.toLowerCase();
    for (const trusted of TRUSTED_HOSTS) {
        if (normalised === trusted)
            return true;
        if (normalised.endsWith(`.${trusted}`))
            return true;
    }
    return false;
}
export interface Cookie {
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number | null;
    httpOnly: boolean;
    secure: boolean;
}
export interface HttpResponse {
    status: number;
    url: string;
    headers: Headers;
    body: string;
    serverTime: number;
}
const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 XMOJ-Electron';
function domainMatches(host: string, domain: string): boolean {
    if (host === domain)
        return true;
    return host.endsWith(`.${domain}`);
}
function pathMatches(requestPath: string, cookiePath: string): boolean {
    if (requestPath === cookiePath)
        return true;
    if (!requestPath.startsWith(cookiePath))
        return false;
    return cookiePath.endsWith('/') || requestPath[cookiePath.length] === '/';
}
export function parseSetCookie(header: string, requestUrl: URL): Cookie | null {
    const segments = header.split(';');
    const first = segments.shift();
    if (!first)
        return null;
    const eq = first.indexOf('=');
    if (eq === -1)
        return null;
    const name = first.slice(0, eq).trim();
    const value = first.slice(eq + 1).trim();
    if (!name)
        return null;
    const cookie: Cookie = {
        name,
        value,
        domain: requestUrl.hostname,
        path: '/',
        expires: null,
        httpOnly: false,
        secure: false,
    };
    for (const raw of segments) {
        const segment = raw.trim();
        if (!segment)
            continue;
        const idx = segment.indexOf('=');
        const key = (idx === -1 ? segment : segment.slice(0, idx)).trim().toLowerCase();
        const val = idx === -1 ? '' : segment.slice(idx + 1).trim();
        switch (key) {
            case 'domain':
                cookie.domain = val.replace(/^\./, '').toLowerCase();
                break;
            case 'path':
                cookie.path = val || '/';
                break;
            case 'expires': {
                const parsed = Date.parse(val);
                if (!Number.isNaN(parsed))
                    cookie.expires = Math.floor(parsed / 1000);
                break;
            }
            case 'max-age': {
                const seconds = Number.parseInt(val, 10);
                if (!Number.isNaN(seconds)) {
                    cookie.expires = Math.floor(Date.now() / 1000) + seconds;
                }
                break;
            }
            case 'httponly':
                cookie.httpOnly = true;
                break;
            case 'secure':
                cookie.secure = true;
                break;
            default:
                break;
        }
    }
    return cookie;
}
export class CookieJar {
    private cookies: Cookie[] = [];
    constructor(initial: Cookie[] = []) {
        this.cookies = initial.filter((c) => c && typeof c.name === 'string');
    }
    private prune(now = Date.now()): void {
        const nowSeconds = Math.floor(now / 1000);
        this.cookies = this.cookies.filter((c) => c.expires === null || c.expires > nowSeconds);
    }
    headerFor(url: URL): string | null {
        this.prune();
        const matches = this.cookies
            .filter((c) => domainMatches(url.hostname.toLowerCase(), c.domain) &&
            pathMatches(url.pathname || '/', c.path) &&
            (!c.secure || url.protocol === 'https:'))
            .sort((a, b) => b.path.length - a.path.length);
        if (matches.length === 0)
            return null;
        return matches.map((c) => `${c.name}=${c.value}`).join('; ');
    }
    store(setCookieHeaders: string[], requestUrl: URL): void {
        for (const header of setCookieHeaders) {
            const cookie = parseSetCookie(header, requestUrl);
            if (!cookie)
                continue;
            if (!isTrustedHost(cookie.domain))
                continue;
            if (!domainMatches(requestUrl.hostname.toLowerCase(), cookie.domain))
                continue;
            const isExpired = cookie.expires !== null && cookie.expires <= Math.floor(Date.now() / 1000);
            const idx = this.cookies.findIndex((c) => c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path);
            if (isExpired) {
                if (idx !== -1)
                    this.cookies.splice(idx, 1);
                continue;
            }
            if (idx === -1)
                this.cookies.push(cookie);
            else
                this.cookies[idx] = cookie;
        }
    }
    get(name: string): string | null {
        this.prune();
        const found = this.cookies.find((c) => c.name === name);
        return found ? found.value : null;
    }
    set(name: string, value: string, domain: string, path = '/'): void {
        const idx = this.cookies.findIndex((c) => c.name === name && c.domain === domain && c.path === path);
        const cookie: Cookie = {
            name,
            value,
            domain,
            path,
            expires: null,
            httpOnly: false,
            secure: true,
        };
        if (idx === -1)
            this.cookies.push(cookie);
        else
            this.cookies[idx] = cookie;
    }
    delete(name: string): void {
        this.cookies = this.cookies.filter((c) => c.name !== name);
    }
    restore(cookie: Cookie): void {
        const idx = this.cookies.findIndex((c) => c.name === cookie.name &&
            c.domain === cookie.domain &&
            c.path === cookie.path);
        if (idx === -1)
            this.cookies.push({ ...cookie });
        else
            this.cookies[idx] = { ...cookie };
    }
    clear(): void {
        this.cookies = [];
    }
    toJSON(): Cookie[] {
        this.prune();
        return this.cookies.map((c) => ({ ...c }));
    }
}
export interface RequestOptions {
    method?: 'GET' | 'POST';
    form?: Record<string, string>;
    body?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
    redirect?: boolean;
}
export class HttpClient {
    readonly jar: CookieJar;
    private readonly userAgent: string;
    private static readonly MAX_REDIRECTS = 8;
    constructor(jar: CookieJar = new CookieJar(), userAgent: string = DEFAULT_UA) {
        this.jar = jar;
        this.userAgent = userAgent;
    }
    async request(url: string | URL, options: RequestOptions = {}): Promise<HttpResponse> {
        const { method = 'GET', form, body, headers: extraHeaders = {}, timeoutMs = 30000, redirect = true, } = options;
        let current = new URL(url);
        let methodForHop: 'GET' | 'POST' = method;
        const isRawBody = body !== undefined;
        let bodyForHop: string | undefined = body ?? (form === undefined ? undefined : new URLSearchParams(form).toString());
        for (let hop = 0; hop <= HttpClient.MAX_REDIRECTS; hop++) {
            const headers: Record<string, string> = {
                'User-Agent': this.userAgent,
                Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                ...extraHeaders,
            };
            const cookieHeader = this.jar.headerFor(current);
            if (cookieHeader)
                headers.Cookie = cookieHeader;
            if (bodyForHop !== undefined) {
                if (!isRawBody)
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                headers['Content-Length'] = String(Buffer.byteLength(bodyForHop));
            }
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            let response: Response;
            try {
                response = await fetch(current, {
                    method: methodForHop,
                    headers,
                    body: bodyForHop,
                    redirect: 'manual',
                    signal: controller.signal,
                });
            }
            catch (error) {
                clearTimeout(timer);
                const reason = error instanceof Error ? error.message : String(error);
                throw new Error(`请求 ${current.href} 失败: ${reason}`);
            }
            finally {
                clearTimeout(timer);
            }
            const setCookie = response.headers.getSetCookie?.() ?? [];
            this.jar.store(setCookie, current);
            const location = response.headers.get('location');
            const isRedirect = response.status >= 300 && response.status < 400 && location;
            if (isRedirect && redirect) {
                const next = new URL(location, current);
                if (response.status === 303 || ((response.status === 301 || response.status === 302) && methodForHop === 'POST')) {
                    methodForHop = 'GET';
                    bodyForHop = undefined;
                    if (isRawBody)
                        delete extraHeaders['Content-Type'];
                }
                current = next;
                continue;
            }
            const text = await response.text();
            const dateHeader = response.headers.get('date');
            const parsedDate = dateHeader ? Date.parse(dateHeader) : Number.NaN;
            return {
                status: response.status,
                url: current.href,
                headers: response.headers,
                body: text,
                serverTime: Number.isNaN(parsedDate) ? Date.now() : parsedDate,
            };
        }
        throw new Error(`重定向次数过多: ${url}`);
    }
    get(url: string | URL, options: Omit<RequestOptions, 'method' | 'form'> = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }
    post(url: string | URL, form: Record<string, string>, options: Omit<RequestOptions, 'method' | 'form'> = {}) {
        return this.request(url, { ...options, method: 'POST', form });
    }
}
