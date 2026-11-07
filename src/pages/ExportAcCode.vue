<script setup lang="ts">import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { Download, FolderOpen, Loader2 } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { exportAcCode, fetchAllProblems, fetchUserProfile } from '@/services/api';
import { useSession } from '@/stores/session';
import type { ExportResult, ProblemsetEntry } from '@/shared/types';
const LANGUAGE_FILTERS = ['C++', 'C', 'Pascal'];
const session = useSession();
const problems = ref<ProblemsetEntry[]>([]);
const loading = ref(false);
const exporting = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const result = ref<ExportResult | null>(null);
const search = ref('');
const onlySolved = ref(true);
const selectedLanguages = ref<string[]>([...LANGUAGE_FILTERS]);
const progress = ref<{ done: number; total: number; problemId: number } | null>(null);
let unsubscribe: (() => void) | undefined;
let token = 0;
async function load(): Promise<void> {
    const current = ++token;
    loading.value = true;
    error.value = null;
    try {
        const username = session.state.user?.username;
        if (!username) throw new Error('请先登录');
        const profile = await fetchUserProfile(username);
        const all = await fetchAllProblems(true).catch(() => null);
        if (current !== token) return;
        const titles = new Map(all?.problems.map(problem => [problem.id, problem.title]) ?? []);
        problems.value = profile.problems.map(problem => ({ id: problem.id, title: titles.get(problem.id) ?? `题目 ${problem.id}`, url: problem.url, solved: true, accepted: null, submissions: problem.attempts, acceptanceRate: null }));
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        problems.value = [];
    }
    finally {
        if (current === token)
            loading.value = false;
    }
}
const candidates = computed(() => problems.value.filter((p) => {
    if (onlySolved.value && p.solved !== true)
        return false;
    const query = search.value.trim();
    if (query && !p.title.includes(query) && !String(p.id).includes(query))
        return false;
    return true;
}));
function toggleLanguage(language: string): void {
    const set = new Set(selectedLanguages.value);
    if (set.has(language))
        set.delete(language);
    else
        set.add(language);
    selectedLanguages.value = [...set];
}
async function runExport(): Promise<void> {
    if (exporting.value || candidates.value.length === 0 || !selectedLanguages.value.length)
        return;
    exporting.value = true;
    error.value = null;
    result.value = null;
    progress.value = null;
    try {
        result.value = await exportAcCode({
            problemIds: candidates.value.map((p) => p.id),
            languages: [...selectedLanguages.value],
        });
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        exporting.value = false;
    }
}
onMounted(() => {
    unsubscribe = window.xmoj.events.onExportProgress(value => { if (exporting.value) progress.value = value; });
    void load();
});
onBeforeUnmount(() => { token++; unsubscribe?.(); });
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">导出 AC 代码</h1>
        <p class="text-sm text-muted-foreground">把已通过的题目代码打包成一个 zip</p>
      </div>
      <Button :disabled="loading || exporting || candidates.length === 0 || !selectedLanguages.length" @click="runExport">
        <Loader2 v-if="exporting" class="animate-spin" />
        <Download v-else />
        {{ exporting ? '正在导出…' : `导出 ${candidates.length} 题` }}
      </Button>
    </div>

    <div
      v-if="result && !result.cancelled"
      class="rounded-lg border px-4 py-3 text-sm" :class="result.written ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'"
    >
      <p class="flex items-center gap-2 font-medium">
        <FolderOpen class="size-4" />
        已导出 {{ result.written }} 份代码（{{ (result.bytes / 1024).toFixed(1) }} KB）
      </p>
      <p v-if="result.path" class="mt-1 font-mono text-xs break-all">{{ result.path }}</p>
      <p v-if="result.skipped.length" class="mt-1 text-xs">
        跳过 {{ result.skipped.length }} 题（没有通过的提交或无法读取代码）
      </p>
    </div>

    <div v-if="exporting && progress" class="space-y-2 rounded-lg border p-4 text-sm" role="progressbar" :aria-valuenow="progress.done" :aria-valuemin="0" :aria-valuemax="progress.total">
      <p>正在处理 #{{ progress.problemId }} · {{ progress.done }} / {{ progress.total }}</p>
      <div class="h-2 overflow-hidden rounded-full bg-muted"><div class="h-full bg-primary transition-[width]" :style="{ width: `${progress.done / Math.max(1, progress.total) * 100}%` }" /></div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Input v-model="search" class="max-w-56" placeholder="按编号筛选" />
      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input
          v-model="onlySolved"
          type="checkbox"
          class="size-4 rounded border-input accent-primary"
        />
        只包含已通过的题目
      </label>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-muted-foreground">语言：</span>
      <Button
        v-for="language in LANGUAGE_FILTERS"
        :key="language"
        size="xs"
        :variant="selectedLanguages.includes(language) ? 'default' : 'outline'"
        @click="toggleLanguage(language)"
      >
        {{ language }}
      </Button>
    </div>

    <div v-if="loading" class="space-y-2">
      <Skeleton v-for="index in 6" :key="index" class="h-10 w-full rounded-lg" />
    </div>

    <div v-else class="overflow-hidden rounded-xl border">
      <div class="flex items-center justify-between border-b bg-muted/50 px-4 py-2 text-sm">
        <span class="font-medium">将导出 {{ candidates.length }} 题</span>
        <span class="text-muted-foreground">已通过 {{ problems.filter((p) => p.solved === true).length }} 题</span>
      </div>
      <div class="max-h-80 divide-y overflow-auto">
        <div
          v-for="problem in candidates.slice(0, 200)"
          :key="problem.id"
          class="flex items-center gap-3 px-4 py-2 text-sm"
        >
          <span class="w-16 shrink-0 font-mono text-xs text-muted-foreground">{{ problem.id }}</span>
          <span class="min-w-0 truncate">{{ problem.title }}</span>
        </div>
        <p v-if="candidates.length === 0" class="px-4 py-8 text-center text-sm text-muted-foreground">
          没有符合条件的题目
        </p>
      </div>
    </div>
  </div>
</template>
