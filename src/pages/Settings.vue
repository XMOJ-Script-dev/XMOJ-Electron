<script setup lang="ts">import { ref } from 'vue';
import { CloudDownload, CloudUpload, Monitor, Moon, RotateCcw, Sun, Trash2 } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { clearPageCache, pullCloudSettings, pushCloudSettings } from '@/services/api';
import { useToasts } from '@/stores/toasts';
import { applySyncedSettings, collectSyncedSettings, usePreferences, type Preferences, type ThemePreference, } from '@/stores/preferences';
const { preferences, resolvedTheme, reset } = usePreferences();
const toasts = useToasts();
const cloudBusy = ref(false);
async function pullCloud(): Promise<void> {
    cloudBusy.value = true;
    try {
        const remote = await pullCloudSettings();
        const { applied, rejected } = applySyncedSettings(remote);
        if (applied === 0 && rejected.length === 0) {
            toasts.info('账号里没有保存过设置');
        }
        else if (applied === 0) {
            toasts.warning(`账号里的设置无法识别，已保留本机设置：${rejected.join('、')}`);
        }
        else if (rejected.length > 0) {
            toasts.success(`已应用 ${applied} 项设置；${rejected.length} 项因无法识别已保留本机值`);
        }
        else {
            toasts.success(`已从账号应用 ${applied} 项设置`);
        }
    }
    catch (caught) {
        toasts.error(caught instanceof Error ? caught.message : String(caught));
    }
    finally {
        cloudBusy.value = false;
    }
}
async function pushCloud(): Promise<void> {
    cloudBusy.value = true;
    try {
        await pushCloudSettings(collectSyncedSettings());
        toasts.success('已上传到账号');
    }
    catch (caught) {
        toasts.error(caught instanceof Error ? caught.message : String(caught));
    }
    finally {
        cloudBusy.value = false;
    }
}
const cacheBusy = ref(false);
async function clearCache(): Promise<void> {
    cacheBusy.value = true;
    try {
        const cleared = await clearPageCache();
        if (cleared > 0)
            toasts.success(`已清除 ${cleared} 条页面缓存`);
        else
            toasts.info('没有需要清除的缓存');
    }
    catch (caught) {
        toasts.error(caught instanceof Error ? caught.message : String(caught));
    }
    finally {
        cacheBusy.value = false;
    }
}
const THEMES: {
    value: ThemePreference;
    label: string;
    icon: typeof Sun;
}[] = [
    { value: 'light', label: '亮色', icon: Sun },
    { value: 'dark', label: '暗色', icon: Moon },
    { value: 'auto', label: '跟随系统', icon: Monitor },
];
const toggles: {
    key: keyof Preferences;
    label: string;
    hint: string;
}[] = [
    {
        key: 'animations',
        label: '界面动画',
        hint: '关闭后减少过渡与动效',
    },
    {
        key: 'units',
        label: '内存与耗时添加单位',
        hint: '显示为 20.47MB / 88ms，而不是原始数字',
    },
    {
        key: 'relativeTime',
        label: '相对时间',
        hint: '显示为「3 分钟前」而不是完整日期',
    },
    {
        key: 'autoRefresh',
        label: '自动刷新评测中记录',
        hint: '对有等待评判的提交自动轮询结果',
    },
    {
        key: 'confirmLeave',
        label: '离开前确认',
        hint: '在关闭窗口前给出确认提示',
    },
];
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">设置</h1>
        <p class="text-sm text-muted-foreground">
          当前生效主题：{{ resolvedTheme === 'dark' ? '暗色' : '亮色' }}
        </p>
      </div>
      <Button variant="outline" size="sm" @click="reset">
        <RotateCcw />
        恢复默认
      </Button>
    </div>

    <section class="space-y-3 rounded-xl border p-4">
      <h2 class="text-sm font-medium">界面主题</h2>
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="option in THEMES"
          :key="option.value"
          :variant="preferences.theme === option.value ? 'default' : 'outline'"
          size="sm"
          @click="preferences.theme = option.value"
        >
          <component :is="option.icon" />
          {{ option.label }}
        </Button>
      </div>
    </section>

    <section class="divide-y rounded-xl border">
      <label
        v-for="item in toggles"
        :key="item.key"
        class="flex cursor-pointer items-start justify-between gap-4 p-4"
      >
        <span class="min-w-0">
          <span class="block text-sm font-medium">{{ item.label }}</span>
          <span class="block text-xs text-muted-foreground">{{ item.hint }}</span>
        </span>
        <input
          v-model="preferences[item.key]"
          type="checkbox"
          class="mt-1 size-4 shrink-0 rounded border-input accent-primary"
        />
      </label>
    </section>

    <section class="space-y-3 rounded-xl border p-4">
      <h2 class="text-sm font-medium">自动刷新间隔</h2>
      <div class="flex items-center gap-3">
        <input
          v-model.number="preferences.autoRefreshSeconds"
          type="range"
          min="5"
          max="60"
          step="5"
          :disabled="!preferences.autoRefresh"
          class="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:opacity-50"
        />
        <span class="w-16 shrink-0 text-right font-mono text-sm tabular-nums">
          {{ preferences.autoRefreshSeconds }} 秒
        </span>
      </div>
      <p class="text-xs text-muted-foreground">
        仅当列表中存在「等待评判」的提交时才会轮询。
      </p>
    </section>

    <section class="space-y-3 rounded-xl border p-4">
      <h2 class="text-sm font-medium">云同步设置</h2>
      <p class="text-xs text-muted-foreground">
        把本机偏好上传到账号，或从账号下载覆盖本机。不会自动同步。
      </p>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" :disabled="cloudBusy" @click="pullCloud">
          <CloudDownload />
          从账号下载
        </Button>
        <Button variant="outline" size="sm" :disabled="cloudBusy" @click="pushCloud">
          <CloudUpload />
          上传到账号
        </Button>
      </div>
    </section>

    <section class="space-y-3 rounded-xl border p-4">
      <h2 class="text-sm font-medium">本地缓存</h2>
      <p class="text-xs text-muted-foreground">
        清除已缓存的页面数据，下次访问时重新从服务器加载。
      </p>
      <Button variant="outline" size="sm" :disabled="cacheBusy" @click="clearCache">
        <Trash2 />
        清除缓存
      </Button>
    </section>
  </div>
</template>
