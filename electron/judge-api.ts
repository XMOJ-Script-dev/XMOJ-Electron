import { XMOJ_ORIGIN, type ContestDetail, type ContestListPage, type ContestProblemSummary, type NavInfo, } from '../src/shared/types.ts';
import type { HttpClient } from './http.ts';
interface JsonResult<T> {
    ok: boolean;
    status: number;
    data: T | null;
    error?: string;
}
interface RawContestProblem {
    contestId?: string | number;
    num?: string | number;
    problemId?: string | number | null;
    problemTitle?: string | null;
    title?: string | null;
    myStatus?: string | null;
}
async function getJson<T>(http: HttpClient, path: string): Promise<JsonResult<T>> {
    const response = await http.get(`${XMOJ_ORIGIN}${path}`);
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('json')) {
        return { ok: false, status: response.status, data: null, error: '返回的不是 JSON' };
    }
    try {
        const parsed = JSON.parse(response.body) as T & {
            detail?: string;
        };
        if (response.status >= 400) {
            return {
                ok: false,
                status: response.status,
                data: null,
                error: parsed.detail ?? `HTTP ${response.status}`,
            };
        }
        return { ok: true, status: response.status, data: parsed };
    }
    catch {
        return { ok: false, status: response.status, data: null, error: '响应解析失败' };
    }
}
export function fetchNavInfo(http: HttpClient): Promise<JsonResult<NavInfo>> {
    return getJson<NavInfo>(http, '/api/nav');
}
export function fetchContestList(http: HttpClient, page = 1): Promise<JsonResult<ContestListPage>> {
    return getJson<ContestListPage>(http, `/api/contest/list?pageNum=${page}`);
}
export async function fetchContestDetail(http: HttpClient, contestId: number): Promise<JsonResult<ContestDetail>> {
    const result = await getJson<{
        contest: ContestDetail['contest'];
        problems?: RawContestProblem[];
        myRole?: string | null;
        canExport?: boolean;
        submitUrl?: string | null;
    }>(http, `/api/contest/${contestId}/A`);
    if (!result.ok || !result.data) {
        return { ok: false, status: result.status, data: null, error: result.error };
    }
    const problems: ContestProblemSummary[] = (result.data.problems ?? []).map((problem) => {
        const rawId = problem.problemId;
        const id = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : typeof rawId === 'number' ? rawId : null;
        return {
            num: String(problem.num ?? '').toUpperCase(),
            problemId: id !== null && Number.isFinite(id) ? id : null,
            title: String(problem.problemTitle ?? problem.title ?? '').trim(),
            status: problem.myStatus ? String(problem.myStatus) : null,
        };
    });
    return {
        ok: true,
        status: result.status,
        data: {
            contest: result.data.contest,
            problems,
            myRole: result.data.myRole ?? null,
            canExport: Boolean(result.data.canExport),
            submitUrl: result.data.submitUrl ?? null,
        },
    };
}
export async function userExists(http: HttpClient, username: string): Promise<boolean> {
    const name = username.trim();
    if (!name)
        return false;
    const response = await http.get(`${XMOJ_ORIGIN}/userinfo.php?user=${encodeURIComponent(name)}`);
    if (/用户不存在|不存在此用户|No such user|查无此人/i.test(response.body))
        return false;
    return /#statics|已解决|Solved/i.test(response.body);
}
