<script setup lang="ts">import { computed, onBeforeUnmount, ref, watch } from 'vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { cn } from '@/lib/utils';
import { userColor } from '@/lib/user-color';
import { fetchUserInfo } from '@/services/api';
import { usePanel } from '@/stores/panel';
import type { UserInfo, UserTag } from '@/shared/types';
import { resolveUserBadge, userBadgeStyle } from '@/shared/user-badge';
import { useSession } from '@/stores/session';
const props = withDefaults(defineProps<{
    username: string;
    tag?: UserTag | null;
    size?: number;
    preferNick?: boolean;
    link?: boolean;
    avatar?: boolean;
    class?: string;
}>(), {
    tag: null,
    size: 24,
    preferNick: false,
    link: true,
    avatar: true,
});
const panel = usePanel();
const info = ref<UserInfo | null>(null);
const session = useSession();
let request = 0;
async function resolve(): Promise<void> {
    const current = ++request;
    const name = props.username.trim();
    if (!name) {
        info.value = null;
        return;
    }
    try {
        const result = await fetchUserInfo(name);
        if (current === request) info.value = result;
    }
    catch {
        if (current === request) info.value = null;
    }
}
watch([() => props.username, () => session.state.authenticated, () => session.state.user?.username], () => { info.value = null; void resolve(); }, { immediate: true });
onBeforeUnmount(() => { request++; });
const label = computed(() => {
    const name = props.username;
    if (!props.preferNick)
        return name;
    return info.value?.nick || name;
});
const badge = computed(() => resolveUserBadge(props.username, info.value, props.tag));
const badgeStyle = computed(() => {
    const current = badge.value;
    if (!current)
        return undefined;
    return userBadgeStyle(current);
});
function openProfile(): void {
    panel.openProfile(props.username);
}
</script>

<template>
  <span data-slot="user-chip" :class="cn('inline-flex min-w-0 items-center gap-1.5 align-middle', props.class)">
    <UserAvatar v-if="avatar" :size="size" :username="username" />
    <span v-if="link" class="min-w-0">
      <button
        type="button"
        class="max-w-full truncate hover:underline"
        :title="username"
        :style="{ color: userColor(username, info?.rating) }"
        @click.stop="openProfile"
      >
        {{ label }}
      </button>
    </span>
    <span v-else class="min-w-0 truncate" :title="username" :style="{ color: userColor(username, info?.rating) }">{{ label }}</span>

    <span
      v-if="badge?.content"
      data-slot="user-badge"
      class="shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium"
      :style="badgeStyle"
      :title="badge.content"
      >{{ badge.content }}</span
    >
  </span>
</template>
