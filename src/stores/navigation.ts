import { ref } from 'vue';
export type ViewId = 'home' | 'problemset' | 'problem' | 'status' | 'submit' | 'discussion' | 'mail' | 'compare' | 'contests' | 'monthly' | 'downloads' | 'export' | 'settings';
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
const currentView = ref<ViewId>('home');
const activeProblemId = ref(0);
const activeThread = ref<{ postId: number; page: number } | null>(null);
export function useNavigation() {
    function navigate(id: ViewId): void {
        currentView.value = id;
    }
    function submitProblem(problemId: number): void {
        activeProblemId.value = problemId;
        currentView.value = 'submit';
    }
    function viewProblem(problemId: number): void {
        activeProblemId.value = problemId;
        currentView.value = 'problem';
    }
    return {
        currentView,
        activeProblemId,
        activeThread,
        viewThread(postId: number, page = 1) {
            activeThread.value = { postId, page };
            currentView.value = 'discussion';
        },
        navigate,
        submitProblem,
        viewProblem,
        views: VIEWS,
    };
}
