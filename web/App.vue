<script setup lang="ts">
import { computed, onMounted } from 'vue';
import AppSidebar from '../src/components/AppSidebar.vue';
import MessageBox from '../src/components/MessageBox.vue';
import ToastStack from '../src/components/ToastStack.vue';
import { SidebarInset, SidebarProvider } from '../src/components/ui/sidebar';
import Downloads from '../src/pages/Downloads.vue';
import Home from '../src/pages/Home.vue';
import Monthly from '../src/pages/Monthly.vue';
import { useNavigation } from '../src/stores/navigation';
import { initPreferences } from '../src/stores/preferences';
import { useSession } from '../src/stores/session';

const navigation = useNavigation();
const session = useSession();
const currentView = computed(() => navigation.currentView.value);

onMounted(() => {
  initPreferences();
  void session.initialise();
});
</script>

<template>
  <SidebarProvider :default-open="false">
    <AppSidebar />
    <SidebarInset>
      <div
        class="border-b bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground"
        role="status"
      >
        网页版开放公开首页、月赛信息和软件下载；账户及其他功能请使用桌面版。
      </div>
      <div
        v-if="session.state.loading"
        class="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"
      >
        正在载入…
      </div>
      <Home v-else-if="currentView === 'home'" />
      <Monthly v-else-if="currentView === 'monthly'" />
      <Downloads v-else-if="currentView === 'downloads'" />
      <Home v-else />
    </SidebarInset>
    <ToastStack />
    <MessageBox />
  </SidebarProvider>
</template>
