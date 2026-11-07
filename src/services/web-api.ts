import type { XmojApi } from '../../electron/preload';
import { SOFTWARE } from '@/shared/software';
import { XMOJ_ORIGIN, type HomeSnapshot, type MonthlyBoard } from '@/shared/types';

const EMPTY_SESSION = {
    authenticated: false,
    user: null,
    sessionId: null,
    verifiedAt: null,
    rememberedUsername: null,
    canSilentLogin: false,
} as const;

interface HtmlResponse {
    html: string;
    serverTime: number;
}

function normaliseText(value: string | null | undefined): string {
    return (value ?? '').replace(/\s+/g, ' ').trim();
}

function safeHtml(element: Element): string {
    const clone = element.cloneNode(true) as Element;
    clone.querySelectorAll('script,style,iframe,object,embed').forEach(node => node.remove());
    for (const node of [clone, ...clone.querySelectorAll('*')]) {
        for (const attribute of [...node.attributes]) {
            const name = attribute.name.toLowerCase();
            if (name.startsWith('on')) {
                node.removeAttribute(attribute.name);
            } else if (['src', 'href', 'action', 'poster'].includes(name)) {
                const raw = attribute.value.trim();
                if (/^\s*javascript:/i.test(raw)) {
                    node.removeAttribute(attribute.name);
                } else if (raw && !raw.startsWith('#') && !raw.startsWith('data:')) {
                    try {
                        node.setAttribute(attribute.name, new URL(raw, XMOJ_ORIGIN).href);
                    } catch {
                        node.removeAttribute(attribute.name);
                    }
                }
            }
        }
    }
    return clone.innerHTML;
}

function parseCountdown(html: string, now: number): HomeSnapshot['countdown'] {
    const list = html.match(/var\s+list\s*=\s*\[([\s\S]*?)\]\s*;/)?.[1];
    if (!list) return [];
    const today = new Date(now);
    const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const result: HomeSnapshot['countdown'] = [];
    for (const match of list.matchAll(/\[\s*["']([^"']*)["']\s*,\s*["']([^"']*)["']\s*\]/g)) {
        const event = match[1].trim();
        const date = match[2].trim();
        const parts = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!event || !parts) continue;
        const target = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])).getTime();
        const days = Math.floor((target - midnight) / 86400000);
        if (Number.isFinite(target) && days >= 0) result.push({ event, date, days });
    }
    return result.sort((left, right) => left.days - right.days);
}

function parseHome({ html, serverTime }: HtmlResponse): HomeSnapshot {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const announcements: HomeSnapshot['announcements'] = [];
    for (const header of document.querySelectorAll('h4.ui.block.top.attached.header')) {
        const title = normaliseText(header.querySelector('.content')?.textContent ?? header.textContent);
        if (!title) continue;
        let body = header.nextElementSibling;
        while (body && !body.classList.contains('news_content') && body.tagName !== 'H4') {
            body = body.nextElementSibling;
        }
        if (!body || body.tagName === 'H4') continue;
        const text = normaliseText(body.textContent);
        if (!text) continue;
        announcements.push({
            title,
            date: normaliseText(header.querySelector('small')?.textContent) || null,
            html: safeHtml(body),
            text: text.slice(0, 400),
        });
    }
    const banners: HomeSnapshot['banners'] = [];
    for (const anchor of document.querySelectorAll('.col-md-4 a')) {
        const image = anchor.querySelector('img');
        if (!image) continue;
        try {
            banners.push({
                href: new URL(anchor.getAttribute('href') ?? '', XMOJ_ORIGIN).href,
                src: new URL(image.getAttribute('src') ?? '', XMOJ_ORIGIN).href,
            });
        } catch {
            continue;
        }
    }
    const clockText = html.match(/var\s+diff\s*=\s*new\s+Date\(\s*["']([^"']+)["']\s*\)/)?.[1];
    const parsedServerTime = clockText ? Date.parse(clockText) : Number.NaN;
    return {
        announcements,
        banners,
        countdown: parseCountdown(html, serverTime),
        serverTime: Number.isFinite(parsedServerTime) ? parsedServerTime : serverTime,
        notice: null,
    };
}

function parseMonthly({ html, serverTime }: HtmlResponse): MonthlyBoard {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const cards: MonthlyBoard['cards'] = [];
    for (const header of document.querySelectorAll('h4.ui.block.top.attached.header')) {
        const title = normaliseText(header.querySelector('.content')?.textContent ?? header.textContent);
        if (!title) continue;
        let body = header.nextElementSibling;
        while (body && !body.matches('.news_content, .segment') && body.tagName !== 'H4') {
            body = body.nextElementSibling;
        }
        if (!body || body.tagName === 'H4') continue;
        const text = normaliseText(body.textContent);
        if (!text) continue;
        cards.push({
            title,
            date: normaliseText(header.querySelector('small')?.textContent) || null,
            html: safeHtml(body),
            text: text.slice(0, 400),
        });
    }
    const intro = document.querySelector('.col-md-4');
    return {
        intro: intro ? safeHtml(intro) : '',
        cards,
        url: `${XMOJ_ORIGIN}/open_contest.php`,
        countdown: parseCountdown(html, serverTime),
        serverTime,
    };
}

async function getHtml(path: 'home' | 'monthly'): Promise<HtmlResponse> {
    const response = await fetch(`/api/${path}`, { credentials: 'omit' });
    const payload = await response.json() as HtmlResponse | { error?: string };
    if (!response.ok || !('html' in payload) || typeof payload.html !== 'string') {
        throw new Error('error' in payload && payload.error ? payload.error : '网页数据暂时不可用');
    }
    return payload;
}

function unavailable(): Promise<never> {
    return Promise.reject(new Error('此功能需要账户会话，目前网页版仅开放公开浏览功能。'));
}

const unavailableSection = new Proxy({}, {
    get: () => () => unavailable(),
});

export function installWebApi(): void {
    const noSubscription = () => () => undefined;
    const api = {
        session: {
            get: async () => ({ ...EMPTY_SESSION }),
            verify: async () => ({ ...EMPTY_SESSION }),
            login: async () => ({
                ok: false,
                message: '网页版暂不支持账户登录。请使用桌面版处理需要登录的功能。',
                state: { ...EMPTY_SESSION },
            }),
            logout: async () => ({ ...EMPTY_SESSION }),
        },
        home: {
            snapshot: async () => parseHome(await getHtml('home')),
        },
        monthly: {
            board: async () => parseMonthly(await getHtml('monthly')),
        },
        downloads: {
            list: async () => SOFTWARE,
        },
        app: {
            respondQuit: async () => undefined,
            openLink: async (raw: string) => {
                const url = new URL(raw);
                if (!['http:', 'https:'].includes(url.protocol)) throw new Error('不支持此链接类型');
                window.open(url.href, '_blank', 'noopener,noreferrer');
            },
            version: async () => '网页版',
            setConfirmLeave: async () => ({ enabled: false }),
            fetchJson: async () => unavailable(),
            dialog: async () => ({ buttonId: null }),
        },
        events: {
            onQuitRequested: noSubscription,
            onPopupBlocked: noSubscription,
            onDownloadProgress: noSubscription,
            onExportProgress: noSubscription,
        },
        problemset: unavailableSection,
        problem: unavailableSection,
        contest: unavailableSection,
        nav: unavailableSection,
        user: unavailableSection,
        settings: unavailableSection,
        cache: unavailableSection,
        source: unavailableSection,
        submit: unavailableSection,
        status: unavailableSection,
        bbs: unavailableSection,
        mail: unavailableSection,
        notices: unavailableSection,
    } as unknown as XmojApi;
    window.xmoj = api;
}
