<script setup lang="ts">import { computed, onMounted, ref } from 'vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { ChevronLeft, ChevronRight, MessageSquare, Plus, RefreshCw, Send } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementBody from '@/components/AnnouncementBody.vue';
import UserChip from '@/components/UserChip.vue';
import { createPost, createReply, fetchBoards, fetchPost, fetchPosts } from '@/services/api';
import { useSession } from '@/stores/session';
import { useNavigation } from '@/stores/navigation';
import type { BbsBoard, BbsPost, BbsPostDetail } from '@/shared/community';
const session = useSession();
const navigation = useNavigation();
const boards = ref<BbsBoard[]>([]);
const selectedBoard = ref(-1);
const posts = ref<BbsPost[]>([]);
const pageCount = ref(1);
const page = ref(1);
const thread = ref<BbsPostDetail | null>(null);
const threadPage = ref(1);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const composing = ref(false);
const newTitle = ref('');
const newContent = ref('');
const newBoardId = ref<number | null>(null);
const replyContent = ref('');
const submitting = ref(false);
let token = 0;
async function loadBoards(cacheFirst = false): Promise<void> {
    const read = async (cacheOnly: boolean) => {
        const result = (await fetchBoards(cacheOnly)) as {
            Success: boolean;
            Data?: {
                Boards: BbsBoard[];
            };
        };
        if (result.Success) {
            boards.value = result.Data?.Boards ?? [];
            if (boards.value.length && newBoardId.value === null) {
                newBoardId.value = boards.value[0].BoardID;
            }
        }
        return result.Success;
    };
    try {
        if (cacheFirst)
            await read(true);
    }
    catch {
    }
    try {
        await read(false);
    }
    catch {
        if (boards.value.length === 0)
            boards.value = [];
    }
}
async function loadPosts(): Promise<void> {
    const current = ++token;
    error.value = null;
    const query = { boardId: selectedBoard.value, page: page.value };
    const read = async (cacheOnly: boolean) => {
        const result = (await fetchPosts(query, cacheOnly)) as {
            Success: boolean;
            Message?: string;
            Data?: {
                Posts: BbsPost[];
                PageCount: number;
            };
        };
        if (current !== token)
            return false;
        if (!result.Success)
            throw new Error(result.Message || '加载失败');
        posts.value = result.Data?.Posts ?? [];
        pageCount.value = result.Data?.PageCount ?? 1;
        return true;
    };
    if (posts.value.length === 0) {
        try {
            await read(true);
        }
        catch {
        }
    }
    if (posts.value.length === 0)
        loading.value = true;
    try {
        await read(false);
    }
    catch (caught) {
        if (current !== token)
            return;
        error.value = caught instanceof Error ? caught.message : String(caught);
        posts.value = [];
    }
    finally {
        if (current === token)
            loading.value = false;
    }
}
async function openThread(postId: number, targetPage = 1): Promise<void> {
    error.value = null;
    const apply = (result: {
        Success: boolean;
        Message?: string;
        Data?: BbsPostDetail;
    }) => {
        if (!result.Success)
            throw new Error(result.Message || '加载失败');
        const detail = result.Data ?? null;
        if (detail && detail.PostID === undefined)
            detail.PostID = postId;
        thread.value = detail;
        threadPage.value = targetPage;
    };
    try {
        apply((await fetchPost(postId, targetPage, true)) as never);
    }
    catch {
    }
    if (thread.value === null)
        loading.value = true;
    try {
        apply((await fetchPost(postId, targetPage, false)) as never);
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        loading.value = false;
    }
}
async function changeThreadPage(delta: number): Promise<void> {
    if (!thread.value)
        return;
    const next = threadPage.value + delta;
    const total = thread.value.PageCount ?? 1;
    if (next < 1 || next > total)
        return;
    await openThread(Number(thread.value.PostID ?? 0), next);
}
function backToList(): void {
    thread.value = null;
    void loadPosts();
}
async function submitNewPost(): Promise<void> {
    if (!newTitle.value.trim() || !newContent.value.trim() || newBoardId.value === null)
        return;
    submitting.value = true;
    error.value = null;
    try {
        const result = (await createPost({
            boardId: newBoardId.value,
            title: newTitle.value.trim(),
            content: newContent.value,
        })) as {
            Success: boolean;
            Message?: string;
        };
        if (!result.Success)
            throw new Error(result.Message || '发帖失败');
        composing.value = false;
        newTitle.value = '';
        newContent.value = '';
        await loadPosts();
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        submitting.value = false;
    }
}
async function submitReply(): Promise<void> {
    if (!thread.value || !replyContent.value.trim())
        return;
    submitting.value = true;
    error.value = null;
    try {
        const result = (await createReply({
            postId: Number(thread.value.PostID ?? 0),
            content: replyContent.value,
        })) as {
            Success: boolean;
            Message?: string;
        };
        if (!result.Success)
            throw new Error(result.Message || '回复失败');
        replyContent.value = '';
        await openThread(Number(thread.value.PostID ?? 0));
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
    }
    finally {
        submitting.value = false;
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
const replies = computed(() => thread.value?.Reply ?? []);
onMounted(async () => {
    await loadBoards(true);
    const target = navigation.consumeDiscussionTarget();
    if (target)
        await openThread(target.postId, target.page);
    else
        await loadPosts();
});
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">讨论</h1>
        <p class="text-sm text-muted-foreground">
          {{ thread ? '帖子详情' : '社区讨论区' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button v-if="thread" variant="outline" size="sm" @click="backToList">
          <ChevronLeft />
          返回列表
        </Button>
        <Button
          v-else
          variant="outline"
          size="sm"
          :disabled="session.state.loading"
          @click="composing = !composing"
        >
          <Plus />
          发帖
        </Button>
        <Button variant="outline" size="icon" :disabled="loading" title="刷新" @click="loadPosts">
          <RefreshCw :class="loading ? 'animate-spin' : ''" />
        </Button>
      </div>
    </div>

    <form
      v-if="composing && !thread"
      class="space-y-3 rounded-xl border p-4"
      @submit.prevent="submitNewPost"
    >
      <h2 class="text-sm font-medium">发布新帖</h2>
      <select
        v-model.number="newBoardId"
        class="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
      >
        <option v-for="board in boards" :key="board.BoardID" :value="board.BoardID">
          {{ board.BoardName }}
        </option>
      </select>
      <Input v-model="newTitle" placeholder="标题" :disabled="submitting" />
      <textarea
        v-model="newContent"
        rows="6"
        placeholder="内容（支持 Markdown）"
        class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        :disabled="submitting"
      />
      <div class="flex justify-end gap-2">
        <Button type="button" variant="ghost" @click="composing = false">取消</Button>
        <Button type="submit" :disabled="submitting || !newTitle.trim() || !newContent.trim()">
          <Send />
          发布
        </Button>
      </div>
    </form>

    <div v-if="!thread" class="flex flex-wrap items-center gap-2">
      <Button
        :variant="selectedBoard === -1 ? 'default' : 'outline'"
        size="sm"
        @click="selectedBoard = -1; page = 1; loadPosts()"
      >
        全部
      </Button>
      <Button
        v-for="board in boards"
        :key="board.BoardID"
        :variant="selectedBoard === board.BoardID ? 'default' : 'outline'"
        size="sm"
        @click="selectedBoard = board.BoardID; page = 1; loadPosts()"
      >
        {{ board.BoardName }}
      </Button>
    </div>

    <div v-if="loading && posts.length === 0 && !thread" class="space-y-2">
      <Skeleton v-for="index in 6" :key="index" class="h-14 w-full rounded-lg" />
    </div>

    <div v-else-if="!thread && posts.length > 0" class="divide-y rounded-xl border">
      <button
        v-for="post in posts"
        :key="post.PostID"
        class="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent/50"
        @click="openThread(post.PostID)"
      >
        <MessageSquare class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-2">
            <span class="truncate font-medium">{{ post.Title }}</span>
            <Badge v-if="post.Lock?.Locked" variant="secondary">已锁定</Badge>
          </span>
          <span class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <UserChip v-if="post.UserID" :username="post.UserID" :size="18" class="text-xs" />
            <span v-else>匿名</span>
            <span v-if="post.BoardName">{{ post.BoardName }}</span>
            <span v-if="post.ProblemID">题目 {{ post.ProblemID }}</span>
            <span>{{ formatTime(post.PostTime) }}</span>
            <span>{{ post.ReplyCount ?? 0 }} 回复</span>
          </span>
        </span>
      </button>
    </div>

    <div
      v-else-if="!thread && !loading"
      class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
    >
      暂无帖子
    </div>

    <div v-if="!thread && posts.length > 0" class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        第 <span class="font-medium text-foreground">{{ page }}</span> 页 / 共
        <span class="font-medium text-foreground">{{ pageCount }}</span> 页
      </p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" :disabled="page <= 1 || loading" @click="page -= 1; loadPosts()">
          <ChevronLeft />
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="page >= pageCount || loading"
          @click="page += 1; loadPosts()"
        >
          下一页
          <ChevronRight />
        </Button>
      </div>
    </div>

    <div v-if="thread" class="space-y-4">
      <article class="rounded-xl border">
        <header class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 class="font-semibold">{{ thread.Title }}</h2>
          <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserChip v-if="thread.UserID" :username="thread.UserID" :size="20" class="text-xs" />
            <span v-else>匿名</span>
            <span>· {{ formatTime(thread.PostTime) }}</span>
          </span>
        </header>
        <AnnouncementBody class="px-4 py-3 text-sm" :source="thread.Content ?? ''" />
      </article>

      <div v-for="reply in replies" :key="reply.ReplyID" class="rounded-xl border">
        <header class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
          <UserChip
            v-if="reply.UserID"
            :username="reply.UserID"
            :size="20"
            class="text-sm font-medium"
          />
          <span v-else class="text-sm font-medium">匿名</span>
          <span class="text-xs text-muted-foreground">
            {{ formatTime(reply.ReplyTime) }}
            <template v-if="reply.EditTime"> · 已编辑</template>
          </span>
        </header>
        <AnnouncementBody class="px-4 py-3 text-sm" :source="reply.Content" />
      </div>

      <div
        v-if="(thread.PageCount ?? 1) > 1"
        class="flex items-center justify-between rounded-xl border px-4 py-2"
      >
        <p class="text-sm text-muted-foreground">
          第 <span class="font-medium text-foreground">{{ threadPage }}</span> 页 / 共
          <span class="font-medium text-foreground">{{ thread.PageCount }}</span> 页
        </p>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="threadPage <= 1 || loading"
            @click="changeThreadPage(-1)"
          >
            <ChevronLeft />
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="threadPage >= (thread.PageCount ?? 1) || loading"
            @click="changeThreadPage(1)"
          >
            下一页
            <ChevronRight />
          </Button>
        </div>
      </div>

      <form class="space-y-3 rounded-xl border p-4" @submit.prevent="submitReply">
        <h3 class="text-sm font-medium">回复</h3>
        <textarea
          v-model="replyContent"
          rows="4"
          placeholder="写下你的回复（支持 Markdown）"
          class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          :disabled="submitting"
        />
        <div class="flex justify-end">
          <Button type="submit" :disabled="submitting || !replyContent.trim()">
            <Send />
            发送
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
