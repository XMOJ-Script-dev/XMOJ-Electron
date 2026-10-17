import { computed, ref } from 'vue';
export async function copyText(text: string): Promise<boolean> {
    if (!text)
        return false;
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    }
    catch {
    }
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-1000px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
    }
    catch {
        return false;
    }
}
export function useCopy(resetAfterMs = 2000) {
    const activeKey = ref<string | null>(null);
    const failed = ref(false);
    let timer: number | undefined;
    async function copy(text: string, key = 'default'): Promise<boolean> {
        if (timer)
            window.clearTimeout(timer);
        const ok = await copyText(text);
        failed.value = !ok;
        activeKey.value = ok ? key : null;
        timer = window.setTimeout(() => {
            activeKey.value = null;
            failed.value = false;
        }, resetAfterMs);
        return ok;
    }
    const copied = computed(() => activeKey.value !== null);
    function isCopied(key = 'default'): boolean {
        return activeKey.value === key;
    }
    return { copy, copied, activeKey, isCopied, failed };
}
