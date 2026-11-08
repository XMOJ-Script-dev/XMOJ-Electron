<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted } from 'vue';
import AppSidebar from '../src/components/AppSidebar.vue';
import MessageBox from '../src/components/MessageBox.vue';
import ToastStack from '../src/components/ToastStack.vue';
import { SidebarInset, SidebarProvider } from '../src/components/ui/sidebar';
import Downloads from '../src/pages/Downloads.vue';
import Contests from '../src/pages/Contests.vue';
import Home from '../src/pages/Home.vue';
import Login from '../src/pages/Login.vue';
import Monthly from '../src/pages/Monthly.vue';
import Problemset from '../src/pages/Problemset.vue';
import ProblemView from '../src/pages/ProblemView.vue';
import Status from '../src/pages/Status.vue';
import Discussion from '../src/pages/Discussion.vue';
import Mail from '../src/pages/Mail.vue';
import Compare from '../src/pages/Compare.vue';
import Settings from '../src/pages/Settings.vue';
import NotificationToasts from '../src/components/NotificationToasts.vue';
import type { ViewId } from '../src/stores/navigation';
import { useNavigation } from '../src/stores/navigation';
import { usePanel } from '../src/stores/panel';
import { initPreferences } from '../src/stores/preferences';
import { useSession } from '../src/stores/session';

const navigation = useNavigation();
const panel = usePanel();
const session = useSession();
const WebPanelHost = defineAsyncComponent(() => import('./WebPanelHost.vue'));
const Submit = defineAsyncComponent(() => import('./WebSubmit.vue'));
const currentView = computed(() => navigation.currentView.value);
const protectedViews = new Set<ViewId>([
  'problemset', 'problem', 'status', 'contests',
  'submit', 'discussion', 'mail', 'compare',
]);
const showLogin = computed(() => protectedViews.has(currentView.value) && !session.state.authenticated);

onMounted(() => {
  initPreferences();
  void session.initialise();
});
</script>

<template>
  <SidebarProvider :default-open="true">
    <AppSidebar />
    <SidebarInset>
      <div
        v-if="currentView === 'home'"
        class="border-b bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground"
        role="status"
      >
        网页版提供公开浏览；登录后可提交代码、使用讨论区、私信、通知与云同步。
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
      <Submit v-else-if="currentView === 'submit'" />
      <Discussion v-else-if="currentView === 'discussion'" />
      <Mail v-else-if="currentView === 'mail'" />
      <Compare v-else-if="currentView === 'compare'" />
      <Settings v-else-if="currentView === 'settings'" />
      <Contests v-else-if="currentView === 'contests'" />
      <Monthly v-else-if="currentView === 'monthly'" />
      <Downloads v-else-if="currentView === 'downloads'" />
      <div v-else-if="session.state.authenticated" class="mx-auto max-w-2xl p-8 text-sm text-muted-foreground">
        该功能暂未提供网页版支持；涉及桌面文件保存、视频回放或原生能力的操作请使用桌面版。
      </div>
      <Home v-else />
    </SidebarInset>
    <ToastStack />
    <MessageBox />
    <NotificationToasts />
    <WebPanelHost v-if="panel.kind.value" />
  </SidebarProvider>
</template>
