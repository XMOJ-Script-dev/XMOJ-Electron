import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { IPC, XMOJ_ORIGIN, type AvatarInfo, type CommunityNotification, type ContestDetail, type ContestListPage, type ContestProblem, type ContestRank, type CachedValue, type DialogButton, type DiffLine, type ExportResult, type IpcResult, type JsonFetchResult, type MonthlyBoard, type NavInfo, type SoftwareEntry, type UserInfo, type UserProfile, type UserTag, type ProblemsetPage, type ProblemDetail, type SessionState, type StatusPage, type SubmitResult, type LoginResult, type HomeSnapshot, } from '../src/shared/types.ts';
import { SessionManager } from './session.ts';
import { CommunityApi, createFileTokenStore } from './community.ts';
import { PageCache } from './cache.ts';
import { fetchContestDetail, fetchContestList, fetchNavInfo, userExists, } from './judge-api.ts';
import { buildSubmitForm, parseContestProblems, parseLanguages, parseProblemDetail, parseSubmitResponse, } from './problems.ts';
import { diffLines } from '../src/lib/diff.ts';
import { exportAcCode, fetchSource } from './sources.ts';
import { fetchContestRank } from './rank.ts';
import { fetchUserProfile } from './profile.ts';
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
    community = new CommunityApi(session.http, createFileTokenStore(tokenFile));
}
let win: BrowserWindow | null = null;
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
const PROBLEMSET_ALL_KEY = 'problemset:all';
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
            const url = `${XMOJ_ORIGIN}/problemset.php` + buildQuery({ page: page > 1 ? page : undefined });
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
        const key = `problemset:${page}:${search}`;
        if (input.cacheFirst) {
            const cached = cache.get<ProblemsetPage>(key);
            if (cached)
                return cached;
        }
        const url = `${XMOJ_ORIGIN}/problemset.php` +
            buildQuery({ page: page > 1 ? page : undefined, search: search || undefined });
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
        const key = `user:${username}`;
        const cached = cache.get<UserInfo>(key);
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
        try {
            const credentials = communityCredentials();
            if (credentials && community) {
                const response = await community.getBadge(credentials, username);
                if (response.Success) {
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
        const info: UserInfo = { username, nick, isAdmin, badge };
        cache.set(key, info);
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
        const target = await dialog.showSaveDialog({
            title: '导出 AC 代码',
            defaultPath: `xmoj-ac-code-${Date.now()}.zip`,
            filters: [{ name: 'Zip 压缩包', extensions: ['zip'] }],
        });
        if (target.canceled || !target.filePath) {
            throw new Error('已取消导出');
        }
        const languages = Array.isArray(input.languages)
            ? (input.languages as unknown[]).map((value) => String(value))
            : undefined;
        return exportAcCode(session.http, ids, target.filePath, {
            user,
            languages,
            onProgress: (done, total, entry) => {
                win?.webContents.send(IPC.exportAcCode + ':progress', {
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
        return communityCacheFirst(`bbs:post:${postId}:${page}`, input.cacheOnly === true, () => withCommunity((api, c) => api.getPost(c, postId, page)));
    });
    handle(IPC.bbsNewPost, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
        return withCommunity((api, c) => api.newPost(c, Number.parseInt(String(input.boardId ?? ''), 10), asString(input.title), asString(input.content), Number.parseInt(String(input.problemId ?? '0'), 10) || 0, asString(input.captchaSecretKey)));
    });
    handle(IPC.bbsNewReply, (payload) => {
        const input = (payload ?? {}) as Record<string, unknown>;
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
    handle<CommunityNotification[]>(IPC.noticesPoll, () => withCommunity(async (api, c) => {
        const notices: CommunityNotification[] = [];
        const bbs = await api.getBbsMentionList(c);
        if (bbs.Success) {
            for (const mention of bbs.Data.MentionList ?? []) {
                notices.push({
                    kind: 'bbs',
                    title: `${mention.PostTitle ?? '讨论区'} 有新的回复`,
                    body: '',
                    postId: mention.PostID,
                    pageNumber: mention.PageNumber,
                    mentionId: Number(mention.MentionID),
                });
            }
        }
        const mail = await api.getMailMentionList(c);
        if (mail.Success) {
            for (const mention of mail.Data.MentionList ?? []) {
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
    }));
}
function createWindow(): void {
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
    });
    win.once('ready-to-show', () => win?.show());
    win.webContents.setWindowOpenHandler(({ url }) => {
        win?.webContents.send('xmoj:popup-blocked', url);
        return { action: 'deny' };
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
    const result = await dialog.showMessageBox(win, {
        type: 'question',
        title: '离开前确认',
        message: '确定要关闭 XMOJ Electron 吗？',
        detail: '可以在「偏好设置」里关闭这个提示。',
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
