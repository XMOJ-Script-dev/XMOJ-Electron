<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Loader2, Pause, Play, RotateCcw, X } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import type { ContestReplay } from '@/shared/types';
const props = defineProps<{ contestId: number; title: string }>();
const emit = defineEmits<{ close: [] }>();
const video = ref<HTMLVideoElement>();
const data = ref<ContestReplay>();
const loading = ref(false), error = ref(''), playing = ref(false);
const selected = ref(0), quality = ref(0), speed = ref(1), volume = ref(1), time = ref(0), duration = ref(0);
const current = computed(() => data.value?.videos[selected.value]);
const source = computed(() => current.value?.sources[quality.value]?.url);
const contentLeft = ref(0);
let resize: ResizeObserver | undefined;
let previousOverflow = '';
function position(): void {
    const main = document.querySelector<HTMLElement>('[data-slot="sidebar-inset"]');
    contentLeft.value = main ? main.getBoundingClientRect().left : 0;
}
let generation = 0;
async function load(): Promise<void> {
    const ticket = ++generation;
    video.value?.pause(); loading.value = true; error.value = '';
    try { const result = await window.xmoj.contest.replay(props.contestId); if (ticket === generation) { data.value = result; selected.value = 0; quality.value = 0; } }
    catch (caught) { if (ticket === generation) error.value = caught instanceof Error ? caught.message : String(caught); }
    finally { if (ticket === generation) loading.value = false; }
}
function format(seconds: number): string { if (!Number.isFinite(seconds)) return '00:00'; const s = Math.max(0, Math.floor(seconds)); return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`; }
function toggle(): void { if (!video.value) return; if (video.value.paused) void video.value.play().catch(() => { error.value = '无法播放，请重试或重新加载回放'; }); else video.value.pause(); }
function seek(event: Event): void { if (video.value) video.value.currentTime = Number((event.target as HTMLInputElement).value); }
function configure(): void { if (video.value) { duration.value = video.value.duration; video.value.playbackRate = speed.value; video.value.volume = volume.value; } }
function close(): void { video.value?.pause(); emit('close'); }
function key(event: KeyboardEvent): void { if (event.key === 'Escape') { event.stopPropagation(); close(); } }
watch([speed, volume], configure);
watch(selected, () => { quality.value = 0; time.value = 0; });
watch(source, () => { time.value = 0; duration.value = 0; playing.value = false; });
watch(() => props.contestId, load);
onMounted(() => { previousOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; position(); resize = new ResizeObserver(position); const main = document.querySelector('[data-slot="sidebar-inset"]'); if (main) resize.observe(main); window.addEventListener('resize', position); document.addEventListener('keydown', key, true); void load(); });
onBeforeUnmount(() => { generation++; resize?.disconnect(); document.documentElement.style.overflow = previousOverflow; window.removeEventListener('resize', position); video.value?.pause(); video.value?.removeAttribute('src'); video.value?.load(); document.removeEventListener('keydown', key, true); });
</script>
<template>
  <section data-slot="contest-replay" class="fixed inset-y-0 right-0 z-10 flex min-w-0 flex-col bg-black text-white" :style="{ left: `${contentLeft}px` }" aria-label="回放">
    <header class="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
      <h2 class="min-w-0 truncate text-sm font-medium">{{ title }} · {{ current?.title || '回放' }}</h2>
      <Button type="button" size="icon" variant="ghost" class="shrink-0 text-white hover:bg-white/15 hover:text-white" aria-label="关闭回放" title="关闭回放（Esc）" @click="close"><X /></Button>
    </header>
    <div class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <Loader2 v-if="loading" class="size-8 animate-spin" aria-label="正在加载回放" />
      <div v-else-if="error" class="space-y-4 p-6 text-center" role="alert"><p>{{ error }}</p><Button variant="secondary" @click="load">重新加载</Button></div>
      <video v-else-if="source" ref="video" :src="source" class="h-full w-full object-contain" playsinline preload="metadata" @loadedmetadata="configure" @timeupdate="time = video?.currentTime || 0" @play="playing = true" @pause="playing = false" @ended="playing = false" @click="toggle" @error="error = '回放加载失败或播放地址已过期，请重新加载'" />
    </div>
    <footer class="shrink-0 space-y-2 border-t border-white/20 bg-neutral-950 p-3" data-slot="replay-controls">
      <input aria-label="播放进度" type="range" class="w-full accent-white" min="0" :max="Number.isFinite(duration) ? duration : 0" :value="time" step="0.1" :disabled="!source || loading || !!error" @input="seek" />
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <Button size="icon" variant="ghost" :disabled="!source || loading || !!error" :aria-label="playing ? '暂停' : '播放'" @click="toggle"><Pause v-if="playing" /><Play v-else /></Button>
        <Button size="icon" variant="ghost" title="后退 10 秒" aria-label="后退 10 秒" :disabled="!video" @click="video && (video.currentTime = Math.max(0, video.currentTime - 10))"><RotateCcw /></Button>
        <span class="font-mono tabular-nums">{{ format(time) }} / {{ format(duration) }}</span>
        <label class="flex items-center gap-2">音量 <input v-model.number="volume" aria-label="音量" class="w-20 accent-white" type="range" min="0" max="1" step="0.05" /></label>
        <label>倍速 <select v-model.number="speed" aria-label="播放速度" class="rounded border border-white/30 bg-neutral-900 p-1"><option v-for="rate in [0.5, 0.75, 1, 1.25, 1.5, 2]" :key="rate" :value="rate">{{ rate }}×</option></select></label>
        <select v-if="current && current.sources.length > 1" v-model="quality" aria-label="画质" class="rounded border border-white/30 bg-neutral-900 p-1"><option v-for="(item, index) in current.sources" :key="index" :value="index">{{ item.label }}</option></select>
        <select v-if="data && data.videos.length > 1" v-model="selected" aria-label="选择回放" class="min-w-0 max-w-64 rounded border border-white/30 bg-neutral-900 p-1"><option v-for="(item, index) in data.videos" :key="index" :value="index">{{ item.title }}</option></select>
      </div>
    </footer>
  </section>
</template>
