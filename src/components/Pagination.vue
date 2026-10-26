<script setup lang="ts">import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { Button } from '@/components/ui/button';
const props = defineProps<{
    page: number;
    totalPages: number | null;
    disabled?: boolean;
}>();
const emit = defineEmits<{
    (event: 'update:page', value: number): void;
}>();
const canGoBack = computed(() => props.page > 1 && !props.disabled);
const canGoForward = computed(() => {
    if (props.disabled)
        return false;
    if (props.totalPages === null)
        return true;
    return props.page < props.totalPages;
});
function go(target: number): void {
    if (target < 1)
        return;
    if (props.totalPages !== null && target > props.totalPages)
        return;
    if (target === props.page)
        return;
    emit('update:page', target);
}
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <p class="text-sm text-muted-foreground">
      第 <span class="font-medium text-foreground">{{ page }}</span> 页<span
        v-if="totalPages"
      >
        / 共 <span class="font-medium text-foreground">{{ totalPages }}</span> 页</span
      >
      <slot name="summary" />
    </p>

    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" :disabled="!canGoBack" @click="go(page - 1)">
        <ChevronLeft />
        上一页
      </Button>
      <Button variant="outline" size="sm" :disabled="!canGoForward" @click="go(page + 1)">
        下一页
        <ChevronRight />
      </Button>
    </div>
  </div>
</template>
