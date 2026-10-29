<script setup lang="ts">import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useNavigation } from '@/stores/navigation';
import { useErrorToast } from '@/composables/useErrorToast';
import { ChevronLeft, ChevronRight, MessageSquare, Plus, RefreshCw, Send } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementBody from '@/components/AnnouncementBody.vue';
import UserChip from '@/components/UserChip.vue';
import CloudflareVerification from '@/components/CloudflareVerification.vue';
import { createPost, createReply, deleteDiscussionPost, deleteDiscussionReply, editDiscussionReply, fetchBoards, fetchPost, fetchPosts } from '@/services/api';
import { useSession } from '@/stores/session';
import type { BbsBoard, BbsPost, BbsPostDetail } from '@/shared/community';
import { canManageDiscussion, isDiscussionAdmin, quoteReply } from '@/shared/discussion';
import { showDialog } from '@/stores/dialog';
const session = useSession();
const navigation = useNavigation();
watch(() => navigation.activeThread.value, (target) => {
    if (target) void openThread(target.postId, target.page);
});
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
const captchaToken = ref('');
const username = computed(() => session.state.user?.username ?? '');
const locked = computed(() => !!thread.value?.Lock?.Locked && !isDiscussionAdmin(username.value));
const publishReason = computed(() => submitting.value ? '正在发布…' : !newTitle.value.trim() ? '请填写标题' : !newContent.value.trim() ? '请填写正文' : newBoardId.value === null ? '请选择板块' : !captchaToken.value ? '请完成人机验证' : '');
const replyReason = computed(() => submitting.value ? '正在发送…' : locked.value ? '讨论已锁定' : !replyContent.value.trim() ? '请填写回复内容' : !captchaToken.value ? '请完成人机验证' : '');
const editor = ref<HTMLTextAreaElement>();
const editing = ref<number | null>(null);
const editContent = ref('');
const editEditor = ref<HTMLTextAreaElement>();
const mutating = ref(false);
async function startEditing(replyId: number, content: string): Promise<void> {
    if (mutating.value) return;
    editing.value = Number(replyId);
    editContent.value = content;
    await nextTick();
    editEditor.value?.scrollIntoView({ block: 'center' });
    editEditor.value?.focus({ preventScroll: true });
}
function canManage(author?: string): boolean { return canManageDiscussion(username.value, author, !!thread.value?.Lock?.Locked); }
async function replyTo(content: string, author?: string): Promise<void> {
    replyContent.value += (replyContent.value ? '\n\n' : '') + quoteReply(content, author);
    await nextTick(); editor.value?.focus(); editor.value?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
async function mutate(action: 'editReply' | 'deleteReply' | 'deletePost', id: number): Promise<void> {
    if (mutating.value) return;
    if (action !== 'editReply') {
        const answer = await showDialog({ title: '确认删除', message: action === 'deletePost' ? '删除整个讨论？此操作无法撤销。' : '删除这条回复？此操作无法撤销。', buttons: [{ id: 'cancel', label: '取消' }, { id: 'delete', label: '删除' }], cancelId: 'cancel', defaultId: 'cancel' });
        if (answer.buttonId !== 'delete') return;
    }
    mutating.value = true;
    try {
        const result = await (action === 'editReply' ? editDiscussionReply(id, editContent.value) : action === 'deletePost' ? deleteDiscussionPost(id) : deleteDiscussionReply(id)) as { Success: boolean; Message?: string };
        if (!result.Success) throw new Error(result.Message || '操作失败');
        editing.value = null;
        if (action === 'deletePost') backToList();
        else if (thread.value) await openThread(Number(thread.value.PostID), threadPage.value);
    } catch (caught) { error.value = caught instanceof Error ? caught.message : String(caught); }
    finally { mutating.value = false; }
}
watch([composing, () => thread.value?.PostID], () => { captchaToken.value = ''; editing.value = null; });
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
    navigation.activeThread.value = null;
    thread.value = null;
    void loadPosts();
}
async function submitNewPost(): Promise<void> {
    if (submitting.value || !captchaToken.value || !newTitle.value.trim() || !newContent.value.trim() || newBoardId.value === null)
        return;
    submitting.value = true;
    error.value = null;
    try {
        const result = (await createPost({
            boardId: newBoardId.value,
            title: newTitle.value.trim(),
            content: newContent.value,
            captchaSecretKey: captchaToken.value,
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
        captchaToken.value = '';
    }
}
async function submitReply(): Promise<void> {
    if (submitting.value || !captchaToken.value || !thread.value || locked.value || !replyContent.value.trim())
        return;
    submitting.value = true;
    error.value = null;
    try {
        const result = (await createReply({
            postId: Number(thread.value.PostID ?? 0),
            content: replyContent.value,
            captchaSecretKey: captchaToken.value,
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
        captchaToken.value = '';
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
const replies = computed(() => (thread.value?.Reply ?? []).filter(reply => reply.ReplyID !== thread.value?.RootReplyID));
onMounted(async () => {
    await loadBoards(true);
    const target = navigation.activeThread.value;
    if (target) await openThread(target.postId, target.page);
    else await loadPosts();
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
        <Button variant="outline" size="icon" :disabled="loading" title="刷新" @click="thread ? openThread(Number(thread.PostID), threadPage) : loadPosts()">
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
      <div class="grid gap-3 md:grid-cols-2" data-slot="markdown-composer">
        <div class="min-w-0 space-y-2">
          <h3 class="text-sm font-medium">Markdown 编辑</h3>
          <textarea v-model="newContent" rows="8" data-enter-submit="ctrl" placeholder="内容（Enter 换行，Ctrl+Enter 发布）" class="min-h-48 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm" :disabled="submitting" />
        </div>
        <div class="min-w-0 space-y-2">
          <h3 class="text-sm font-medium">实时预览</h3>
          <div class="min-h-48 max-h-96 overflow-auto rounded-md border p-3" data-slot="markdown-preview"><AnnouncementBody :source="newContent" format="markdown" class="text-sm" /><p v-if="!newContent" class="text-sm text-muted-foreground">输入内容后在这里预览</p></div>
        </div>
      </div>
      <CloudflareVerification v-model="captchaToken" />
      <div class="flex justify-end gap-2">
        <Button type="button" variant="ghost" @click="composing = false">取消</Button>
        <Button type="submit" :disabled="!!publishReason">
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
      <article class="rounded-xl border" data-slot="discussion-post">
        <header class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 class="font-semibold">{{ thread.Title }}</h2>
          <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserChip v-if="thread.UserID" :username="thread.UserID" :size="20" class="text-xs" />
            <span v-else>匿名</span>
            <span>· {{ formatTime(thread.PostTime) }}</span>
          </span>
        </header>
        <AnnouncementBody class="px-4 py-3 text-sm" :source="thread.Content ?? ''" format="markdown" />
        <div class="flex gap-2 px-4 pb-3">
          <Button v-if="username" size="sm" variant="outline" :disabled="locked" @click="replyTo(thread.Content ?? '', thread.UserID)">回复</Button>
          <Button v-if="canManage(thread.UserID) && thread.RootReplyID" type="button" size="sm" variant="outline" :disabled="mutating" @click="startEditing(thread.RootReplyID, thread.Content ?? '')">编辑</Button>
          <Button v-if="canManage(thread.UserID)" size="sm" variant="destructive" :disabled="mutating" @click="mutate('deletePost', Number(thread.PostID))">删除讨论</Button>
        </div>
      </article>

      <form v-if="editing !== null" data-slot="discussion-edit-form" class="space-y-3 rounded-xl border p-4" @submit.prevent="mutate('editReply', editing)">
        <h3 class="font-medium">编辑内容</h3>
        <div class="grid gap-3 md:grid-cols-2">
          <textarea ref="editEditor" v-model="editContent" rows="8" data-enter-submit="ctrl" placeholder="Enter 换行，Ctrl+Enter 保存修改" class="w-full rounded-md border p-3 font-mono text-sm" :disabled="mutating" aria-label="编辑 Markdown" />
          <AnnouncementBody class="overflow-auto rounded-md border p-3 text-sm" :source="editContent" format="markdown" />
        </div>
        <div class="flex gap-2"><Button type="submit" :disabled="mutating || !editContent.trim()">保存修改</Button><Button type="button" variant="outline" :disabled="mutating" @click="editing = null">取消</Button></div>
      </form>

      <div v-for="reply in replies" :key="reply.ReplyID" class="rounded-xl border" data-slot="discussion-comment">
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
        <AnnouncementBody class="px-4 py-3 text-sm" :source="reply.Content" format="markdown" />
        <div class="flex gap-2 px-4 pb-3">
          <Button v-if="username" size="sm" variant="outline" :disabled="locked" @click="replyTo(reply.Content, reply.UserID)">回复</Button>
          <Button v-if="canManage(reply.UserID)" type="button" size="sm" variant="outline" :disabled="mutating" @click="startEditing(reply.ReplyID, reply.Content)">编辑</Button>
          <Button v-if="canManage(reply.UserID)" size="sm" variant="destructive" :disabled="mutating" @click="mutate('deleteReply', reply.ReplyID)">删除</Button>
        </div>
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
        <div class="grid gap-3 md:grid-cols-2" data-slot="markdown-composer">
          <div class="min-w-0 space-y-2">
            <h3 class="text-sm font-medium">Markdown 编辑</h3>
            <textarea ref="editor" v-model="replyContent" rows="8" data-enter-submit="ctrl" placeholder="写下你的回复（Enter 换行，Ctrl+Enter 发送）" class="min-h-48 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm" :disabled="submitting || locked" />
          </div>
          <div class="min-w-0 space-y-2">
            <h3 class="text-sm font-medium">实时预览</h3>
            <div class="min-h-48 max-h-96 overflow-auto rounded-md border p-3" data-slot="markdown-preview"><AnnouncementBody :source="replyContent" format="markdown" class="text-sm" /><p v-if="!replyContent" class="text-sm text-muted-foreground">输入内容后在这里预览</p></div>
          </div>
        </div>
        <CloudflareVerification v-if="!locked" v-model="captchaToken" />
        <p v-else class="text-sm text-muted-foreground">本讨论已锁定，不能回复。</p>
        <div class="flex justify-end">
          <Button type="submit" :disabled="!!replyReason">
            <Send />
            发送
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
