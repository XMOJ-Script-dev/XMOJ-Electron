<script setup lang="ts">import { AlertTriangle, Check, Download, Info, X } from '@lucide/vue';
import { onMounted, onBeforeUnmount } from 'vue';
import { activeDownloads, updateDownload, removeDownload } from '@/stores/downloads';
import { useToasts } from '@/stores/toasts';
const toasts = useToasts();
async function cancel(id: string): Promise<void> {
    try { await window.xmoj.downloads.cancel(id); }
    catch (error) { toasts.error(String(error)); }
}
let unsubscribe: (() => void) | undefined;
const timers = new Set<ReturnType<typeof setTimeout>>();
onMounted(() => {
    unsubscribe = window.xmoj.events.onDownloadProgress(progress => {
        updateDownload(progress);
        if (progress.state === 'completed') {
            const timer = setTimeout(() => { removeDownload(progress.id); timers.delete(timer); }, 700);
            timers.add(timer);
        } else if (progress.state === 'interrupted') toasts.error(`下载失败：${progress.fileName}`);
    });
});
onBeforeUnmount(() => { unsubscribe?.(); for (const timer of timers) clearTimeout(timer); });
const TONE = {
    error: { icon: AlertTriangle, class: 'border-destructive/50 bg-destructive/10 text-destructive' },
    warning: { icon: AlertTriangle, class: 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    success: { icon: Check, class: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    info: { icon: Info, class: 'border-border bg-popover' },
} as const;
</script>

<template>
  <div
    class="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2"
  >
    <TransitionGroup
      enter-from-class="translate-y-2 opacity-0"
      enter-active-class="transition duration-200"
      leave-to-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150"
    >
      <div v-for="download in activeDownloads" :key="download.id" data-slot="download-progress" class="pointer-events-auto relative isolate flex items-center gap-2 overflow-hidden rounded-lg border border-neutral-200 bg-white px-3 py-3 text-black shadow-lg" role="progressbar" :aria-label="`正在下载：${download.fileName}`" :aria-valuenow="download.totalBytes > 0 ? Math.min(100, Math.round(download.receivedBytes / download.totalBytes * 100)) : undefined" :aria-valuemin="0" :aria-valuemax="100">
        <div class="absolute inset-y-0 left-0 -z-10 bg-sky-200 transition-[width] duration-300" :class="download.totalBytes <= 0 ? 'animate-pulse' : ''" :style="{ width: download.state === 'completed' ? '100%' : download.totalBytes > 0 ? `${Math.min(100, download.receivedBytes / download.totalBytes * 100)}%` : '30%' }" />
        <Download class="size-4 shrink-0" />
        <p class="min-w-0 flex-1 break-words text-sm">正在下载：{{ download.fileName }}</p>
        <button v-if="download.state !== 'completed'" class="shrink-0 rounded p-1 hover:bg-black/10" title="终止下载" aria-label="终止下载" @click="cancel(download.id)"><X class="size-4" /></button>
      </div>
      <div
        v-for="toast in toasts.items.value"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur"
        :class="TONE[toast.tone].class"
        role="alert"
      >
        <component :is="TONE[toast.tone].icon" class="mt-0.5 size-4 shrink-0" />
        <p class="min-w-0 flex-1 text-sm break-words whitespace-pre-wrap">{{ toast.message }}</p>
        <button
          class="-m-1 shrink-0 rounded p-1 opacity-70 hover:opacity-100"
          title="关闭"
          @click="toasts.dismiss(toast.id)"
        >
          <X class="size-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
