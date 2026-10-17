<script setup lang="ts">import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ExternalLink, RefreshCw } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementBody from '@/components/AnnouncementBody.vue';
import { useCachedResource } from '@/composables/useAsyncResource';
import { fetchHomeSnapshot } from '@/services/api';
import { useNavigation } from '@/stores/navigation';
import { XMOJ_ORIGIN } from '@/shared/types';
const navigation = useNavigation();
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
const announcements = computed(() => resource.data.value?.announcements ?? []);
const banners = computed(() => resource.data.value?.banners ?? []);
const countdown = computed(() => resource.data.value?.countdown ?? []);
const notice = computed(() => resource.data.value?.notice ?? null);
function openBanner(href: string): void {
    if (!href)
        return;
    let url: URL;
    try {
        url = new URL(href, `${XMOJ_ORIGIN}/`);
    }
    catch {
        return;
    }
    if (url.origin !== XMOJ_ORIGIN) {
        return;
    }
    if (/contest\.php/.test(url.pathname) || /open_contest/.test(url.pathname)) {
        navigation.navigate('contests');
        return;
    }
    if (/problemset\.php/.test(url.pathname)) {
        navigation.navigate('problemset');
        return;
    }
    if (/status\.php/.test(url.pathname)) {
        navigation.navigate('status');
        return;
    }
}
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
  <div class="mx-auto w-full max-w-6xl space-y-6 p-6">
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

    <div class="space-y-6">
      <!-- Countdown, then the service notice, then the news list. -->
      <div v-if="countdown.length > 0" class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground">倒计时</h2>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
          <AnnouncementBody class="px-4 py-3 text-sm leading-relaxed" :source="notice" />
        </article>
      </div>

      <div v-if="announcements.length > 0" class="space-y-3">
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
            :source="item.html"
          />
        </article>
      </div>

      <div
        v-else-if="!resource.loading.value && !resource.error.value"
        class="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
      >
        暂无公告
      </div>

      <div v-if="banners.length > 0" class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground">推荐</h2>
        <!--
          `items-start` matters: the default `stretch` would force both cards to
          the taller one's height, so a tall banner would letterbox the other.
        -->
        <div class="grid items-start gap-4 sm:grid-cols-2">
          <button
            v-for="(banner, index) in banners"
            :key="`${banner.src}-${index}`"
            type="button"
            data-slot="promo-banner"
            class="group relative flex items-center justify-center overflow-hidden rounded-xl border bg-muted transition-shadow hover:shadow-sm"
            :title="banner.href"
            @click="openBanner(banner.href)"
          >
            <!--
              The card follows the image's own aspect ratio: a fixed height either
              crops wide banners or letterboxes tall ones.
            -->
            <img
              :src="banner.src"
              class="block h-auto w-full object-contain"
              alt=""
              decoding="async"
              referrerpolicy="no-referrer"
            />
            <ExternalLink
              class="absolute top-2 right-2 size-4 text-foreground opacity-0 drop-shadow transition-opacity group-hover:opacity-100"
            />
          </button>
        </div>
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
