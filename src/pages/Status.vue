<script setup lang="ts">import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { ChevronLeft, ChevronRight, GitCompare, RefreshCw, Search, X } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStatus } from '@/services/api';
import UserChip from '@/components/UserChip.vue';
import { createPoller } from '@/lib/poller';
import { formatDateTime, formatMemory, formatTime } from '@/lib/format';
import { useNavigation } from '@/stores/navigation';
import { usePanel } from '@/stores/panel';
import type { StatusPaging, SubmissionEntry, SubmissionVerdict } from '@/shared/types';
const navigation = useNavigation();
const panel = usePanel();
const RESULT_OPTIONS: {
    value: string;
    label: string;
}[] = [
    { value: '', label: '全部结果' },
    { value: '4', label: 'Accepted' },
    { value: '6', label: 'Wrong Answer' },
    { value: '7', label: 'Time Limit Exceeded' },
    { value: '8', label: 'Memory Limit Exceeded' },
    { value: '9', label: 'Output Limit Exceeded' },
    { value: '10', label: 'Runtime Error' },
    { value: '11', label: 'Compile Error' },
    { value: '5', label: 'Presentation Error' },
];
const submissions = ref<SubmissionEntry[]>([]);
const currentTop = ref<number | null>(null);
const currentPrevTop = ref<number | null>(null);
const paging = ref<StatusPaging>({ nextTop: null, nextPrevTop: null, prevTop: null });
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const draftUser = ref('');
const draftProblemId = ref('');
const draftResult = ref('');
const language = ref('');
const appliedUser = ref('');
const appliedProblemId = ref('');
const appliedResult = ref('');
let token = 0;
async function load(): Promise<void> {
    const current = ++token;
    loading.value = true;
    error.value = null;
    try {
        const problemId = Number.parseInt(appliedProblemId.value, 10);
        const result = await fetchStatus({
            top: currentTop.value ?? undefined,
            prevTop: currentPrevTop.value ?? undefined,
            user: appliedUser.value || undefined,
            problemId: Number.isFinite(problemId) ? problemId : undefined,
            result: appliedResult.value || undefined,
            language: language.value || undefined,
        });
        if (current !== token)
            return;
        submissions.value = result.submissions;
        paging.value = result.paging;
    }
    catch (caught) {
        if (current !== token)
            return;
        error.value = caught instanceof Error ? caught.message : String(caught);
        submissions.value = [];
        paging.value = { nextTop: null, nextPrevTop: null, prevTop: null };
    }
    finally {
        if (current === token)
            loading.value = false;
    }
}
function goNext(): void {
    const next = paging.value.nextTop;
    if (next === null)
        return;
    currentPrevTop.value =
        submissions.value[0]?.id ?? paging.value.nextPrevTop ?? null;
    currentTop.value = next;
    void load();
}
function goPrev(): void {
    const prev = paging.value.prevTop;
    if (prev === null)
        return;
    currentTop.value = prev;
    currentPrevTop.value = null;
    void load();
}
function applyFilters(): void {
    appliedUser.value = draftUser.value.trim();
    appliedProblemId.value = draftProblemId.value.trim();
    appliedResult.value = draftResult.value;
    currentTop.value = null;
    currentPrevTop.value = null;
    void load();
}
function resetFilters(): void {
    draftUser.value = '';
    draftProblemId.value = '';
    draftResult.value = '';
    appliedUser.value = '';
    appliedProblemId.value = '';
    appliedResult.value = '';
    language.value = '';
    currentTop.value = null;
    currentPrevTop.value = null;
    void load();
}
const hasFilters = computed(() => Boolean(appliedUser.value) ||
    Boolean(appliedProblemId.value) ||
    Boolean(appliedResult.value) ||
    Boolean(language.value));
watch(language, () => {
    currentTop.value = null;
    currentPrevTop.value = null;
    void load();
});
const POLL_INTERVAL_MS = 8000;
const hasPending = computed(() => submissions.value.some((s) => s.verdict === 'pending'));
const poller = createPoller({
    intervalMs: POLL_INTERVAL_MS,
    tick: () => load(),
    shouldContinue: () => hasPending.value && !document.hidden,
});
watch(hasPending, (pending) => {
    if (pending)
        poller.start();
    else
        poller.stop();
});
onMounted(() => void load());
onBeforeUnmount(() => poller.stop());
const verdictStyles: Record<SubmissionVerdict, string> = {
    accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    wrong_answer: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
    runtime_error: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',
    compile_error: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/40',
    time_limit: 'bg-neutral-900/15 text-neutral-900 dark:bg-neutral-100/15 dark:text-neutral-100 border-neutral-900/30 dark:border-neutral-100/30',
    memory_limit: 'bg-neutral-900/15 text-neutral-900 dark:bg-neutral-100/15 dark:text-neutral-100 border-neutral-900/30 dark:border-neutral-100/30',
    output_limit: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
    presentation_error: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
    pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    other: 'bg-muted text-muted-foreground',
};
function verdictStyle(verdict: SubmissionVerdict): string {
    return verdictStyles[verdict] ?? verdictStyles.other;
}
function openSubmission(submission: SubmissionEntry): void {
    panel.openSource(submission.id, `提交 #${submission.id} · ${submission.problemTitle || ''}`, submission.language);
}
</script>

<template>
  <div class="mx-auto min-w-0 w-full max-w-6xl space-y-4 p-4 lg:space-y-6 lg:p-6" data-slot="status-page" :aria-busy="loading">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">状态</h1>
        <p class="text-sm text-muted-foreground">
          评测记录与结果
          <span v-if="hasPending" class="ml-1 text-amber-600 dark:text-amber-400">
            · 有提交正在评测，每 {{ POLL_INTERVAL_MS / 1000 }} 秒自动刷新
          </span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="navigation.navigate('compare')">
          <GitCompare />
          对比代码
        </Button>
        <Button variant="outline" size="icon" :disabled="loading" title="刷新" @click="load">
          <RefreshCw :class="loading ? 'animate-spin' : ''" />
        </Button>
      </div>
    </div>

    <form
      class="grid min-w-0 grid-cols-2 gap-2 rounded-xl border p-3 md:grid-cols-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.8fr)_auto]"
      data-slot="status-filters"
      @submit.prevent="applyFilters"
    >
      <div class="relative min-w-0">
        <Search
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="draftProblemId"
          class="pl-9"
          placeholder="题目编号"
          inputmode="numeric"
          :disabled="loading"
        />
      </div>
      <Input v-model="draftUser" placeholder="用户名" aria-label="按用户名筛选" :disabled="loading" />
      <select
        v-model="draftResult"
        class="h-9 min-w-0 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
        :disabled="loading"
      >
        <option v-for="option in RESULT_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <select
        v-model="language"
        class="h-9 min-w-0 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
        :disabled="loading"
      >
        <option value="">全部语言</option>
        <option value="0">C</option>
        <option value="1">C++</option>
        <option value="2">Pascal</option>
      </select>
      <div class="flex gap-2">
        <Button type="submit" :disabled="loading">查询</Button>
        <Button
          v-if="hasFilters"
          type="button"
          variant="ghost"
          :disabled="loading"
          @click="resetFilters"
        >
          <X />
        </Button>
      </div>
    </form>

    <div v-if="loading && submissions.length === 0" class="space-y-2">
      <Skeleton v-for="index in 8" :key="index" class="h-11 w-full rounded-lg" />
    </div>

    <div v-else-if="submissions.length > 0" class="min-w-0 max-w-full overflow-x-auto rounded-xl border" data-slot="status-table-scroll" role="region" aria-label="评测记录，可左右滚动查看完整列" tabindex="0">
      <table class="w-full min-w-[960px] whitespace-nowrap text-sm">
        <thead class="bg-muted/50 text-muted-foreground">
          <tr>
            <th class="w-20 px-3 py-2 text-right font-medium">编号</th>
            <th class="px-3 py-2 text-left font-medium">用户</th>
            <th class="px-3 py-2 text-left font-medium">题目</th>
            <th class="px-3 py-2 text-left font-medium">结果</th>
            <th class="w-24 px-3 py-2 text-right font-medium">内存</th>
            <th class="w-24 px-3 py-2 text-right font-medium">耗时</th>
            <th class="px-3 py-2 text-left font-medium">语言</th>
            <th class="w-40 px-3 py-2 text-left font-medium">提交时间</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="submission in submissions"
            :key="submission.id"
            class="cursor-pointer border-t transition-colors hover:bg-accent/50"
            @click="openSubmission(submission)"
          >
            <td class="px-3 py-2 text-right font-mono tabular-nums">{{ submission.id }}</td>
            <td class="whitespace-nowrap px-3 py-2"><UserChip v-if="submission.user" :username="submission.user" :size="20" /><span v-else>—</span></td>
            <td class="max-w-64 px-3 py-2">
              <span class="block max-w-64 truncate" :title="submission.problemTitle">
                {{ submission.problemTitle || '—' }}
              </span>
            </td>
            <td class="px-3 py-2">
              <Badge
                variant="outline"
                :class="verdictStyle(submission.verdict)"
                :title="submission.verdictLabel"
              >
                {{ submission.verdictLabel }}
              </Badge>
            </td>
            <td class="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
              {{ formatMemory(submission.memoryKb) }}
            </td>
            <td class="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
              {{ formatTime(submission.timeMs) }}
            </td>
            <td class="px-3 py-2 text-muted-foreground">{{ submission.language || '—' }}</td>
            <td class="px-3 py-2 font-mono text-xs text-muted-foreground">
              {{ formatDateTime(submission.submittedAt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="!loading"
      class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
    >
      没有符合条件的评测记录
    </div>

    <div v-if="submissions.length > 0" class="flex items-center justify-between gap-4">
      <p class="text-sm text-muted-foreground">
        <template v-if="currentTop === null">最新提交</template>
        <template v-else>较早的提交</template>
      </p>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="loading || paging.prevTop === null" @click="goPrev">
          <ChevronLeft />
          上一页
        </Button>
        <Button variant="outline" size="sm" :disabled="loading || paging.nextTop === null" @click="goNext">
          下一页
          <ChevronRight />
        </Button>
      </div>
    </div>
  </div>
</template>
