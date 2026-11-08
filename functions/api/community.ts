import { XMOJ_API_ORIGIN } from '../../src/shared/types.ts';
import { attachOpeningComment } from '../../src/shared/discussion.ts';
import type { BbsPostDetail } from '../../src/shared/community.ts';
import { isAlreadyLoggedInResponse, isLoginGate } from '../../electron/parsers.ts';
import { readSession, type PagesEnv } from './session.ts';
import { fetchUpstream } from './_upstream.ts';

const CLIENT_VERSION = '4.0.5';
const LOGIN_REQUIRED = new Set([
  'GetBoards', 'GetPosts', 'GetPost', 'GetPostCount', 'NewPost', 'NewReply',
  'DeletePost', 'DeleteReply', 'EditReply', 'GetMailList', 'GetMail', 'SendMail',
  'GetMailMentionList', 'GetBBSMentionList', 'ReadMailMention', 'ReadBBSMention',
  'GetStdList', 'GetStd', 'UploadStd', 'UploadImage', 'GetBadge', 'LastOnline',
  'GetUserSettings', 'SetUserSettings',
]);
const ACTIONS = new Set([...LOGIN_REQUIRED, 'GetNotice', 'GetAddOnScript']);
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

interface PagesContext {
  request: Request;
  env: PagesEnv;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function validId(value: unknown, allowZero = false): value is number {
  return Number.isSafeInteger(value) && Number(value) >= (allowZero ? 0 : 1) && Number(value) <= 1_000_000_000;
}

function validateData(action: string, value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const text = (key: string, max: number, allowEmpty = false) =>
    typeof data[key] === 'string' && data[key].length <= max && (allowEmpty || Boolean(data[key].trim()));
  switch (action) {
    case 'GetNotice':
    case 'GetAddOnScript':
    case 'GetBoards':
    case 'GetMailList':
    case 'GetMailMentionList':
    case 'GetBBSMentionList':
    case 'GetStdList':
    case 'GetUserSettings':
      return Object.keys(data).length === 0 ? {} : null;
    case 'GetPosts':
      return (data.BoardID === -1 || validId(data.BoardID, true)) && validId(data.Page) && data.Page <= 10_000 &&
        validId(data.ProblemID, true) ? { BoardID: data.BoardID, Page: data.Page, ProblemID: data.ProblemID } : null;
    case 'GetPost':
      return validId(data.PostID) && validId(data.Page) && data.Page <= 10_000
        ? { PostID: data.PostID, Page: data.Page } : null;
    case 'GetPostCount':
    case 'GetStd':
    case 'UploadStd':
      return validId(data.ProblemID) ? { ProblemID: data.ProblemID } : null;
    case 'NewPost':
      return validId(data.BoardID) && validId(data.ProblemID, true) &&
        text('Title', 200) && text('Content', 100_000) && text('CaptchaSecretKey', 4096)
        ? {
          BoardID: data.BoardID,
          ProblemID: data.ProblemID,
          Title: data.Title,
          Content: data.Content,
          CaptchaSecretKey: data.CaptchaSecretKey,
        } : null;
    case 'NewReply':
      return validId(data.PostID) && text('Content', 100_000) && text('CaptchaSecretKey', 4096)
        ? { PostID: data.PostID, Content: data.Content, CaptchaSecretKey: data.CaptchaSecretKey } : null;
    case 'DeletePost':
      return validId(data.PostID) ? { PostID: data.PostID } : null;
    case 'DeleteReply':
      return validId(data.ReplyID) ? { ReplyID: data.ReplyID } : null;
    case 'EditReply':
      return validId(data.ReplyID) && text('Content', 100_000, true)
        ? { ReplyID: data.ReplyID, Content: data.Content } : null;
    case 'GetMail':
      return text('OtherUser', 128) ? { OtherUser: data.OtherUser } : null;
    case 'SendMail':
      return text('ToUser', 128) && text('Content', 100_000)
        ? { ToUser: data.ToUser, Content: data.Content } : null;
    case 'ReadMailMention':
    case 'ReadBBSMention':
      return validId(data.MentionID) ? { MentionID: data.MentionID } : null;
    case 'UploadImage':
      return text('Image', 2_800_000) &&
        /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(data.Image)
        ? { Image: data.Image } : null;
    case 'GetBadge':
      return text('UserID', 128) ? { UserID: data.UserID } : null;
    case 'LastOnline':
      return text('Username', 128) ? { Username: data.Username } : null;
    case 'SetUserSettings':
      return data.Settings && typeof data.Settings === 'object' && !Array.isArray(data.Settings) &&
        new TextEncoder().encode(JSON.stringify(data.Settings)).byteLength <= 64_000
        ? { Settings: JSON.stringify(data.Settings) } : null;
    default:
      return null;
  }
}

async function post(
  action: string,
  authentication: Record<string, string>,
  data: unknown,
  usernameHint = '',
): Promise<Response> {
  return fetchUpstream(`${XMOJ_API_ORIGIN}/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'XMOJ-UserID': usernameHint || authentication.Username || '',
      'XMOJ-Script-Version': CLIENT_VERSION,
      DebugMode: 'false',
    },
    body: JSON.stringify({
      Authentication: authentication,
      Data: data,
      Version: CLIENT_VERSION,
      DebugMode: false,
    }),
    signal: AbortSignal.timeout(20_000),
  }, ['api.xmoj-script.uk']);
}

async function callCommunity(
  action: string,
  data: Record<string, unknown>,
  credentials: { sessionId: string; username: string },
): Promise<unknown> {
  const unauthenticated = action === 'GetNotice' || action === 'GetAddOnScript';
  let token = '';
  let legacy = false;
  if (!unauthenticated && LOGIN_REQUIRED.has(action)) {
    const login = await post('Login', {
      SessionID: credentials.sessionId,
      Username: credentials.username,
    }, {}, credentials.username);
    if (!login.ok) throw new Error('社区登录暂不可用');
    const body = await readApiResponse(login);
    if (body.Success && typeof body.Data?.Token === 'string' && body.Data.Token) {
      token = body.Data.Token;
    } else if (body.Message === '访问的页面不存在') {
      legacy = true;
    } else {
      throw new Error(body.Message || '无法获取社区会话');
    }
  }

  const auth = unauthenticated
    ? {}
    : legacy
    ? { SessionID: credentials.sessionId, Username: credentials.username }
    : token ? { Token: token } : {};
  let response = await post(action, auth, data, credentials.username);
  if (!response.ok) throw new Error(`社区服务返回 HTTP ${response.status}`);
  let result = await readApiResponse(response);
  if (!result.Success && result.Message === '参数Token未知' && !legacy) {
    response = await post(action, {
      SessionID: credentials.sessionId,
      Username: credentials.username,
    }, data, credentials.username);
    if (!response.ok) throw new Error(`社区服务返回 HTTP ${response.status}`);
    result = await readApiResponse(response);
  } else if (!result.Success && result.Data?.TokenInvalid && !legacy) {
    const login = await post('Login', {
      SessionID: credentials.sessionId,
      Username: credentials.username,
    }, {}, credentials.username);
    if (!login.ok) throw new Error('社区登录暂不可用');
    const refreshed = await readApiResponse(login);
    const freshToken = refreshed.Data?.Token;
    if (typeof freshToken !== 'string' || !freshToken) throw new Error('无法刷新社区会话');
    response = await post(action, { Token: freshToken }, data, credentials.username);
    if (!response.ok) throw new Error(`社区服务返回 HTTP ${response.status}`);
    result = await readApiResponse(response);
  } else if (!result.Success && result.Data?.SessionRequired) {
    response = await post(action, {
      ...auth,
      SessionID: credentials.sessionId,
      Username: credentials.username,
    }, data, credentials.username);
    if (!response.ok) throw new Error(`社区服务返回 HTTP ${response.status}`);
    result = await readApiResponse(response);
  }
  return result;
}

async function readApiResponse(response: Response): Promise<any> {
  const contentLength = Number(response.headers.get('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new Error('社区响应过大');
  }
  const raw = await response.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_RESPONSE_BYTES) throw new Error('社区响应过大');
  try {
    const result = JSON.parse(raw);
    if (!result || typeof result !== 'object' || typeof result.Success !== 'boolean') {
      throw new Error('社区响应格式无效');
    }
    return result;
  } catch (error) {
    if (error instanceof Error && error.message === '社区响应格式无效') throw error;
    throw new Error('社区后端返回了非 JSON 内容');
  }
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ error: 'Invalid request origin' }, 403);
  }
  const length = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return json({ error: '请求内容过大' }, 413);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: '请求内容过大' }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: '请求格式无效' }, 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: '请求格式无效' }, 400);
  }
  const action = typeof body.action === 'string' ? body.action : '';
  if (!ACTIONS.has(action)) return json({ error: '不支持的社区操作' }, 400);
  const data = validateData(action, body.data ?? {});
  if (!data) return json({ error: '社区请求参数无效' }, 400);

  if (LOGIN_REQUIRED.has(action)) {
    const session = await readSession(request, env);
    if (!session) return json({ error: '登录状态已失效，请重新登录' }, 401);
    try {
      const verified = await fetchUpstream('https://www.xmoj.tech/loginpage.php', {
        headers: { Cookie: `PHPSESSID=${session.sessionId}`, Accept: 'text/html' },
        signal: AbortSignal.timeout(20_000),
      }, ['www.xmoj.tech', 'xmoj.tech']);
      if (!verified.ok) return json({ error: '登录状态已失效，请重新登录' }, 401);
      const html = await verified.text();
      if (!isAlreadyLoggedInResponse(html) || isLoginGate(html)) {
        return json({ error: '登录状态已失效，请重新登录' }, 401);
      }
      const credentials = {
        sessionId: session.sessionId,
        username: session.username,
      };
      const result = await callCommunity(action, data, credentials);
      if (action === 'GetPost' && Number(data.Page) > 1 && result && typeof result === 'object') {
        const envelope = result as { Success?: boolean; Data?: BbsPostDetail };
        if (envelope.Success && envelope.Data?.PostID) {
          const firstPage = await callCommunity('GetPost', { PostID: data.PostID, Page: 1 }, credentials) as {
            Success?: boolean;
            Data?: BbsPostDetail;
          };
          if (firstPage.Success && firstPage.Data) {
            envelope.Data = attachOpeningComment(envelope.Data, firstPage.Data);
          }
        }
      }
      return json(result);
    } catch (caught) {
      console.error('[api/community] upstream request failed', caught);
      return json({ error: '社区服务暂时不可用', cause: safeFailureCode(caught) }, 502);
    }
  }

  try {
    return json(await callCommunity(action, data, { sessionId: '', username: '' }));
  } catch (caught) {
    console.error('[api/community] public request failed', caught);
    return json({ error: '社区服务暂时不可用', cause: safeFailureCode(caught) }, 502);
  }
}

function safeFailureCode(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  const status = message.match(/HTTP (\d{3})/);
  if (status) return `upstream_http_${status[1]}`;
  if (message.includes('非 JSON')) return 'upstream_invalid_json';
  if (message.includes('响应过大')) return 'upstream_response_too_large';
  if (message.includes('重定向')) return 'upstream_redirect_rejected';
  return 'upstream_unreachable';
}
