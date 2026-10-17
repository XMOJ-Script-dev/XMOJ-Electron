<script setup lang="ts">import { computed, onMounted, ref, watch } from 'vue';
import { User } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { fetchAvatarFor } from '@/services/api';
import { useSession } from '@/stores/session';
const props = withDefaults(defineProps<{
    size?: number;
    username?: string;
    class?: string;
}>(), {
    size: 32,
});
const session = useSession();
const url = ref<string | null>(null);
const failed = ref(false);
const initial = computed(() => (props.username?.trim()[0] ?? '').toUpperCase());
async function resolve(): Promise<void> {
    failed.value = false;
    const target = props.username?.trim();
    if (!target && !session.state.authenticated) {
        url.value = null;
        return;
    }
    try {
        const info = target
            ? await fetchAvatarFor(target)
            : session.state.authenticated
                ? await window.xmoj.session.avatar()
                : null;
        url.value = info?.url ?? null;
    }
    catch {
        url.value = null;
    }
}
onMounted(() => void resolve());
watch(() => [props.username, session.state.authenticated, session.state.user?.username], () => void resolve());
</script>

<template>
  <img
    v-if="url && !failed"
    :src="url"
    :width="size"
    :height="size"
    :alt="props.username ?? session.state.user?.username ?? 'avatar'"
    class="shrink-0 rounded-full bg-muted object-cover"
    :class="cn(props.class)"
    referrerpolicy="no-referrer"
    @error="failed = true"
  />
  <div
    v-else
    :style="{ width: `${size}px`, height: `${size}px` }"
    class="flex shrink-0 items-center justify-center rounded-full bg-muted text-[0.6em] font-medium"
    :class="cn(props.class)"
  >
    <span v-if="initial">{{ initial }}</span>
    <User
      v-else
      :style="{ width: `${Math.round(size * 0.6)}px`, height: `${Math.round(size * 0.6)}px` }"
    />
  </div>
</template>
