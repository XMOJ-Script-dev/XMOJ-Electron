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
import { type ProblemCard, type ProblemDetail } from '@/shared/types';
import { htmlToMarkdown } from '@/lib/markdown-copy';
const navigation = useNavigation();
const { copy, isCopied } = useCopy(2000);
const problemId = ref(navigation.activeProblemId.value || 0);
const problem = ref<ProblemDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const std = ref<string | null>(null);
const stdError = ref<string | null>(null);
const statementText = computed(() => cards.value.map(card => `## ${card.title}\n\n${cardMarkdown(card)}`).join('\n\n'));
const cards = computed(() => problem.value?.cards ?? []);
let request = 0;
function cardMarkdown(card: ProblemCard): string {
    const parts = card.isSamples ? card.samples.map((sample, index) =>
        `### 样例输入 #${index + 1}\n\n\`\`\`\n${sample.input}\n\`\`\`\n\n### 样例输出 #${index + 1}\n\n\`\`\`\n${sample.output}\n\`\`\``) : [];
    parts.push(htmlToMarkdown(card.html));
    return parts.filter(Boolean).join('\n\n');
}
async function load(): Promise<void> {
    const id = Number(problemId.value);
    if (!Number.isFinite(id) || id <= 0) {
        error.value = '请输入有效的题目编号';
        return;
    }
    loading.value = true;
    const current = ++request;
    error.value = null;
    std.value = null;
    stdError.value = null;
    try {
        const fresh = await fetchProblemDetail(id, false);
        if (current !== request) return;
        if (/题目不可用/.test(fresh.value.title)) {
            error.value = '题目不可用';
            return;
        }
        problem.value = fresh.value;
        navigation.activeProblemId.value = id;
    }
    catch (caught) {
        if (current !== request) return;
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        if (current === request) loading.value = false;
    }
}
function goSubmit(): void {
    navigation.submitProblem(problem.value?.id ?? Number(problemId.value));
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
      <form class="flex flex-wrap items-center gap-2" @submit.prevent="load">
        <Input
          id="problem-view-id"
          v-model.number="problemId"
          class="w-28"
          placeholder="题目编号"
          inputmode="numeric"
        />
        <Button type="submit" variant="outline" size="sm" :disabled="loading">
          <Loader2 v-if="loading" class="animate-spin" />
          <RefreshCw v-else />
          载入
        </Button>
      </form>
    </div>

    <div v-if="loading && !problem" class="space-y-2">
      <Skeleton class="h-10 w-full rounded-lg" />
      <Skeleton class="h-64 w-full rounded-lg" />
    </div>

    <template v-else-if="problem">
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
          <h2 class="text-sm font-semibold">{{ card.title }}</h2>
          <Button
            size="xs"
            variant="ghost"
            @click="copy(cardMarkdown(card), `card-${index}`)"
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
          <AnnouncementBody v-if="card.html" class="text-sm leading-relaxed" :source="card.html" format="statement" />
        </div>

        <AnnouncementBody v-else class="px-4 py-3 text-sm leading-relaxed" :source="card.html" format="statement" />
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
