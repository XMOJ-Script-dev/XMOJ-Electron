<script setup lang="ts">import type { HTMLAttributes, Ref } from "vue";
import { useEventListener, useMediaQuery, useVModel } from "@vueuse/core";
import { TooltipProvider } from "reka-ui";
import { computed, ref } from "vue";
import { cn } from "@/lib/utils";
import { provideSidebarContext, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from "./utils";
const props = withDefaults(defineProps<{
    defaultOpen?: boolean;
    open?: boolean;
    class?: HTMLAttributes["class"];
}>(), {
    defaultOpen: false,
    open: undefined,
});
const emits = defineEmits<{
    "update:open": [
        open: boolean
    ];
}>();
const isMobile = useMediaQuery("(max-width: 768px)");
const openMobile = ref(false);
const SIDEBAR_OPEN_KEY = "xmoj.sidebar.open.v1";
function initialOpen(): boolean {
    try {
        const saved = localStorage.getItem(SIDEBAR_OPEN_KEY);
        return saved === null ? props.defaultOpen : saved === "true";
    }
    catch {
        return props.defaultOpen;
    }
}
const open = useVModel(props, "open", emits, {
    defaultValue: initialOpen(),
    passive: (props.open === undefined) as false,
}) as Ref<boolean>;
const pinnedOpen = ref(initialOpen());
function setOpen(value: boolean, persist = true) {
    open.value = value;
    if (persist) {
        pinnedOpen.value = value;
        try {
            localStorage.setItem(SIDEBAR_OPEN_KEY, String(value));
        }
        catch {
        }
    }
}
function setOpenMobile(value: boolean) {
    openMobile.value = value;
}
function toggleSidebar() {
    return isMobile.value ? setOpenMobile(!openMobile.value) : setOpen(!open.value);
}
useEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
    }
});
const state = computed(() => open.value ? "expanded" : "collapsed");
provideSidebarContext({
    state,
    open,
    pinnedOpen,
    setOpen,
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar,
});
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <div
      data-slot="sidebar-wrapper"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH,
        '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
        '--sidebar-offset': SIDEBAR_WIDTH_ICON,
      }"
      :class="cn('group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full', props.class)"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </TooltipProvider>
</template>
