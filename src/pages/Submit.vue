<script setup lang="ts">import { computed, onMounted, ref, watch } from 'vue';
import { AlertTriangle, Check, ExternalLink, Loader2, Send, X } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import CodeEditor from '@/components/CodeEditor.vue';
import { fetchProblemDetail, submitCode } from '@/services/api';
import { useCopy } from '@/composables/useClipboard';
import { useErrorToast } from '@/composables/useErrorToast';
import { checkSource, type CodeIssue } from '@/lib/codecheck';
import { useNavigation } from '@/stores/navigation';
import type { ProblemDetail } from '@/shared/types';
const navigation = useNavigation();
const props = withDefaults(defineProps<{
    problemId?: number;
}>(), { problemId: 0 });
const problem = ref<ProblemDetail | null>(null);
const problemId = ref(props.problemId || 0);
const languageId = ref(1);
const enableO2 = ref(true);
const source = ref('');
const loading = ref(false);
const submitting = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const result = ref<string | null>(null);
const { copy, copied } = useCopy();
function draftKey(id: number): string {
    return `xmoj.draft.${id}`;
}
function loadDraft(id: number): string {
    if (!id)
        return '';
    try {
        return localStorage.getItem(draftKey(id)) ?? '';
    }
    catch {
        return '';
    }
}
function saveDraft(id: number, value: string): void {
    if (!id)
        return;
    try {
        if (value.trim())
            localStorage.setItem(draftKey(id), value);
        else
            localStorage.removeItem(draftKey(id));
    }
    catch {
    }
}
const issues = computed<CodeIssue[]>(() => checkSource(source.value, {
    inputName: problem.value?.inputName,
    outputName: problem.value?.outputName,
    languageId: languageId.value,
}));
const blockingIssues = computed(() => issues.value.filter((i) => i.severity === 'error'));
async function load(): Promise<void> {
    const id = Number(problemId.value);
    if (!Number.isFinite(id) || id <= 0) {
        error.value = '请输入有效的题目编号';
        return;
    }
    loading.value = true;
    error.value = null;
    result.value = null;
    try {
        const result = await fetchProblemDetail(id);
        const detail = result.value;
        problem.value = detail;
        if (detail.languages.length) {
            const cpp = detail.languages.find((l) => /C\+\+|G\+\+/i.test(l.name));
            languageId.value = cpp?.id ?? detail.languages[0].id;
        }
        source.value = loadDraft(id);
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        problem.value = null;
    }
    finally {
        loading.value = false;
    }
}
async function submit(): Promise<void> {
    if (blockingIssues.value.length > 0 || !problem.value)
        return;
    submitting.value = true;
    error.value = null;
    result.value = null;
    try {
        const response = await submitCode({
            problemId: Number(problemId.value),
            languageId: languageId.value,
            source: source.value,
            enableO2: enableO2.value,
        });
        if (!response.ok)
            throw new Error(response.message || '提交失败');
        result.value = response.solutionId
            ? `提交成功，评测编号 #${response.solutionId}`
            : '提交已发送，请在“状态”中查看结果';
        saveDraft(Number(problemId.value), '');
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        submitting.value = false;
    }
}
watch(() => props.problemId, (id) => {
    if (id > 0 && id !== problemId.value) {
        problemId.value = id;
        void load();
    }
});
watch(source, (value) => saveDraft(Number(problemId.value), value));
onMounted(() => {
    if (Number(problemId.value) > 0)
        void load();
});
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight">提交代码</h1>
        <p class="truncate text-sm text-muted-foreground">
          <template v-if="problem">
            {{ problem.id }} · {{ problem.title }}
          </template>
          <template v-else>选择题目并编写代码</template>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Input
          id="submit-problem-id"
          v-model.number="problemId"
          class="w-28"
          placeholder="题目编号"
          inputmode="numeric"
        />
        <Button variant="outline" size="sm" :disabled="loading" @click="load">
          <Loader2 v-if="loading" class="animate-spin" />
          载入题目
        </Button>
        <Button
          v-if="problem"
          variant="ghost"
          size="sm"
          @click="navigation.viewProblem(problem.id)"
        >
          <ExternalLink />
          查看题面
        </Button>
      </div>
    </div>

    <div
      v-if="result"
      class="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
    >
      {{ result }}
    </div>

    <div v-if="loading" class="space-y-2">
      <Skeleton class="h-10 w-full rounded-lg" />
      <Skeleton class="h-96 w-full rounded-lg" />
    </div>

    <template v-else>
      <div v-if="problem" class="flex flex-wrap items-center gap-2 text-sm">
        <span v-if="problem.timeLimitMs" class="rounded-md border px-2 py-1">
          时间
          {{ problem.timeLimitMs >= 1000 ? `${problem.timeLimitMs / 1000} s` : `${problem.timeLimitMs} ms` }}
        </span>
        <span v-if="problem.memoryLimitKb" class="rounded-md border px-2 py-1">
          内存 {{ Math.round(problem.memoryLimitKb / 1024) }} MB
        </span>
        <span v-if="problem.inputName" class="rounded-md border px-2 py-1">
          文件输入输出：{{ problem.inputName }}.in / {{ problem.outputName || problem.inputName }}.out
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <select
          v-if="problem?.languages.length"
          v-model.number="languageId"
          class="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option v-for="language in problem.languages" :key="language.id" :value="language.id">
            {{ language.name }}
          </option>
        </select>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            v-model="enableO2"
            type="checkbox"
            class="size-4 rounded border-input accent-primary"
          />
          打开 O2 优化
        </label>
        <span v-if="source" class="text-xs text-muted-foreground">草稿已自动保存</span>
      </div>

      <CodeEditor v-model="source" :language-id="languageId" height="26rem" />

      <div v-if="issues.length" class="space-y-2">
        <p class="text-sm font-medium">
          提交前检查发现 {{ issues.length }} 处问题
          <span v-if="blockingIssues.length" class="text-destructive">
            （{{ blockingIssues.length }} 处会阻止提交）
          </span>
        </p>
        <div
          v-for="(issue, index) in issues"
          :key="`${issue.label}-${index}`"
          class="rounded-lg border px-4 py-3 text-sm"
          :class="
            issue.severity === 'error'
              ? 'border-destructive/40 bg-destructive/10'
              : 'border-amber-500/40 bg-amber-500/10'
          "
        >
          <p class="flex items-center gap-2 font-medium">
            <AlertTriangle class="size-4 shrink-0" />
            {{ issue.label }}
          </p>
          <p class="mt-1">{{ issue.message }}</p>
          <div v-if="issue.suggestion" class="mt-2">
            <pre class="overflow-x-auto rounded bg-muted p-2 text-xs">{{ issue.suggestion }}</pre>
            <Button
              size="xs"
              variant="outline"
              class="mt-2"
              @click="copy(issue.suggestion ?? '')"
            >
              <Check v-if="copied" />
              <X v-else />
              {{ copied ? '已复制' : '复制 freopen 语句' }}
            </Button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4">
        <p class="text-xs text-muted-foreground">
          <template v-if="problem?.inputName">
            本题需使用文件输入输出，可用上方建议补全 freopen。
          </template>
          <template v-else>本题使用标准输入输出。</template>
        </p>
        <Button
          :disabled="submitting || blockingIssues.length > 0 || !source.trim()"
          @click="submit"
        >
          <Loader2 v-if="submitting" class="animate-spin" />
          <Send v-else />
          {{ submitting ? '提交中…' : '提交' }}
        </Button>
      </div>
    </template>
  </div>
</template>
