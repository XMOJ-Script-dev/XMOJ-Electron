import { ref, shallowRef } from 'vue';
export interface AsyncResource<T> {
    data: ReturnType<typeof shallowRef<T | null>>;
    loading: ReturnType<typeof ref<boolean>>;
    error: ReturnType<typeof ref<string | null>>;
    run: () => Promise<void>;
}
export interface CachedResource<T> extends AsyncResource<T> {
    stale: ReturnType<typeof ref<boolean>>;
    fetchedAt: ReturnType<typeof ref<number | null>>;
    loadCacheFirst: () => Promise<void>;
}
export function useAsyncResource<T>(loader: () => Promise<T>): AsyncResource<T> {
    const data = shallowRef<T | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    let token = 0;
    async function run(): Promise<void> {
        const current = ++token;
        loading.value = true;
        error.value = null;
        try {
            const result = await loader();
            if (current !== token)
                return;
            data.value = result;
        }
        catch (caught) {
            if (current !== token)
                return;
            error.value = caught instanceof Error ? caught.message : String(caught);
        }
        finally {
            if (current === token)
                loading.value = false;
        }
    }
    return { data, loading, error, run };
}
export function useCachedResource<T>(cached: () => Promise<T | null>, fresh: () => Promise<T>): CachedResource<T> {
    const data = shallowRef<T | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const stale = ref(false);
    const fetchedAt = ref<number | null>(null);
    let token = 0;
    async function load(fetchCached: boolean): Promise<void> {
        const current = ++token;
        error.value = null;
        if (fetchCached) {
            try {
                const value = await cached();
                if (current !== token)
                    return;
                if (value !== null) {
                    data.value = value;
                    stale.value = true;
                }
            }
            catch {
            }
        }
        if (data.value === null)
            loading.value = true;
        try {
            const value = await fresh();
            if (current !== token)
                return;
            data.value = value;
            fetchedAt.value = Date.now();
            stale.value = false;
        }
        catch (caught) {
            if (current !== token)
                return;
            error.value = caught instanceof Error ? caught.message : String(caught);
        }
        finally {
            if (current === token)
                loading.value = false;
        }
    }
    return {
        data,
        loading,
        error,
        stale,
        fetchedAt,
        run: () => load(false),
        loadCacheFirst: () => load(true),
    };
}
