import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { XMOJ_API_ORIGIN } from '../src/shared/types.ts';
import type { ApiEnvelope, BbsBoard, BbsMention, BbsPostDetail, BbsPostPage, MailMessage, MailMention, MailThreadSummary, UserBadge, } from '../src/shared/community.ts';
import { UNAUTHENTICATED_ACTIONS } from '../src/shared/community.ts';
import type { HttpClient } from './http.ts';
const CLIENT_VERSION = '4.0.5';
const LEGACY_BACKEND_MESSAGE = '参数Token未知';
const UNKNOWN_PAGE_MESSAGE = '访问的页面不存在';
export interface CommunityCredentials {
    sessionId: string;
    username: string;
}
export interface TokenStore {
    get(username: string): string | null;
    set(username: string, token: string): void;
    clear(username: string): void;
}
export function createMemoryTokenStore(): TokenStore {
    const tokens = new Map<string, string>();
    return {
        get: (username) => tokens.get(username) ?? null,
        set: (username, token) => void tokens.set(username, token),
        clear: (username) => void tokens.delete(username),
    };
}
export function createFileTokenStore(filePath: string): TokenStore {
    const raw = ((): Record<string, string> => {
        try {
            return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, string>;
        }
        catch {
            return {};
        }
    })();
    const tokens = new Map<string, string>(Object.entries(raw));
    const flush = (): void => {
        try {
            mkdirSync(path.dirname(filePath), { recursive: true });
            writeFileSync(filePath, JSON.stringify(Object.fromEntries(tokens), null, 2), {
                encoding: 'utf8',
                mode: 0o600,
            });
        }
        catch {
        }
    };
    return {
        get: (username) => tokens.get(username) ?? null,
        set: (username, token) => {
            tokens.set(username, token);
            flush();
        },
        clear: (username) => {
            tokens.delete(username);
            flush();
        },
    };
}
export class CommunityApi {
    private token: string | null = null;
    private legacyMode = false;
    private usernameHint: string | null = null;
    private inflightLogin: Promise<string> | null = null;
    private readonly http: HttpClient;
    private readonly tokens: TokenStore;
    private readonly baseUrl: string;
    constructor(http: HttpClient, tokens: TokenStore = createMemoryTokenStore(), baseUrl: string = XMOJ_API_ORIGIN) {
        this.http = http;
        this.tokens = tokens;
        this.baseUrl = baseUrl;
    }
    reset(credentials?: CommunityCredentials): void {
        this.token = null;
        this.legacyMode = false;
        if (credentials)
            this.tokens.clear(credentials.username);
    }
    private async post(action: string, authentication: Record<string, unknown>, data: unknown): Promise<ApiEnvelope<unknown>> {
        const body = JSON.stringify({
            Authentication: authentication,
            Data: data,
            Version: CLIENT_VERSION,
            DebugMode: false,
        });
        const response = await this.http.request(`${this.baseUrl}/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'XMOJ-UserID': this.usernameHint ?? '',
                'XMOJ-Script-Version': CLIENT_VERSION,
                DebugMode: 'false',
            },
            body,
            timeoutMs: 20000,
        });
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`社区后端返回 HTTP ${response.status}`);
        }
        try {
            return JSON.parse(response.body) as ApiEnvelope<unknown>;
        }
        catch {
            throw new Error('社区后端返回了非 JSON 内容');
        }
    }
    private async ensureToken(credentials: CommunityCredentials): Promise<string> {
        if (this.token)
            return this.token;
        const cached = this.tokens.get(credentials.username);
        if (cached) {
            this.token = cached;
            return cached;
        }
        if (this.inflightLogin)
            return this.inflightLogin;
        this.inflightLogin = (async () => {
            try {
                const result = await this.post('Login', { SessionID: credentials.sessionId, Username: credentials.username }, {});
                const token = (result.Data as {
                    Token?: string;
                } | undefined)?.Token;
                if (result.Success && typeof token === 'string' && token) {
                    this.token = token;
                    this.tokens.set(credentials.username, token);
                    return token;
                }
                if (result.Message === UNKNOWN_PAGE_MESSAGE) {
                    this.legacyMode = true;
                    return '';
                }
                throw new Error(result.Message || '无法获取社区后端令牌');
            }
            finally {
                this.inflightLogin = null;
            }
        })();
        return this.inflightLogin;
    }
    private authFor(token: string, credentials: CommunityCredentials): Record<string, unknown> {
        if (this.legacyMode || !token) {
            return { SessionID: credentials.sessionId, Username: credentials.username };
        }
        return { Token: token };
    }
    async call<T>(action: string, data: unknown, credentials: CommunityCredentials): Promise<ApiEnvelope<T>> {
        this.usernameHint = credentials.username;
        const unauthenticated = (UNAUTHENTICATED_ACTIONS as readonly string[]).includes(action);
        let token = '';
        if (!unauthenticated) {
            try {
                token = await this.ensureToken(credentials);
            }
            catch (error) {
                return {
                    Success: false,
                    Message: error instanceof Error ? error.message : String(error),
                    Data: {} as T & Record<string, never>,
                };
            }
        }
        let result = await this.post(action, this.authFor(token, credentials), data) as ApiEnvelope<T>;
        if (!result.Success &&
            result.Message === LEGACY_BACKEND_MESSAGE &&
            !this.legacyMode) {
            this.legacyMode = true;
            this.token = null;
            this.tokens.clear(credentials.username);
            result = await this.post(action, this.authFor('', credentials), data) as ApiEnvelope<T>;
        }
        if (!result.Success && result.Data) {
            if (result.Data.TokenInvalid) {
                this.token = null;
                this.tokens.clear(credentials.username);
                const fresh = await this.ensureToken(credentials);
                result = await this.post(action, this.authFor(fresh, credentials), data) as ApiEnvelope<T>;
            }
            else if (result.Data.SessionRequired) {
                result = await this.post(action, { ...this.authFor(this.token ?? '', credentials), SessionID: credentials.sessionId }, data) as ApiEnvelope<T>;
            }
        }
        return result;
    }
    async require<T>(action: string, data: unknown, credentials: CommunityCredentials): Promise<T> {
        const envelope = await this.call<T>(action, data, credentials);
        if (!envelope.Success)
            throw new Error(envelope.Message || `${action} 失败`);
        return envelope.Data;
    }
    getNotice(credentials: CommunityCredentials) {
        return this.call<{
            Notice: string;
        }>('GetNotice', {}, credentials);
    }
    getBoards(credentials: CommunityCredentials) {
        return this.call<{
            Boards: BbsBoard[];
        }>('GetBoards', {}, credentials);
    }
    getPosts(credentials: CommunityCredentials, boardId: number, page: number, problemId = 0) {
        return this.call<BbsPostPage>('GetPosts', { ProblemID: Number(problemId) || 0, Page: Number(page), BoardID: Number(boardId) }, credentials);
    }
    getPost(credentials: CommunityCredentials, postId: number, page: number) {
        return this.call<BbsPostDetail>('GetPost', { PostID: Number(postId), Page: Number(page) }, credentials);
    }
    getPostCount(credentials: CommunityCredentials, problemId: number) {
        return this.call<{
            DiscussCount: number;
        }>('GetPostCount', { ProblemID: Number(problemId) }, credentials);
    }
    newPost(credentials: CommunityCredentials, boardId: number, title: string, content: string, problemId = 0, captchaSecretKey = '') {
        return this.call<{
            PostID: number;
        }>('NewPost', {
            Title: String(title),
            Content: String(content),
            ProblemID: Number(problemId) || 0,
            CaptchaSecretKey: String(captchaSecretKey),
            BoardID: Number(boardId),
        }, credentials);
    }
    newReply(credentials: CommunityCredentials, postId: number, content: string, captchaSecretKey = '') {
        return this.call('NewReply', {
            PostID: Number(postId),
            Content: String(content),
            CaptchaSecretKey: String(captchaSecretKey),
        }, credentials);
    }
    deletePost(credentials: CommunityCredentials, postId: number) {
        return this.call('DeletePost', { PostID: Number(postId) }, credentials);
    }
    deleteReply(credentials: CommunityCredentials, replyId: number) {
        return this.call('DeleteReply', { ReplyID: Number(replyId) }, credentials);
    }
    editReply(credentials: CommunityCredentials, replyId: number, content: string) {
        return this.call('EditReply', { ReplyID: Number(replyId), Content: String(content) }, credentials);
    }
    getMailList(credentials: CommunityCredentials) {
        return this.call<{
            MailList: MailThreadSummary[];
        }>('GetMailList', {}, credentials);
    }
    getMail(credentials: CommunityCredentials, otherUser: string) {
        return this.call<{
            Mail: MailMessage[];
        }>('GetMail', { OtherUser: String(otherUser) }, credentials);
    }
    sendMail(credentials: CommunityCredentials, toUser: string, content: string) {
        return this.call('SendMail', { ToUser: String(toUser), Content: String(content) }, credentials);
    }
    getMailMentionList(credentials: CommunityCredentials) {
        return this.call<{
            MentionList: MailMention[];
        }>('GetMailMentionList', {}, credentials);
    }
    getBbsMentionList(credentials: CommunityCredentials) {
        return this.call<{
            MentionList: BbsMention[];
        }>('GetBBSMentionList', {}, credentials);
    }
    readMailMention(credentials: CommunityCredentials, mentionId: number) {
        return this.call('ReadMailMention', { MentionID: Number(mentionId) }, credentials);
    }
    readBbsMention(credentials: CommunityCredentials, mentionId: number) {
        return this.call('ReadBBSMention', { MentionID: Number(mentionId) }, credentials);
    }
    getStdList(credentials: CommunityCredentials) {
        return this.call<{
            StdList: number[];
        }>('GetStdList', {}, credentials);
    }
    getStd(credentials: CommunityCredentials, problemId: number) {
        return this.call<{
            StdCode: string;
        }>('GetStd', { ProblemID: Number(problemId) }, credentials);
    }
    uploadStd(credentials: CommunityCredentials, problemId: number) {
        return this.call('UploadStd', { ProblemID: Number(problemId) }, credentials);
    }
    uploadImage(credentials: CommunityCredentials, dataUrl: string) {
        return this.call<{
            ImageID: string;
        }>('UploadImage', { Image: String(dataUrl) }, credentials);
    }
    getBadge(credentials: CommunityCredentials, userId: string) {
        return this.call<UserBadge>('GetBadge', { UserID: String(userId) }, credentials);
    }
    lastOnline(credentials: CommunityCredentials, username: string) {
        return this.call<{
            logintime: number | null;
        }>('LastOnline', { Username: username }, credentials);
    }
    async getUserSettings(credentials: CommunityCredentials): Promise<ApiEnvelope<{
        Settings: Record<string, unknown>;
    }>> {
        const response = await this.call<{
            Settings?: unknown;
        }>('GetUserSettings', {}, credentials);
        let settings: Record<string, unknown> = {};
        if (typeof response.Data?.Settings === 'string') {
            try {
                const parsed = JSON.parse(response.Data.Settings) as unknown;
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    settings = parsed as Record<string, unknown>;
                }
            }
            catch {
            }
        }
        else if (response.Data?.Settings && typeof response.Data.Settings === 'object') {
            settings = response.Data.Settings as Record<string, unknown>;
        }
        return { ...response, Data: { Settings: settings } };
    }
    setUserSettings(credentials: CommunityCredentials, settings: Record<string, unknown>) {
        return this.call('SetUserSettings', { Settings: JSON.stringify(settings) }, credentials);
    }
}
export function isMissingBadgeMessage(message: string | undefined): boolean {
    if (!message)
        return false;
    return /标签\s*(在数据库中\s*)?不存在/.test(message);
}
