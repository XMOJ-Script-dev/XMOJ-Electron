const XMOJ_ORIGIN = 'https://www.xmoj.tech';

interface PagesContext {
  request: Request;
}

interface RawProblem {
  contestId?: string | number;
  num?: string | number;
  problemId?: string | number | null;
  problemTitle?: string | null;
  title?: string | null;
  myStatus?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function onRequestGet({ request }: PagesContext): Promise<Response> {
  const rawId = new URL(request.url).searchParams.get('id') ?? '';
  if (!/^\d{1,10}$/.test(rawId) || Number(rawId) < 1) {
    return Response.json({ error: '无效的比赛编号' }, { status: 400 });
  }
  try {
    const response = await fetch(`${XMOJ_ORIGIN}/api/contest/${rawId}/A`, {
      headers: { Accept: 'application/json' },
      redirect: 'manual',
      signal: request.signal,
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
      return Response.json({ error: '暂时无法读取比赛信息' }, {
        status: 502,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    const raw: unknown = await response.json();
    if (!isRecord(raw) || !isRecord(raw.contest)) {
      return Response.json({ error: '比赛信息格式无效' }, { status: 502 });
    }
    const problems = Array.isArray(raw.problems) ? raw.problems as RawProblem[] : [];
    return Response.json({
      contest: raw.contest,
      problems: problems.map(problem => {
        const id = typeof problem.problemId === 'string'
          ? Number.parseInt(problem.problemId, 10)
          : typeof problem.problemId === 'number' ? problem.problemId : null;
        return {
          num: String(problem.num ?? '').toUpperCase(),
          problemId: id !== null && Number.isFinite(id) ? id : null,
          title: String(problem.problemTitle ?? problem.title ?? '').trim(),
          status: problem.myStatus ? String(problem.myStatus) : null,
        };
      }),
      myRole: typeof raw.myRole === 'string' ? raw.myRole : null,
      canExport: Boolean(raw.canExport),
      submitUrl: typeof raw.submitUrl === 'string' ? raw.submitUrl : null,
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
    });
  } catch {
    return Response.json({ error: '暂时无法读取比赛信息' }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
