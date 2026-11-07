<script setup lang="ts">import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Bell, Mail, X } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { pollNotices, markBbsMentionRead, markMailMentionRead } from '@/services/api';
import { createPoller } from '@/lib/poller';
import { useSession } from '@/stores/session';
import { useNavigation } from '@/stores/navigation';
import { useMailTarget } from '@/stores/mail-target';
import type { CommunityNotification } from '@/shared/types';
const POLL_INTERVAL_MS = 60000;
const session = useSession();
const navigation = useNavigation();
const mailTarget = useMailTarget();
const notices = ref<CommunityNotification[]>([]);
const seen = new Set<string>();
let seenUser = '';
const noticeKey = (notice: CommunityNotification) => `${notice.kind}:${notice.mentionId}`;
async function refresh(): Promise<void> {
    if (!session.state.authenticated)
        return;
    const user = session.state.user?.username ?? '';
    if (seenUser !== user) { seenUser = user; seen.clear(); notices.value = []; }
    try {
        const items = await pollNotices();
        if (!session.state.authenticated || session.state.user?.username !== user) return;
        const fresh = items.filter((item) => !seen.has(noticeKey(item)));
        if (fresh.length === 0)
            return;
        for (const item of fresh)
            seen.add(noticeKey(item));
        notices.value = [...fresh, ...notices.value].slice(0, 5);
    }
    catch {
    }
}
const poller = createPoller({
    intervalMs: POLL_INTERVAL_MS,
    tick: () => refresh(),
    shouldContinue: () => session.state.authenticated && !document.hidden,
});
function dismiss(notice: CommunityNotification): void {
    notices.value = notices.value.filter((item) => noticeKey(item) !== noticeKey(notice));
}
function open(notice: CommunityNotification): void {
    if (notice.kind === 'bbs') {
        if (notice.postId) navigation.viewThread(notice.postId, notice.pageNumber || 1);
        else navigation.navigate('discussion');
        void markBbsMentionRead(notice.mentionId).catch(() => {});
    }
    else {
        if (notice.mailUser) mailTarget.setTarget(notice.mailUser);
        navigation.navigate('mail');
        void markMailMentionRead(notice.mentionId).catch(() => {});
    }
    dismiss(notice);
}
function onFocus(): void {
    void refresh();
}
onMounted(() => {
    window.addEventListener('focus', onFocus);
    void refresh();
    poller.start();
});
onBeforeUnmount(() => {
    window.removeEventListener('focus', onFocus);
    poller.stop();
});
</script>

<template>
  <div class="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
    <div
      v-for="notice in notices"
      :key="noticeKey(notice)"
      class="pointer-events-auto rounded-lg border bg-popover p-3 shadow-lg"
    >
      <div class="flex items-start gap-2">
        <component
          :is="notice.kind === 'mail' ? Mail : Bell"
          class="mt-0.5 size-4 shrink-0 text-primary"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ notice.title }}</p>
          <p v-if="notice.body" class="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {{ notice.body }}
          </p>
        </div>
        <button
          class="-m-1 shrink-0 rounded p-1 text-muted-foreground hover:bg-accent"
          title="忽略"
          @click="dismiss(notice)"
        >
          <X class="size-3.5" />
        </button>
      </div>
      <div class="mt-2 flex justify-end">
        <Button size="xs" variant="outline" @click="open(notice)">查看</Button>
      </div>
    </div>
  </div>
</template>
