<script setup lang="ts">import { computed, onMounted, ref, watch } from 'vue';
import CodeEditor from '@/components/CodeEditor.vue';
import type { JudgeDetails } from '@/shared/types';
import { Check, Copy, Loader2, RefreshCw } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchSource } from '@/services/api';
import { useCopy } from '@/composables/useClipboard';
import { useErrorToast } from '@/composables/useErrorToast';
import { usePanel } from '@/stores/panel';
const panel = usePanel();
const { copy, copied } = useCopy();
const source = ref<string | null>(null);
const details = ref<JudgeDetails | null>(null);
const detailsError = ref<string | null>(null);
let request = 0;
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const solutionId = computed(() => panel.sourceSolutionId.value);
async function load(): Promise<void> {
    if (!solutionId.value)
        return;
    loading.value = true;
    const current = ++request;
    const id = solutionId.value;
    source.value = null;
    details.value = null;
    detailsError.value = null;
    error.value = null;
    try {
        const [codeResult, detailResult] = await Promise.allSettled([fetchSource(id), window.xmoj.source.details(id)]);
        if (current !== request) return;
        if (detailResult.status === 'fulfilled') details.value = detailResult.value;
        else detailsError.value = '测试点详情加载失败';
        if (codeResult.status === 'rejected') throw codeResult.reason;
        source.value = codeResult.value;
        if (source.value === null)
            error.value = '无法读取该提交的代码（可能已被隐藏）';
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        source.value = null;
    }
    finally {
        if (current === request) loading.value = false;
    }
}
onMounted(() => void load());
watch(solutionId, () => void load());
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-4 p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-semibold tracking-tight">{{ panel.sourceTitle.value }}</h1>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="!source" @click="copy(source ?? '')">
          <Check v-if="copied" />
          <Copy v-else />
          复制代码
        </Button>
        <Button variant="outline" size="icon" :disabled="loading" title="刷新" @click="load">
          <Loader2 v-if="loading" class="animate-spin" />
          <RefreshCw v-else />
        </Button>
      </div>
    </div>

    <Skeleton v-if="loading && !source" class="h-64 w-full rounded-lg" />

    <section v-if="details" class="space-y-3">
      <h2 class="text-sm font-semibold">测试点详情</h2>
      <div v-if="details.tests.length" class="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <div v-for="(test, index) in details.tests" :key="`${test.group}-${test.name}`" class="rounded-lg border bg-card p-3 text-xs" :class="test.status === 'AC' ? 'border-emerald-500/40' : 'border-destructive/40'">
          <p v-if="test.group" class="mb-1 text-muted-foreground">{{ test.group }}</p>
          <div class="flex justify-between gap-2"><span :title="test.name">#{{ index + 1 }} · {{ test.name }}</span><strong :class="test.status === 'AC' ? 'text-emerald-600' : 'text-destructive'">{{ test.status }}</strong></div>
          <p class="mt-2 font-mono text-muted-foreground">{{ test.timeMs }} ms · {{ test.memoryKb }} KB</p>
          <p v-if="test.score !== null" class="mt-1 text-muted-foreground">得分 {{ test.score }}</p>
        </div>
      </div>
      <p v-else class="text-sm text-muted-foreground">该提交暂无可查看的测试点信息</p>
      <pre v-if="details.diagnostic" class="overflow-auto rounded-lg bg-muted p-4 text-xs">{{ details.diagnostic }}</pre>
    </section>
    <p v-if="detailsError" class="text-sm text-destructive">{{ detailsError }}</p>
    <CodeEditor v-if="source" :model-value="source" :language-id="panel.sourceLanguage.value" readonly height="32rem" />
  </div>
</template>
