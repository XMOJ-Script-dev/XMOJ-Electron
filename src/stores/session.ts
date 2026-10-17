import { computed, reactive } from 'vue';
import type { SessionState } from '@/shared/types';
const EMPTY_STATE: SessionState = {
    authenticated: false,
    user: null,
    sessionId: null,
    verifiedAt: null,
    rememberedUsername: null,
    canSilentLogin: false,
};
const state = reactive({
    loading: true,
    submitting: false,
    error: null as string | null,
    user: null as SessionState['user'],
    authenticated: false,
    rememberedUsername: null as string | null,
    canSilentLogin: false,
});
function apply(next: SessionState): void {
    state.user = next.user;
    state.authenticated = next.authenticated;
    state.rememberedUsername = next.rememberedUsername;
    state.canSilentLogin = next.canSilentLogin;
}
async function initialise(): Promise<void> {
    state.loading = true;
    state.error = null;
    try {
        const current = await window.xmoj.session.get();
        apply(current);
        if (!current.authenticated) {
            apply(await window.xmoj.session.verify());
        }
    }
    catch (error) {
        state.error = error instanceof Error ? error.message : String(error);
    }
    finally {
        state.loading = false;
    }
}
async function login(username: string, password: string, remember: boolean): Promise<boolean> {
    state.submitting = true;
    state.error = null;
    try {
        const result = await window.xmoj.session.login({ username, password, remember });
        apply(result.state);
        if (!result.ok) {
            state.error = result.message ?? '登录失败';
            return false;
        }
        return true;
    }
    catch (error) {
        state.error = error instanceof Error ? error.message : String(error);
        return false;
    }
    finally {
        state.submitting = false;
    }
}
async function logout(): Promise<void> {
    state.submitting = true;
    state.error = null;
    try {
        apply(await window.xmoj.session.logout());
    }
    catch (error) {
        state.error = error instanceof Error ? error.message : String(error);
    }
    finally {
        state.submitting = false;
    }
}
export function useSession() {
    return {
        state,
        isAuthenticated: computed(() => state.authenticated),
        username: computed(() => state.user?.username ?? ''),
        isAdmin: computed(() => Boolean(state.user?.isAdmin)),
        initialise,
        login,
        logout,
    };
}
export { EMPTY_STATE };
