export const XMOJ_ORIGIN = 'https://www.xmoj.tech';
export const XMOJ_API_ORIGIN = 'https://api.xmoj-script.uk';
export const XMOJ_SCRIPT_ORIGIN = 'https://www.xmoj-script.uk';
export interface SessionUser {
    username: string;
    isAdmin: boolean;
    email: string | null;
}
export interface SessionState {
    authenticated: boolean;
    user: SessionUser | null;
    sessionId: string | null;
    verifiedAt: number | null;
    rememberedUsername: string | null;
    canSilentLogin: boolean;
}
export interface LoginRequest {
    username: string;
    password: string;
    remember?: boolean;
}
export interface LoginResult {
    ok: boolean;
    message?: string;
    state: SessionState;
}
export interface HomeAnnouncement {
    title: string;
    date: string | null;
    html: string;
    text: string;
}
export interface HomeBanner {
    href: string;
    src: string;
}
export interface HomeCountdown {
    event: string;
    date: string;
    days: number;
}
export interface HomeSnapshot {
    announcements: HomeAnnouncement[];
    banners: HomeBanner[];
    countdown: HomeCountdown[];
    serverTime: number;
    notice: string | null;
}
export interface ProblemsetEntry {
    id: number;
    title: string;
    url: string;
    accepted: number | null;
    submissions: number | null;
    solved: boolean | null;
    acceptanceRate: number | null;
}
export interface ProblemsetQuery {
    page?: number;
    search?: string;
}
export interface ProblemsetPage {
    problems: ProblemsetEntry[];
    page: number;
    totalPages: number | null;
}
export type SubmissionVerdict = 'accepted' | 'wrong_answer' | 'runtime_error' | 'compile_error' | 'time_limit' | 'memory_limit' | 'output_limit' | 'presentation_error' | 'pending' | 'other';
export interface SubmissionEntry {
    id: number;
    verdict: SubmissionVerdict;
    verdictCode: number | null;
    verdictLabel: string;
    verdictText: string;
    problemId: number | null;
    problemTitle: string;
    problemUrl: string | null;
    user: string;
    memoryKb: number | null;
    timeMs: number | null;
    language: string;
    codeLength: number | null;
    userRating: string | null;
    submittedAt: string;
}
export interface StatusQuery {
    top?: number;
    prevTop?: number;
    user?: string;
    problemId?: number;
    result?: string;
    language?: string;
}
export interface StatusPaging {
    nextTop: number | null;
    nextPrevTop: number | null;
    prevTop: number | null;
}
export interface StatusPage {
    submissions: SubmissionEntry[];
    paging: StatusPaging;
}
export type IpcResult<T> = {
    ok: true;
    data: T;
} | {
    ok: false;
    error: string;
};
export interface AvatarInfo {
    hash: string;
    url: string;
}
export interface JudgeLanguage {
    id: number;
    name: string;
}
export interface ProblemSample {
    input: string;
    output: string;
}
export interface ProblemMeta {
    label: string;
    value: string;
}
export interface ProblemCard {
    title: string;
    html: string;
    isSamples: boolean;
    samples: ProblemSample[];
}
export interface ProblemDetail {
    id: number;
    title: string;
    cards: ProblemCard[];
    statementHtml: string;
    meta: ProblemMeta[];
    inputName: string | null;
    outputName: string | null;
    samples: ProblemSample[];
    timeLimitMs: number | null;
    memoryLimitKb: number | null;
    languages: JudgeLanguage[];
}
export interface SubmitRequest {
    problemId: number;
    languageId: number;
    source: string;
    enableO2: boolean;
    contestId?: number;
    contestPid?: number;
}
export interface SubmitResult {
    ok: boolean;
    solutionId: number | null;
    message: string;
}
export interface CommunityNotification {
    kind: 'bbs' | 'mail';
    title: string;
    body: string;
    postId?: number;
    pageNumber?: number;
    mailUser?: string;
    mentionId: number;
}
export interface AcCodeEntry {
    problemId: number;
    solutionId: number;
    language: string;
    source: string;
}
export interface ExportResult {
    written: number;
    skipped: number[];
    path: string | null;
    bytes: number;
}
export interface DiffLine {
    kind: 'equal' | 'added' | 'removed';
    left: number | null;
    right: number | null;
    text: string;
}
export interface SourcePair {
    left: {
        solutionId: number;
        problemId: number | null;
        source: string;
        language: string;
    };
    right: {
        solutionId: number;
        problemId: number | null;
        source: string;
        language: string;
    };
}
export interface SolvedProblem {
    id: number;
    attempts: number;
    url: string;
}
export interface UserProfile {
    username: string;
    nick: string;
    solvedTotal: number;
    problems: SolvedProblem[];
    profileUrl: string;
}
export interface RankRow {
    rank: number | null;
    rankText: string | null;
    userId: string;
    nick: string;
    solved: number;
    score: number;
    cells: {
        text: string;
        accepted: boolean;
    }[];
}
export interface ContestRank {
    contestId: number;
    title: string;
    oi: boolean;
    headers: string[];
    rows: RankRow[];
}
export interface ContestProblem {
    index: number;
    label: string;
    title: string;
    url: string;
    problemId: number | null;
}
export interface NavInfo {
    loggedIn: boolean;
    serverTime: string;
    lang: string;
    userId: string;
    nick: string;
    isAdmin: boolean;
    isTeacher: boolean;
    isContestCreator: boolean;
    isProblemEditor: boolean;
    isContestObserver: boolean;
}
export interface UserTag {
    content: string;
    backgroundColor: string;
    color: string;
}
export interface UserInfo {
    username: string;
    nick: string | null;
    isAdmin: boolean;
    badge: UserTag | null;
}
export interface ContestSummary {
    contestId: number;
    title: string;
    startTime: string | null;
    endTime: string | null;
    defunct: string | null;
    creator?: string | null;
}
export interface ContestListPage {
    list: ContestSummary[];
    total: number;
    totalPages: number;
    pageNum: number;
    pageSize: number;
}
export interface ContestProblemSummary {
    num: string;
    problemId: number | null;
    title: string;
    status?: string | null;
}
export interface ContestDetail {
    contest: ContestSummary;
    problems: ContestProblemSummary[];
    myRole: string | null;
    canExport: boolean;
    submitUrl: string | null;
}
export interface CachedValue<T> {
    value: T;
    fetchedAt: number;
    fromCache: boolean;
}
export interface MonthlyCard {
    title: string;
    date: string | null;
    html: string;
    text: string;
}
export interface MonthlyBoard {
    intro: string;
    cards: MonthlyCard[];
    url: string;
}
export interface SoftwareEntry {
    name: string;
    url: string;
    image: string | null;
}
export interface JsonFetchResult {
    ok: boolean;
    status: number;
    data: unknown;
    error?: string;
}
export interface DialogButton {
    id: string;
    label: string;
}
export interface DialogRequest {
    title: string;
    message: string;
    detail?: string;
    buttons: DialogButton[];
    defaultId?: string;
    cancelId?: string;
}
export const IPC = {
    sessionGet: 'xmoj:session:get',
    sessionLogin: 'xmoj:session:login',
    sessionLogout: 'xmoj:session:logout',
    sessionVerify: 'xmoj:session:verify',
    sessionEmail: 'xmoj:session:email',
    sessionAvatar: 'xmoj:session:avatar',
    homeSnapshot: 'xmoj:home:snapshot',
    problemsetList: 'xmoj:problemset:list',
    problemsetAll: 'xmoj:problemset:all',
    monthlyBoard: 'xmoj:monthly:board',
    softwareList: 'xmoj:downloads:list',
    statusList: 'xmoj:status:list',
    problemDetail: 'xmoj:problem:detail',
    submitCode: 'xmoj:submit:code',
    contestProblems: 'xmoj:contest:problems',
    contestList: 'xmoj:contest:list',
    contestDetail: 'xmoj:contest:detail',
    contestRank: 'xmoj:contest:rank',
    navInfo: 'xmoj:nav:info',
    userInfo: 'xmoj:user:info',
    userExists: 'xmoj:user:exists',
    userProfile: 'xmoj:user:profile',
    settingsCloud: 'xmoj:settings:cloud',
    appVersion: 'xmoj:app:version',
    appFetchJson: 'xmoj:app:fetch-json',
    appDialog: 'xmoj:app:dialog',
    appQuitConfirm: 'xmoj:app:quit-confirm',
    cacheClear: 'xmoj:cache:clear',
    popupBlocked: 'xmoj:popup-blocked',
    sourceGet: 'xmoj:source:get',
    sourceCompare: 'xmoj:source:compare',
    exportAcCode: 'xmoj:source:export',
    bbsBoards: 'xmoj:bbs:boards',
    bbsPosts: 'xmoj:bbs:posts',
    bbsPost: 'xmoj:bbs:post',
    bbsNewPost: 'xmoj:bbs:new-post',
    bbsNewReply: 'xmoj:bbs:new-reply',
    bbsStd: 'xmoj:bbs:std',
    mailList: 'xmoj:mail:list',
    mailGet: 'xmoj:mail:get',
    mailSend: 'xmoj:mail:send',
    noticesPoll: 'xmoj:notices:poll',
} as const;
