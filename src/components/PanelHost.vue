<script setup lang="ts">import { onBeforeUnmount, onMounted } from 'vue';
import ContestRank from '@/pages/ContestRank.vue';
import SourceView from '@/pages/SourceView.vue';
import UserProfile from '@/pages/UserProfile.vue';
import { usePanel } from '@/stores/panel';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
const panel = usePanel();
function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape')
        panel.close();
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Dialog :open="!!panel.kind.value" @update:open="open => { if (!open) panel.close(); }">
    <DialogContent class="flex max-h-[90vh] flex-col p-0 pt-8 sm:max-w-[min(72rem,92vw)]">
      <DialogTitle class="sr-only">{{ panel.kind.value === 'profile' ? '用户详情' : panel.kind.value === 'source' ? '评测详情' : '比赛排名' }}</DialogTitle>
      <DialogDescription class="sr-only">详细信息</DialogDescription>
    <div class="min-h-0 flex-1 overflow-auto">
      <ContestRank v-if="panel.kind.value === 'rank'" />
      <SourceView v-else-if="panel.kind.value === 'source'" />
      <UserProfile v-else-if="panel.kind.value === 'profile'" />
    </div>
    </DialogContent>
  </Dialog>
</template>
