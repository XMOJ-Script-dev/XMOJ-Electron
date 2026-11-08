import { ref } from 'vue';
export type ViewId = 'home' | 'problemset' | 'problem' | 'status' | 'submit' | 'discussion' | 'mail' | 'compare' | 'contests' | 'monthly' | 'downloads' | 'export' | 'settings';
export interface NavigationRoute {
    view: ViewId;
    problemId: number;
    contestId: number;
    thread: { postId: number; page: number } | null;
}
export interface ViewMeta {
    id: ViewId;
    title: string;
    description: string;
    requiresAuth: boolean;
}
export const VIEWS: ViewMeta[] = [
    { id: 'home', title: '首页', description: '公告与最新动态', requiresAuth: false },
    { id: 'problemset', title: '题库', description: '浏览全部题目', requiresAuth: true },
    { id: 'problem', title: '题目', description: '查看题面与样例', requiresAuth: true },
    { id: 'contests', title: '竞赛&作业', description: '比赛列表与排名', requiresAuth: true },
    { id: 'monthly', title: '月赛', description: '月赛公告与分组', requiresAuth: false },
    { id: 'downloads', title: '下载', description: '常用软件下载', requiresAuth: false },
    { id: 'status', title: '状态', description: '评测记录与结果', requiresAuth: true },
    { id: 'submit', title: '提交', description: '编写并提交代码', requiresAuth: true },
    { id: 'discussion', title: '讨论', description: '社区讨论区', requiresAuth: true },
    { id: 'mail', title: '短消息', description: '站内私信', requiresAuth: true },
    { id: 'compare', title: '代码对比', description: '比较两次提交', requiresAuth: true },
    { id: 'export', title: '导出 AC 代码', description: '打包已通过的代码', requiresAuth: true },
    { id: 'settings', title: '设置', description: '界面与行为偏好', requiresAuth: false },
];
const paths: Record<ViewId, string> = {
    home: '/',
    problemset: '/problemset',
    problem: '/problem',
    status: '/status',
    submit: '/submit',
    discussion: '/discussion',
    mail: '/mail',
    compare: '/compare',
    contests: '/contests',
    monthly: '/monthly',
    downloads: '/downloads',
    export: '/export',
    settings: '/settings',
};
const webBuild = import.meta.env?.VITE_WEB_BUILD === 'true';
const validId = (value: string | null): number => {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : 0;
};
export function parseWebRoute(url: URL): NavigationRoute {
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    const contestProblem = pathname.match(/^\/contests\/(\d+)\/problems\/(\d+)$/);
    if (contestProblem) {
        return {
            view: 'problem',
            problemId: validId(contestProblem[2]),
            contestId: validId(contestProblem[1]),
            thread: null,
        };
    }
    const contest = pathname.match(/^\/contests\/(\d+)$/);
    if (contest) {
        return { view: 'contests', problemId: 0, contestId: validId(contest[1]), thread: null };
    }
    const problem = pathname.match(/^\/problem(?:\/(\d+))?$/);
    if (problem) {
        return { view: 'problem', problemId: validId(problem[1] ?? url.searchParams.get('id')), contestId: 0, thread: null };
    }
    const submit = pathname.match(/^\/submit(?:\/(\d+))?$/);
    if (submit) {
        return { view: 'submit', problemId: validId(submit[1] ?? url.searchParams.get('id')), contestId: 0, thread: null };
    }
    const discussion = pathname.match(/^\/discussion(?:\/(\d+))?$/);
    if (discussion) {
        const postId = validId(discussion[1] ?? url.searchParams.get('post'));
        const page = validId(url.searchParams.get('page')) || 1;
        return { view: 'discussion', problemId: 0, contestId: 0, thread: postId ? { postId, page } : null };
    }
    const view = (Object.entries(paths).find(([, path]) => path === pathname)?.[0] ?? 'home') as ViewId;
    return { view, problemId: 0, contestId: 0, thread: null };
}
export function pathForWebRoute(route: NavigationRoute): string {
    if (route.view === 'problem' && route.contestId > 0 && route.problemId > 0) {
        return `/contests/${route.contestId}/problems/${route.problemId}`;
    }
    if (route.view === 'contests' && route.contestId > 0) {
        return `/contests/${route.contestId}`;
    }
    if (route.view === 'problem' || route.view === 'submit') {
        return route.problemId > 0 ? `${paths[route.view]}/${route.problemId}` : paths[route.view];
    }
    if (route.view === 'discussion' && route.thread) {
        const suffix = route.thread.page > 1 ? `?page=${route.thread.page}` : '';
        return `${paths.discussion}/${route.thread.postId}${suffix}`;
    }
    return paths[route.view];
}
const initialRoute = webBuild && typeof window !== 'undefined'
    ? parseWebRoute(new URL(window.location.href))
    : { view: 'home' as ViewId, problemId: 0, contestId: 0, thread: null };
const currentView = ref<ViewId>(initialRoute.view);
const activeProblemId = ref(initialRoute.problemId);
const activeContestId = ref(initialRoute.contestId);
const activeThread = ref(initialRoute.thread);
function applyRoute(route: NavigationRoute): void {
    currentView.value = route.view;
    activeProblemId.value = route.problemId;
    activeContestId.value = route.contestId;
    activeThread.value = route.thread;
}
function syncBrowserRoute(replace = false): void {
    if (!webBuild || typeof window === 'undefined') return;
    const path = pathForWebRoute({
        view: currentView.value,
        problemId: activeProblemId.value,
        contestId: activeContestId.value,
        thread: activeThread.value,
    });
    if (`${window.location.pathname}${window.location.search}` === path) return;
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
}
if (webBuild && typeof window !== 'undefined') {
    syncBrowserRoute(true);
    window.addEventListener('popstate', () => applyRoute(parseWebRoute(new URL(window.location.href))));
}
export function useNavigation() {
    function navigate(id: ViewId): void {
        currentView.value = id;
        if (id !== 'problem' && id !== 'submit') activeProblemId.value = 0;
        activeContestId.value = 0;
        if (id !== 'discussion') activeThread.value = null;
        syncBrowserRoute();
    }
    function submitProblem(problemId: number): void {
        activeProblemId.value = problemId;
        currentView.value = 'submit';
        activeContestId.value = 0;
        activeThread.value = null;
        syncBrowserRoute();
    }
    function viewProblem(problemId: number): void {
        activeProblemId.value = problemId;
        currentView.value = 'problem';
        activeContestId.value = 0;
        activeThread.value = null;
        syncBrowserRoute();
    }
    function viewContest(contestId: number): void {
        activeProblemId.value = 0;
        activeContestId.value = contestId;
        currentView.value = 'contests';
        activeThread.value = null;
        syncBrowserRoute();
    }
    function viewContestProblem(contestId: number, problemId: number): void {
        activeProblemId.value = problemId;
        activeContestId.value = contestId;
        currentView.value = 'problem';
        activeThread.value = null;
        syncBrowserRoute();
    }
    return {
        currentView,
        activeProblemId,
        activeContestId,
        activeThread,
        viewThread(postId: number, page = 1) {
            activeThread.value = { postId, page };
            currentView.value = 'discussion';
            activeProblemId.value = 0;
            syncBrowserRoute();
        },
        navigate,
        submitProblem,
        viewProblem,
        viewContest,
        viewContestProblem,
        views: VIEWS,
    };
}
