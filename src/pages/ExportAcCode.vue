<script setup lang="ts">import { computed, onMounted, ref } from 'vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { Download, FolderOpen, Loader2 } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { exportAcCode, fetchProblemset } from '@/services/api';
import type { ExportResult, ProblemsetEntry } from '@/shared/types';
const LANGUAGE_FILTERS = ['C++', 'C', 'Python', 'Java', 'Pascal'];
const problems = ref<ProblemsetEntry[]>([]);
const loading = ref(false);
const exporting = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const result = ref<ExportResult | null>(null);
const search = ref('');
const onlySolved = ref(true);
const selectedLanguages = ref<string[]>(['C++', 'C', 'Python', 'Java', 'Pascal']);
let token = 0;
async function load(): Promise<void> {
    const current = ++token;
    loading.value = true;
    error.value = null;
    try {
        const first = await fetchProblemset({ page: 1 });
        problems.value = first.value.problems;
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
    if (candidates.value.length === 0)
        return;
    exporting.value = true;
    error.value = null;
    result.value = null;
    try {
        result.value = await exportAcCode({
            problemIds: candidates.value.map((p) => p.id),
            languages: selectedLanguages.value,
        });
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        exporting.value = false;
    }
}
onMounted(() => void load());
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">导出 AC 代码</h1>
        <p class="text-sm text-muted-foreground">把已通过的题目代码打包成一个 zip</p>
      </div>
      <Button :disabled="exporting || candidates.length === 0" @click="runExport">
        <Loader2 v-if="exporting" class="animate-spin" />
        <Download v-else />
        {{ exporting ? '正在导出…' : `导出 ${candidates.length} 题` }}
      </Button>
    </div>

    <div
      v-if="result"
      class="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
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

    <div class="flex flex-wrap items-center gap-3">
      <Input v-model="search" class="max-w-56" placeholder="按编号或标题筛选" />
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

    <p class="text-xs text-muted-foreground">
      导出会逐题向判题站查询通过记录与代码，题目较多时请耐心等待。
    </p>
  </div>
</template>
