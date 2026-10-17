<script setup lang="ts">import { computed, onMounted, ref, watch } from 'vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { cn } from '@/lib/utils';
import { fetchUserInfo } from '@/services/api';
import { usePanel } from '@/stores/panel';
import type { UserInfo, UserTag } from '@/shared/types';
const props = withDefaults(defineProps<{
    username: string;
    tag?: UserTag | null;
    size?: number;
    preferNick?: boolean;
    link?: boolean;
    class?: string;
}>(), {
    tag: null,
    size: 24,
    preferNick: false,
    link: true,
});
const panel = usePanel();
const info = ref<UserInfo | null>(null);
async function resolve(): Promise<void> {
    const name = props.username.trim();
    if (!name) {
        info.value = null;
        return;
    }
    try {
        info.value = await fetchUserInfo(name);
    }
    catch {
        info.value = null;
    }
}
onMounted(() => void resolve());
watch(() => props.username, () => void resolve());
const label = computed(() => {
    const name = props.username;
    if (!props.preferNick)
        return name;
    return info.value?.nick || name;
});
const badge = computed<UserTag | null>(() => props.tag ?? info.value?.badge ?? null);
const badgeStyle = computed(() => {
    const current = badge.value;
    if (!current)
        return undefined;
    const background = /^#[0-9a-f]{6}$/i.test(current.backgroundColor)
        ? current.backgroundColor
        : '#000000';
    const color = /^#[0-9a-f]{6}$/i.test(current.color) ? current.color : '#ffffff';
    return { backgroundColor: background, color };
});
function openProfile(): void {
    panel.openProfile(props.username);
}
</script>

<template>
  <span :class="cn('inline-flex min-w-0 items-center gap-1.5 align-middle', props.class)">
    <UserAvatar :size="size" :username="username" />
    <span v-if="link" class="min-w-0">
      <button
        type="button"
        class="max-w-full truncate hover:underline"
        :title="username"
        @click.stop="openProfile"
      >
        {{ label }}
      </button>
    </span>
    <span v-else class="min-w-0 truncate" :title="username">{{ label }}</span>

    <span
      v-if="badge?.content"
      class="shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium"
      :style="badgeStyle"
      :title="badge.content"
      >{{ badge.content }}</span
    >
    <span
      v-else-if="info?.isAdmin"
      class="shrink-0 rounded border px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground"
      >管理员</span
    >
  </span>
</template>
