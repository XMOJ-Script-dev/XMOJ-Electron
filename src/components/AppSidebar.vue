<script setup lang="ts">import { computed, ref } from 'vue';
import { BookText, CalendarDays, ChartNoAxesColumn, ChartPie, ChevronsUpDown, Download, FolderDown, House, Info, Loader2, LogIn, LogOut, Mail, MessagesSquare, Pin, RefreshCw, Settings, User, } from '@lucide/vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { useSession } from '@/stores/session';
import { useNavigation, type ViewId } from '@/stores/navigation';
import { usePanel } from '@/stores/panel';
import { useToasts } from '@/stores/toasts';
import { useSidebar } from '@/components/ui/sidebar/utils';
import { checkAppUpdate, showAboutDialog, showUpdateDialog } from '@/services/update';
const session = useSession();
const navigation = useNavigation();
const panel = usePanel();
const sidebar = useSidebar();
const mainItems = [
    { id: 'home' as ViewId, title: '首页', icon: House },
    { id: 'problemset' as ViewId, title: '题库', icon: BookText },
    { id: 'status' as ViewId, title: '状态', icon: ChartPie },
    { id: 'contests' as ViewId, title: '竞赛&作业', icon: ChartNoAxesColumn },
    { id: 'downloads' as ViewId, title: '下载', icon: Download },
    { id: 'monthly' as ViewId, title: '月赛', icon: CalendarDays },
    { id: 'discussion' as ViewId, title: '讨论', icon: MessagesSquare },
];
const footerItems = [
    { id: 'mail' as ViewId, title: '短消息', icon: Mail },
    { id: 'export' as ViewId, title: '导出 AC 代码', icon: FolderDown },
    { id: 'settings' as ViewId, title: '偏好设置', icon: Settings },
];
const currentView = computed(() => navigation.currentView.value);
const isAuthenticated = computed(() => session.state.authenticated);
const username = computed(() => session.state.user?.username ?? '');
const isAdmin = computed(() => Boolean(session.state.user?.isAdmin));
const checkingUpdate = ref(false);
async function openAbout(): Promise<void> {
    await showAboutDialog();
}
async function checkForUpdates(): Promise<void> {
    checkingUpdate.value = true;
    try {
        const result = await checkAppUpdate();
        const choice = await showUpdateDialog(result);
        void choice;
    }
    catch (caught) {
        useToasts().error(caught instanceof Error ? caught.message : String(caught));
    }
    finally {
        checkingUpdate.value = false;
    }
}
async function handleLogout(): Promise<void> {
    await session.logout();
    navigation.navigate('home');
}
function handleSignIn(): void {
    navigation.navigate('problemset');
}
function togglePinnedSidebar(): void {
    sidebar.setOpen(!sidebar.pinnedOpen.value);
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" class="group overflow-hidden">
            <div class="relative flex size-8 shrink-0 items-center justify-center">
              <img src="/logo.png" class="size-8 rounded-lg" alt="XMOJ" />
            </div>
            <div
              class="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
            >
              <span class="truncate font-semibold">小明的OJ</span>
              <span class="truncate text-xs text-muted-foreground">XMOJ Electron</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in mainItems" :key="item.id">
              <SidebarMenuButton
                :is-active="currentView === item.id"
                :tooltip="item.title"
                @click="navigation.navigate(item.id)"
              >
                <component :is="item.icon" />
                <span class="min-w-0 truncate group-data-[collapsible=icon]:hidden">
                  {{ item.title }}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg" :tooltip="username || '未登录'">
                <UserAvatar :size="32" class="size-8" />
                <div
                  class="grid min-w-0 flex-1 text-left text-sm group-data-[collapsible=icon]:hidden"
                >
                  <span class="truncate">{{ username || '未登录' }}</span>
                  <span class="truncate text-xs text-muted-foreground">
                    {{ isAuthenticated ? (isAdmin ? '管理员' : '已登录') : '请登录' }}
                  </span>
                </div>
                <ChevronsUpDown class="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="right" align="end" class="w-52">
              <DropdownMenuLabel class="truncate">
                {{ username || '未登录' }}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem @select="togglePinnedSidebar">
                <Pin />
                {{ sidebar.pinnedOpen.value ? '取消侧栏常驻' : '侧栏常驻' }}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <!-- The less-used views live here rather than in the main list. -->
              <DropdownMenuItem
                v-for="item in footerItems"
                :key="item.id"
                @select="navigation.navigate(item.id)"
              >
                <component :is="item.icon" />
                {{ item.title }}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem @select="openAbout">
                <Info />
                关于
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="checkingUpdate" @select="checkForUpdates">
                <Loader2 v-if="checkingUpdate" class="animate-spin" />
                <RefreshCw v-else />
                检查更新
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                v-if="isAuthenticated"
                @select="panel.openProfile(username)"
              >
                <User />
                个人主页
              </DropdownMenuItem>
              <DropdownMenuItem v-if="isAuthenticated" @select="handleLogout">
                <LogOut />
                注销
              </DropdownMenuItem>
              <DropdownMenuItem v-else @select="handleSignIn">
                <LogIn />
                登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
