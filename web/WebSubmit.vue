<script setup lang="ts">
import { ref, watch } from 'vue';
import { AlertTriangle, Loader2, Send } from '@lucide/vue';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import { fetchProblemDetail, submitCode } from '../src/services/api';
import type { ProblemDetail } from '../src/shared/types';

const props = defineProps<{
  problemId: number;
  contestId: number;
}>();
const problemId = ref(props.problemId > 0 ? String(props.problemId) : '');
const problem = ref<ProblemDetail | null>(null);
const languageId = ref(1);
const source = ref('');
const enableO2 = ref(true);
const loading = ref(false);
const submitting = ref(false);
const error = ref('');
const result = ref('');

async function loadProblem(): Promise<void> {
  const id = Number(problemId.value);
  if (!Number.isSafeInteger(id) || id < 1) {
    error.value = '请输入有效的题目编号';
    return;
  }
  loading.value = true;
  error.value = '';
  result.value = '';
  try {
    const response = await fetchProblemDetail(id);
    problem.value = response.value;
    const cpp = response.value.languages.find(language => /C\+\+|G\+\+/i.test(language.name));
    languageId.value = cpp?.id ?? response.value.languages[0]?.id ?? 1;
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught);
    problem.value = null;
  } finally {
    loading.value = false;
  }
}

async function submit(): Promise<void> {
  if (!problem.value || !source.value.trim()) {
    error.value = '请先载入题目并填写代码';
    return;
  }
  submitting.value = true;
  error.value = '';
  result.value = '';
  try {
    const response = await submitCode({
      problemId: problem.value.id,
      languageId: languageId.value,
      source: source.value,
      enableO2: enableO2.value,
      ...(props.contestId > 0 && problem.value.id === props.problemId
        ? { contestId: props.contestId }
        : {}),
    });
    if (!response.ok) throw new Error(response.message || '提交失败');
    result.value = response.solutionId
      ? `提交成功，评测编号 #${response.solutionId}`
      : '提交已发送，请在“状态”中查看结果';
    source.value = '';
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    submitting.value = false;
  }
}

watch(() => props.problemId, (id) => {
  problemId.value = id > 0 ? String(id) : '';
  if (id > 0) void loadProblem();
}, { immediate: true });
</script>

<template>
  <main class="mx-auto w-full max-w-5xl space-y-5 p-6">
    <header>
      <h1 class="text-2xl font-semibold">提交代码</h1>
      <p class="text-sm text-muted-foreground">提交源码会发送到 XMOJ 进行评测。</p>
    </header>

    <form class="flex flex-wrap gap-2" @submit.prevent="loadProblem">
      <Input v-model="problemId" class="w-36" inputmode="numeric" placeholder="题目编号" />
      <Button type="submit" variant="outline" :disabled="loading">
        <Loader2 v-if="loading" class="animate-spin" />
        载入题目
      </Button>
      <span v-if="problem" class="self-center text-sm text-muted-foreground">
        {{ problem.id }} · {{ problem.title }}
      </span>
    </form>

    <div v-if="error" role="alert" class="flex items-center gap-2 text-sm text-destructive">
      <AlertTriangle class="size-4" />
      {{ error }}
    </div>
    <div v-if="result" role="status" class="rounded-md border p-3 text-sm">{{ result }}</div>

    <template v-if="problem">
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model.number="languageId"
          class="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option v-for="language in problem.languages" :key="language.id" :value="language.id">
            {{ language.name }}
          </option>
        </select>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="enableO2" type="checkbox">
          启用 O2
        </label>
      </div>
      <textarea
        v-model="source"
        class="min-h-96 w-full resize-y rounded-md border bg-background p-3 font-mono text-sm"
        spellcheck="false"
        aria-label="代码源文件"
        placeholder="在此输入或粘贴代码"
      />
      <Button :disabled="submitting || !source.trim()" @click="submit">
        <Loader2 v-if="submitting" class="animate-spin" />
        <Send v-else />
        提交代码
      </Button>
    </template>
  </main>
</template>
