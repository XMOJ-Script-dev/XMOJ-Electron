<script setup lang="ts">import { AlertTriangle, Check, Info, X } from '@lucide/vue';
import { useToasts } from '@/stores/toasts';
const toasts = useToasts();
const TONE = {
    error: { icon: AlertTriangle, class: 'border-destructive/50 bg-destructive/10 text-destructive' },
    warning: { icon: AlertTriangle, class: 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    success: { icon: Check, class: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    info: { icon: Info, class: 'border-border bg-popover' },
} as const;
</script>

<template>
  <div
    class="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2"
  >
    <TransitionGroup
      enter-from-class="translate-y-2 opacity-0"
      enter-active-class="transition duration-200"
      leave-to-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150"
    >
      <div
        v-for="toast in toasts.items.value"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur"
        :class="TONE[toast.tone].class"
        role="alert"
      >
        <component :is="TONE[toast.tone].icon" class="mt-0.5 size-4 shrink-0" />
        <p class="min-w-0 flex-1 text-sm break-words whitespace-pre-wrap">{{ toast.message }}</p>
        <button
          class="-m-1 shrink-0 rounded p-1 opacity-70 hover:opacity-100"
          title="关闭"
          @click="toasts.dismiss(toast.id)"
        >
          <X class="size-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
