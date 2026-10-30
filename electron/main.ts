import { app, BrowserWindow, WebContentsView, dialog, ipcMain, Menu, net, shell } from 'electron';
import type { DownloadItem, Event as ElectronEvent, WebContents } from 'electron';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { IPC, XMOJ_ORIGIN, type AvatarInfo, type CommunityNotification, type ContestDetail, type ContestListPage, type ContestProblem, type ContestRank, type CachedValue, type DialogButton, type DiffLine, type ExportResult, type IpcResult, type JsonFetchResult, type MonthlyBoard, type NavInfo, type SoftwareEntry, type UserInfo, type UserProfile, type UserTag, type ProblemsetPage, type ProblemDetail, type SessionState, type StatusPage, type SubmitResult, type LoginResult, type HomeSnapshot, } from '../src/shared/types.ts';
import { SessionManager } from './session.ts';
import { HttpClient } from './http.ts';
import type { CaptchaRequest, CaptchaState, CaptchaBounds } from '../src/shared/types.ts';
import { captchaViewport } from '../src/shared/captcha-layout.ts';
import { fetchContestReplay } from './replay.ts';
import { attachOpeningComment } from '../src/shared/discussion.ts';
import { isExternalWebUrl, isJudgeUrl } from '../src/shared/links.ts';
import { CommunityApi, createFileTokenStore } from './community.ts';
import { PageCache } from './cache.ts';
import { fetchContestDetail, fetchContestList, fetchNavInfo, userExists, } from './judge-api.ts';
import { buildSubmitForm, parseContestProblems, parseLanguages, parseProblemDetail, parseSubmitResponse, } from './problems.ts';
import { diffLines } from '../src/lib/diff.ts';
import { exportAcCode, fetchSource, fetchJudgeDetails } from './sources.ts';
import { fetchContestRank } from './rank.ts';
import { fetchUserProfile } from './profile.ts';
import { trackDownload, cancelDownload } from './downloads.ts';
import { createNoticePoller } from './notices.ts';
import { fetchMonthlyBoard, fetchSoftwareList } from './extras.ts';
import { parseHomeSnapshot, parseProblemsetPage, parseStatusPage } from './parsers.ts';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, '..');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, 'public')
    : RENDERER_DIST;
const session = new SessionManager();
const cache = new PageCache(app.getPath('userData'));
let community: CommunityApi | null = null;
function initCommunity(): void {
    const tokenFile = path.join(app.getPath('userData'), 'community-tokens.json');
    const http = new HttpClient(session.http.jar, undefined, (url, options) => {
        const headers = new Headers(options.headers);
        headers.delete('Content-Length');
        return net.fetch(url.href, { ...options, headers, credentials: 'omit' });
    });
    community = new CommunityApi(http, createFileTokenStore(tokenFile));
}
let win: BrowserWindow | null = null;
let inlineCaptcha: { id: string; view: WebContentsView; owner: BrowserWindow; initialized?: boolean; resetting?: boolean; bounds?: CaptchaBounds; loadTimeout?: ReturnType<typeof setTimeout>; scriptTimeout?: ReturnType<typeof setTimeout>; state?: Omit<CaptchaState, 'id'>; transform?: string } | null = null;
function removeInlineCaptcha(): void {
    if (!inlineCaptcha) return;
    const { view, owner, loadTimeout, scriptTimeout } = inlineCaptcha;
    inlineCaptcha = null;
    clearTimeout(loadTimeout); clearTimeout(scriptTimeout);
    if (!owner.isDestroyed()) owner.contentView.removeChildView(view);
    const contents = view.webContents;
    if (contents && !contents.isDestroyed()) contents.close();
}
function positionInlineCaptcha(bounds?: CaptchaBounds): void {
    if (!inlineCaptcha || !bounds) return;
    const { view, owner } = inlineCaptcha;
    inlineCaptcha.bounds = bounds;
    if (owner.isDestroyed() || !view.webContents || view.webContents.isDestroyed()) return;
    const zoom = owner.webContents.getZoomFactor();
    const [width, height] = owner.getContentSize();
    const layout = captchaViewport(bounds, width, height, zoom);
    if (!layout) return;
    view.setBounds(layout.bounds);
    view.webContents.setZoomFactor(zoom);
    const transform = `translate(${-layout.offsetX}px, ${-layout.offsetY}px)`;
    if (inlineCaptcha.initialized && inlineCaptcha.transform !== transform) {
        inlineCaptcha.transform = transform;
        void view.webContents.executeJavaScript(`document.body.style.transform = ${JSON.stringify(transform)}`).catch(() => {});
    }
    view.setVisible(!!inlineCaptcha.initialized && layout.visible);
}
function publishCaptchaState(current: NonNullable<typeof inlineCaptcha>, state: Omit<CaptchaState, 'id'>): void {
    if (inlineCaptcha !== current || current.owner.isDestroyed()) return;
    current.state = state;
    if (state.status !== 'loading') clearTimeout(current.scriptTimeout);
    current.owner.webContents.send(IPC.bbsCaptchaState, { id: current.id, ...state });
}
async function reconcileCaptchaState(current: NonNullable<typeof inlineCaptcha>): Promise<void> {
    const contents = current.view.webContents;
    if (!current.initialized || current.resetting || !contents || contents.isDestroyed()) return;
    // Read the official widget API as a fallback, not just our callback variable.
    // This recovers a successful response if a callback or push event was missed.
    try {
        const state = await contents.executeJavaScript(`(() => {
            const state = window.__xmojCaptcha;
            if (!window.turnstile?.getResponse || window.__xmojCaptchaWidget === undefined) return state;
            const token = window.turnstile.getResponse(window.__xmojCaptchaWidget);
            if (token && !['error', 'expired'].includes(state?.status)) return { status: 'success', token };
            if (!token && state?.status === 'success') return { status: 'expired', message: '验证已过期，请重新验证' };
            return state;
        })()`) as Omit<CaptchaState, 'id'> | undefined;
        if (inlineCaptcha !== current || current.resetting || !state) return;
        if (!['loading', 'ready', 'success', 'error', 'expired'].includes(state.status)) return;
        if (state.status === 'success' && (typeof state.token !== 'string' || !state.token.trim() || state.token.length > 8192)) return;
        if (JSON.stringify(state) !== JSON.stringify(current.state)) publishCaptchaState(current, state);
    } catch { /* Keep the last known state across a transient renderer failure. */ }
}
async function mountInlineCaptcha(owner: BrowserWindow, request: CaptchaRequest): Promise<void> {
    removeInlineCaptcha();
    const view = new WebContentsView({ webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false, partition: 'xmoj-turnstile', preload: path.join(__dirname, 'preload.mjs'), additionalArguments: ['--xmoj-turnstile'] } });
    const current = { id: request.id, view, owner } as NonNullable<typeof inlineCaptcha>;
    inlineCaptcha = current;
    view.setVisible(false);
    owner.contentView.addChildView(view);
    view.setBackgroundColor('#ffffff');
    positionInlineCaptcha(request.bounds);
    const publish = (state: Omit<CaptchaState, 'id'>) => publishCaptchaState(current, state);
    publish({ status: 'loading' });
    view.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    view.webContents.session.setPermissionCheckHandler(() => false);
    view.webContents.setWindowOpenHandler(({ url }) => {
        if (isExternalWebUrl(url)) void shell.openExternal(url).catch(() => {});
        return { action: 'deny' };
    });
    view.webContents.on('will-navigate', event => event.preventDefault());
    try {
        // Use a lightweight real judge document, without loading homepage images/ads.
        // Start as soon as its real document is parsed, while preserving its origin.
        await new Promise<void>((resolve, reject) => {
            const ready = () => { clearTimeout(current.loadTimeout); resolve(); };
            view.webContents.once('dom-ready', ready);
            current.loadTimeout = setTimeout(() => { view.webContents.removeListener('dom-ready', ready); reject(new Error('验证页面加载超时')); }, 15000);
            void view.webContents.loadURL(`${XMOJ_ORIGIN}/loginpage.php`).catch(reject);
        });
        clearTimeout(current.loadTimeout);
        if (inlineCaptcha !== current) return;
        if (new URL(view.webContents.getURL()).origin !== XMOJ_ORIGIN) throw new Error('验证页面来源不正确');
        view.webContents.stop();
        await view.webContents.executeJavaScript(`(() => {
            window.stop();
            document.title = 'Cloudflare 人机验证';
            document.head.querySelectorAll('style,script,link[rel="stylesheet"]').forEach(node => node.remove());
            const container = document.createElement('div'); container.id = 'xmoj-turnstile';
            document.body.replaceChildren(container);
            document.documentElement.style.cssText = 'margin:0;padding:0;background:white;overflow:hidden';
            document.body.style.cssText = 'margin:0;padding:0;width:320px;height:80px;background:white;overflow:hidden;transform-origin:top left';
            const report = state => { window.__xmojCaptcha = state; window.turnstileBridge.report(state); };
            report({ status: 'loading' });
            window.__xmojCaptchaRetry = null;
            window.__xmojCaptchaReset = () => {
                clearTimeout(window.__xmojCaptchaRetry);
                report({ status: 'ready' });
                window.turnstile.reset(window.__xmojCaptchaWidget);
            };
            const retry = (status, message) => {
                report({ status, message });
                clearTimeout(window.__xmojCaptchaRetry);
                window.__xmojCaptchaRetry = setTimeout(window.__xmojCaptchaReset, 8000);
            };
            const render = () => {
                report({ status: 'ready' });
                window.__xmojCaptchaWidget = window.turnstile.render('#xmoj-turnstile', {
                    sitekey: '0x4AAAAAAALBT58IhyDViNmv', language: 'zh-cn', theme: 'light',
                    retry: 'never', 'refresh-expired': 'manual', 'refresh-timeout': 'manual',
                    callback: token => { clearTimeout(window.__xmojCaptchaRetry); report({ status: 'success', token }); },
                    'expired-callback': () => retry('expired', '验证已过期，正在重新验证'),
                    'timeout-callback': () => retry('error', '验证超时，正在重试'),
                    'error-callback': () => { retry('error', '验证失败，正在重试'); return true; },
                });
            };
            if (window.turnstile) render();
            else {
                const script = document.createElement('script');
                script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                script.onload = render;
                script.onerror = () => report({ status: 'error', message: 'Cloudflare 连接失败，请检查代理或网络后重试' });
                document.head.append(script);
            }
        })()`);
        if (inlineCaptcha !== current) return;
        current.initialized = true;
        positionInlineCaptcha(current.bounds);
        if (!current.state || current.state.status === 'loading') current.scriptTimeout = setTimeout(() => {
            if (current.state?.status === 'loading') publish({ status: 'error', message: '验证码加载超时，请重试' });
        }, 15000);
    } catch (error) {
        clearTimeout(current.loadTimeout);
        const detail = error instanceof Error ? error.message : String(error);
        const connectionClosed = /ERR_CONNECTION_CLOSED|ERR_CONNECTION_RESET|ERR_SSL|handshake/i.test(detail);
        publish({ status: 'error', message: connectionClosed ? '验证连接中断或 TLS 握手失败，请检查代理或网络后重试' : '验证码加载失败或超时，请重试' });
    }
}
let quitRequested = false;
function communityCredentials(): {
    sessionId: string;
    username: string;
} | null {
    const state = session.snapshot();
    if (!state.authenticated || !state.sessionId || !state.user)
        return null;
    return { sessionId: state.sessionId, username: state.user.username };
}
async function withCommunity<T>(action: (api: CommunityApi, credentials: {
    sessionId: string;
    username: string;
}) => Promise<T>): Promise<T> {
    const credentials = communityCredentials();
    if (!credentials)
        throw new Error('请先登录后再使用该功能');
    if (!community)
        initCommunity();
    return action(community as CommunityApi, credentials);
}
function handle<T>(channel: string, fn: (...args: unknown[]) => Promise<T> | T): void {
    ipcMain.handle(channel, async (_event, ...args): Promise<IpcResult<T>> => {
        try {
            const data = await fn(...args);
            return { ok: true, data };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[ipc] ${channel} 失败:`, message);
            return { ok: false, error: message };
        }
    });
}
function asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}
const PROBLEMSET_PAGE_SIZE = 20;
const PROBLEMSET_MAX_PAGES = 40;
const PROBLEMSET_ALL_KEY = 'problemset:v2:all';
let confirmLeaveEnabled = false;
let quitting = false;
function appVersion(): string {
    if (app.isPackaged)
        return app.getVersion();
    try {
        const manifest = JSON.parse(readFileSync(path.join(String(process.env.APP_ROOT), 'package.json'), 'utf8')) as {
            version?: string;
        };
        return manifest.version || app.getVersion();
    }
    catch {
        return app.getVersion();
    }
}
function asPage(value: unknown): number {
    const parsed = Number.parseInt(String(value ?? '1'), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
function buildQuery(params: Record<string, string | number | undefined>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === '')
            continue;
        search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : '';
}
async function communityCacheFirst<T>(key: string, cacheOnly: boolean, load: () => Promise<T>): Promise<CachedValue<T>> {
    if (cacheOnly) {
        const cached = cache.get<T>(`community:${key}`);
        if (cached)
            return cached;
    }
    return cache.set(`community:${key}`, await load());
}
async function fetchServiceNotice(): Promise<string | null> {
    if (!community)
        initCommunity();
    const credentials = communityCredentials() ?? { sessionId: '', username: '' };
    try {
        const response = await (community as CommunityApi).getNotice(credentials);
        return response.Success && typeof response.Data?.Notice === 'string'
            ? response.Data.Notice
            : null;
    }
    catch {
        return null;
    }
}
function registerIpc(): void {
    handle(IPC.contestReplay, payload => {
        const id = Number((payload as { contestId?: number })?.contestId);
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error('无效的比赛编号');
        if (!session.snapshot().authenticated) throw new Error('请先登录后观看回放');
        return fetchContestReplay(session.http, id, (url, options) => net.fetch(String(url), options));
    });
    ipcMain.on(IPC.bbsCaptchaReport, (event, value: unknown) => {
        const current = inlineCaptcha;
        if (!current || event.sender !== current.view.webContents || event.senderFrame?.frameTreeNodeId !== event.sender.mainFrame.frameTreeNodeId) return;
        try { if (new URL(event.senderFrame.url).origin !== XMOJ_ORIGIN) return; } catch { return; }
        if (!value || typeof value !== 'object') return;
        const input = value as Record<string, unknown>;
        if (!['loading', 'ready', 'success', 'error', 'expired'].includes(String(input.status))) return;
        if (input.status === 'success' && (typeof input.token !== 'string' || !input.token.trim() || input.token.length > 8192)) return;
        publishCaptchaState(current, {
            status: input.status as CaptchaState['status'],
            ...(input.status === 'success' ? { token: input.token as string } : {}),
            ...(typeof input.message === 'string' ? { message: input.message.slice(0, 300) } : {}),
        });
    });
    handle<MonthlyBoard>(IPC.monthlyBoard, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const key = 'monthly:board';
        if (input.cacheFirst === true) {
            const cached = cache.get<MonthlyBoard>(key);
            if (cached)
                return cached.value;
        }
        return cache.set(key, await fetchMonthlyBoard(session.http)).value;
    });
    handle<SoftwareEntry[]>(IPC.softwareList, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const key = 'downloads:list';
        if (input.cacheFirst === true) {
            const cached = cache.get<SoftwareEntry[]>(key);
            if (cached)
                return cached.value;
        }
        return cache.set(key, await fetchSoftwareList(session.http)).value;
    });
    handle<void>(IPC.downloadCancel, payload => { cancelDownload(asString((payload as { id?: string })?.id)); });
    handle<ProblemsetPage>(IPC.problemsetAll, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const cacheFirst = input.cacheFirst === true;
        if (cacheFirst) {
            const cached = cache.get<ProblemsetPage>(PROBLEMSET_ALL_KEY);
            if (cached)
                return cached.value;
        }
        const collected: ProblemsetPage['problems'] = [];
        let totalPages = 1;
        let page = 1;
        for (; page <= PROBLEMSET_MAX_PAGES; page++) {
            const url = `${XMOJ_ORIGIN}/problemset.php` + buildQuery({ page });
            const response = await session.http.get(url);
            const parsed = parseProblemsetPage(response.body, page);
            collected.push(...parsed.problems);
            if (page === 1)
                totalPages = parsed.totalPages ?? 1;
            if (page >= totalPages || parsed.problems.length === 0)
                break;
            await new Promise((resolve) => setTimeout(resolve, 120));
        }
        const all: ProblemsetPage = {
            problems: collected,
            page: 1,
            totalPages: Math.max(1, Math.ceil(collected.length / PROBLEMSET_PAGE_SIZE)),
        };
        return cache.set(PROBLEMSET_ALL_KEY, all).value;
    });
    handle<SessionState>(IPC.sessionGet, () => session.snapshot());
    handle<SessionState>(IPC.sessionVerify, () => session.trySilentLogin());
    handle<LoginResult>(IPC.sessionLogin, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        return session.login(asString(input.username), asString(input.password), Boolean(input.remember));
    });
    handle<SessionState>(IPC.sessionLogout, () => session.logout());
    handle<string | null>(IPC.sessionEmail, () => session.accountEmail());
    handle<AvatarInfo | null>(IPC.sessionAvatar, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const username = asString(input.username).trim();
        if (username)
            return session.avatarFor(username);
        return session.avatar(Boolean(input.cacheBust));
    });
    handle<HomeSnapshot>(IPC.homeSnapshot, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const key = 'home:snapshot';
        if (input.cacheOnly) {
            const cached = cache.get<HomeSnapshot>(key);
            if (cached)
                return cached.value;
        }
        const response = await session.http.get(`${XMOJ_ORIGIN}/index.php`);
        const snapshot = parseHomeSnapshot(response.body, response.serverTime);
        snapshot.notice = await fetchServiceNotice();
        return cache.set(key, snapshot).value;
    });
    handle<CachedValue<ProblemsetPage>>(IPC.problemsetList, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const page = asPage(input.page);
        const search = asString(input.search).trim();
        const key = `problemset:v2:${page}:${search}`;
        if (input.cacheFirst) {
            const cached = cache.get<ProblemsetPage>(key);
            if (cached)
                return cached;
        }
        const url = `${XMOJ_ORIGIN}/problemset.php` +
            buildQuery({ page, search: search || undefined });
        const response = await session.http.get(url);
        return cache.set(key, parseProblemsetPage(response.body, page));
    });
    handle<StatusPage>(IPC.statusList, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const problemId = Number.parseInt(String(input.problemId ?? ''), 10);
        const top = Number.parseInt(String(input.top ?? ''), 10);
        const prevTop = Number.parseInt(String(input.prevTop ?? ''), 10);
        const url = `${XMOJ_ORIGIN}/status.php` +
            buildQuery({
                user_id: asString(input.user).trim() || undefined,
                problem_id: Number.isFinite(problemId) ? problemId : undefined,
                jresult: asString(input.result).trim() || undefined,
                language: asString(input.language).trim() || undefined,
                top: Number.isFinite(top) ? top : undefined,
                prevtop: Number.isFinite(prevTop) ? prevTop : undefined,
            });
        const response = await session.http.get(url);
        return parseStatusPage(response.body);
    });
    handle<CachedValue<ProblemDetail>>(IPC.problemDetail, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const problemId = Number.parseInt(String(input.problemId ?? ''), 10);
        if (!Number.isFinite(problemId))
            throw new Error('缺少题目编号');
        const key = `problem:${problemId}`;
        if (input.cacheOnly) {
            const cached = cache.get<ProblemDetail>(key);
            if (cached)
                return cached;
        }
        const problem = await session.http.get(`${XMOJ_ORIGIN}/problem.php?id=${problemId}`);
        const detail = parseProblemDetail(problem.body, problemId);
        try {
            const submitPage = await session.http.get(`${XMOJ_ORIGIN}/submitpage.php?id=${problemId}`);
            detail.languages = parseLanguages(submitPage.body);
        }
        catch {
            detail.languages = [];
        }
        return cache.set(key, detail);
    });
    handle<SubmitResult>(IPC.submitCode, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const problemId = Number.parseInt(String(input.problemId ?? ''), 10);
        const contestId = Number.parseInt(String(input.contestId ?? ''), 10);
        const contestPid = Number.parseInt(String(input.contestPid ?? ''), 10);
        const form = buildSubmitForm({
            problemId: Number.isFinite(problemId) ? problemId : undefined,
            contestId: Number.isFinite(contestId) ? contestId : undefined,
            contestPid: Number.isFinite(contestPid) ? contestPid : undefined,
            languageId: Number.parseInt(String(input.languageId ?? '1'), 10) || 1,
            source: asString(input.source),
            enableO2: Boolean(input.enableO2),
        });
        const response = await session.http.post(`${XMOJ_ORIGIN}/submit.php`, form);
        const solutionId = parseSubmitResponse(response.body);
        const ok = solutionId !== null || response.status === 200;
        return {
            ok,
            solutionId,
            message: ok ? '' : response.body.replace(/\s+/g, ' ').slice(0, 300),
        };
    });
    handle<NavInfo>(IPC.navInfo, async () => {
        const cached = cache.get<NavInfo>('nav');
        if (cached)
            return cached.value;
        const result = await fetchNavInfo(session.http);
        if (!result.ok || !result.data)
            throw new Error(result.error || '无法读取账号信息');
        cache.set('nav', result.data);
        return result.data;
    });
    handle<UserInfo>(IPC.userInfo, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const username = asString(input.username).trim();
        if (!username)
            throw new Error('缺少用户名');
        const viewer = communityCredentials();
        const key = `user:v2:${viewer?.username ?? 'anonymous'}:${username}`;
        const cached = cache.get<UserInfo>(key, 60000);
        if (cached)
            return cached.value;
        let nick: string | null = null;
        let isAdmin = false;
        try {
            const nav = await fetchNavInfo(session.http);
            if (nav.ok && nav.data && nav.data.userId === username) {
                nick = nav.data.nick;
                isAdmin = nav.data.isAdmin || nav.data.isTeacher;
            }
        }
        catch {
        }
        let badge: UserTag | null = null;
        let badgeResolved = !viewer;
        try {
            const credentials = viewer;
            if (credentials && community) {
                const response = await community.getBadge(credentials, username);
                if (response.Success) {
                    badgeResolved = true;
                    badge = {
                        content: String(response.Data.Content ?? ''),
                        backgroundColor: String(response.Data.BackgroundColor ?? ''),
                        color: String(response.Data.Color ?? ''),
                    };
                }
            }
        }
        catch {
        }
        let rating = 0;
        try {
            const profileKey = `profile:${username}`;
            const profile = cache.get<UserProfile>(profileKey)?.value ?? await fetchUserProfile(session.http, username);
            cache.set(profileKey, profile);
            rating = profile.rating ?? 0;
            nick ||= profile.nick;
        } catch {}
        const info: UserInfo = { username, nick, isAdmin, badge, rating };
        if (badgeResolved) cache.set(key, info);
        return info;
    });
    handle<UserProfile>(IPC.userProfile, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const username = asString(input.username).trim();
        if (!username)
            throw new Error('缺少用户名');
        const key = `profile:${username}`;
        if (input.cacheOnly) {
            const cached = cache.get<UserProfile>(key);
            if (cached)
                return cached.value;
        }
        const profile = await fetchUserProfile(session.http, username);
        return cache.set(key, profile).value;
    });
    handle<{
        settings: Record<string, unknown>;
    }>(IPC.settingsCloud, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const action = asString(input.action);
        if (action === 'push') {
            const settings = input.settings && typeof input.settings === 'object'
                ? (input.settings as Record<string, unknown>)
                : {};
            const response = await withCommunity((api, c) => api.setUserSettings(c, settings));
            if (!response.Success)
                throw new Error(response.Message || '上传设置失败');
            return { settings };
        }
        const response = await withCommunity((api, c) => api.getUserSettings(c));
        if (!response.Success)
            throw new Error(response.Message || '读取设置失败');
        return { settings: response.Data.Settings };
    });
    handle<{
        version: string;
    }>(IPC.appVersion, () => ({ version: appVersion() }));
    handle<JsonFetchResult>(IPC.appFetchJson, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const url = asString(input.url);
        if (!/^https:\/\//i.test(url)) {
            return { ok: false, status: 0, data: null, error: '只允许请求 https 地址' };
        }
        try {
            const response = await fetch(url, {
                headers: { Accept: 'application/json', 'User-Agent': `XMOJ-Electron/${appVersion()}` },
                redirect: 'follow',
            });
            const text = await response.text();
            if (!response.ok) {
                return { ok: false, status: response.status, data: null, error: `HTTP ${response.status}` };
            }
            try {
                return { ok: true, status: response.status, data: JSON.parse(text) };
            }
            catch {
                return { ok: false, status: response.status, data: null, error: '返回的不是合法 JSON' };
            }
        }
        catch (error) {
            return {
                ok: false,
                status: 0,
                data: null,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    });
    handle<{
        enabled: boolean;
    }>(IPC.appQuitConfirm, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        confirmLeaveEnabled = input.enabled === true;
        return { enabled: confirmLeaveEnabled };
    });
    handle<{
        buttonId: string | null;
    }>(IPC.appDialog, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const buttons = Array.isArray(input.buttons)
            ? (input.buttons as DialogButton[]).filter((button) => button && button.label)
            : [];
        const labels = buttons.length > 0 ? buttons.map((button) => button.label) : ['好'];
        const result = await dialog.showMessageBox({
            type: 'info',
            title: asString(input.title) || 'XMOJ',
            message: asString(input.message),
            detail: asString(input.detail) || undefined,
            buttons: labels,
            defaultId: Math.max(0, buttons.findIndex((button) => button.id === asString(input.defaultId))),
            cancelId: Math.max(0, buttons.findIndex((button) => button.id === asString(input.cancelId))),
            noLink: true,
        });
        return { buttonId: buttons[result.response]?.id ?? null };
    });
    handle<{
        exists: boolean;
    }>(IPC.userExists, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const username = asString(input.username).trim();
        if (!username)
            return { exists: false };
        return { exists: await userExists(session.http, username) };
    });
    handle<CachedValue<ContestListPage>>(IPC.contestList, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const page = asPage(input.page);
        const key = `contest:list:${page}`;
        if (input.cacheOnly) {
            const cached = cache.get<ContestListPage>(key);
            if (cached)
                return cached;
        }
        const result = await fetchContestList(session.http, page);
        if (!result.ok || !result.data)
            throw new Error(result.error || '无法读取比赛列表');
        return cache.set(key, result.data);
    });
    handle<CachedValue<ContestDetail>>(IPC.contestDetail, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const contestId = Number.parseInt(String(input.contestId ?? ''), 10);
        if (!Number.isFinite(contestId))
            throw new Error('缺少比赛编号');
        const key = `contest:detail:${contestId}`;
        if (input.cacheOnly) {
            const cached = cache.get<ContestDetail>(key);
            if (cached)
                return cached;
        }
        const result = await fetchContestDetail(session.http, contestId);
        if (!result.ok || !result.data)
            throw new Error(result.error || '无法读取比赛信息');
        return cache.set(key, result.data);
    });
    handle<{
        cleared: number;
    }>(IPC.cacheClear, () => {
        const cleared = cache.keys().length;
        cache.clear();
        return { cleared };
    });
    handle<ContestRank>(IPC.contestRank, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const contestId = Number.parseInt(String(input.contestId ?? ''), 10);
        if (!Number.isFinite(contestId))
            throw new Error('缺少比赛编号');
        return fetchContestRank(session.http, contestId, input.oi === true);
    });
    handle<ContestProblem[]>(IPC.contestProblems, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const contestId = Number.parseInt(String(input.contestId ?? ''), 10);
        if (!Number.isFinite(contestId))
            throw new Error('缺少比赛编号');
        const key = `contest:problems:${contestId}`;
        if (input.cacheOnly) {
            const cached = cache.get<ContestProblem[]>(key);
            if (cached)
                return cached.value;
        }
        const detail = await fetchContestDetail(session.http, contestId);
        if (detail.ok && detail.data && detail.data.problems.length) {
            const problems: ContestProblem[] = detail.data.problems.map((problem, index) => ({
                index,
                label: problem.num,
                title: problem.title,
                url: `${XMOJ_ORIGIN}/problem.php?cid=${contestId}&pid=${index}`,
                problemId: problem.problemId,
                status: problem.status ?? null,
            }));
            return cache.set(key, problems).value;
        }
        const response = await session.http.get(`${XMOJ_ORIGIN}/contest.php?cid=${contestId}`);
        return cache.set(key, parseContestProblems(response.body)).value;
    });
    handle<void>(IPC.appQuitResponse, (payload) => {
        if (!quitRequested) return;
        quitRequested = false;
        if ((payload as Record<string, unknown>)?.confirmed === true) {
            quitting = true;
            app.quit();
        }
    });
    handle<void>(IPC.appOpenLink, async (payload) => {
        await openLink(asString((payload as Record<string, unknown>)?.url));
    });
    handle<import('../src/shared/types.ts').JudgeDetails>(IPC.sourceDetails, async (payload) => {
        const solutionId = Number((payload as Record<string, unknown>)?.solutionId);
        if (!Number.isSafeInteger(solutionId) || solutionId <= 0) throw new Error('缺少提交编号');
        return fetchJudgeDetails(session.http, solutionId);
    });
    handle<string | null>(IPC.sourceGet, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const solutionId = Number.parseInt(String(input.solutionId ?? ''), 10);
        if (!Number.isFinite(solutionId))
            throw new Error('缺少提交编号');
        return fetchSource(session.http, solutionId);
    });
    handle<DiffLine[]>(IPC.sourceCompare, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const leftId = Number.parseInt(String(input.leftSolutionId ?? ''), 10);
        const rightId = Number.parseInt(String(input.rightSolutionId ?? ''), 10);
        if (!Number.isFinite(leftId) || !Number.isFinite(rightId)) {
            throw new Error('需要两个提交编号才能比较');
        }
        const [left, right] = await Promise.all([
            fetchSource(session.http, leftId),
            fetchSource(session.http, rightId),
        ]);
        if (left === null)
            throw new Error(`无法读取提交 #${leftId} 的代码`);
        if (right === null)
            throw new Error(`无法读取提交 #${rightId} 的代码`);
        return diffLines(left, right);
    });
    handle<ExportResult>(IPC.exportAcCode, async (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const ids = Array.isArray(input.problemIds)
            ? (input.problemIds as unknown[])
                .map((value) => Number.parseInt(String(value), 10))
                .filter((value) => Number.isFinite(value))
            : [];
        if (ids.length === 0)
            throw new Error('没有可导出的题目');
        const state = session.snapshot();
        const user = state.user?.username ?? '';
        if (!state.authenticated || !user) throw new Error('请先登录后再导出 AC 代码');
        const target = await dialog.showSaveDialog({
            title: '导出 AC 代码',
            defaultPath: `xmoj-ac-code-${Date.now()}.zip`,
            filters: [{ name: 'Zip 压缩包', extensions: ['zip'] }],
        });
        if (target.canceled || !target.filePath) {
            return { written: 0, skipped: [], path: null, bytes: 0, cancelled: true };
        }
        const languages = Array.isArray(input.languages)
            ? (input.languages as unknown[]).map((value) => String(value))
            : undefined;
        return exportAcCode(session.http, ids, target.filePath, {
            user,
            languages,
            onProgress: (done, total, entry) => {
                win?.webContents.send(IPC.exportProgress, {
                    done,
                    total,
                    problemId: entry.problemId,
                });
            },
        });
    });
    handle(IPC.bbsStd, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        return withCommunity((api, c) => api.getStd(c, Number.parseInt(String(input.problemId ?? ''), 10)));
    });
    for (const [channel, action] of [[IPC.bbsDeletePost, 'deletePost'], [IPC.bbsDeleteReply, 'deleteReply'], [IPC.bbsEditReply, 'editReply']] as const) {
        handle(channel, async payload => {
            const input = (payload ?? {}) as Record<string, unknown>;
            const id = Number(action === 'deletePost' ? input.postId : input.replyId);
            if (!Number.isSafeInteger(id) || id <= 0) throw new Error('无效的讨论编号');
            const result = await withCommunity((api, c) => action === 'editReply' ? api.editReply(c, id, asString(input.content)) : api[action](c, id));
            if (result.Success) for (const key of cache.keys()) if (key.startsWith('community:bbs:post:') || key.startsWith('community:bbs:posts:')) cache.clear(key);
            return result;
        });
    }
    handle<CaptchaState | null>(IPC.bbsCaptchaSnapshot, async payload => {
        const current = inlineCaptcha;
        if (!current || current.id !== asString((payload as { id?: string })?.id)) return null;
        await reconcileCaptchaState(current);
        if (inlineCaptcha !== current) return null;
        return { id: current.id, ...(current.state ?? { status: 'loading' }) };
    });
    handle<void>(IPC.bbsCaptcha, async payload => {
        const request = payload as CaptchaRequest;
        if (!request || typeof request.id !== 'string' || request.id.length > 128) throw new Error('无效的验证码请求');
        if (request.action === 'unmount') { if (inlineCaptcha?.id === request.id) removeInlineCaptcha(); return; }
        if (!win || !session.snapshot().authenticated) throw new Error('请先登录后进行人机验证');
        if (request.action === 'mount') { await mountInlineCaptcha(win, request); return; }
        if (inlineCaptcha?.id !== request.id) return;
        if (request.action === 'bounds') positionInlineCaptcha(request.bounds);
        if (request.action === 'reset') {
            const current = inlineCaptcha;
            const contents = current.view.webContents;
            if (!contents || contents.isDestroyed()) return;
            current.resetting = true;
            publishCaptchaState(current, { status: 'ready' });
            try {
                const ready = await contents.executeJavaScript('typeof window.__xmojCaptchaReset === "function" && window.__xmojCaptchaWidget !== undefined');
                if (inlineCaptcha !== current || contents.isDestroyed()) return;
                if (ready) await contents.executeJavaScript('window.__xmojCaptchaReset()');
                else await mountInlineCaptcha(win, request);
            } finally { current.resetting = false; }
        }
    });
    handle(IPC.bbsBoards, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        return communityCacheFirst('bbs:boards', input.cacheOnly === true, () => withCommunity((api, c) => api.getBoards(c)));
    });
    handle(IPC.bbsPosts, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const boardId = Number.parseInt(String(input.boardId ?? '-1'), 10);
        const page = asPage(input.page);
        const problemId = Number.parseInt(String(input.problemId ?? '0'), 10) || 0;
        const key = `bbs:posts:${boardId}:${page}:${problemId}`;
        return communityCacheFirst(key, input.cacheOnly === true, () => withCommunity((api, c) => api.getPosts(c, boardId, page, problemId)));
    });
    handle(IPC.bbsPost, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const postId = Number.parseInt(String(input.postId ?? ''), 10);
        const page = asPage(input.page);
        return communityCacheFirst(`bbs:post:${postId}:${page}`, input.cacheOnly === true, () => withCommunity(async (api, c) => {
            const result = await api.getPost(c, postId, page);
            if (!result.Success) return result;
            const firstPage = page === 1 ? result : await api.getPost(c, postId, 1);
            return { ...result, Data: attachOpeningComment(result.Data, firstPage.Success ? firstPage.Data : result.Data) };
        }));
    });
    handle(IPC.bbsNewPost, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        if (!asString(input.captchaSecretKey).trim()) throw new Error('请先完成 Cloudflare 人机验证');
        return withCommunity((api, c) => api.newPost(c, Number.parseInt(String(input.boardId ?? ''), 10), asString(input.title), asString(input.content), Number.parseInt(String(input.problemId ?? '0'), 10) || 0, asString(input.captchaSecretKey)));
    });
    handle(IPC.bbsNewReply, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        if (!asString(input.captchaSecretKey).trim()) throw new Error('请先完成 Cloudflare 人机验证');
        return withCommunity((api, c) => api.newReply(c, Number.parseInt(String(input.postId ?? ''), 10), asString(input.content), asString(input.captchaSecretKey)));
    });
    handle(IPC.mailList, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        return communityCacheFirst('mail:list', input.cacheOnly === true, () => withCommunity((api, c) => api.getMailList(c)));
    });
    handle(IPC.mailGet, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const otherUser = asString(input.otherUser);
        return communityCacheFirst(`mail:thread:${otherUser}`, input.cacheOnly === true, () => withCommunity((api, c) => api.getMail(c, otherUser)));
    });
    handle(IPC.mailSend, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        return withCommunity((api, c) => api.sendMail(c, asString(input.toUser), asString(input.content)));
    });
    handle(IPC.mailReadMention, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const mentionId = Number(input.mentionId);
        if (!Number.isSafeInteger(mentionId) || mentionId <= 0) throw new Error('无效的私信通知编号');
        return withCommunity((api, c) => api.readMailMention(c, mentionId));
    });
    handle(IPC.bbsReadMention, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        const mentionId = Number(input.mentionId);
        if (!Number.isSafeInteger(mentionId) || mentionId <= 0) throw new Error('无效的讨论通知编号');
        return withCommunity((api, c) => api.readBbsMention(c, mentionId));
    });
    const pollNotices = createNoticePoller((channel, credentials) => withCommunity(async (api, c) => {
        if (credentials.sessionId !== c.sessionId || credentials.username !== c.username) return [];
        const notices: CommunityNotification[] = [];
        if (channel === 'bbs') {
            const bbs = await api.getBbsMentionList(credentials);
            if (!bbs.Success) throw new Error(bbs.Message || '讨论通知暂不可用');
            for (const mention of bbs.Data?.MentionList ?? []) {
                notices.push({
                    kind: 'bbs',
                    title: `${mention.PostTitle ?? '讨论区'} 有新的回复`,
                    body: '',
                    postId: mention.PostID,
                    pageNumber: mention.PageNumber,
                    mentionId: Number(mention.MentionID),
                });
            }
        } else {
            const mail = await api.getMailMentionList(credentials);
            if (!mail.Success) throw new Error(mail.Message || '私信通知暂不可用');
            for (const mention of mail.Data?.MentionList ?? []) {
                notices.push({
                    kind: 'mail',
                    title: `${mention.FromUserID ?? '有人'} 给你发了私信`,
                    body: '',
                    mailUser: mention.FromUserID,
                    mentionId: Number(mention.MentionID),
                });
            }
        }
        return notices;
    }), { onFailure: (channel, error, retryMs) => console.warn(`[notices] ${channel} 暂不可用，${retryMs / 1000} 秒后重试：${error instanceof Error ? error.message : String(error)}`) });
    handle<CommunityNotification[]>(IPC.noticesPoll, () => {
        const credentials = communityCredentials();
        return credentials ? pollNotices(credentials) : [];
    });
}
function isDownloadLink(value: string): boolean {
    try {
        const url = new URL(value);
        return isJudgeUrl(url) && /^\/(upload\/file|downloads)\//.test(url.pathname);
    } catch { return false; }
}
const downloadTargets = new Map<string, string[]>();
async function openLink(value: string): Promise<void> {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('不支持的链接');
    if (isDownloadLink(url.href)) {
        if (!win) return;
        const owner = win;
        const target = await dialog.showSaveDialog(owner, {
            title: '保存下载文件', defaultPath: path.basename(decodeURIComponent(url.pathname)) || 'download',
        });
        if (target.canceled || !target.filePath || owner.isDestroyed()) return;
        for (const cookie of session.http.jar.toJSON()) {
            if (cookie.domain !== url.hostname && !url.hostname.endsWith(`.${cookie.domain}`)) continue;
            await win.webContents.session.cookies.set({
                url: `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`,
                name: cookie.name, value: cookie.value, domain: cookie.domain,
                path: cookie.path, secure: cookie.secure, httpOnly: cookie.httpOnly,
                ...(cookie.expires ? { expirationDate: cookie.expires } : {}),
            });
        }
        const targets = downloadTargets.get(url.href) ?? [];
        targets.push(target.filePath);
        downloadTargets.set(url.href, targets);
        owner.webContents.downloadURL(url.href);
    } else await shell.openExternal(url.href);
}
function createWindow(): void {
    Menu.setApplicationMenu(null);
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, 'logo.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        minWidth: 900,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
    });
    win.once('ready-to-show', () => win?.show());
    win.once('closed', removeInlineCaptcha);
    win.webContents.on('render-process-gone', removeInlineCaptcha);
    win.webContents.on('did-start-navigation', (_event, _url, _inPlace, mainFrame) => { if (mainFrame) removeInlineCaptcha(); });
    const downloadSession = win.webContents.session;
    const downloadWindow = win;
    const onDownload = (event: ElectronEvent, item: DownloadItem, contents: WebContents) => {
        if (contents && contents.id !== downloadWindow.webContents.id) return;
        const source = item.getURLChain()[0] ?? item.getURL();
        const targets = downloadTargets.get(source);
        const savePath = targets?.shift();
        if (!targets?.length) downloadTargets.delete(source);
        if (savePath) item.setSavePath(savePath);
        setImmediate(() => {
            if (event.defaultPrevented || downloadWindow.isDestroyed()) return;
            trackDownload(item, progress => {
                if (!downloadWindow.isDestroyed()) downloadWindow.webContents.send(IPC.downloadProgress, progress);
            });
        });
    };
    downloadSession.on('will-download', onDownload);
    win.once('closed', () => downloadSession.removeListener('will-download', onDownload));
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (isJudgeUrl(url) || isExternalWebUrl(url)) {
            void openLink(url).catch(error => console.warn('[link]', error));
            return { action: 'deny' };
        }
        return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (event, url) => {
        const isDevApp = VITE_DEV_SERVER_URL && new URL(url).origin === new URL(VITE_DEV_SERVER_URL).origin;
        if (isDownloadLink(url) || (isExternalWebUrl(url) && !isDevApp)) {
            event.preventDefault();
            void openLink(url).catch(error => console.warn('[link]', error));
        } else if (isJudgeUrl(url)) {
            event.preventDefault();
            void openLink(url).catch(error => console.warn('[link]', error));
        }
    });
    win.on('close', (event) => {
        if (!confirmLeaveEnabled || quitting)
            return;
        event.preventDefault();
        void confirmQuit();
    });
    if (VITE_DEV_SERVER_URL) {
        void win.loadURL(VITE_DEV_SERVER_URL);
    }
    else {
        void win.loadFile(path.join(RENDERER_DIST, 'index.html'));
    }
}
async function confirmQuit(): Promise<void> {
    if (!win) {
        quitting = true;
        app.quit();
        return;
    }
    if (!win.webContents.isLoading() && !win.webContents.isCrashed()) {
        if (!quitRequested) {
            quitRequested = true;
            win.webContents.send(IPC.appQuitRequested);
        }
        return;
    }
    const result = await dialog.showMessageBox(win, {
        type: 'question',
        title: '离开前确认',
        message: '确定要关闭 XMOJ Electron 吗？',
        buttons: ['取消', '关闭'],
        defaultId: 1,
        cancelId: 0,
        noLink: true,
    });
    if (result.response === 1) {
        quitting = true;
        app.quit();
    }
}
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        win = null;
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
app.whenReady().then(async () => {
    await session.load();
    initCommunity();
    registerIpc();
    createWindow();
});
