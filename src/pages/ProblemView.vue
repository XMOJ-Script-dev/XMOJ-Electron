<script setup lang="ts">import { computed, onMounted, ref, watch } from 'vue';
import { Check, Copy, Loader2, RefreshCw, Send } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementBody from '@/components/AnnouncementBody.vue';
import { fetchProblemDetail } from '@/services/api';
import { useCopy } from '@/composables/useClipboard';
import { useErrorToast } from '@/composables/useErrorToast';
import { useNavigation } from '@/stores/navigation';
import { type ProblemDetail } from '@/shared/types';
const navigation = useNavigation();
const { copy, isCopied } = useCopy(2000);
const problemId = ref(navigation.activeProblemId.value || 0);
const problem = ref<ProblemDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const std = ref<string | null>(null);
const stdError = ref<string | null>(null);
const statementText = computed(() => textOf(problem.value?.statementHtml ?? ''));
const cards = computed(() => problem.value?.cards ?? []);
const hasSamples = computed(() => cards.value.some((card) => card.isSamples));
function textOf(html: string): string {
    if (!html)
        return '';
    const container = document.createElement('div');
    container.innerHTML = html;
    return (container.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}
async function load(): Promise<void> {
    const id = Number(problemId.value);
    if (!Number.isFinite(id) || id <= 0) {
        error.value = '请输入有效的题目编号';
        return;
    }
    loading.value = true;
    error.value = null;
    std.value = null;
    stdError.value = null;
    try {
        const first = await fetchProblemDetail(id, true);
        problem.value = first.value;
        navigation.activeProblemId.value = id;
        if (first.fromCache) {
            const fresh = await fetchProblemDetail(id, false);
            problem.value = fresh.value;
        }
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        problem.value = null;
    }
    finally {
        loading.value = false;
    }
}
function goSubmit(): void {
    navigation.submitProblem(Number(problemId.value));
}
watch(() => navigation.activeProblemId.value, (id) => {
    if (id > 0 && id !== problemId.value) {
        problemId.value = id;
        void load();
    }
});
onMounted(() => {
    if (Number(problemId.value) > 0)
        void load();
});
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ problem ? problem.title : '题目' }}
        </h1>
        <p class="text-sm text-muted-foreground">
          <template v-if="problem">#{{ problem.id }}</template>
          <template v-else>输入题目编号以查看题面</template>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Input
          id="problem-view-id"
          v-model.number="problemId"
          class="w-28"
          placeholder="题目编号"
          inputmode="numeric"
        />
        <Button variant="outline" size="sm" :disabled="loading" @click="load">
          <Loader2 v-if="loading" class="animate-spin" />
          <RefreshCw v-else />
          载入
        </Button>
      </div>
    </div>

    <div v-if="loading" class="space-y-2">
      <Skeleton class="h-10 w-full rounded-lg" />
      <Skeleton class="h-64 w-full rounded-lg" />
    </div>

    <template v-else-if="problem">
      <!-- Problem information: the judge's `.jumbotron` header, as chips. -->
      <section class="rounded-xl" data-slot="problem-head">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="item in problem.meta"
            :key="item.label + item.value"
            class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"
          >
            <span class="text-muted-foreground">{{ item.label }}</span>
            <span class="font-mono font-medium">{{ item.value }}</span>
          </span>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button size="sm" @click="goSubmit">
            <Send />
            提交代码
          </Button>
          <Button size="sm" variant="outline" @click="copy(statementText, 'statement')">
            <Check v-if="isCopied('statement')" />
            <Copy v-else />
            {{ isCopied('statement') ? '已复制' : '复制完整题面' }}
          </Button>
        </div>
      </section>

      <article
        v-for="(card, index) in cards"
        :key="`card-${index}`"
        class="rounded-xl border bg-card"
        data-slot="problem-card"
      >
        <header class="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <h2 class="text-sm font-medium">{{ card.title || `第 ${index + 1} 节` }}</h2>
          <Button
            size="xs"
            variant="ghost"
            @click="copy(textOf(card.html), `card-${index}`)"
          >
            <Check v-if="isCopied(`card-${index}`)" />
            <Copy v-else />
            {{ isCopied(`card-${index}`) ? '已复制' : '复制' }}
          </Button>
        </header>

        <div v-if="card.isSamples && card.samples.length" class="space-y-3 p-4">
          <div
            v-for="(sample, sampleIndex) in card.samples"
            :key="sampleIndex"
            class="grid gap-3 md:grid-cols-2"
          >
            <div class="rounded-lg border">
              <header class="flex items-center justify-between border-b px-3 py-1.5">
                <span class="text-xs text-muted-foreground">输入 #{{ sampleIndex + 1 }}</span>
                <Button
                  size="xs"
                  variant="ghost"
                  @click="copy(sample.input, `in-${index}-${sampleIndex}`)"
                >
                  <Check v-if="isCopied(`in-${index}-${sampleIndex}`)" />
                  <Copy v-else />
                  {{ isCopied(`in-${index}-${sampleIndex}`) ? '已复制' : '复制' }}
                </Button>
              </header>
              <pre class="overflow-x-auto px-3 py-2 font-mono text-xs">{{ sample.input }}</pre>
            </div>
            <div class="rounded-lg border">
              <header class="flex items-center justify-between border-b px-3 py-1.5">
                <span class="text-xs text-muted-foreground">输出 #{{ sampleIndex + 1 }}</span>
                <Button
                  size="xs"
                  variant="ghost"
                  @click="copy(sample.output, `out-${index}-${sampleIndex}`)"
                >
                  <Check v-if="isCopied(`out-${index}-${sampleIndex}`)" />
                  <Copy v-else />
                  {{ isCopied(`out-${index}-${sampleIndex}`) ? '已复制' : '复制' }}
                </Button>
              </header>
              <pre class="overflow-x-auto px-3 py-2 font-mono text-xs">{{ sample.output }}</pre>
            </div>
          </div>
        </div>

        <AnnouncementBody v-else class="px-4 py-3 text-sm leading-relaxed" :source="card.html" />
      </article>

      <article v-if="cards.length === 0" class="rounded-xl border bg-card" data-slot="problem-card">
        <header class="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <h2 class="text-sm font-medium">题目描述</h2>
          <Button size="xs" variant="ghost" @click="copy(statementText, 'fallback')">
            <Check v-if="isCopied('fallback')" />
            <Copy v-else />
            {{ isCopied('fallback') ? '已复制' : '复制' }}
          </Button>
        </header>
        <AnnouncementBody class="px-4 py-3 text-sm" :source="problem.statementHtml" />
      </article>

      <!-- Samples that were not part of a card. -->
      <article
        v-if="!hasSamples && problem.samples.length"
        class="rounded-xl border bg-card"
        data-slot="problem-card"
      >
        <header class="border-b px-4 py-2.5">
          <h2 class="text-sm font-medium">样例输入输出</h2>
        </header>
        <div class="space-y-3 p-4">
          <div
            v-for="(sample, index) in problem.samples"
            :key="index"
            class="grid gap-3 md:grid-cols-2"
          >
            <pre
              class="overflow-x-auto rounded-lg border p-3 font-mono text-xs"
            >{{ sample.input }}</pre>
            <pre
              class="overflow-x-auto rounded-lg border p-3 font-mono text-xs"
            >{{ sample.output }}</pre>
          </div>
        </div>
      </article>
    </template>

    <div
      v-else
      class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
    >
      还没有载入题目
    </div>
  </div>
</template>
