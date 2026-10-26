<script setup lang="ts">import type { SidebarProps } from ".";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useIntervalFn, useStorage } from "@vueuse/core";
import { Pin, PinOff } from '@lucide/vue';
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from '@/components/ui/sheet';
import SheetDescription from '@/components/ui/sheet/SheetDescription.vue';
import SheetHeader from '@/components/ui/sheet/SheetHeader.vue';
import SheetTitle from '@/components/ui/sheet/SheetTitle.vue';
import { SIDEBAR_WIDTH_MOBILE, useSidebar } from "./utils";
defineOptions({
    inheritAttrs: false,
});
const props = withDefaults(defineProps<SidebarProps>(), {
    side: "left",
    variant: "sidebar",
    collapsible: "offcanvas",
});
const { isMobile, state, openMobile, setOpenMobile, setOpen } = useSidebar();
let closeTimer: number | undefined;
const pinned = ref(0);
const persistent = useStorage('xmoj-sidebar-pinned', false);
function togglePersistent(): void {
    persistent.value = !persistent.value;
    setOpen(true, false);
}
const pointerInside = ref(false);
function cancelClose(): void {
    if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = undefined;
    }
}
function isPointerOverSidebar(point?: { x: number; y: number }): boolean {
    if (!point)
        return false;
    const inside = (node: HTMLElement | null) => {
        if (!node)
            return false;
        const rect = node.getBoundingClientRect();
        return (point.x >= rect.left && point.x < rect.right && point.y >= rect.top && point.y < rect.bottom);
    };
    const rail = document.querySelector('[data-slot="sidebar-hover-rail"]') as HTMLElement | null;
    return inside(panelRef.value) || inside(rail);
}
function onMouseEnter(event?: MouseEvent): void {
    pointerInside.value = true;
    cancelClose();
    setOpen(true, false);
    void event;
}
function onMouseLeave(event?: MouseEvent): void {
    pointerInside.value = false;
    if (event) lastPointer = { x: event.clientX, y: event.clientY };
    if (persistent.value || pinned.value > 0)
        return;
    scheduleClose(70);
}
function scheduleClose(delay = 160): void {
    cancelClose();
    closeTimer = window.setTimeout(() => {
        closeTimer = undefined;
        if (persistent.value || pinned.value > 0)
            return;
        if (document.querySelector('[data-slot="dropdown-menu-content"][data-state="open"]')) return;
        if (isPointerOverSidebar(lastPointer) || pointerInside.value)
            return;
        setOpen(false);
    }, delay);
}
function pin(): void {
    pinned.value += 1;
    cancelClose();
    setOpen(true, false);
}
function unpin(): void {
    pinned.value = Math.max(0, pinned.value - 1);
    if (pinned.value === 0 && !pointerInside.value)
        scheduleClose();
}
function onDocumentPointerDown(event: PointerEvent): void {
    if (persistent.value) return;
    const target = event.target as Node | null;
    if (!target)
        return;
    const panel = panelRef.value;
    if (panel && panel.contains(target))
        return;
    const closest = (target as HTMLElement).closest?.('[data-slot="dropdown-menu-content"], [data-slot="tooltip-content"]');
    if (closest)
        return;
    if (pinned.value > 0 && pointerInside.value)
        return;
    setOpen(false);
}
function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && !persistent.value)
        setOpen(false);
}
const panelRef = ref<HTMLElement | null>(null);
let lastPointer: { x: number; y: number } | undefined;
function trackPointer(event: MouseEvent): void {
    lastPointer = { x: event.clientX, y: event.clientY };
    const inside = isPointerOverSidebar(lastPointer);
    pointerInside.value = inside;
    if (inside) cancelClose();
    else if (state.value === 'expanded' && !persistent.value && pinned.value === 0 && closeTimer === undefined) scheduleClose(70);
}
let popoverPinned = false;
const { pause } = useIntervalFn(() => {
    const node = document.querySelector('[data-slot="dropdown-menu-content"][data-state="open"]') as HTMLElement | null;
    const open = Boolean(node && node.offsetParent !== null);
    if (open && !popoverPinned) {
        popoverPinned = true;
        pin();
    }
    else if (!open) {
        if (popoverPinned) {
            popoverPinned = false;
            unpin();
        }
    }
}, 150, { immediateCallback: true });
onBeforeUnmount(() => {
    pause();
    cancelClose();
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('mousemove', trackPointer, true);
});
onMounted(() => {
    if (persistent.value) setOpen(true, false);
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('mousemove', trackPointer, true);
});
</script>

<template>
  <div
    v-if="collapsible === 'none'"
    data-slot="sidebar"
    :class="cn('bg-sidebar text-sidebar-foreground flex w-(--sidebar-width) flex-col', props.class)"
    v-bind="$attrs"
  >
    <slot />
  </div>

  <Sheet v-else-if="isMobile" :open="openMobile" v-bind="$attrs" @update:open="setOpenMobile">
    <SheetContent
      data-sidebar="sidebar"
      data-slot="sidebar"
      data-mobile="true"
      :side="side"
      class="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
      }"
    >
      <SheetHeader class="sr-only">
        <SheetTitle>Sidebar</SheetTitle>
        <SheetDescription>Displays the mobile sidebar.</SheetDescription>
      </SheetHeader>
      <div class="flex h-full w-full flex-col">
        <slot />
      </div>
    </SheetContent>
  </Sheet>

  <div
    v-else
    class="group peer text-sidebar-foreground hidden md:block"
    data-slot="sidebar"
    :data-state="state"
    :data-collapsible="state === 'collapsed' ? collapsible : ''"
    :data-variant="variant"
    :data-side="side"
  >
    <div :class="persistent ? 'relative w-(--sidebar-width) shrink-0' : 'relative w-(--sidebar-width-icon) shrink-0'" />
    <div
      :class="
        cn(
          'absolute inset-y-0 z-40 hidden w-(--sidebar-width-icon) md:block',
          side === 'left' ? 'left-0' : 'right-0',
          state === 'expanded' ? 'pointer-events-none' : 'cursor-pointer',
        )
      "
      data-slot="sidebar-hover-rail"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
      @click="onMouseEnter"
    />
    <div
      :class="cn(
        'fixed inset-y-0 z-20 hidden overflow-hidden md:block',
        'bg-sidebar text-sidebar-foreground border-sidebar-border',
        'transition-[width] duration-100 ease-out',
        side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
        state === 'collapsed'
          ? 'w-(--sidebar-width-icon)'
          : 'w-(--sidebar-width) shadow-lg',
        variant === 'floating' || variant === 'inset' ? 'p-2' : '',
        props.class,
      )"
      v-bind="$attrs"
      ref="panelRef"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <div
        data-sidebar="sidebar"
        class="flex h-full flex-col group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        :style="{ width: 'var(--sidebar-width)' }"
      >
        <button v-if="state === 'expanded'" class="absolute right-2 top-2 z-10 rounded-md bg-sidebar p-1.5 hover:bg-sidebar-accent" :title="persistent ? '取消常驻' : '常驻侧栏'" :aria-pressed="persistent" @click="togglePersistent">
          <PinOff v-if="persistent" class="size-4" /><Pin v-else class="size-4" />
        </button>
        <slot />
      </div>
    </div>
  </div>
</template>
