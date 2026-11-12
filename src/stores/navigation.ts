import { ref } from 'vue';
import { VIEWS, parseWebRoute, pathForWebRoute, type NavigationRoute, type ViewId } from './web-route';
export { VIEWS, parseWebRoute, pathForWebRoute };
export type { NavigationRoute, ViewId, ViewMeta } from './web-route';
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
    function submitProblem(problemId: number, contestId = 0): void {
        activeProblemId.value = problemId;
        currentView.value = 'submit';
        activeContestId.value = contestId;
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
