<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../src/components/ui/dialog';
import ContestRank from '../src/pages/ContestRank.vue';
import UserProfile from '../src/pages/UserProfile.vue';
import { usePanel } from '../src/stores/panel';

const panel = usePanel();
</script>

<template>
  <Dialog :open="!!panel.kind.value" @update:open="open => { if (!open) panel.close(); }">
    <DialogContent class="flex max-h-[90vh] flex-col p-0 pt-8 sm:max-w-[min(72rem,92vw)]">
      <DialogTitle class="sr-only">
        {{ panel.kind.value === 'profile' ? '用户主页' : '比赛排名' }}
      </DialogTitle>
      <DialogDescription class="sr-only">公开信息</DialogDescription>
      <div class="min-h-0 flex-1 overflow-auto">
        <ContestRank v-if="panel.kind.value === 'rank'" />
        <UserProfile v-else-if="panel.kind.value === 'profile'" />
        <p v-else-if="panel.kind.value === 'source'" class="p-6 text-sm text-muted-foreground">
          提交源码查看暂未开放。
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>
