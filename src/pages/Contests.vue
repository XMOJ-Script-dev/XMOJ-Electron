<script setup lang="ts">import { computed, onMounted, ref } from 'vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { ChevronLeft, ChevronRight, RefreshCw, Trophy, Play, Send } from '@lucide/vue';
import ContestReplay from '@/components/ContestReplay.vue';
import { Button } from '@/components/ui/button';
import UserChip from '@/components/UserChip.vue';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchContestDetail, fetchContestList } from '@/services/api';
import { useNavigation } from '@/stores/navigation';
import { usePanel } from '@/stores/panel';
import type { ContestDetail, ContestProblemSummary, ContestSummary } from '@/shared/types';
const navigation = useNavigation();
const panel = usePanel();
const contests = ref<ContestSummary[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const refreshing = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const detail = ref<ContestDetail | null>(null);
const detailLoading = ref(false);
const replayOpen = ref(false);
const replayAvailable = computed(() => detail.value?.contest.replay === true || detail.value?.contest.replay === 'Y');
let token = 0;
function statusOf(contest: ContestSummary): {
    label: string;
    tone: 'running' | 'upcoming' | 'ended';
} {
    const now = Date.now();
    const parse = (value: string | null) => {
        if (!value)
            return Number.NaN;
        return new Date(value.replace(' ', 'T')).getTime();
    };
    const start = parse(contest.startTime);
    const end = parse(contest.endTime);
    if (Number.isFinite(start) && now < start)
        return { label: '未开始', tone: 'upcoming' };
    if (Number.isFinite(end) && now > end)
        return { label: '已结束', tone: 'ended' };
    return { label: '进行中', tone: 'running' };
}
async function load(target = page.value): Promise<void> {
    const current = ++token;
    error.value = null;
    loading.value = contests.value.length === 0;
    refreshing.value = true;
    try {
        const first = await fetchContestList(target, true);
        if (current !== token)
            return;
        apply(first.value);
        page.value = target;
        if (first.fromCache) {
            const fresh = await fetchContestList(target, false);
            if (current !== token)
                return;
            apply(fresh.value);
        }
    }
    catch (caught) {
        if (current !== token)
            return;
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        if (current === token) {
            loading.value = false;
            refreshing.value = false;
        }
    }
}
function apply(value: {
    list: ContestSummary[];
    totalPages: number;
    total: number;
}): void {
    contests.value = value.list;
    totalPages.value = value.totalPages;
    total.value = value.total;
}
async function openContest(contest: ContestSummary): Promise<void> {
    detailLoading.value = true;
    error.value = null;
    try {
        const first = await fetchContestDetail(contest.contestId, true);
        detail.value = first.value;
        if (first.fromCache) {
            const fresh = await fetchContestDetail(contest.contestId, false);
            detail.value = fresh.value;
        }
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        detailLoading.value = false;
    }
}
function closeContest(): void {
    replayOpen.value = false;
    detail.value = null;
}
function openProblem(problemId: number | null): void {
    if (problemId !== null)
        navigation.viewProblem(problemId);
}
function submitProblem(problem: ContestProblemSummary): void {
    const current = detail.value;
    if (!current || problem.problemId === null)
        return;
    const index = current.problems.indexOf(problem);
    if (index < 0)
        return;
    navigation.submitProblem(problem.problemId, {
        contestId: current.contest.contestId,
        contestPid: index,
    });
}
function problemStatusClass(status: string | null | undefined): string {
    const value = String(status ?? '').toUpperCase();
    if (value === 'AC' || value === 'ACCEPTED') {
        return 'border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
    }
    if (value.includes('WAIT') || value.includes('PENDING') || value.includes('JUDG')) {
        return 'border-amber-500/40 bg-amber-500/20 text-amber-700 dark:text-amber-300';
    }
    if (/^(SUBMIT|WA|TLE|MLE|RE|CE|OLE|PE|FAIL)/.test(value)) {
        return 'border-rose-500/40 bg-rose-500/20 text-rose-700 dark:text-rose-300';
    }
    return 'border-input';
}
function problemStatusLabel(status: string | null | undefined): string {
    const value = String(status ?? '').toUpperCase();
    if (value === 'AC' || value === 'ACCEPTED')
        return '已通过';
    if (value === 'SUBMIT')
        return '未通过';
    if (value)
        return value;
    return '未作答';
}
const detailStatus = computed(() => (detail.value ? statusOf(detail.value.contest) : null));
onMounted(() => {
    void load(1).catch(() => undefined);
});
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6" :aria-busy="refreshing || detailLoading">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">竞赛&作业</h1>
        <p class="text-sm text-muted-foreground">
          <template v-if="detail">{{ detail.contest.title }}</template>
          <template v-else>共 {{ total }} 场比赛</template>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button v-if="detail" variant="outline" size="sm" @click="closeContest">
          <ChevronLeft />
          返回列表
        </Button>
        <Button
          v-else
          variant="outline"
          size="icon"
          :disabled="refreshing"
          title="刷新"
          @click="load(page)"
        >
          <RefreshCw :class="refreshing ? 'animate-spin' : ''" />
        </Button>
        <Button
          v-if="detail && replayAvailable"
          variant="outline"
          size="sm"
          :disabled="detailLoading"
          @click="panel.close(); replayOpen = true"
        >
          <Play />
          回放
        </Button>
        <Button
          v-if="detail"
          variant="outline"
          size="sm"
          @click="panel.openRank(detail.contest.contestId, detail.contest.title, true)"
        >
          <Trophy />
          OI 排名
        </Button>
        <Button
          v-if="detail"
          variant="outline"
          size="sm"
          @click="panel.openRank(detail.contest.contestId, detail.contest.title, false)"
        >
          <Trophy />
          订正排名
        </Button>
      </div>
    </div>

    <template v-if="!detail">
      <div v-if="loading && contests.length === 0" class="space-y-2">
        <Skeleton v-for="index in 6" :key="index" class="h-16 w-full rounded-lg" />
      </div>

      <div v-else-if="contests.length" class="divide-y rounded-xl border">
        <button
          v-for="contest in contests"
          :key="contest.contestId"
          class="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent/50"
          @click="openContest(contest)"
        >
          <Trophy class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-2">
              <span class="truncate font-medium">{{ contest.title }}</span>
              <Badge
                :variant="statusOf(contest).tone === 'running' ? 'default' : 'secondary'"
                :class="
                  statusOf(contest).tone === 'running'
                    ? 'bg-emerald-600 text-white'
                    : statusOf(contest).tone === 'upcoming'
                      ? 'bg-amber-500 text-white'
                      : ''
                "
              >
                {{ statusOf(contest).label }}
              </Badge>
            </span>
            <span class="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <span>#{{ contest.contestId }}</span>
              <span>{{ contest.startTime ?? '—' }}</span>
              <span>→ {{ contest.endTime ?? '—' }}</span>
              <span v-if="contest.creator">创建者 {{ contest.creator }}</span>
            </span>
          </span>
        </button>
      </div>

      <div
        v-else
        class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
      >
        没有比赛
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between">
        <p class="text-sm text-muted-foreground">
          第 <span class="font-medium text-foreground">{{ page }}</span> 页 / 共
          <span class="font-medium text-foreground">{{ totalPages }}</span> 页
        </p>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="page <= 1 || refreshing"
            @click="load(page - 1)"
          >
            <ChevronLeft />
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="page >= totalPages || refreshing"
            @click="load(page + 1)"
          >
            下一页
            <ChevronRight />
          </Button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <Badge v-if="detailStatus" :variant="detailStatus.tone === 'running' ? 'default' : 'secondary'">
          {{ detailStatus.label }}
        </Badge>
        <span class="rounded-md border px-2 py-1 text-xs">
          {{ detail.contest.startTime ?? '—' }} → {{ detail.contest.endTime ?? '—' }}
        </span>
      </div>

      <div v-if="detailLoading" class="space-y-2">
        <Skeleton v-for="index in 5" :key="index" class="h-11 w-full rounded-lg" />
      </div>

      <div v-else-if="detail.problems.length" class="divide-y rounded-xl border">
        <div
          v-for="problem in detail.problems"
          :key="problem.num"
          class="flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50"
        >
          <button class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="openProblem(problem.problemId)">
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-md border font-mono text-xs"
              :class="problemStatusClass(problem.status)"
              :title="problemStatusLabel(problem.status)"
            >
              {{ problem.num }}
            </span>
            <span class="min-w-0 flex-1 truncate text-sm">{{ problem.title }}</span>
            <span v-if="problem.problemId" class="shrink-0 font-mono text-xs text-muted-foreground">
              #{{ problem.problemId }}
            </span>
          </button>
          <Button
            v-if="problem.problemId"
            variant="outline"
            size="sm"
            class="shrink-0"
            @click="submitProblem(problem)"
          >
            <Send />
            提交
          </Button>
        </div>
      </div>

      <div
        v-else
        class="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
      >
        该比赛没有可见题目（可能尚未开始或为私有比赛）
      </div>

      <p v-if="detail.contest.creator" class="flex items-center gap-2 text-xs text-muted-foreground">
        创建者 <UserChip :username="detail.contest.creator" :size="20" />
      </p>
    </template>
    <ContestReplay v-if="replayOpen && detail" :contest-id="detail.contest.contestId" :title="detail.contest.title" @close="replayOpen = false" />
  </div>
</template>
