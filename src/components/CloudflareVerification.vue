<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { activeDialog } from '@/stores/dialog';
import type { CaptchaBounds, CaptchaState } from '@/shared/types';
const model = defineModel<string>({ default: '' });
const id = crypto.randomUUID();
const host = ref<HTMLElement>();
const status = ref('loading');
const error = ref('');
let unsubscribe: (() => void) | undefined;
let resize: ResizeObserver | undefined;
let mutations: MutationObserver | undefined;
let frame = 0;
let mounted = false;
let lastBounds = '';
let syncTimer: ReturnType<typeof setInterval> | undefined;
let syncing = false;
let epoch = 0;
function bounds(): CaptchaBounds {
    const rect = host.value?.getBoundingClientRect();
    let clipLeft = 0, clipRight = window.innerWidth;
    if (rect) for (const sidebar of document.querySelectorAll<HTMLElement>('[data-slot="sidebar"] [data-sidebar="sidebar"]')) {
        const expanded = sidebar.closest('[data-slot="sidebar"]')?.getAttribute('data-state') === 'expanded';
        const panel = expanded ? sidebar : sidebar.parentElement;
        if (!panel?.checkVisibility()) continue;
        const cover = panel.getBoundingClientRect();
        if (cover.top >= rect.bottom || cover.bottom <= rect.top) continue;
        if (cover.left <= rect.left && cover.right > rect.left) clipLeft = Math.max(clipLeft, cover.right);
        else if (cover.right >= rect.right && cover.left < rect.right) clipRight = Math.min(clipRight, cover.left);
    }
    return {
        x: rect?.x ?? 0, y: rect?.y ?? 0, width: rect?.width ?? 0, height: rect?.height ?? 0,
        clipLeft, clipRight,
        visible: !!rect && !!host.value?.checkVisibility() && !activeDialog.value && !document.querySelector('[role="dialog"],[role="menu"],[data-slot="sheet-content"]'),
    };
}
function updateBounds(): void {
    if (!mounted) return;
    const next = bounds();
    if (!next.visible) {
        cancelAnimationFrame(frame); frame = 0;
        const serialized = JSON.stringify(next);
        if (lastBounds !== serialized) {
            lastBounds = serialized;
            void window.xmoj.bbs.captcha({ id, action: 'bounds', bounds: next }).catch(() => {});
        }
        return;
    }
    if (frame) return;
    frame = requestAnimationFrame(() => {
        frame = 0;
        const value = bounds();
        const serialized = JSON.stringify(value);
        if (lastBounds === serialized) return;
        lastBounds = serialized;
        void window.xmoj.bbs.captcha({ id, action: 'bounds', bounds: value }).catch(() => {});
    });
}
async function reset(): Promise<void> {
    epoch++;
    error.value = ''; status.value = 'loading'; model.value = '';
    try { await window.xmoj.bbs.captcha({ id, action: 'reset', bounds: bounds() }); }
    catch (caught) { status.value = 'error'; error.value = caught instanceof Error ? caught.message : String(caught); }
}
watch(model, (value, previous) => { if (mounted && previous && !value && status.value === 'success') void reset(); });
watch(activeDialog, updateBounds);
function applyState(state: CaptchaState): void {
    if (!mounted || state.id !== id) return;
    epoch++;
    status.value = state.status;
    error.value = state.message ?? '';
    model.value = state.status === 'success' ? state.token ?? '' : '';
}
async function syncState(): Promise<void> {
    if (!mounted || syncing) return;
    syncing = true;
    const current = epoch;
    try { const state = await window.xmoj.bbs.captchaState(id); if (state && current === epoch) applyState(state); }
    catch { /* A transient IPC failure must not clear a verified token. */ }
    finally { syncing = false; }
}
onMounted(() => {
    mounted = true;
    unsubscribe = window.xmoj.bbs.onCaptchaState(applyState);
    resize = new ResizeObserver(updateBounds);
    if (host.value) resize.observe(host.value);
    mutations = new MutationObserver(updateBounds);
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open', 'data-state'] });
    window.addEventListener('scroll', updateBounds, true);
    window.addEventListener('resize', updateBounds);
    document.addEventListener('transitionend', updateBounds, true);
    syncTimer = setInterval(() => { void syncState(); }, 1500);
    void window.xmoj.bbs.captcha({ id, action: 'mount', bounds: bounds() }).then(syncState).catch(caught => { status.value = 'error'; error.value = String(caught); });
});
onBeforeUnmount(() => {
    mounted = false;
    clearInterval(syncTimer);
    cancelAnimationFrame(frame);
    resize?.disconnect(); mutations?.disconnect(); unsubscribe?.();
    window.removeEventListener('scroll', updateBounds, true);
    window.removeEventListener('resize', updateBounds);
    document.removeEventListener('transitionend', updateBounds, true);
    void window.xmoj.bbs.captcha({ id, action: 'unmount' }).catch(() => {});
    model.value = '';
});
</script>
<template>
  <div class="space-y-2" data-slot="cloudflare-verification" :data-state="status">
    <div ref="host" class="h-20 w-[min(100%,320px)] rounded-md bg-white" data-slot="cloudflare-widget" aria-label="Cloudflare 人机验证码" />
    <div v-if="error" class="flex items-center gap-2">
      <p class="text-xs text-destructive" role="alert">{{ error }}</p>
      <Button type="button" variant="outline" size="sm" @click="reset">重新验证</Button>
    </div>
  </div>
</template>
