import { buildSubmitForm, parseSubmitResponse } from '../../electron/problems.ts';
import { isAlreadyLoggedInResponse, isLoginGate } from '../../electron/parsers.ts';
import { readSession, type PagesEnv } from './session.ts';
import { fetchUpstream } from './_upstream.ts';

const XMOJ_ORIGIN = 'https://www.xmoj.tech';

interface PagesContext {
  request: Request;
  env: PagesEnv;
}

function response(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

function sameOrigin(request: Request): boolean {
  return request.headers.get('Origin') === new URL(request.url).origin;
}

function contestEndTimestamp(value: unknown): number {
  if (typeof value !== 'string' || !value.trim()) return Number.NaN;
  const date = value.trim().replace(' ', 'T');
  return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/i.test(date) ? date : `${date}+08:00`);
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (!sameOrigin(request)) return response({ error: 'Invalid request origin' }, 403);
  const session = await readSession(request, env);
  if (!session) return response({ error: '登录状态已失效，请重新登录' }, 401);

  const contentLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > 600_000) {
    return response({ error: '提交内容过大' }, 413);
  }
  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 600_000) {
      return response({ error: '提交内容过大' }, 413);
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return response({ error: '提交请求格式无效' }, 400);
    }
    input = parsed as Record<string, unknown>;
  } catch {
    return response({ error: '提交请求格式无效' }, 400);
  }
  const problemId = Number(input.problemId);
  const languageId = Number(input.languageId);
  const hasContest = input.contestId !== undefined && input.contestId !== null;
  const contestId = Number(input.contestId);
  const source = typeof input.source === 'string' ? input.source : '';
  if (
    !Number.isSafeInteger(problemId) || problemId < 1 || problemId > 1_000_000_000 ||
    !Number.isSafeInteger(languageId) || languageId < 0 || languageId > 1000 ||
    (hasContest && (!Number.isSafeInteger(contestId) || contestId < 1 || contestId > 1_000_000_000)) ||
    !source.trim() || new TextEncoder().encode(source).byteLength > 512_000
  ) {
    return response({ error: '提交信息无效' }, 400);
  }

  try {
    const cookie = `PHPSESSID=${session.sessionId}`;
    const verify = await fetchUpstream(`${XMOJ_ORIGIN}/loginpage.php`, {
      headers: { Cookie: cookie, Accept: 'text/html' },
    }, ['www.xmoj.tech', 'xmoj.tech']);
    const verifyHtml = await verify.text();
    if (!verify.ok || !isAlreadyLoggedInResponse(verifyHtml) || isLoginGate(verifyHtml)) {
      return response({ error: '登录状态已失效，请重新登录' }, 401);
    }

    let activeContestId: number | undefined;
    let activeContestPid: number | undefined;
    if (hasContest) {
      const contestResponse = await fetchUpstream(`${XMOJ_ORIGIN}/api/contest/${contestId}/A`, {
        headers: { Cookie: cookie, Accept: 'application/json' },
      }, ['www.xmoj.tech', 'xmoj.tech']);
      if (!contestResponse.ok || !contestResponse.headers.get('content-type')?.includes('json')) {
        return response({ error: '无法确认竞赛状态，提交未发送' }, 502);
      }
      const contestData: unknown = await contestResponse.json();
      if (
        !contestData || typeof contestData !== 'object' ||
        !('contest' in contestData) || !contestData.contest || typeof contestData.contest !== 'object'
      ) {
        return response({ error: '竞赛信息格式无效，提交未发送' }, 502);
      }
      const contest = contestData.contest as { endTime?: unknown };
      const endTime = contestEndTimestamp(contest.endTime);
      if (!Number.isFinite(endTime)) {
        return response({ error: '无法确认竞赛结束时间，提交未发送' }, 502);
      }
      if (endTime > Date.now()) {
        const problems = 'problems' in contestData && Array.isArray(contestData.problems)
          ? contestData.problems
          : [];
        const contestPid = problems.findIndex((problem) => {
          if (!problem || typeof problem !== 'object' || !('problemId' in problem)) return false;
          return Number(problem.problemId) === problemId;
        });
        if (contestPid < 0) {
          return response({ error: '题目不属于该竞赛，提交未发送' }, 400);
        }
        activeContestId = contestId;
        activeContestPid = contestPid;
      }
    }

    const form = buildSubmitForm({
      problemId,
      contestId: activeContestId,
      contestPid: activeContestPid,
      languageId,
      source,
      enableO2: input.enableO2 === true,
    });
    let result = await fetch(`${XMOJ_ORIGIN}/submit.php`, {
      method: 'POST',
      headers: {
        Cookie: cookie,
        Accept: 'text/html',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(form),
      redirect: 'manual',
    });
    if (result.status >= 300 && result.status < 400) {
      const location = result.headers.get('Location');
      if (!location) return response({ error: '提交响应无效' }, 502);
      const destination = new URL(location, XMOJ_ORIGIN);
      if (destination.origin !== XMOJ_ORIGIN) return response({ error: '提交响应目标无效' }, 502);
      result = await fetch(destination, {
        headers: { Cookie: cookie, Accept: 'text/html' },
        redirect: 'manual',
      });
    }
    const html = await result.text();
    const solutionId = result.ok ? parseSubmitResponse(html) : null;
    if (solutionId === null) {
      return response({
        ok: false,
        solutionId: null,
        message: '提交失败，服务器未返回提交编号',
      }, 502);
    }
    return response({ ok: true, solutionId, message: '提交成功' });
  } catch {
    return response({ error: '提交服务暂时不可用' }, 502);
  }
}
