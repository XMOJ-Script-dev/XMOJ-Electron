<script setup lang="ts">import { computed, onMounted, ref } from 'vue';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementBody from '@/components/AnnouncementBody.vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { htmlToMarkdown } from '@/lib/markdown-copy';
import { fetchMonthlyBoard } from '@/services/api';
import type { MonthlyBoard } from '@/shared/types';
const board = ref<MonthlyBoard | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const cards = computed(() => board.value?.cards ?? []);
const announcements = computed(() => cards.value.filter(card => card.title !== '我的月赛' && card.title !== '倒计时').map(card => ({ ...card, markdown: htmlToMarkdown(card.html) })));
const mine = computed(() => { const card = cards.value.find(card => card.title === '我的月赛'); return card ? { ...card, markdown: htmlToMarkdown(card.html) } : null; });
const countdown = computed(() => board.value?.countdown ?? []);
function apply(value: MonthlyBoard): void {
    board.value = value;
}
async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
        const cached = await fetchMonthlyBoard(true);
        if (cached.cards.length > 0) {
            apply(cached);
            loading.value = false;
        }
    }
    catch {
    }
    try {
        apply(await fetchMonthlyBoard(false));
    }
    catch (caught) {
        if (!board.value)
            error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        loading.value = false;
    }
}
onMounted(() => void load());
</script>

<template>
  <div class="mx-auto min-w-0 w-full max-w-6xl space-y-6 p-6" :aria-busy="loading">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">月赛</h1>
        <p class="text-sm text-muted-foreground">月赛公告</p>
      </div>
    </div>

    <div v-if="loading && cards.length === 0" class="space-y-3">
      <Skeleton v-for="index in 4" :key="index" class="h-28 w-full rounded-xl" />
    </div>

    <div v-else-if="board" class="grid items-start gap-6 md:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
      <div class="order-2 min-w-0 space-y-6 md:col-start-2 md:row-start-1" data-slot="monthly-sidebar">
        <article v-if="mine" class="rounded-xl border bg-card" data-slot="monthly-mine">
          <header class="border-b px-4 py-3"><h2 class="font-semibold">我的月赛</h2></header>
          <AnnouncementBody class="px-4 py-3 text-sm leading-relaxed" :source="mine.markdown" format="markdown" />
        </article>
        <div v-if="countdown.length" class="space-y-3" data-slot="monthly-countdown">
          <h2 class="text-sm font-medium text-muted-foreground">倒计时</h2>
          <div v-for="item in countdown" :key="`${item.event}-${item.date}`" class="flex items-baseline justify-between gap-3 rounded-lg border bg-card px-3 py-2">
            <span class="min-w-0 truncate text-sm" :title="item.event">{{ item.event }}</span>
            <span class="shrink-0 text-sm text-muted-foreground">距离还有 <span class="font-mono font-semibold text-foreground tabular-nums">{{ item.days }}</span> 天</span>
          </div>
        </div>
      </div>
      <div class="order-1 min-w-0 space-y-3 md:col-start-1 md:row-start-1" data-slot="monthly-announcements">
        <article
          v-for="(card, index) in announcements"
          :key="`${card.title}-${index}`"
          class="rounded-xl border bg-card"
          data-slot="monthly-card"
        >
          <header class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <h2 class="font-semibold">{{ card.title }}</h2>
            <Badge v-if="card.date" variant="secondary" class="font-mono">{{ card.date }}</Badge>
          </header>
          <AnnouncementBody class="px-4 py-3 text-sm leading-relaxed" :source="card.markdown" format="markdown" />
        </article>

        <div
          v-if="announcements.length === 0"
          class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
        >
          暂时没有月赛公告
        </div>
      </div>
    </div>
  </div>
</template>
