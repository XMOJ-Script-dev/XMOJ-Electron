<script setup lang="ts">
import { computed } from 'vue';
import { VisXYContainer, VisLine, VisAxis, VisGroupedBar, VisSingleContainer, VisDonut } from '@unovis/vue';
import { ChartContainer, ChartCrosshair, ChartTooltip, ChartTooltipContent, componentToString } from '@/components/ui/chart';
import type { UserProfile } from '@/shared/types';
const props = defineProps<{ profile: UserProfile }>();
type Point = { timestamp: number; submitted: number; accepted: number };
const config = { submitted: { label: '提交', color: 'var(--chart-1)' }, accepted: { label: '正确', color: 'var(--chart-2)' } };
const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
const statistics = computed(() => props.profile.statistics?.filter(s => s.count > 0) ?? []);
const countValue = (d: { count: number }) => d.count;
const sliceColor = (_: unknown, i: number) => colors[i % colors.length];
const date = (value: number | Date) => new Date(value).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', month: 'short', day: 'numeric', year: 'numeric' });
const tooltip = (point: Point) => componentToString(config, ChartTooltipContent, { labelFormatter: date, x: point.timestamp, payload: { submitted: point.submitted, accepted: point.accepted } });
</script>
<template>
  <div class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)]">
    <section class="min-w-0 rounded-xl border bg-card p-5 shadow-sm">
      <h2 class="font-semibold">提交记录</h2>
      <p class="mt-1 text-xs text-muted-foreground">每日提交与正确数量</p>
      <div class="mt-3 flex gap-4 text-xs"><span class="text-[var(--chart-1)]">● 提交</span><span class="text-[var(--chart-2)]">● 正确</span></div>
      <ChartContainer v-if="profile.activity?.length" :config="config" class="mt-4 h-64 w-full" cursor>
        <VisXYContainer :data="profile.activity" :margin="{ left: 8, right: 12, top: 12, bottom: 0 }">
          <VisGroupedBar :x="(d: Point) => d.timestamp" :y="(d: Point) => d.accepted" color="var(--chart-2)" :bar-max-width="10" :rounded-corners="2" />
          <VisLine :x="(d: Point) => d.timestamp" :y="(d: Point) => d.submitted" color="var(--chart-1)" :line-width="1.5" />
          <VisAxis type="x" :x="(d: Point) => d.timestamp" :tick-format="date" :num-ticks="3" :grid-line="false" />
          <VisAxis type="y" :num-ticks="4" :tick-format="(value: number) => Number.isInteger(value) ? String(value) : ''" />
          <ChartTooltip />
          <ChartCrosshair :template="tooltip" color="var(--chart-1)" />
        </VisXYContainer>
      </ChartContainer>
      <p v-else class="py-16 text-center text-sm text-muted-foreground">暂无提交记录</p>
    </section>
    <section class="rounded-xl border bg-card p-5 shadow-sm">
      <h2 class="font-semibold">判题结果分布</h2>
      <ChartContainer v-if="statistics.length" :config="config" class="mx-auto my-4 h-40 w-40">
        <VisSingleContainer :data="statistics">
          <VisDonut :value="countValue" :color="sliceColor" :arc-width="22" :central-label="String(statistics.reduce((sum, s) => sum + s.count, 0))" central-sub-label="总提交" />
        </VisSingleContainer>
      </ChartContainer>
      <ul class="space-y-2 text-xs"><li v-for="(item, index) in statistics" :key="item.verdict" class="flex items-center gap-2"><span class="size-2 rounded-sm" :style="{ background: colors[index % colors.length] }" />{{ item.label }}<span class="ml-auto font-mono tabular-nums">{{ item.count }}</span></li></ul>
    </section>
  </div>
</template>
