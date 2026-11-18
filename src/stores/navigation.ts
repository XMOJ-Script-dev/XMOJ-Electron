import { ref } from 'vue';
import { VIEWS, parseWebRoute, pathForWebRoute, type NavigationRoute, type ViewId } from './web-route.ts';
export { VIEWS, parseWebRoute, pathForWebRoute };
export type { NavigationRoute, ViewId, ViewMeta } from './web-route.ts';
function detectWebBuild(): boolean {
    try {
        return import.meta.env.VITE_WEB_BUILD === 'true';
    }
    catch {
        return false;
    }
}
const webBuild = detectWebBuild();
const initialRoute = webBuild && typeof window !== 'undefined'
    ? parseWebRoute(new URL(window.location.href))
    : { view: 'home' as ViewId, problemId: 0, contestId: 0, thread: null };
const currentView = ref<ViewId>(initialRoute.view);
const activeProblemId = ref(initialRoute.problemId);
const activeContestId = ref(initialRoute.contestId);
const activeContest = ref<{ contestId: number; contestPid: number } | null>(null);
const activeThread = ref(initialRoute.thread);
function applyRoute(route: NavigationRoute): void {
    currentView.value = route.view;
    activeProblemId.value = route.problemId;
    activeContestId.value = route.contestId;
    activeContest.value = null;
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
interface ContestContext {
    contestId: number;
    contestPid: number;
}
export function useNavigation() {
    function navigate(id: ViewId): void {
        activeContest.value = null;
        currentView.value = id;
        activeContestId.value = 0;
        if (id !== 'discussion') activeThread.value = null;
        syncBrowserRoute();
    }
    function submitProblem(problemId: number, contest: number | ContestContext | null = 0): void {
        activeProblemId.value = problemId;
        if (contest && typeof contest === 'object') {
            activeContest.value = { contestId: contest.contestId, contestPid: contest.contestPid };
            activeContestId.value = contest.contestId;
        }
        else {
            activeContest.value = null;
            activeContestId.value = typeof contest === 'number' && contest > 0 ? contest : 0;
        }
        currentView.value = 'submit';
        activeThread.value = null;
        syncBrowserRoute();
    }
    function viewProblem(problemId: number): void {
        activeContest.value = null;
        activeProblemId.value = problemId;
        currentView.value = 'problem';
        activeContestId.value = 0;
        activeThread.value = null;
        syncBrowserRoute();
    }
    function viewContest(contestId: number): void {
        activeContest.value = null;
        activeProblemId.value = 0;
        activeContestId.value = contestId;
        currentView.value = 'contests';
        activeThread.value = null;
        syncBrowserRoute();
    }
    function viewContestProblem(contestId: number, problemId: number): void {
        activeContest.value = null;
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
        activeContest,
        activeThread,
        viewThread(postId: number, page = 1) {
            activeThread.value = { postId, page };
            currentView.value = 'discussion';
            activeProblemId.value = 0;
            activeContestId.value = 0;
            activeContest.value = null;
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
