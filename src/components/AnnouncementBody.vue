<script setup lang="ts">import { computed } from 'vue';
import { renderAnnouncement } from '@/lib/markdown';
import 'katex/dist/katex.min.css';
const props = defineProps<{
    source?: string | null;
}>();
const rendered = computed(() => renderAnnouncement(props.source ?? ''));
</script>

<template>
  <div class="announcement-body" v-html="rendered" />
</template>

<style>
.announcement-body .katex-display {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem 0;
}

.announcement-body img {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
}

.announcement-body p {
  margin: 0.5rem 0;
}

.announcement-body ul,
.announcement-body ol {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.announcement-body ul {
  list-style: disc;
}

.announcement-body ol {
  list-style: decimal;
}

.announcement-body a {
  color: var(--primary);
  text-decoration: underline;
}

.announcement-body h1,
.announcement-body h2,
.announcement-body h3,
.announcement-body h4 {
  font-weight: 600;
  margin: 0.75rem 0 0.25rem;
}

.announcement-body code {
  background: var(--muted);
  border-radius: 0.25rem;
  padding: 0.1rem 0.3rem;
  font-size: 0.875em;
}

.announcement-body pre {
  background: var(--muted);
  border-radius: 0.375rem;
  padding: 0.75rem;
  overflow-x: auto;
}

.announcement-body table {
  border-collapse: collapse;
  margin: 0.5rem 0;
}

.announcement-body th,
.announcement-body td {
  border: 1px solid var(--border);
  padding: 0.25rem 0.5rem;
}
</style>
