<script setup lang="ts">
import { computed, onMounted } from 'vue';
import AppSidebar from '../src/components/AppSidebar.vue';
import MessageBox from '../src/components/MessageBox.vue';
import ToastStack from '../src/components/ToastStack.vue';
import { SidebarInset, SidebarProvider } from '../src/components/ui/sidebar';
import Downloads from '../src/pages/Downloads.vue';
import Home from '../src/pages/Home.vue';
import Login from '../src/pages/Login.vue';
import Monthly from '../src/pages/Monthly.vue';
import Problemset from '../src/pages/Problemset.vue';
import ProblemView from '../src/pages/ProblemView.vue';
import Status from '../src/pages/Status.vue';
import type { ViewId } from '../src/stores/navigation';
import { useNavigation } from '../src/stores/navigation';
import { initPreferences } from '../src/stores/preferences';
import { useSession } from '../src/stores/session';

const navigation = useNavigation();
const session = useSession();
const currentView = computed(() => navigation.currentView.value);
const protectedViews = new Set<ViewId>([
  'submit', 'discussion', 'mail',
  'compare', 'contests', 'export',
]);
const showLogin = computed(() => protectedViews.has(currentView.value) && !session.state.authenticated);

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
      <Login v-else-if="showLogin" />
      <Home v-else-if="currentView === 'home'" />
      <Problemset v-else-if="currentView === 'problemset'" />
      <ProblemView v-else-if="currentView === 'problem'" />
      <Status v-else-if="currentView === 'status'" />
      <Monthly v-else-if="currentView === 'monthly'" />
      <Downloads v-else-if="currentView === 'downloads'" />
      <div v-else-if="session.state.authenticated" class="mx-auto max-w-2xl p-8 text-sm text-muted-foreground">
        该功能的网页版接口仍在接入中，请先使用首页、月赛或下载。
      </div>
      <Home v-else />
    </SidebarInset>
    <ToastStack />
    <MessageBox />
  </SidebarProvider>
</template>
