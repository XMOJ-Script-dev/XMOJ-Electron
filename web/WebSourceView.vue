<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Check, Copy, Loader2, RefreshCw } from '@lucide/vue';
import { Button } from '../src/components/ui/button';
import { fetchSource } from '../src/services/api';
import { useCopy } from '../src/composables/useClipboard';
import { usePanel } from '../src/stores/panel';
import type { JudgeDetails } from '../src/shared/types';

const panel = usePanel();
const { copy, copied } = useCopy();
const source = ref<string | null>(null);
const details = ref<JudgeDetails | null>(null);
const error = ref('');
const detailsError = ref('');
const loading = ref(false);
let requestId = 0;
const solutionId = () => panel.sourceSolutionId.value;

async function load(): Promise<void> {
  const id = solutionId();
  if (!id) return;
  const request = ++requestId;
  loading.value = true;
  source.value = null;
  details.value = null;
  error.value = '';
  detailsError.value = '';
  await Promise.all([
    fetchSource(id).then((value) => {
      if (request !== requestId) return;
      source.value = value;
      if (source.value === null) error.value = '无法读取该提交的代码（可能已被隐藏）';
    }).catch((reason: unknown) => {
      if (request === requestId) error.value = reason instanceof Error ? reason.message : String(reason);
    }),
    window.xmoj.source.details(id).then((value) => {
      if (request === requestId) details.value = value;
    }).catch(() => {
      if (request === requestId) detailsError.value = '测试点详情加载失败';
    }),
  ]);
  if (request === requestId) loading.value = false;
}

onMounted(() => void load());
watch(() => panel.sourceSolutionId.value, () => void load());
</script>

<template>
  <section class="space-y-4 p-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">{{ panel.sourceTitle.value }}</h2>
      <div class="flex gap-2">
        <Button size="sm" variant="outline" :disabled="!source" @click="copy(source ?? '')">
          <Check v-if="copied" />
          <Copy v-else />
          复制源码
        </Button>
        <Button size="icon" variant="outline" :disabled="loading" title="刷新" @click="load">
          <Loader2 v-if="loading" class="animate-spin" />
          <RefreshCw v-else />
        </Button>
      </div>
    </header>
    <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
    <div v-if="details" class="space-y-2">
      <h3 class="text-sm font-medium">测试点详情</h3>
      <div v-if="details.tests.length" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(test, index) in details.tests" :key="`${test.group}-${test.name}`" class="rounded-md border p-3 text-xs">
          <p class="font-medium">#{{ index + 1 }} · {{ test.name }} · {{ test.status }}</p>
          <p class="mt-1 text-muted-foreground">{{ test.timeMs }} ms · {{ test.memoryKb }} KB</p>
          <p v-if="test.score !== null" class="mt-1 text-muted-foreground">得分 {{ test.score }}</p>
        </div>
      </div>
      <pre v-if="details.diagnostic" class="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">{{ details.diagnostic }}</pre>
    </div>
    <p v-if="detailsError" class="text-xs text-muted-foreground">{{ detailsError }}</p>
    <pre v-if="source" class="max-h-[65vh] overflow-auto rounded-md border bg-muted/40 p-4 text-xs leading-relaxed"><code>{{ source }}</code></pre>
  </section>
</template>
