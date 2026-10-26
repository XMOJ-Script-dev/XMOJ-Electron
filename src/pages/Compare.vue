<script setup lang="ts">import { computed, ref } from 'vue';
import { ArrowLeftRight, Loader2 } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { compareSources, fetchSource } from '@/services/api';
import { summariseDiff } from '@/lib/diff';
import { useCopy } from '@/composables/useClipboard';
import { useErrorToast } from '@/composables/useErrorToast';
import type { DiffLine } from '@/shared/types';
const leftId = ref<string | number>('');
const rightId = ref<string | number>('');
const lines = ref<DiffLine[]>([]);
const leftSource = ref<string | null>(null);
const rightSource = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const { copy } = useCopy();
const summary = computed(() => summariseDiff(lines.value));
async function compare(): Promise<void> {
    const left = Number(leftId.value);
    const right = Number(rightId.value);
    if (!Number.isFinite(left) || !Number.isFinite(right) || left <= 0 || right <= 0) {
        error.value = '请输入两个有效的评测编号';
        return;
    }
    loading.value = true;
    error.value = null;
    lines.value = [];
    try {
        const [a, b] = await Promise.all([fetchSource(left), fetchSource(right)]);
        if (a === null)
            throw new Error(`无法读取提交 #${left} 的代码`);
        if (b === null)
            throw new Error(`无法读取提交 #${right} 的代码`);
        leftSource.value = a;
        rightSource.value = b;
        lines.value = await compareSources(left, right);
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        loading.value = false;
    }
}
const unified = computed(() => lines.value
    .map((line) => {
    const prefix = line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' ';
    return `${prefix}${line.text}`;
})
    .join('\n'));
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">代码对比</h1>
        <p class="text-sm text-muted-foreground">输入两个评测编号，逐行比较代码差异</p>
      </div>
      <form class="flex flex-wrap items-center gap-2" @submit.prevent="compare">
        <Input v-model="leftId" class="w-32" placeholder="旧编号" inputmode="numeric" />
        <Input v-model="rightId" class="w-32" placeholder="新编号" inputmode="numeric" />
        <Button type="submit" size="sm" :disabled="loading">
          <Loader2 v-if="loading" class="animate-spin" />
          <ArrowLeftRight v-else />
          对比
        </Button>
        <Button v-if="lines.length" type="button" size="sm" variant="outline" @click="copy(unified)">
          复制差异
        </Button>
      </form>
    </div>

    <div v-if="lines.length" class="flex flex-wrap gap-3 text-sm">
      <span class="rounded-md border px-2 py-1 text-emerald-600 dark:text-emerald-400">
        +{{ summary.added }} 行
      </span>
      <span class="rounded-md border px-2 py-1 text-rose-600 dark:text-rose-400">
        -{{ summary.removed }} 行
      </span>
      <span class="rounded-md border px-2 py-1 text-muted-foreground">
        {{ summary.equal }} 行相同
      </span>
    </div>

    <div v-if="lines.length" class="overflow-hidden rounded-xl border">
      <div class="grid grid-cols-[3rem_1fr_3rem_1fr] bg-muted/50 text-xs text-muted-foreground">
        <div class="px-2 py-2 text-right">旧</div>
        <div class="px-2 py-2">代码</div>
        <div class="px-2 py-2 text-right">新</div>
        <div class="px-2 py-2">代码</div>
      </div>
      <div class="max-h-[70vh] overflow-auto font-mono text-xs">
        <div
          v-for="(line, index) in lines"
          :key="index"
          class="grid grid-cols-[3rem_1fr_3rem_1fr] border-t"
          :class="{
            'bg-emerald-500/10': line.kind === 'added',
            'bg-rose-500/10': line.kind === 'removed',
          }"
        >
          <div class="px-2 py-0.5 text-right text-muted-foreground tabular-nums">
            {{ line.left ?? '' }}
          </div>
          <div class="overflow-x-auto px-2 py-0.5 whitespace-pre">
            <template v-if="line.kind !== 'added'">{{ line.text }}</template>
          </div>
          <div class="px-2 py-0.5 text-right text-muted-foreground tabular-nums">
            {{ line.right ?? '' }}
          </div>
          <div class="overflow-x-auto px-2 py-0.5 whitespace-pre">
            <template v-if="line.kind !== 'removed'">{{ line.text }}</template>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="!loading"
      class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
    >
      输入两个评测编号后开始对比
    </div>
  </div>
</template>
