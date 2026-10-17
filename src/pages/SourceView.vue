<script setup lang="ts">import { computed, onMounted, ref } from 'vue';
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
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const solutionId = computed(() => panel.sourceSolutionId.value);
async function load(): Promise<void> {
    if (!solutionId.value)
        return;
    loading.value = true;
    error.value = null;
    try {
        source.value = await fetchSource(solutionId.value);
        if (source.value === null)
            error.value = '无法读取该提交的代码（可能已被隐藏）';
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        source.value = null;
    }
    finally {
        loading.value = false;
    }
}
onMounted(() => void load());
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

    <pre
      v-else-if="source"
      class="overflow-auto rounded-lg border bg-muted/30 p-4 font-mono text-xs"
    >{{ source }}</pre>
  </div>
</template>
