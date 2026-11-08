import type { XmojApi } from '../../electron/preload';
import { SOFTWARE } from '@/shared/software';
import { XMOJ_ORIGIN, type CommunityNotification, type ContestDetail, type ContestListPage, type ContestProblem, type ContestRank, type DiffLine, type HomeSnapshot, type LoginRequest, type MonthlyBoard, type ProblemsetPage, type ProblemDetail, type ProblemsetQuery, type StatusPage, type StatusQuery, type UserInfo, type UserProfile } from '@/shared/types';
import { diffLines } from '@/lib/diff';

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

function communityCall<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
    return requestJson<T>('/api/community', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
    });
}

async function fetchWebSource(solutionId: number): Promise<string | null> {
    const result = await requestJson<{ source: string | null }>(`/api/source?id=${solutionId}`, {
        credentials: 'include',
    });
    return result.source;
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

async function requestSession(method: 'GET' | 'POST' | 'DELETE', body?: unknown) {
    const response = await fetch('/api/session', {
        method,
        credentials: 'include',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json() as { error?: string; ok?: boolean; state?: typeof EMPTY_SESSION };
    if (!response.ok) throw new Error(payload.error ?? '网页会话暂不可用');
    return payload;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, { credentials: 'omit', ...init });
    const payload = await response.json() as T | { error?: string };
    if (!response.ok || (payload && typeof payload === 'object' && 'error' in payload)) {
        throw new Error(
            payload && typeof payload === 'object' && 'error' in payload && payload.error
                ? payload.error
                : '网页数据暂时不可用',
        );
    }
    return payload as T;
}

function cached<T>(value: T) {
    return { value, fetchedAt: Date.now(), fromCache: false };
}

function unavailable(): Promise<never> {
    return Promise.reject(new Error('此功能暂未在网页版开放。'));
}

export function installWebApi(): void {
    const noSubscription = () => () => undefined;
    const api = {
        session: {
            get: async () => {
                const payload = await requestSession('GET');
                return payload as Awaited<ReturnType<XmojApi['session']['get']>>;
            },
            verify: async () => {
                const payload = await requestSession('GET');
                return payload as Awaited<ReturnType<XmojApi['session']['verify']>>;
            },
            login: async ({ username, password }: LoginRequest) => {
                try {
                    const payload = await requestSession('POST', { username, password });
                    return payload as Awaited<ReturnType<XmojApi['session']['login']>>;
                } catch (error) {
                    return {
                        ok: false,
                        message: error instanceof Error ? error.message : String(error),
                        state: { ...EMPTY_SESSION },
                    };
                }
            },
            logout: async () => {
                const payload = await requestSession('DELETE');
                return payload as Awaited<ReturnType<XmojApi['session']['logout']>>;
            },
            email: async () => {
                const payload = await requestSession('GET') as { user?: { email?: string | null } };
                return payload.user?.email ?? null;
            },
            avatar: async (payload: { username?: string; cacheBust?: boolean } = {}) => {
                const params = new URLSearchParams();
                if (payload.username) params.set('username', payload.username);
                if (payload.cacheBust) params.set('cacheBust', '1');
                const result = await requestJson<{ avatar: Awaited<ReturnType<XmojApi['session']['avatar']>> }>(
                    `/api/avatar${params.size ? `?${params}` : ''}`,
                    { credentials: 'include' },
                );
                return result.avatar;
            },
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
        problemset: {
            list: async (query: ProblemsetQuery = {}) => cached(await requestJson<ProblemsetPage>(
                `/api/problemset${query.search ? `?search=${encodeURIComponent(query.search)}` : ''}`,
            )),
            all: async () => requestJson<ProblemsetPage>('/api/problemset'),
        },
        problem: {
            detail: async (problemId: number) => cached(await requestJson<ProblemDetail>(`/api/problem?id=${problemId}`)),
        },
        contest: {
            list: async (page = 1) => cached(await requestJson<ContestListPage>(`/api/contest-list?page=${page}`)),
            detail: async (contestId: number) => cached(await requestJson<ContestDetail>(`/api/contest-detail?id=${contestId}`)),
            problems: async (contestId: number) => {
                const detail = await requestJson<ContestDetail>(`/api/contest-detail?id=${contestId}`);
                return detail.problems.map((problem, index): ContestProblem => ({
                    index,
                    label: problem.num,
                    title: problem.title,
                    url: problem.problemId
                        ? `${XMOJ_ORIGIN}/problem.php?id=${problem.problemId}`
                        : `${XMOJ_ORIGIN}/contest.php?cid=${contestId}`,
                    problemId: problem.problemId,
                }));
            },
            rank: async (contestId: number, oi: boolean) => requestJson<ContestRank>(
                `/api/contest-rank?id=${contestId}&oi=${oi}`,
            ),
            replay: unavailable,
        },
        nav: {
            info: async () => {
                const payload = await requestSession('GET') as { authenticated?: boolean; user?: { username?: string; isAdmin?: boolean } };
                return {
                    loggedIn: payload.authenticated === true,
                    serverTime: new Date().toISOString(),
                    lang: 'zh',
                    userId: payload.user?.username ?? '',
                    nick: '',
                    isAdmin: payload.user?.isAdmin === true,
                    isTeacher: false,
                    isContestCreator: false,
                    isProblemEditor: false,
                    isContestObserver: false,
                };
            },
        },
        user: {
            profile: async (username: string) => requestJson<UserProfile>(
                `/api/profile?username=${encodeURIComponent(username)}`,
            ),
            info: async (username: string) => {
                const profile = await requestJson<UserProfile>(
                    `/api/profile?username=${encodeURIComponent(username)}`,
                );
                return {
                    username: profile.username,
                    nick: profile.nick || null,
                    isAdmin: false,
                    badge: null,
                    rating: profile.rating ?? 0,
                } satisfies UserInfo;
            },
            exists: async (username: string) => requestJson<{ exists: boolean }>(
                `/api/user-exists?username=${encodeURIComponent(username)}`,
            ).then(result => result.exists),
        },
        settings: {
            pull: async () => {
                const result = await communityCall<{ Success: boolean; Message?: string; Data?: { Settings?: unknown } }>('GetUserSettings');
                if (!result.Success) throw new Error(result.Message || '读取设置失败');
                let settings: Record<string, unknown> = {};
                const raw = result.Data?.Settings;
                try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) as unknown : raw;
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        settings = parsed as Record<string, unknown>;
                    }
                } catch {
                    settings = {};
                }
                return settings;
            },
            push: async (settings: Record<string, unknown>) => {
                const result = await communityCall<{ Success: boolean; Message?: string }>('SetUserSettings', { Settings: settings });
                if (!result.Success) throw new Error(result.Message || '上传设置失败');
                return settings;
            },
        },
        cache: { clear: async () => ({ cleared: 0 }) },
        source: {
            details: async (solutionId: number) => requestJson(`/api/source-details?id=${solutionId}`, {
                credentials: 'include',
            }),
            get: fetchWebSource,
            compare: async (leftSolutionId: number, rightSolutionId: number): Promise<DiffLine[]> => {
                const [left, right] = await Promise.all([
                    fetchWebSource(leftSolutionId),
                    fetchWebSource(rightSolutionId),
                ]);
                if (left === null || right === null) throw new Error('无法读取提交代码（可能已隐藏）');
                return diffLines(left, right);
            },
            exportAcCode: unavailable,
        },
        submit: {
            code: (request: Parameters<XmojApi['submit']['code']>[0]) => requestJson<
                Awaited<ReturnType<XmojApi['submit']['code']>>
            >('/api/submit', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            }),
        },
        status: {
            list: async (query: StatusQuery = {}) => {
                const params = new URLSearchParams();
                for (const [key, value] of Object.entries(query)) {
                    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
                }
                return requestJson<StatusPage>(`/api/status?${params}`);
            },
        },
        bbs: {
            deletePost: async (postId: number) => communityCall('DeletePost', { PostID: postId }),
            deleteReply: async (replyId: number) => communityCall('DeleteReply', { ReplyID: replyId }),
            editReply: async (replyId: number, content: string) =>
                communityCall('EditReply', { ReplyID: replyId, Content: content }),
            captcha: unavailable,
            captchaState: async () => null,
            onCaptchaState: noSubscription,
            boards: async () => communityCall('GetBoards'),
            posts: async (query: { boardId?: number; page?: number; problemId?: number } = {}) =>
                communityCall('GetPosts', {
                    BoardID: query.boardId ?? 0,
                    Page: query.page ?? 1,
                    ProblemID: query.problemId ?? 0,
                }),
            post: async (postId: number, page = 1) =>
                communityCall('GetPost', { PostID: postId, Page: page }),
            newPost: async (payload: Parameters<XmojApi['bbs']['newPost']>[0]) =>
                communityCall('NewPost', {
                    BoardID: payload.boardId,
                    Title: payload.title,
                    Content: payload.content,
                    ProblemID: payload.problemId ?? 0,
                    CaptchaSecretKey: payload.captchaSecretKey ?? '',
                }),
            newReply: async (payload: Parameters<XmojApi['bbs']['newReply']>[0]) =>
                communityCall('NewReply', {
                    PostID: payload.postId,
                    Content: payload.content,
                    CaptchaSecretKey: payload.captchaSecretKey ?? '',
                }),
            std: async (problemId: number) => communityCall('GetStd', { ProblemID: problemId }),
        },
        mail: {
            list: async () => communityCall('GetMailList'),
            get: async (otherUser: string) => communityCall('GetMail', { OtherUser: otherUser }),
            send: async (toUser: string, content: string) =>
                communityCall('SendMail', { ToUser: toUser, Content: content }),
        },
        notices: {
            poll: async (): Promise<CommunityNotification[]> => {
                const [bbs, mail] = await Promise.all([
                    communityCall<{
                        Success: boolean;
                        Message?: string;
                        Data?: { MentionList?: Array<{ MentionID: number; PostTitle?: string; PostID?: number; PageNumber?: number }> };
                    }>('GetBBSMentionList'),
                    communityCall<{
                        Success: boolean;
                        Message?: string;
                        Data?: { MentionList?: Array<{ MentionID: number; FromUserID?: string }> };
                    }>('GetMailMentionList'),
                ]);
                if (!bbs.Success) throw new Error(bbs.Message || '讨论通知暂不可用');
                if (!mail.Success) throw new Error(mail.Message || '私信通知暂不可用');
                return [
                    ...(bbs.Data?.MentionList ?? []).map(mention => ({
                        kind: 'bbs' as const,
                        title: `${mention.PostTitle ?? '讨论区'} 有新的回复`,
                        body: '',
                        postId: mention.PostID,
                        pageNumber: mention.PageNumber,
                        mentionId: Number(mention.MentionID),
                    })),
                    ...(mail.Data?.MentionList ?? []).map(mention => ({
                        kind: 'mail' as const,
                        title: `${mention.FromUserID ?? '有人'} 给你发了私信`,
                        body: '',
                        mailUser: mention.FromUserID,
                        mentionId: Number(mention.MentionID),
                    })),
                ];
            },
        },
    } as unknown as XmojApi;
    window.xmoj = api;
}
