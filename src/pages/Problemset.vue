<script setup lang="ts">import { computed, onMounted, ref, watch } from 'vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { Check, RefreshCw, Search, X } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/Pagination.vue';
import { fetchAllProblems } from '@/services/api';
import { formatRatio } from '@/lib/format';
import { useNavigation } from '@/stores/navigation';
import type { ProblemsetEntry } from '@/shared/types';
const navigation = useNavigation();
const PAGE_SIZE = 20;
const all = ref<ProblemsetEntry[]>([]);
const page = ref(1);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const draft = ref('');
const search = ref('');
let token = 0;
const filtered = computed(() => {
    const query = search.value.trim().toLowerCase();
    if (!query)
        return all.value;
    return all.value.filter((problem) => problem.title.toLowerCase().includes(query) || String(problem.id).includes(query));
});
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));
const visible = computed(() => {
    const start = (page.value - 1) * PAGE_SIZE;
    return filtered.value.slice(start, start + PAGE_SIZE);
});
async function load(): Promise<void> {
    const current = ++token;
    loading.value = true;
    error.value = null;
    try {
        const cached = await fetchAllProblems(true);
        if (current !== token)
            return;
        if (cached.problems.length > 0) {
            all.value = cached.problems;
            loading.value = false;
        }
    }
    catch {
    }
    try {
        const fresh = await fetchAllProblems(false);
        if (current !== token)
            return;
        all.value = fresh.problems;
    }
    catch (caught) {
        if (current !== token)
            return;
        if (all.value.length === 0) {
            error.value = caught instanceof Error ? caught.message : String(caught);
        }
    }
    finally {
        if (current === token)
            loading.value = false;
    }
}
function applySearch(): void {
    search.value = draft.value.trim();
    page.value = 1;
}
function clearSearch(): void {
    draft.value = '';
    search.value = '';
    page.value = 1;
}
watch(filtered, () => {
    if (page.value > totalPages.value)
        page.value = 1;
});
onMounted(() => void load());
function openProblem(problem: ProblemsetEntry): void {
    navigation.viewProblem(problem.id);
}
const hasResults = computed(() => visible.value.length > 0);
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">题库</h1>
        <p class="text-sm text-muted-foreground">竞赛&作业 中的所有题目</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" :disabled="loading" title="刷新" @click="load">
          <RefreshCw :class="loading ? 'animate-spin' : ''" />
        </Button>
      </div>
    </div>

    <form class="flex items-center gap-2" @submit.prevent="applySearch">
      <div class="relative flex-1">
        <Search
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="draft"
          class="pl-9"
          placeholder="按标题或内容搜索题目"
          :disabled="loading"
        />
      </div>
      <Button type="submit" :disabled="loading">搜索</Button>
      <Button
        v-if="search"
        type="button"
        variant="ghost"
        :disabled="loading"
        @click="clearSearch"
      >
        <X />
        清除
      </Button>
    </form>

    <div v-if="loading && !hasResults" class="space-y-2">
      <Skeleton v-for="index in 8" :key="index" class="h-11 w-full rounded-lg" />
    </div>

    <div v-else-if="hasResults" class="overflow-hidden rounded-xl border">
      <table class="w-full text-sm">
        <thead class="bg-muted/50 text-muted-foreground">
          <tr>
            <th class="w-16 px-3 py-2 text-center font-medium">状态</th>
            <th class="w-20 px-3 py-2 text-right font-medium">编号</th>
            <th class="px-3 py-2 text-left font-medium">标题</th>
            <th class="w-28 px-3 py-2 text-right font-medium">通过率</th>
            <th class="hidden w-28 px-3 py-2 text-right font-medium sm:table-cell">通过 / 提交</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="problem in visible"
            :key="problem.id"
            class="cursor-pointer border-t transition-colors hover:bg-accent/50"
            @click="openProblem(problem)"
          >
            <td class="px-3 py-2">
              <div class="flex justify-center">
                <span
                  v-if="problem.solved === true"
                  class="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  title="已通过"
                >
                  <Check class="size-3.5" />
                </span>
                <span
                  v-else-if="problem.solved === false"
                  class="flex size-5 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  title="未通过"
                >
                  <X class="size-3.5" />
                </span>
                <span v-else class="size-5" />
              </div>
            </td>
            <td class="px-3 py-2 text-right font-mono tabular-nums">{{ problem.id }}</td>
            <td class="px-3 py-2">
              <span class="truncate">{{ problem.title }}</span>
            </td>
            <td class="px-3 py-2 text-right">
              <Badge v-if="problem.submissions" variant="secondary" class="font-mono">
                {{ formatRatio(problem.accepted, problem.submissions) }}
              </Badge>
              <span v-else class="text-muted-foreground">—</span>
            </td>
            <td
              class="hidden px-3 py-2 text-right font-mono text-xs text-muted-foreground sm:table-cell"
            >
              <template v-if="problem.submissions !== null">
                {{ problem.accepted ?? '—' }} / {{ problem.submissions }}
              </template>
              <template v-else>—</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="!loading"
      class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
    >
      <template v-if="search">没有匹配「{{ search }}」的题目</template>
      <template v-else>还没有载入题目</template>
    </div>

    <div v-if="hasResults" class="flex items-center justify-between text-xs text-muted-foreground">
      <span>共 {{ filtered.length }} 题</span>
    </div>

    <Pagination
      v-if="hasResults"
      v-model:page="page"
      :total-pages="totalPages"
      :disabled="loading"
    />
  </div>
</template>
