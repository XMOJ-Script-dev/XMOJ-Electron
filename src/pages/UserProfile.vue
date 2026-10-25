<script setup lang="ts">import { computed, onMounted, ref, watch } from 'vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { ChevronLeft, Loader2, RefreshCw } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import UserChip from '@/components/UserChip.vue';
import { fetchUserProfile } from '@/services/api';
import { usePanel } from '@/stores/panel';
import { useNavigation } from '@/stores/navigation';
import type { UserProfile } from '@/shared/types';
const panel = usePanel();
const navigation = useNavigation();
const username = ref(panel.profileUsername.value);
const profile = ref<UserProfile | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const filter = ref('');
const activityChart = computed(() => {
    const activity = profile.value?.activity ?? [];
    if (activity.length === 0)
        return null;
    const width = 600;
    const left = 42;
    const right = width - 12;
    const top = 24;
    const bottom = 190;
    const first = activity[0].timestamp;
    const last = activity[activity.length - 1].timestamp;
    const range = last - first || 86_400_000;
    const maxCount = Math.max(1, ...activity.map((point) => point.submissions));
    const x = (timestamp: number) => left + ((timestamp - first) / range) * (right - left);
    const y = (count: number) => bottom - (count / maxCount) * (bottom - top);
    return {
        path: activity.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.timestamp)} ${y(point.submissions)}`).join(' '),
        bars: activity.map((point) => ({
            ...point,
            x: x(point.timestamp),
            y: y(point.accepted),
            height: bottom - y(point.accepted),
        })),
        maxCount,
        first: new Date(first).toLocaleDateString(),
        last: new Date(last).toLocaleDateString(),
    };
});
const resultPie = computed(() => {
    const stats = profile.value?.resultStats ?? [];
    const total = stats.reduce((sum, item) => sum + item.count, 0);
    if (total === 0)
        return '';
    const colors = ['#f87171', '#818cf8', '#4ade80', '#f472b6', '#c084fc', '#a8a29e'];
    let offset = 0;
    const slices = stats.map((item, index) => {
        const start = offset;
        offset += item.count / total * 100;
        return `${colors[index % colors.length]} ${start}% ${offset}%`;
    });
    return `conic-gradient(${slices.join(', ')})`;
});
async function load(): Promise<void> {
    const name = username.value.trim();
    if (!name) {
        error.value = '缺少用户名';
        return;
    }
    loading.value = true;
    error.value = null;
    try {
        const first = await fetchUserProfile(name, true);
        profile.value = first;
        if (first) {
            const fresh = await fetchUserProfile(name, false);
            profile.value = fresh;
        }
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        profile.value = null;
    }
    finally {
        loading.value = false;
    }
}
const visibleProblems = computed(() => {
    const query = filter.value.trim();
    const list = profile.value?.problems ?? [];
    if (!query)
        return list;
    return list.filter((problem) => String(problem.id).includes(query));
});
onMounted(() => void load());
watch(() => panel.profileUsername.value, (name) => {
    if (name && name !== username.value) {
        username.value = name;
        void load();
    }
});
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight">
          <UserChip v-if="profile" :username="profile.username" :size="32" prefer-nick />
          <template v-else>用户主页</template>
        </h1>
        <p class="text-sm text-muted-foreground">
          <template v-if="profile">
            已解决 {{ profile.solvedTotal }} 题
          </template>
          <template v-else>输入用户名查看</template>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" @click="panel.close()">
          <ChevronLeft />
          返回
        </Button>
        <Input v-model="username" class="w-40" placeholder="用户名" />
        <Button variant="outline" size="sm" :disabled="loading" @click="load">
          <Loader2 v-if="loading" class="animate-spin" />
          <RefreshCw v-else />
          载入
        </Button>
      </div>
    </div>

    <div v-if="loading && !profile" class="space-y-2">
      <Skeleton class="h-16 w-full rounded-lg" />
      <Skeleton class="h-40 w-full rounded-lg" />
    </div>

    <template v-else-if="profile">
      <section class="rounded-xl border bg-card p-4">
        <div class="flex flex-wrap items-center gap-3">
          <UserChip :username="profile.username" />
          <Badge variant="secondary">已解决 {{ profile.solvedTotal }}</Badge>
          <Badge>评分 {{ profile.rating }}</Badge>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="space-y-4 rounded-xl border bg-card p-4">
          <div class="flex items-baseline justify-between gap-3">
            <h2 class="font-semibold">判题统计</h2>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded-lg bg-muted/50 p-3">
              <div class="font-mono text-lg font-semibold tabular-nums">{{ profile.submissionTotal }}</div>
              <div class="text-xs text-muted-foreground">提交</div>
            </div>
            <div class="rounded-lg bg-muted/50 p-3">
              <div class="font-mono text-lg font-semibold tabular-nums">{{ profile.acceptedTotal }}</div>
              <div class="text-xs text-muted-foreground">正确</div>
            </div>
            <div class="rounded-lg bg-muted/50 p-3">
              <div class="font-mono text-lg font-semibold tabular-nums">
                {{ profile.submissionTotal ? `${(profile.acceptedTotal / profile.submissionTotal * 100).toFixed(1)}%` : '—' }}
              </div>
              <div class="text-xs text-muted-foreground">正确率</div>
            </div>
          </div>
          <div v-if="resultPie" class="flex flex-wrap items-center gap-4">
            <div
              role="img"
              aria-label="判题结果分布"
              class="size-24 shrink-0 rounded-full"
              :style="{ background: resultPie }"
            />
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li v-for="(item, index) in profile.resultStats" :key="item.label" class="flex items-center gap-2">
                <span
                  class="size-2.5 rounded-sm"
                  :style="{ backgroundColor: ['#f87171', '#818cf8', '#4ade80', '#f472b6', '#c084fc', '#a8a29e'][index % 6] }"
                />
                {{ item.label }} · {{ item.count }}
              </li>
            </ul>
          </div>
          <p v-else class="text-sm text-muted-foreground">暂无判题统计</p>
        </article>

        <article class="space-y-3 rounded-xl border bg-card p-4">
          <h2 class="font-semibold">提交趋势</h2>
          <svg
            v-if="activityChart"
            class="w-full"
            viewBox="0 0 600 230"
            role="img"
            aria-label="每日提交与正确数量"
          >
            <line x1="42" x2="588" y1="190" y2="190" class="stroke-border" />
            <line x1="42" x2="588" y1="24" y2="24" class="stroke-border" />
            <text x="36" y="194" text-anchor="end" class="fill-muted-foreground text-[11px]">0</text>
            <text x="36" y="28" text-anchor="end" class="fill-muted-foreground text-[11px]">{{ activityChart.maxCount }}</text>
            <rect
              v-for="point in activityChart.bars"
              :key="`accepted-${point.timestamp}`"
              :x="point.x - 3"
              :y="point.y"
              width="6"
              :height="point.height"
              rx="2"
              fill="#4799cc"
            >
              <title>{{ new Date(point.timestamp).toLocaleDateString() }} 正确：{{ point.accepted }}</title>
            </rect>
            <path :d="activityChart.path" fill="none" stroke="#d4a017" stroke-width="2" />
            <text x="42" y="218" class="fill-muted-foreground text-[11px]">{{ activityChart.first }}</text>
            <text x="588" y="218" text-anchor="end" class="fill-muted-foreground text-[11px]">{{ activityChart.last }}</text>
            <text x="240" y="16" fill="#d4a017" class="text-xs">提交</text>
            <text x="300" y="16" fill="#4799cc" class="text-xs">正确</text>
          </svg>
          <p v-else class="py-8 text-center text-sm text-muted-foreground">暂无提交趋势数据</p>
        </article>
      </section>

      <section class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-sm font-medium">已解决的题目（{{ visibleProblems.length }}）</h2>
          <Input v-model="filter" class="w-40" placeholder="按题目编号筛选" />
        </div>

        <div v-if="visibleProblems.length" class="flex flex-wrap gap-1.5">
          <Button
            v-for="problem in visibleProblems"
            :key="problem.id"
            size="xs"
            variant="outline"
            :title="`尝试 ${problem.attempts} 次`"
            @click="navigation.viewProblem(problem.id)"
          >
            {{ problem.id }}
          </Button>
        </div>
        <p v-else class="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          没有匹配的题目
        </p>
      </section>
    </template>
  </div>
</template>
