import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type AvatarInfo, type CachedValue, type CommunityNotification, type ContestDetail, type ContestListPage, type ContestProblem, type ContestRank, type DialogRequest, type DiffLine, type ExportResult, type HomeSnapshot, type IpcResult, type JsonFetchResult, type LoginRequest, type LoginResult, type MonthlyBoard, type NavInfo, type ProblemsetPage, type ProblemsetQuery, type ProblemDetail, type SessionState, type SoftwareEntry, type StatusPage, type StatusQuery, type SubmitRequest, type SubmitResult, type UserInfo, type UserProfile, } from '../src/shared/types.ts';
async function invoke<T>(channel: string, payload?: unknown): Promise<T> {
    const result = (await ipcRenderer.invoke(channel, payload)) as IpcResult<T>;
    if (!result || typeof result !== 'object') {
        throw new Error(`IPC ${channel} 返回了无效结果`);
    }
    if (!result.ok)
        throw new Error(result.error);
    return result.data;
}
const api = {
    session: {
        get: () => invoke<SessionState>(IPC.sessionGet),
        verify: () => invoke<SessionState>(IPC.sessionVerify),
        login: (request: LoginRequest) => invoke<LoginResult>(IPC.sessionLogin, request),
        logout: () => invoke<SessionState>(IPC.sessionLogout),
        email: () => invoke<string | null>(IPC.sessionEmail),
        avatar: (payload: {
            cacheBust?: boolean;
            username?: string;
        } = {}) => invoke<AvatarInfo | null>(IPC.sessionAvatar, payload),
    },
    home: {
        snapshot: (cacheOnly = false) => invoke<HomeSnapshot>(IPC.homeSnapshot, { cacheOnly }),
    }, problemset: {
        list: (query: ProblemsetQuery = {}, cacheFirst = false) => invoke<CachedValue<ProblemsetPage>>(IPC.problemsetList, {
            ...query,
            cacheFirst,
        }),
        all: (cacheFirst = false) => invoke<ProblemsetPage>(IPC.problemsetAll, { cacheFirst }),
    },
    problem: {
        detail: (problemId: number, cacheOnly = false) => invoke<CachedValue<ProblemDetail>>(IPC.problemDetail, { problemId, cacheOnly }),
    },
    contest: {
        replay: (contestId: number) => invoke<import('../src/shared/types.ts').ContestReplay>(IPC.contestReplay, { contestId }),
        problems: (contestId: number, cacheOnly = false) => invoke<ContestProblem[]>(IPC.contestProblems, { contestId, cacheOnly }),
        list: (page = 1, cacheOnly = false) => invoke<CachedValue<ContestListPage>>(IPC.contestList, { page, cacheOnly }),
        detail: (contestId: number, cacheOnly = false) => invoke<CachedValue<ContestDetail>>(IPC.contestDetail, { contestId, cacheOnly }),
        rank: (contestId: number, oi: boolean) => invoke<ContestRank>(IPC.contestRank, { contestId, oi }),
    },
    nav: {
        info: () => invoke<NavInfo>(IPC.navInfo),
    },
    user: {
        info: (username: string) => invoke<UserInfo>(IPC.userInfo, { username }),
        exists: (username: string) => invoke<{
            exists: boolean;
        }>(IPC.userExists, { username }).then((r) => r.exists),
        profile: (username: string, cacheOnly = false) => invoke<UserProfile>(IPC.userProfile, { username, cacheOnly }),
    },
    settings: {
        pull: () => invoke<{
            settings: Record<string, unknown>;
        }>(IPC.settingsCloud, {
            action: 'pull',
        }).then((r) => r.settings),
        push: (settings: Record<string, unknown>) => invoke<{
            settings: Record<string, unknown>;
        }>(IPC.settingsCloud, {
            action: 'push',
            settings,
        }).then((r) => r.settings),
    },
    app: {
        respondQuit: (confirmed: boolean) => invoke<void>(IPC.appQuitResponse, { confirmed }),
        openLink: (url: string) => invoke<void>(IPC.appOpenLink, { url }),
        version: () => invoke<{
            version: string;
        }>(IPC.appVersion).then((r) => r.version),
        fetchJson: (url: string) => invoke<JsonFetchResult>(IPC.appFetchJson, { url }),
        dialog: (request: DialogRequest) => invoke<{
            buttonId: string | null;
        }>(IPC.appDialog, request),
        setConfirmLeave: (enabled: boolean) => invoke<{
            enabled: boolean;
        }>(IPC.appQuitConfirm, { enabled }).then((r) => r.enabled),
    },
    monthly: {
        board: (cacheFirst = false) => invoke<MonthlyBoard>(IPC.monthlyBoard, { cacheFirst }),
    },
    downloads: {
        cancel: (id: string) => invoke<void>(IPC.downloadCancel, { id }),
        list: (cacheFirst = false) => invoke<SoftwareEntry[]>(IPC.softwareList, { cacheFirst }),
    },
    cache: {
        clear: () => invoke<{
            cleared: number;
        }>(IPC.cacheClear),
    },
    events: {
        onExportProgress: (handler: (progress: { done: number; total: number; problemId: number }) => void) => {
            const listener = (_event: unknown, progress: { done: number; total: number; problemId: number }) => handler(progress);
            ipcRenderer.on(IPC.exportProgress, listener);
            return () => ipcRenderer.removeListener(IPC.exportProgress, listener);
        },
        onDownloadProgress: (handler: (progress: import('../src/shared/types.ts').DownloadProgress) => void) => {
            const listener = (_event: unknown, progress: import('../src/shared/types.ts').DownloadProgress) => handler(progress);
            ipcRenderer.on(IPC.downloadProgress, listener);
            return () => ipcRenderer.removeListener(IPC.downloadProgress, listener);
        },
        onQuitRequested: (handler: () => void) => {
            const listener = () => handler();
            ipcRenderer.on(IPC.appQuitRequested, listener);
            return () => ipcRenderer.removeListener(IPC.appQuitRequested, listener);
        },
        onPopupBlocked: (handler: (url: string) => void) => {
            const listener = (_event: unknown, url: string) => handler(url);
            ipcRenderer.on(IPC.popupBlocked, listener);
            return () => ipcRenderer.removeListener(IPC.popupBlocked, listener);
        },
    },
    source: {
        details: (solutionId: number) => invoke<import('../src/shared/types.ts').JudgeDetails>(IPC.sourceDetails, { solutionId }),
        get: (solutionId: number) => invoke<string | null>(IPC.sourceGet, { solutionId }),
        compare: (leftSolutionId: number, rightSolutionId: number) => invoke<DiffLine[]>(IPC.sourceCompare, { leftSolutionId, rightSolutionId }),
        exportAcCode: (payload: {
            problemIds: number[];
            languages?: string[];
        }) => invoke<ExportResult>(IPC.exportAcCode, payload),
    },
    submit: {
        code: (request: SubmitRequest) => invoke<SubmitResult>(IPC.submitCode, request),
    },
    status: {
        list: (query: StatusQuery = {}) => invoke<StatusPage>(IPC.statusList, query),
    },
    bbs: {
        deletePost: (postId: number) => invoke(IPC.bbsDeletePost, { postId }),
        deleteReply: (replyId: number) => invoke(IPC.bbsDeleteReply, { replyId }),
        editReply: (replyId: number, content: string) => invoke(IPC.bbsEditReply, { replyId, content }),
        captcha: (request: import('../src/shared/types.ts').CaptchaRequest) => invoke<void>(IPC.bbsCaptcha, request),
        captchaState: (id: string) => invoke<import('../src/shared/types.ts').CaptchaState | null>(IPC.bbsCaptchaSnapshot, { id }),
        onCaptchaState: (handler: (state: import('../src/shared/types.ts').CaptchaState) => void) => {
            const listener = (_event: unknown, state: import('../src/shared/types.ts').CaptchaState) => handler(state);
            ipcRenderer.on(IPC.bbsCaptchaState, listener);
            return () => ipcRenderer.removeListener(IPC.bbsCaptchaState, listener);
        },
        boards: (cacheOnly = false) => invoke<CachedValue<unknown>>(IPC.bbsBoards, { cacheOnly }).then((r) => r.value),
        posts: (query: {
            boardId?: number;
            page?: number;
            problemId?: number;
        } = {}, cacheOnly = false) => invoke<CachedValue<unknown>>(IPC.bbsPosts, { ...query, cacheOnly }).then((r) => r.value),
        post: (postId: number, page = 1, cacheOnly = false) => invoke<CachedValue<unknown>>(IPC.bbsPost, { postId, page, cacheOnly }).then((r) => r.value),
        newPost: (payload: {
            boardId: number;
            title: string;
            content: string;
            problemId?: number;
            captchaSecretKey?: string;
        }) => invoke(IPC.bbsNewPost, payload),
        newReply: (payload: {
            postId: number;
            content: string;
            captchaSecretKey?: string;
        }) => invoke(IPC.bbsNewReply, payload),
        readMention: (mentionId: number) => invoke(IPC.bbsReadMention, { mentionId }),
        std: (problemId: number) => invoke(IPC.bbsStd, { problemId }),
    },
    mail: {
        list: (cacheOnly = false) => invoke<CachedValue<unknown>>(IPC.mailList, { cacheOnly }).then((r) => r.value),
        get: (otherUser: string, cacheOnly = false) => invoke<CachedValue<unknown>>(IPC.mailGet, { otherUser, cacheOnly }).then((r) => r.value),
        send: (toUser: string, content: string) => invoke(IPC.mailSend, { toUser, content }),
        readMention: (mentionId: number) => invoke(IPC.mailReadMention, { mentionId }),
    },
    notices: {
        poll: () => invoke<CommunityNotification[]>(IPC.noticesPoll),
    },
} as const;
export type XmojApi = typeof api;
if (process.argv.includes('--xmoj-turnstile')) {
    // The remote verification document gets only one-way widget reports, never
    // the application's account, filesystem, download or discussion APIs.
    contextBridge.exposeInMainWorld('turnstileBridge', {
        report: (state: Omit<import('../src/shared/types.ts').CaptchaState, 'id'>) => ipcRenderer.send(IPC.bbsCaptchaReport, state),
    });
} else contextBridge.exposeInMainWorld('xmoj', api);
