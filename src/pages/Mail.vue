<script setup lang="ts">import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { ArrowLeft, Loader2, RefreshCw, Send } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementBody from '@/components/AnnouncementBody.vue';
import UserChip from '@/components/UserChip.vue';
import { fetchMail, fetchMailList, sendMail, userExists } from '@/services/api';
import { useSession } from '@/stores/session';
import { useMailTarget } from '@/stores/mail-target';
import type { MailMessage, MailThreadSummary } from '@/shared/community';
const session = useSession();
const mailTarget = useMailTarget();
const threads = ref<MailThreadSummary[]>([]);
const messages = ref<MailMessage[]>([]);
const activeUser = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const draft = ref('');
const sending = ref(false);
const currentUser = computed(() => session.state.user?.username ?? '');
async function loadThreads(): Promise<void> {
    error.value = null;
    const read = async (cacheOnly: boolean) => {
        const result = (await fetchMailList(cacheOnly)) as {
            Success: boolean;
            Message?: string;
            Data?: {
                MailList: MailThreadSummary[];
            };
        };
        if (!result.Success)
            throw new Error(result.Message || '加载失败');
        threads.value = result.Data?.MailList ?? [];
    };
    try {
        await read(true);
    }
    catch {
    }
    if (threads.value.length === 0)
        loading.value = true;
    try {
        await read(false);
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        if (threads.value.length === 0)
            threads.value = [];
    }
    finally {
        loading.value = false;
    }
}
async function openThread(otherUser: string): Promise<void> {
    activeUser.value = otherUser;
    error.value = null;
    const read = async (cacheOnly: boolean) => {
        const result = (await fetchMail(otherUser, cacheOnly)) as {
            Success: boolean;
            Message?: string;
            Data?: {
                Mail: MailMessage[];
            };
        };
        if (!result.Success)
            throw new Error(result.Message || '加载失败');
        messages.value = result.Data?.Mail ?? [];
    };
    try {
        await read(true);
    }
    catch {
    }
    if (messages.value.length === 0)
        loading.value = true;
    try {
        await read(false);
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        if (messages.value.length === 0)
            messages.value = [];
    }
    finally {
        loading.value = false;
    }
}
const newRecipient = ref('');
const checkingUser = ref(false);
const recipientError = ref<string | null>(null);
async function startConversation(): Promise<void> {
    const target = newRecipient.value.trim();
    if (!target)
        return;
    checkingUser.value = true;
    recipientError.value = null;
    try {
        const exists = await userExists(target);
        if (!exists) {
            recipientError.value = `用户“${target}”不存在，请检查用户名`;
            return;
        }
        newRecipient.value = '';
        await openThread(target);
    }
    catch (caught) {
        recipientError.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        checkingUser.value = false;
    }
}
async function submit(): Promise<void> {
    if (!activeUser.value || !draft.value.trim())
        return;
    sending.value = true;
    error.value = null;
    try {
        const result = (await sendMail(activeUser.value, draft.value)) as {
            Success: boolean;
            Message?: string;
        };
        if (!result.Success)
            throw new Error(result.Message || '发送失败');
        draft.value = '';
        await openThread(activeUser.value);
        await loadThreads();
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        sending.value = false;
    }
}
function formatTime(value?: number): string {
    if (!value)
        return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return '—';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
async function revealThread(otherUser: string): Promise<void> {
    await openThread(otherUser);
    await nextTick();
    document.getElementById(`mail-thread-${otherUser}`)?.scrollIntoView({ block: 'nearest' });
}
watch(mailTarget.targetUser, (user) => {
    if (!user)
        return;
    mailTarget.clearTarget();
    void revealThread(user);
});
onMounted(() => {
    void (async () => {
        await loadThreads();
        if (mailTarget.targetUser.value) {
            const user = mailTarget.targetUser.value;
            mailTarget.clearTarget();
            await revealThread(user);
        }
    })();
});
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">短消息</h1>
        <p class="text-sm text-muted-foreground">站内私信</p>
      </div>
      <form class="flex items-center gap-2" @submit.prevent="startConversation">
        <Input
          id="mail-recipient"
          v-model="newRecipient"
          class="w-40"
          placeholder="用户名"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          :disabled="!newRecipient.trim() || checkingUser"
        >
          <Loader2 v-if="checkingUser" class="animate-spin" />
          新建会话
        </Button>
        <Button type="button" variant="outline" size="icon" :disabled="loading" title="刷新" @click="loadThreads">
          <RefreshCw :class="loading ? 'animate-spin' : ''" />
        </Button>
      </form>
    </div>

    <div
      v-if="recipientError"
      class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400"
      role="alert"
    >
      {{ recipientError }}
    </div>

    <div class="grid gap-4 md:grid-cols-[16rem_1fr]">
      <aside class="space-y-2">
        <div v-if="loading && threads.length === 0" class="space-y-2">
          <Skeleton v-for="index in 4" :key="index" class="h-12 w-full rounded-lg" />
        </div>
        <button
          v-for="thread in threads"
          :id="`mail-thread-${thread.OtherUser}`"
          :key="thread.OtherUser"
          class="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50"
          :class="activeUser === thread.OtherUser ? 'border-primary bg-accent/50' : ''"
          @click="openThread(thread.OtherUser)"
        >
          <span class="min-w-0 flex-1">
            <UserChip :username="thread.OtherUser" :size="22" class="font-medium" />
            <span class="mt-0.5 block truncate text-xs text-muted-foreground">
              {{ thread.LastsMessage || '—' }}
            </span>
            <span class="mt-0.5 block truncate text-xs text-muted-foreground">
              {{ formatTime(thread.SendTime) }}
            </span>
          </span>
          <Badge v-if="thread.UnreadCount > 0" variant="destructive">
            {{ thread.UnreadCount }}
          </Badge>
        </button>
        <p v-if="!loading && threads.length === 0" class="text-sm text-muted-foreground">
          还没有会话
        </p>
      </aside>

      <section class="min-w-0 space-y-4">
        <div
          v-if="!activeUser"
          class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
        >
          选择左侧的会话，或输入用户名新建会话
        </div>

        <template v-else>
          <div class="flex items-center justify-between">
            <UserChip :username="activeUser" :size="28" class="text-base font-medium" />
            <Button variant="ghost" size="sm" class="md:hidden" @click="activeUser = null">
              <ArrowLeft />
              返回
            </Button>
          </div>

          <div class="space-y-3">
            <article
              v-for="(message, index) in messages"
              :key="`${message.SendTime}-${index}`"
              class="rounded-xl border"
              :class="message.FromUser === currentUser ? 'bg-muted/40' : ''"
            >
              <header class="flex items-center justify-between border-b px-4 py-2 text-xs">
                <span v-if="message.FromUser === currentUser" class="font-medium">我</span>
                <UserChip v-else :username="message.FromUser" :size="20" />
                <span class="flex items-center gap-2 text-muted-foreground">
                  <Badge v-if="message.FromUser !== currentUser && !message.IsRead" variant="secondary">未读</Badge>
                  {{ formatTime(message.SendTime) }}
                </span>
              </header>
              <AnnouncementBody class="px-4 py-3 text-sm" :source="message.Content" />
            </article>
            <p
              v-if="messages.length === 0"
              class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
            >
              还没有消息，发送第一条吧
            </p>
          </div>

          <form class="space-y-2" @submit.prevent="submit">
            <textarea
              v-model="draft"
              rows="3"
              placeholder="输入消息（支持 Markdown）"
              class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              :disabled="sending"
            />
            <div class="flex justify-end">
              <Button type="submit" :disabled="sending || !draft.trim()">
                <Send />
                发送
              </Button>
            </div>
          </form>
        </template>
      </section>
    </div>
  </div>
</template>
