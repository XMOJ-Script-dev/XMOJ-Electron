<script setup lang="ts">import { computed, onMounted, ref, watch } from 'vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { ChevronLeft, RefreshCw } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import UserChip from '@/components/UserChip.vue';
import { fetchContestRank } from '@/services/api';
import { usePanel } from '@/stores/panel';
import type { ContestRank } from '@/shared/types';
const panel = usePanel();
const oi = ref(panel.rankOi.value);
const rank = ref<ContestRank | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const contestId = computed(() => panel.rankContestId.value);
async function load(): Promise<void> {
    const id = contestId.value;
    if (!id) {
        error.value = '缺少比赛编号';
        return;
    }
    loading.value = true;
    error.value = null;
    try {
        rank.value = await fetchContestRank(id, oi.value);
        if (rank.value.rows.length === 0)
            error.value = '该比赛还没有排名数据';
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        rank.value = null;
    }
    finally {
        loading.value = false;
    }
}
function switchBoard(next: boolean): void {
    if (oi.value === next)
        return;
    oi.value = next;
    panel.rankOi.value = next;
    void load();
}
onMounted(() => void load());
watch(contestId, () => void load());
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight truncate">
          {{ rank?.title || '比赛排名' }}
        </h1>
        <p class="text-sm text-muted-foreground">
          比赛 #{{ contestId }} · 共 {{ rank?.rows.length ?? 0 }} 人
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" @click="panel.close()">
          <ChevronLeft />
          返回
        </Button>
        <Button
          size="sm"
          :variant="oi ? 'default' : 'outline'"
          @click="switchBoard(true)"
        >
          OI 排名
        </Button>
        <Button
          size="sm"
          :variant="!oi ? 'default' : 'outline'"
          @click="switchBoard(false)"
        >
          订正排名
        </Button>
        <Button variant="outline" size="icon" :disabled="loading" title="刷新" @click="load">
          <RefreshCw :class="loading ? 'animate-spin' : ''" />
        </Button>
      </div>
    </div>

    <div v-if="loading && !rank" class="space-y-2">
      <Skeleton v-for="index in 8" :key="index" class="h-9 w-full rounded-lg" />
    </div>

    <div v-else-if="rank && rank.rows.length" class="overflow-x-auto rounded-xl border">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr>
            <th class="px-3 py-2 text-left font-medium">#</th>
            <th class="px-3 py-2 text-left font-medium">用户</th>
            <th class="px-3 py-2 text-right font-medium">解决</th>
            <th class="px-3 py-2 text-right font-medium">总分</th>
            <th
              v-for="(header, index) in rank.headers"
              :key="index"
              class="px-2 py-2 text-center font-medium"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in rank.rows"
            :key="`${row.userId}-${index}`"
            class="border-t hover:bg-accent/40"
          >
            <td class="px-3 py-1.5">
              <Badge v-if="row.rankText" variant="secondary">{{ row.rankText }}</Badge>
              <span v-else class="tabular-nums">{{ row.rank }}</span>
            </td>
            <td class="max-w-56 px-3 py-1.5">
              <UserChip :username="row.userId" :size="20" class="text-sm" />
            </td>
            <td class="px-3 py-1.5 text-right tabular-nums">{{ row.solved }}</td>
            <td class="px-3 py-1.5 text-right font-medium tabular-nums">{{ row.score }}</td>
            <td
              v-for="(cell, cellIndex) in row.cells"
              :key="cellIndex"
              class="px-2 py-1.5 text-center tabular-nums"
              :class="cell.accepted ? 'bg-emerald-500/15 font-medium' : 'text-muted-foreground'"
            >
              {{ cell.text || '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
