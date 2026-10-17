<script setup lang="ts">import { computed, onMounted, ref } from 'vue';
import { RefreshCw } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementBody from '@/components/AnnouncementBody.vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { useCopy } from '@/composables/useClipboard';
import { fetchMonthlyBoard } from '@/services/api';
import type { MonthlyBoard } from '@/shared/types';
const board = ref<MonthlyBoard | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const { copy, isCopied } = useCopy(2000);
const cards = computed(() => board.value?.cards ?? []);
async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
        const cached = await fetchMonthlyBoard(true);
        if (cached.cards.length > 0) {
            board.value = cached;
            loading.value = false;
        }
    }
    catch {
    }
    try {
        board.value = await fetchMonthlyBoard(false);
    }
    catch (caught) {
        if (!board.value)
            error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        loading.value = false;
    }
}
function textOf(html: string): string {
    const container = document.createElement('div');
    container.innerHTML = html;
    return (container.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}
onMounted(() => void load());
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">月赛</h1>
        <p class="text-sm text-muted-foreground">月赛公告、分组与规则</p>
      </div>
      <Button variant="outline" size="icon" :disabled="loading" title="刷新" @click="load">
        <RefreshCw :class="loading ? 'animate-spin' : ''" />
      </Button>
    </div>

    <div v-if="loading && cards.length === 0" class="space-y-3">
      <Skeleton v-for="index in 4" :key="index" class="h-28 w-full rounded-xl" />
    </div>

    <template v-else-if="board">
      <article
        v-if="board.intro"
        class="rounded-xl border bg-card"
        data-slot="monthly-intro"
      >
        <AnnouncementBody class="px-4 py-3 text-sm leading-relaxed" :source="board.intro" />
      </article>

      <article
        v-for="(card, index) in cards"
        :key="`${card.title}-${index}`"
        class="rounded-xl border bg-card"
        data-slot="monthly-card"
      >
        <header class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 class="font-semibold">{{ card.title }}</h2>
          <div class="flex items-center gap-2">
            <Badge v-if="card.date" variant="secondary" class="font-mono">{{ card.date }}</Badge>
            <Button
              size="xs"
              variant="ghost"
              @click="copy(textOf(card.html), `monthly-${index}`)"
            >
              {{ isCopied(`monthly-${index}`) ? '已复制' : '复制' }}
            </Button>
          </div>
        </header>
        <AnnouncementBody class="px-4 py-3 text-sm leading-relaxed" :source="card.html" />
      </article>

      <div
        v-if="cards.length === 0"
        class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
      >
        暂时没有月赛公告
      </div>
    </template>
  </div>
</template>
