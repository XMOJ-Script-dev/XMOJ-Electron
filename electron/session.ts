import { app, safeStorage } from 'electron';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { XMOJ_ORIGIN, type AvatarInfo, type LoginResult, type SessionState, type SessionUser, } from '../src/shared/types.ts';
import { CookieJar, HttpClient, type Cookie } from './http.ts';
import { isAlreadyLoggedInResponse, isLoginFailureAlert, isLoginGate, parseAccountEmail, parseLoginAlert, parseProfile, parseProfileScript, } from './parsers.ts';
function findProfileScriptSrc(html: string): string | null {
    const match = html.match(/<script[^>]+src\s*=\s*["']?([^"'\s>]*profile\.php[^"'\s>]*)["']?/i);
    return match ? match[1] : null;
}
interface PersistedSession {
    version: 1;
    cookies: Cookie[];
    username?: string;
    secret?: string;
}
const ADMIN_USERS = new Set(['zhuchenrui2', 'shanwenxiao', 'chenlangning', 'admin']);
function isAdminUser(username: string): boolean {
    return ADMIN_USERS.has(username.toLowerCase());
}
function avatarFromEmail(email: string, cacheBust = false): AvatarInfo {
    const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex');
    const params = new URLSearchParams({ retro: '1', s: '160' });
    if (cacheBust)
        params.set('_', String(Date.now()));
    return { hash, url: `https://cravatar.cn/avatar/${hash}?${params.toString()}` };
}
export class SessionManager {
    readonly http: HttpClient;
    private user: SessionUser | null = null;
    private verifiedAt: number | null = null;
    private rememberedUsername: string | null = null;
    private rememberedSecret: string | null = null;
    private inflightLogin: Promise<LoginResult> | null = null;
    private readonly avatarCache = new Map<string, AvatarInfo | null>();
    constructor(httpClient: HttpClient = new HttpClient()) {
        this.http = httpClient;
    }
    private get storePath(): string {
        return path.join(app.getPath('userData'), 'session.json');
    }
    async load(): Promise<void> {
        try {
            const raw = await readFile(this.storePath, 'utf8');
            const parsed = JSON.parse(raw) as PersistedSession;
            if (parsed.version === 1 && Array.isArray(parsed.cookies)) {
                const restored = new CookieJar(parsed.cookies).toJSON();
                this.http.jar.clear();
                for (const cookie of restored)
                    this.http.jar.restore(cookie);
            }
            this.rememberedUsername = parsed.username ?? null;
            this.rememberedSecret = parsed.secret ?? null;
        }
        catch {
        }
    }
    private async save(): Promise<void> {
        const payload: PersistedSession = {
            version: 1,
            cookies: this.http.jar.toJSON(),
        };
        if (this.rememberedUsername)
            payload.username = this.rememberedUsername;
        if (this.rememberedSecret)
            payload.secret = this.rememberedSecret;
        try {
            await mkdir(path.dirname(this.storePath), { recursive: true });
            await writeFile(this.storePath, JSON.stringify(payload, null, 2), 'utf8');
        }
        catch (error) {
            console.error('[session] 无法保存会话:', error);
        }
    }
    private decryptSecret(): string | null {
        if (!this.rememberedSecret)
            return null;
        try {
            if (!safeStorage.isEncryptionAvailable())
                return null;
            return safeStorage.decryptString(Buffer.from(this.rememberedSecret, 'base64'));
        }
        catch {
            return null;
        }
    }
    private encryptSecret(plaintext: string): string | null {
        try {
            if (!safeStorage.isEncryptionAvailable())
                return null;
            return safeStorage.encryptString(plaintext).toString('base64');
        }
        catch {
            return null;
        }
    }
    snapshot(): SessionState {
        const sessionId = this.http.jar.get('PHPSESSID');
        return {
            authenticated: this.user !== null && sessionId !== null,
            user: this.user,
            sessionId,
            verifiedAt: this.verifiedAt,
            rememberedUsername: this.rememberedUsername,
            canSilentLogin: this.hasRememberedPassword,
        };
    }
    get rememberedUser(): string | null {
        return this.rememberedUsername;
    }
    async accountEmail(): Promise<string | null> {
        if (!this.user)
            return null;
        const email = await this.fetchEmail();
        if (email && this.user)
            this.user = { ...this.user, email };
        return email;
    }
    async avatar(cacheBust = false): Promise<AvatarInfo | null> {
        const email = this.user?.email ?? (await this.fetchEmail());
        if (email && this.user)
            this.user = { ...this.user, email };
        if (!email)
            return null;
        return avatarFromEmail(email, cacheBust);
    }
    async avatarFor(username: string): Promise<AvatarInfo | null> {
        const name = username.trim();
        if (!name)
            return null;
        if (this.user && this.user.username === name)
            return this.avatar();
        const cached = this.avatarCache.get(name);
        if (cached !== undefined)
            return cached;
        let result: AvatarInfo | null = null;
        try {
            const email = await this.fetchEmailFor(name);
            result = email ? avatarFromEmail(email) : null;
        }
        catch {
            result = null;
        }
        this.avatarCache.set(name, result);
        return result;
    }
    private async fetchEmailFor(username: string): Promise<string | null> {
        if (!this.http)
            return null;
        const response = await this.http.get(`${XMOJ_ORIGIN}/userinfo.php?user=${encodeURIComponent(username)}`);
        return parseAccountEmail(response.body);
    }
    get hasRememberedPassword(): boolean {
        return this.decryptSecret() !== null;
    }
    async verify(): Promise<SessionState> {
        if (!this.http.jar.get('PHPSESSID')) {
            this.user = null;
            this.verifiedAt = null;
            return this.snapshot();
        }
        try {
            const response = await this.http.get(`${XMOJ_ORIGIN}/loginpage.php`);
            const live = isAlreadyLoggedInResponse(response.body) && !isLoginGate(response.body);
            if (live) {
                this.user = await this.resolveUser();
                this.verifiedAt = this.user ? Date.now() : null;
                if (!this.user)
                    this.http.jar.delete('PHPSESSID');
            }
            else {
                this.user = null;
                this.verifiedAt = null;
                this.http.jar.delete('PHPSESSID');
            }
        }
        catch (error) {
            console.error('[session] 校验会话失败:', error);
            this.user = null;
            this.verifiedAt = null;
        }
        await this.save();
        return this.snapshot();
    }
    private async resolveUser(): Promise<SessionUser | null> {
        let username: string | null = null;
        try {
            const response = await this.http.get(`${XMOJ_ORIGIN}/index.php`);
            const scriptPath = findProfileScriptSrc(response.body);
            if (scriptPath) {
                const scriptUrl = new URL(scriptPath, XMOJ_ORIGIN).href;
                const script = await this.http.get(scriptUrl);
                username = parseProfileScript(script.body).username;
            }
            if (!username)
                username = parseProfile(response.body).username;
        }
        catch (error) {
            console.error('[session] 读取用户信息失败:', error);
        }
        if (!username)
            username = this.rememberedUsername;
        if (!username)
            return null;
        return {
            username,
            isAdmin: isAdminUser(username),
            email: await this.fetchEmail(),
        };
    }
    private async fetchEmail(): Promise<string | null> {
        try {
            const response = await this.http.get(`${XMOJ_ORIGIN}/modifypage.php`);
            return parseAccountEmail(response.body);
        }
        catch (error) {
            console.error('[session] 读取邮箱失败:', error);
            return null;
        }
    }
    async login(username: string, password: string, remember = false): Promise<LoginResult> {
        if (this.inflightLogin)
            return this.inflightLogin;
        this.inflightLogin = (async (): Promise<LoginResult> => {
            const trimmed = username.trim();
            if (!trimmed || !password) {
                return {
                    ok: false,
                    message: '请输入用户名和密码',
                    state: this.snapshot(),
                };
            }
            try {
                this.http.jar.clear();
                this.user = null;
                this.verifiedAt = null;
                const response = await this.http.post(`${XMOJ_ORIGIN}/login.php`, {
                    user_id: trimmed,
                    password,
                    return_url: '',
                    submit: '登录',
                });
                const alert = parseLoginAlert(response.body);
                if (isLoginFailureAlert(alert)) {
                    return { ok: false, message: alert ?? '登录失败', state: this.snapshot() };
                }
                if (!this.http.jar.get('PHPSESSID')) {
                    return {
                        ok: false,
                        message: '登录失败：服务器未下发会话 Cookie',
                        state: this.snapshot(),
                    };
                }
                const resolved = await this.resolveUser();
                if (!resolved) {
                    this.http.jar.delete('PHPSESSID');
                    return {
                        ok: false,
                        message: '登录状态未能确认，请检查用户名与密码',
                        state: this.snapshot(),
                    };
                }
                this.user = resolved;
                this.verifiedAt = Date.now();
                this.rememberedUsername = trimmed;
                if (remember) {
                    this.rememberedSecret = this.encryptSecret(password);
                }
                else {
                    this.rememberedSecret = null;
                }
                await this.save();
                return { ok: true, state: this.snapshot() };
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                return { ok: false, message, state: this.snapshot() };
            }
            finally {
                this.inflightLogin = null;
            }
        })();
        return this.inflightLogin;
    }
    async trySilentLogin(): Promise<SessionState> {
        const existing = await this.verify();
        if (existing.authenticated)
            return existing;
        const username = this.rememberedUsername;
        const password = this.decryptSecret();
        if (!username || !password)
            return this.snapshot();
        const result = await this.login(username, password, true);
        return result.state;
    }
    async logout(): Promise<SessionState> {
        try {
            await this.http.get(`${XMOJ_ORIGIN}/logout.php`);
        }
        catch (error) {
            console.error('[session] 注销请求失败:', error);
        }
        this.http.jar.clear();
        this.user = null;
        this.verifiedAt = null;
        this.rememberedSecret = null;
        try {
            await rm(this.storePath, { force: true });
        }
        catch {
        }
        await this.save();
        return this.snapshot();
    }
    rotateSessionId(): void {
        const value = randomBytes(21).toString('base64url').slice(0, 28);
        this.http.jar.set('PHPSESSID', value, 'www.xmoj.tech', '/');
    }
}
