import { computed, reactive, watch } from 'vue';
export type ThemePreference = 'light' | 'dark' | 'auto';
export interface Preferences {
    theme: ThemePreference;
    animations: boolean;
    units: boolean;
    relativeTime: boolean;
    autoRefresh: boolean;
    autoRefreshSeconds: number;
    confirmLeave: boolean;
}
const STORAGE_KEY = 'xmoj.preferences.v1';
const SCHEMA_VERSION = 2;
const DEFAULTS: Preferences = {
    theme: 'auto',
    animations: true,
    units: true,
    relativeTime: false,
    autoRefresh: true,
    autoRefreshSeconds: 10,
    confirmLeave: false,
};
const SYNCED_KEYS = [
    'theme',
    'animations',
    'units',
    'relativeTime',
    'autoRefresh',
    'autoRefreshSeconds',
    'confirmLeave',
] as const satisfies readonly (keyof Preferences)[];
export type SyncedKey = (typeof SYNCED_KEYS)[number];
function load(): Preferences {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return { ...DEFAULTS };
        const parsed = JSON.parse(raw) as Partial<Preferences>;
        const merged = { ...DEFAULTS };
        for (const key of Object.keys(DEFAULTS) as (keyof Preferences)[]) {
            const value = parsed[key];
            if (typeof value === typeof DEFAULTS[key]) {
                ;
                (merged as Record<string, unknown>)[key] = value;
            }
        }
        return merged;
    }
    catch {
        return { ...DEFAULTS };
    }
}
const state = reactive<Preferences>(load());
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(): void {
    const resolved = state.theme === 'auto' ? (mediaQuery.matches ? 'dark' : 'light') : state.theme;
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
}
function applyAnimations(): void {
    document.documentElement.dataset.animations = state.animations ? 'on' : 'off';
}
function applyConfirmLeave(): void {
    void window.xmoj?.app?.setConfirmLeave(state.confirmLeave).catch(() => undefined);
}
function persist(): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state }));
    }
    catch {
    }
}
watch(() => ({ ...state }), () => {
    applyTheme();
    applyAnimations();
    applyConfirmLeave();
    persist();
}, { deep: true });
mediaQuery.addEventListener('change', () => {
    if (state.theme === 'auto')
        applyTheme();
});
export function initPreferences(): void {
    applyTheme();
    applyAnimations();
    applyConfirmLeave();
}
export interface RemoteSettingsResult {
    applied: number;
    rejected: string[];
}
export function collectSyncedSettings(): Record<string, unknown> {
    const out: Record<string, unknown> = { __version: SCHEMA_VERSION };
    for (const key of SYNCED_KEYS)
        out[key] = state[key];
    return out;
}
export function applySyncedSettings(remote: Record<string, unknown> | null | undefined): RemoteSettingsResult {
    const rejected: string[] = [];
    let applied = 0;
    if (!remote || typeof remote !== 'object')
        return { applied, rejected };
    const source = remote as Record<string, unknown>;
    const needsMigration = typeof source.__version !== 'number' || source.__version < SCHEMA_VERSION;
    for (const key of SYNCED_KEYS) {
        if (!(key in source)) {
            if (needsMigration)
                rejected.push(key);
            continue;
        }
        const value = source[key];
        if (typeof value !== typeof DEFAULTS[key]) {
            rejected.push(key);
            continue;
        }
        if (key === 'theme' && !['light', 'dark', 'auto'].includes(String(value))) {
            rejected.push(key);
            continue;
        }
        if (key === 'autoRefreshSeconds') {
            const seconds = Number(value);
            if (!Number.isFinite(seconds) || seconds < 5 || seconds > 60) {
                rejected.push(key);
                continue;
            }
        }
        ;
        (state as Record<string, unknown>)[key] = value;
        applied += 1;
    }
    return { applied, rejected };
}
export function usePreferences() {
    function reset(): void {
        Object.assign(state, DEFAULTS);
    }
    return {
        preferences: state,
        theme: computed(() => state.theme),
        resolvedTheme: computed<'light' | 'dark'>(() => state.theme === 'auto' ? (mediaQuery.matches ? 'dark' : 'light') : state.theme),
        reset,
    };
}
export { DEFAULTS as DEFAULT_PREFERENCES, SCHEMA_VERSION as PREFERENCES_SCHEMA_VERSION, STORAGE_KEY as PREFERENCES_STORAGE_KEY, SYNCED_KEYS as SYNCED_PREFERENCE_KEYS, };
