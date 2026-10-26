<script setup lang="ts">import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { RefreshCw } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementBody from '@/components/AnnouncementBody.vue';
import { useCachedResource } from '@/composables/useAsyncResource';
import { fetchHomeSnapshot } from '@/services/api';
import { htmlToMarkdown } from '@/lib/markdown-copy';
const resource = useCachedResource(() => fetchHomeSnapshot(true).catch(() => null), () => fetchHomeSnapshot(false));
const clockOffset = ref(0);
const now = ref(Date.now());
let clockTimer: number | undefined;
const clock = computed(() => {
    const current = new Date(now.value + clockOffset.value);
    const pad = (value: number) => String(value).padStart(2, '0');
    return (`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())} ` +
        `${pad(current.getHours())}:${pad(current.getMinutes())}:${pad(current.getSeconds())}`);
});
const announcements = computed(() => (resource.data.value?.announcements ?? []).map(item => ({ ...item, markdown: htmlToMarkdown(item.html) })));
const banners = computed(() => resource.data.value?.banners ?? []);
const countdown = computed(() => resource.data.value?.countdown ?? []);
const notice = computed(() => resource.data.value?.notice ?? null);
async function load(): Promise<void> {
    await resource.run();
    const serverTime = resource.data.value?.serverTime;
    if (serverTime)
        clockOffset.value = serverTime - Date.now();
}
onMounted(() => {
    clockTimer = window.setInterval(() => {
        now.value = Date.now();
    }, 1000);
    void resource.loadCacheFirst().then(() => {
        const serverTime = resource.data.value?.serverTime;
        if (serverTime)
            clockOffset.value = serverTime - Date.now();
    });
});
onBeforeUnmount(() => {
    if (clockTimer)
        window.clearInterval(clockTimer);
});
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6" :aria-busy="resource.loading.value">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">小明的 OJ</h1>
        <p class="text-sm text-muted-foreground">公告与最新动态</p>
      </div>

      <div class="flex items-center gap-3">
        <div class="rounded-lg border bg-card px-3 py-2 text-right">
          <div class="text-[11px] text-muted-foreground">服务器时间</div>
          <div class="font-mono text-sm tabular-nums">{{ clock }}</div>
        </div>
        <Button
          variant="outline"
          size="icon"
          :disabled="resource.loading.value"
          title="刷新"
          @click="load"
        >
          <RefreshCw
            :class="resource.loading.value || resource.stale.value ? 'animate-spin' : ''"
          />
        </Button>
      </div>
    </div>

    <div v-if="resource.loading.value && announcements.length === 0" class="space-y-3">
      <Skeleton v-for="index in 3" :key="index" class="h-28 w-full rounded-xl" />
    </div>

    <div class="grid items-start gap-6 md:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
      <div class="order-2 space-y-6 md:col-start-2 md:row-start-1">
      <div v-if="countdown.length > 0" class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground">倒计时</h2>
        <div class="grid gap-2">
          <div
            v-for="item in countdown"
            :key="`${item.event}-${item.date}`"
            class="flex items-baseline justify-between gap-3 rounded-lg border bg-card px-3 py-2"
          >
            <span class="min-w-0 truncate text-sm" :title="item.event">{{ item.event }}</span>
            <span class="shrink-0 text-sm text-muted-foreground">
              距离还有
              <span class="font-mono font-semibold text-foreground tabular-nums">
                {{ item.days }}
              </span>
              天
            </span>
          </div>
        </div>
      </div>

      <div v-if="notice" class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground">服务公告</h2>
        <article class="rounded-xl border bg-card">
          <AnnouncementBody class="service-notice px-4 py-3" :source="notice" format="markdown" />
        </article>
      </div>

      <div v-if="banners.length > 0" class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground">推荐</h2>
        <a v-for="(banner, index) in banners" :key="index" :href="banner.href" :title="banner.href" data-slot="promo-banner" class="block w-full overflow-hidden rounded-xl border bg-muted hover:shadow-sm">
          <img :src="banner.src" class="h-auto w-full object-contain" alt="推荐" referrerpolicy="no-referrer" />
        </a>
      </div>
      </div>

      <div v-if="announcements.length > 0" class="order-1 min-w-0 space-y-3 md:col-start-1 md:row-start-1">
        <h2 class="text-sm font-medium text-muted-foreground">公告</h2>
        <article
          v-for="(item, index) in announcements"
          :key="`${item.title}-${index}`"
          class="rounded-xl border bg-card transition-shadow hover:shadow-sm"
        >
          <header class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <h3 class="font-semibold">{{ item.title }}</h3>
            <Badge v-if="item.date" variant="secondary" class="font-mono">
              {{ item.date }}
            </Badge>
          </header>
          <AnnouncementBody
            class="px-4 py-3 text-sm leading-relaxed"
            :source="item.markdown"
            format="markdown"
          />
        </article>
      </div>

      <div
        v-else-if="!resource.loading.value && !resource.error.value"
        class="order-1 rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground md:col-start-1 md:row-start-1"
      >
        暂无公告
      </div>

    </div>

    <footer
      class="border-t pt-4 text-center text-xs text-muted-foreground"
      data-slot="home-footer"
    >
      训练营QQ群：228967292
    </footer>
  </div>
</template>
