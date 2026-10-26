<script setup lang="ts">import { computed } from 'vue';
import { renderAnnouncement } from '@/lib/markdown';
import { htmlToMarkdown } from '@/lib/markdown-copy';
import 'katex/dist/katex.min.css';
const props = defineProps<{
    source?: string | null;
    format?: 'auto' | 'markdown' | 'statement';
}>();
const rendered = computed(() => {
    const source = props.source ?? '';
    if (props.format === 'statement') return renderAnnouncement(htmlToMarkdown(source), 'markdown');
    return renderAnnouncement(source, props.format === 'markdown' ? 'markdown' : 'auto');
});
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
.announcement-body h4,
.announcement-body h5,
.announcement-body h6 {
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

.announcement-body blockquote {
  margin: 0.75rem 0;
  border-left: 3px solid var(--border);
  padding: 0.1rem 0 0.1rem 1rem;
  color: var(--muted-foreground);
}
.announcement-body hr {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 1rem 0;
}
.announcement-body pre code { padding: 0; background: none; }
.announcement-body th, .announcement-body td { vertical-align: top; }
.service-notice {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 0.9rem;
  line-height: 1.5;
}
.service-notice :is(h1,h2,h3,h4,h5,h6) { font-size: 1em; line-height: 1.35; }
.service-notice .badge {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  background: #40885b;
  color: white;
  font-size: 0.8em;
  font-weight: 700;
  line-height: 1.2;
  vertical-align: middle;
}
</style>
