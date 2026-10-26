<script setup lang="ts">import { computed, onMounted, ref, watch } from 'vue';
import { useErrorToast } from '@/composables/useErrorToast';
import { ChevronLeft, Loader2, RefreshCw } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import UserChip from '@/components/UserChip.vue';
import ProfileCharts from '@/components/ProfileCharts.vue';
import { userColor } from '@/lib/user-color';
import { fetchUserProfile } from '@/services/api';
import { usePanel } from '@/stores/panel';
import { useNavigation } from '@/stores/navigation';
import type { UserProfile } from '@/shared/types';
const panel = usePanel();
const navigation = useNavigation();
const username = ref(panel.profileUsername.value);
const profile = ref<UserProfile | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
useErrorToast(error);
const filter = ref('');
async function load(): Promise<void> {
    const name = username.value.trim();
    if (!name) {
        error.value = '缺少用户名';
        return;
    }
    loading.value = true;
    error.value = null;
    try {
        const first = await fetchUserProfile(name, true);
        profile.value = first;
        if (first) {
            const fresh = await fetchUserProfile(name, false);
            profile.value = fresh;
        }
    }
    catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        profile.value = null;
    }
    finally {
        loading.value = false;
    }
}
const visibleProblems = computed(() => {
    const query = filter.value.trim();
    const list = profile.value?.problems ?? [];
    if (!query)
        return list;
    return list.filter((problem) => String(problem.id).includes(query));
});
onMounted(() => void load());
watch(() => panel.profileUsername.value, (name) => {
    if (name && name !== username.value) {
        username.value = name;
        void load();
    }
});
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight">
          <UserChip v-if="profile" :username="profile.username" :size="32" prefer-nick />
          <template v-else>用户主页</template>
        </h1>
        <p class="text-sm text-muted-foreground">
          <template v-if="profile">
            已解决 {{ profile.solvedTotal }} 题
          </template>
          <template v-else>输入用户名查看</template>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" @click="panel.close()">
          <ChevronLeft />
          返回
        </Button>
        <form class="flex items-center gap-2" @submit.prevent="load">
        <Input v-model="username" class="w-40" placeholder="用户名" />
        <Button type="submit" variant="outline" size="sm" :disabled="loading">
          <Loader2 v-if="loading" class="animate-spin" />
          <RefreshCw v-else />
          载入
        </Button>
        </form>
      </div>
    </div>

    <div v-if="loading && !profile" class="space-y-2">
      <Skeleton class="h-16 w-full rounded-lg" />
      <Skeleton class="h-40 w-full rounded-lg" />
    </div>

    <template v-else-if="profile">
      <section class="rounded-xl border bg-card p-4">
        <div class="flex flex-wrap items-center gap-3">
          <UserChip :username="profile.username" />
          <Badge variant="secondary">已解决 {{ profile.solvedTotal }}</Badge>
          <div class="ml-auto text-right"><p class="text-xs text-muted-foreground">Rating</p><p class="font-mono text-3xl font-semibold tabular-nums" :style="{ color: userColor(profile.username, profile.rating) }">{{ profile.rating ?? 0 }}</p></div>
        </div>
      </section>

      <ProfileCharts :profile="profile" />

      <section class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-sm font-medium">已解决的题目（{{ visibleProblems.length }}）</h2>
          <Input v-model="filter" class="w-40" placeholder="按题目编号筛选" />
        </div>

        <div v-if="visibleProblems.length" class="flex flex-wrap gap-1.5">
          <Button
            v-for="problem in visibleProblems"
            :key="problem.id"
            size="xs"
            variant="outline"
            :title="`尝试 ${problem.attempts} 次`"
            @click="panel.close(); navigation.viewProblem(problem.id)"
          >
            {{ problem.id }}
          </Button>
        </div>
        <p v-else class="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          没有匹配的题目
        </p>
      </section>
    </template>
  </div>
</template>
