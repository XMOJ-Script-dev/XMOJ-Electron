<script setup lang="ts">import { computed, onMounted } from 'vue';
import { Loader2 } from '@lucide/vue';
import AppSidebar from './components/AppSidebar.vue';
import Login from '@/pages/Login.vue';
import Home from '@/pages/Home.vue';
import Problemset from '@/pages/Problemset.vue';
import ProblemView from '@/pages/ProblemView.vue';
import Status from '@/pages/Status.vue';
import Discussion from '@/pages/Discussion.vue';
import Mail from '@/pages/Mail.vue';
import Submit from '@/pages/Submit.vue';
import Compare from '@/pages/Compare.vue';
import Contests from '@/pages/Contests.vue';
import Monthly from '@/pages/Monthly.vue';
import Downloads from '@/pages/Downloads.vue';
import ExportAcCode from '@/pages/ExportAcCode.vue';
import Settings from '@/pages/Settings.vue';
import NotificationToasts from '@/components/NotificationToasts.vue';
import ToastStack from '@/components/ToastStack.vue';
import PanelHost from '@/components/PanelHost.vue';
import MessageBox from '@/components/MessageBox.vue';
import { showDialog } from '@/stores/dialog';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useSession } from '@/stores/session';
import { useNavigation } from '@/stores/navigation';
import { initPreferences } from '@/stores/preferences';
import { useToasts } from '@/stores/toasts';
import type { ViewId } from '@/stores/navigation';
const session = useSession();
const navigation = useNavigation();
const PROTECTED_VIEWS = new Set<ViewId>([
    'problemset',
    'problem',
    'status',
    'discussion',
    'mail',
    'submit',
    'compare',
    'contests',
    'export',
]);
const view = computed(() => navigation.currentView.value);
const showLogin = computed(() => PROTECTED_VIEWS.has(view.value) && !session.state.authenticated);
onMounted(() => {
    window.xmoj.events.onQuitRequested(() => {
        void showDialog({ title: '离开前确认', message: '确定要关闭 XMOJ Electron 吗？', buttons: [{ id: 'cancel', label: '取消' }, { id: 'close', label: '关闭' }], defaultId: 'close', cancelId: 'cancel' })
            .then(result => window.xmoj.app.respondQuit(result.buttonId === 'close'));
    });
    initPreferences();
    void session.initialise();
    window.xmoj.events.onPopupBlocked((url) => {
        useToasts().warning(`该链接没有对应的应用内页面，未打开：${url}`);
    });
});
</script>

<template>
  <SidebarProvider :default-open="false">
    <AppSidebar />

    <SidebarInset>
      <div
        v-if="session.state.loading"
        class="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"
      >
        <Loader2 class="size-4 animate-spin" />
        正在恢复登录状态…
      </div>

      <Login v-else-if="showLogin" />

      <Home v-else-if="view === 'home'" />
      <Problemset v-else-if="view === 'problemset'" />
      <ProblemView v-else-if="view === 'problem'" />
      <Status v-else-if="view === 'status'" />
      <Discussion v-else-if="view === 'discussion'" />
      <Mail v-else-if="view === 'mail'" />
      <Submit v-else-if="view === 'submit'" :problem-id="navigation.activeProblemId.value" />
      <Compare v-else-if="view === 'compare'" />
      <Contests v-else-if="view === 'contests'" />
      <Monthly v-else-if="view === 'monthly'" />
      <Downloads v-else-if="view === 'downloads'" />
      <ExportAcCode v-else-if="view === 'export'" />
      <Settings v-else-if="view === 'settings'" />
    </SidebarInset>

    <NotificationToasts />
    <ToastStack />
    <PanelHost />
    <MessageBox />
  </SidebarProvider>
</template>
