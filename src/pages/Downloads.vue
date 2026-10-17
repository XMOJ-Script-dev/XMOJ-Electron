<script setup lang="ts">import { computed, onMounted, ref } from 'vue';
import { Download, ExternalLink, RefreshCw } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useErrorToast } from '@/composables/useErrorToast';
import { useToasts } from '@/stores/toasts';
import { fetchSoftwareList } from '@/services/api';
import type { SoftwareEntry } from '@/shared/types';
const entries = ref<SoftwareEntry[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const filter = ref('');
useErrorToast(error);
const toasts = useToasts();
const visible = computed(() => {
    const query = filter.value.trim().toLowerCase();
    if (!query)
        return entries.value;
    return entries.value.filter((entry) => entry.name.toLowerCase().includes(query));
});
async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
        const cached = await fetchSoftwareList(true);
        if (cached.length > 0) {
            entries.value = cached;
            loading.value = false;
        }
    }
    catch {
    }
    try {
        entries.value = await fetchSoftwareList(false);
    }
    catch (caught) {
        if (entries.value.length === 0) {
            error.value = caught instanceof Error ? caught.message : String(caught);
        }
    }
    finally {
        loading.value = false;
    }
}
function openEntry(entry: SoftwareEntry): void {
    void window.xmoj.app.dialog({
        title: '下载',
        message: entry.name,
        detail: `${entry.url}\n\n请在浏览器中打开该链接完成下载。`,
        buttons: [
            { id: 'cancel', label: '取消' },
            { id: 'open', label: '复制链接' },
        ],
        defaultId: 'cancel',
        cancelId: 'cancel',
    }).then(async (result) => {
        if (result.buttonId !== 'open')
            return;
        const { copyText } = await import('@/composables/useClipboard');
        const ok = await copyText(entry.url);
        if (ok)
            toasts.success('下载链接已复制');
        else
            toasts.error('复制失败');
    });
}
onMounted(() => void load());
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">下载</h1>
        <p class="text-sm text-muted-foreground">常用 IDE、编译器与工具</p>
      </div>
      <div class="flex items-center gap-2">
        <Input v-model="filter" class="w-44" placeholder="筛选名称" />
        <Button variant="outline" size="icon" :disabled="loading" title="刷新" @click="load">
          <RefreshCw :class="loading ? 'animate-spin' : ''" />
        </Button>
      </div>
    </div>

    <div v-if="loading && entries.length === 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="index in 6" :key="index" class="h-32 w-full rounded-xl" />
    </div>

    <div v-else-if="visible.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="entry in visible"
        :key="`${entry.name}-${entry.url}`"
        type="button"
        class="flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/50"
        data-slot="software-card"
        :title="entry.url"
        @click="openEntry(entry)"
      >
        <img
          v-if="entry.image"
          :src="entry.image"
          class="size-10 shrink-0 rounded object-contain"
          alt=""
          referrerpolicy="no-referrer"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <span
          v-else
          class="flex size-10 shrink-0 items-center justify-center rounded bg-muted"
        >
          <Download class="size-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium">{{ entry.name }}</span>
          <span class="block truncate text-xs text-muted-foreground">{{ entry.url }}</span>
        </span>
        <ExternalLink class="size-4 shrink-0 text-muted-foreground" />
      </button>
    </div>

    <div
      v-else-if="!loading"
      class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
    >
      没有匹配的软件
    </div>
  </div>
</template>
