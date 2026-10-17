<script setup lang="ts">import { onBeforeUnmount, onMounted } from 'vue';
import { X } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import ContestRank from '@/pages/ContestRank.vue';
import SourceView from '@/pages/SourceView.vue';
import UserProfile from '@/pages/UserProfile.vue';
import { usePanel } from '@/stores/panel';
const panel = usePanel();
function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape')
        panel.close();
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div v-if="panel.kind.value" class="fixed inset-0 z-50 flex flex-col bg-background">
    <div class="flex items-center justify-end border-b px-4 py-1.5">
      <Button variant="ghost" size="sm" @click="panel.close()">
        <X />
        关闭
      </Button>
    </div>
    <div class="min-h-0 flex-1 overflow-auto">
      <ContestRank v-if="panel.kind.value === 'rank'" />
      <SourceView v-else-if="panel.kind.value === 'source'" />
      <UserProfile v-else-if="panel.kind.value === 'profile'" />
    </div>
  </div>
</template>
