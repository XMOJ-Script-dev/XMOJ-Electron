import type { AvatarInfo, CachedValue, CommunityNotification, ContestDetail, ContestListPage, ContestProblem, ContestRank, DiffLine, ExportResult, HomeSnapshot, LoginResult, NavInfo, ProblemsetPage, ProblemsetQuery, ProblemDetail, MonthlyBoard, SessionState, SoftwareEntry, StatusPage, StatusQuery, SubmitRequest, SubmitResult, UserInfo, UserProfile, } from '@/shared/types';
export function getSession(): Promise<SessionState> {
    return window.xmoj.session.get();
}
export function verifySession(): Promise<SessionState> {
    return window.xmoj.session.verify();
}
export function login(username: string, password: string, remember = false): Promise<LoginResult> {
    return window.xmoj.session.login({ username, password, remember });
}
export function logout(): Promise<SessionState> {
    return window.xmoj.session.logout();
}
export function fetchAccountEmail(): Promise<string | null> {
    return window.xmoj.session.email();
}
export function fetchHomeSnapshot(cacheOnly = false): Promise<HomeSnapshot> {
    return window.xmoj.home.snapshot(cacheOnly);
}
export function fetchProblemset(query: ProblemsetQuery = {}, cacheFirst = false): Promise<CachedValue<ProblemsetPage>> {
    return window.xmoj.problemset.list(query, cacheFirst);
}
export function fetchAllProblems(cacheFirst = false): Promise<ProblemsetPage> {
    return window.xmoj.problemset.all(cacheFirst);
}
export function fetchMonthlyBoard(cacheFirst = false): Promise<MonthlyBoard> {
    return window.xmoj.monthly.board(cacheFirst);
}
export function fetchSoftwareList(cacheFirst = false): Promise<SoftwareEntry[]> {
    return window.xmoj.downloads.list(cacheFirst);
}
export function fetchProblemDetail(problemId: number, cacheOnly = false): Promise<CachedValue<ProblemDetail>> {
    return window.xmoj.problem.detail(problemId, cacheOnly);
}
export function fetchStatus(query: StatusQuery = {}): Promise<StatusPage> {
    return window.xmoj.status.list(query);
}
export function fetchContestProblems(contestId: number, cacheOnly = false): Promise<ContestProblem[]> {
    return window.xmoj.contest.problems(contestId, cacheOnly);
}
export function fetchContestList(page = 1, cacheOnly = false): Promise<CachedValue<ContestListPage>> {
    return window.xmoj.contest.list(page, cacheOnly);
}
export function fetchContestDetail(contestId: number, cacheOnly = false): Promise<CachedValue<ContestDetail>> {
    return window.xmoj.contest.detail(contestId, cacheOnly);
}
export function fetchContestRank(contestId: number, oi: boolean): Promise<ContestRank> {
    return window.xmoj.contest.rank(contestId, oi);
}
export function fetchUserProfile(username: string, cacheOnly = false): Promise<UserProfile> {
    return window.xmoj.user.profile(username, cacheOnly);
}
export function fetchNavInfo(): Promise<NavInfo> {
    return window.xmoj.nav.info();
}
const userInfoRequests = new Map<string, Promise<UserInfo>>();
export function fetchUserInfo(username: string): Promise<UserInfo> {
    const existing = userInfoRequests.get(username);
    if (existing) return existing;
    const request = window.xmoj.user.info(username).finally(() => { userInfoRequests.delete(username); });
    userInfoRequests.set(username, request);
    return request;
}
export function userExists(username: string): Promise<boolean> {
    return window.xmoj.user.exists(username);
}
export function fetchAvatarFor(username: string): Promise<AvatarInfo | null> {
    return window.xmoj.session.avatar({ username });
}
export function pullCloudSettings(): Promise<Record<string, unknown>> {
    return window.xmoj.settings.pull();
}
export function pushCloudSettings(settings: Record<string, unknown>): Promise<Record<string, unknown>> {
    return window.xmoj.settings.push(settings);
}
export function clearPageCache(): Promise<number> {
    return window.xmoj.cache.clear().then((result) => result.cleared);
}
export function fetchSource(solutionId: number): Promise<string | null> {
    return window.xmoj.source.get(solutionId);
}
export function compareSources(left: number, right: number): Promise<DiffLine[]> {
    return window.xmoj.source.compare(left, right);
}
export function exportAcCode(payload: {
    problemIds: number[];
    languages?: string[];
}): Promise<ExportResult> {
    return window.xmoj.source.exportAcCode(payload);
}
export function submitCode(request: SubmitRequest): Promise<SubmitResult> {
    return window.xmoj.submit.code(request);
}
export function fetchBoards(cacheOnly = false): Promise<unknown> {
    return window.xmoj.bbs.boards(cacheOnly);
}
export function fetchPosts(query: {
    boardId?: number;
    page?: number;
    problemId?: number;
} = {}, cacheOnly = false): Promise<unknown> {
    return window.xmoj.bbs.posts(query, cacheOnly);
}
export function fetchPost(postId: number, page = 1, cacheOnly = false): Promise<unknown> {
    return window.xmoj.bbs.post(postId, page, cacheOnly);
}
export function deleteDiscussionPost(postId: number): Promise<unknown> { return window.xmoj.bbs.deletePost(postId); }
export function deleteDiscussionReply(replyId: number): Promise<unknown> { return window.xmoj.bbs.deleteReply(replyId); }
export function editDiscussionReply(replyId: number, content: string): Promise<unknown> { return window.xmoj.bbs.editReply(replyId, content); }
export function createPost(payload: {
    boardId: number;
    title: string;
    content: string;
    problemId?: number;
    captchaSecretKey?: string;
}): Promise<unknown> {
    return window.xmoj.bbs.newPost(payload);
}
export function createReply(payload: {
    postId: number;
    content: string;
    captchaSecretKey?: string;
}): Promise<unknown> {
    return window.xmoj.bbs.newReply(payload);
}
export function fetchStdCode(problemId: number): Promise<unknown> {
    return window.xmoj.bbs.std(problemId);
}
export function fetchMailList(cacheOnly = false): Promise<unknown> {
    return window.xmoj.mail.list(cacheOnly);
}
export function fetchMail(otherUser: string, cacheOnly = false): Promise<unknown> {
    return window.xmoj.mail.get(otherUser, cacheOnly);
}
export function sendMail(toUser: string, content: string): Promise<unknown> {
    return window.xmoj.mail.send(toUser, content);
}
export function pollNotices(): Promise<CommunityNotification[]> {
    return window.xmoj.notices.poll();
}
