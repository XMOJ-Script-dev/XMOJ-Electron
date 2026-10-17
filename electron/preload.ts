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
        list: (cacheFirst = false) => invoke<SoftwareEntry[]>(IPC.softwareList, { cacheFirst }),
    },
    cache: {
        clear: () => invoke<{
            cleared: number;
        }>(IPC.cacheClear),
    },
    events: {
        onPopupBlocked: (handler: (url: string) => void) => {
            const listener = (_event: unknown, url: string) => handler(url);
            ipcRenderer.on(IPC.popupBlocked, listener);
            return () => ipcRenderer.removeListener(IPC.popupBlocked, listener);
        },
    },
    source: {
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
        std: (problemId: number) => invoke(IPC.bbsStd, { problemId }),
    },
    mail: {
        list: (cacheOnly = false) => invoke<CachedValue<unknown>>(IPC.mailList, { cacheOnly }).then((r) => r.value),
        get: (otherUser: string, cacheOnly = false) => invoke<CachedValue<unknown>>(IPC.mailGet, { otherUser, cacheOnly }).then((r) => r.value),
        send: (toUser: string, content: string) => invoke(IPC.mailSend, { toUser, content }),
    },
    notices: {
        poll: () => invoke<CommunityNotification[]>(IPC.noticesPoll),
    },
} as const;
export type XmojApi = typeof api;
contextBridge.exposeInMainWorld('xmoj', api);
