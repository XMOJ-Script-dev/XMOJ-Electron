<script setup lang="ts">import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
const props = defineProps<{
    class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <main
    data-slot="sidebar-inset"
    :class="cn(
      'bg-background relative flex w-full flex-1 flex-col',
      // The desktop sidebar keeps a permanent icon rail in the flow, so the
      // content is offset by a constant amount and never reflows when the
      // sidebar opens or closes.
      'md:pl-(--sidebar-offset)',
      'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
      props.class,
    )"
  >
    <slot />
  </main>
</template>
