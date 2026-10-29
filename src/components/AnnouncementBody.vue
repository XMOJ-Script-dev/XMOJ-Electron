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
.announcement-body h1 { font-size: 2em; }
.announcement-body h2 { font-size: 1.5em; }
.announcement-body h3 { font-size: 1.25em; }
.announcement-body h4 { font-size: 1.1em; }

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
.announcement-body th, .announcement-body td { vertical-align: middle; }
.announcement-body .markdown-callout {
  --callout-color: #3b82f6;
  margin: 0.75rem 0;
  border: 1px solid color-mix(in srgb, var(--callout-color) 45%, var(--border));
  border-left: 4px solid var(--callout-color);
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--callout-color) 7%, var(--background));
}
.announcement-body .callout-success { --callout-color: #22a06b; }
.announcement-body .callout-warning { --callout-color: #d99a13; }
.announcement-body .callout-error { --callout-color: #e5484d; }
.announcement-body .markdown-callout > summary {
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  font-weight: 600;
}
.announcement-body .callout-content { padding: 0 0.8rem 0.5rem; }
/* Alignment affects only prose, not lists, code or tables. Inner directives win. */
.announcement-body .markdown-align-left { --markdown-align: left; }
.announcement-body .markdown-align-center { --markdown-align: center; }
.announcement-body .markdown-align-right { --markdown-align: right; }
.announcement-body .markdown-align :is(p, h1, h2, h3, h4, h5, h6) { text-align: var(--markdown-align); }
.announcement-body .markdown-align :is(ul, ol, blockquote, table, pre) { --markdown-align: left; }
.announcement-body .markdown-epigraph { margin: 0.5em 0 0.5em 60%; width: 40%; text-align: left; }
.announcement-body .markdown-epigraph:has(> figcaption) > :nth-last-child(2) { margin-bottom: 0; }
.announcement-body .markdown-epigraph > figcaption { margin-top: 0; border-top: 1px solid #888; text-align: right; }
.announcement-body .cute-table { margin-inline: auto; }
.announcement-body .cute-table :is(th, td) { vertical-align: middle; }
.announcement-body :is(.cute-table-three, .cute-table-tuack) { border-top: 5px solid currentColor; border-bottom: 5px solid currentColor; }
.announcement-body :is(.cute-table-three, .cute-table-tuack) :is(th, td) { border: 0; }
.announcement-body :is(.cute-table-three, .cute-table-tuack) th { font-weight: 400; }
.announcement-body :is(.cute-table-three, .cute-table-tuack) thead { border-bottom: 3px solid currentColor; }
.announcement-body .cute-table-tuack col:not(:first-child) { border-left: 1px solid currentColor; }
.announcement-body .cute-table-tuack col.table-divider { border-left: 3px solid currentColor; }
.announcement-body .cute-table-tuack :is(th, td).table-divider { border-left: 3px solid currentColor; }
.announcement-body .cute-table-tuack :is(th, td).table-divider-end { border-right: 3px solid currentColor; }
.announcement-body .cute-table-tuack tr:not(:last-child) { border-bottom: 1px solid currentColor; }
.announcement-body pre code { display: block; width: max-content; min-width: 100%; box-sizing: border-box; white-space: pre; line-height: 1.6; }
.announcement-body .code-line { display: block; position: relative; box-sizing: border-box; min-height: 1.6em; padding-left: 4.5em; }
.announcement-body .code-line::before {
  content: attr(data-line);
  position: absolute;
  left: 0;
  width: 3.5em;
  padding-right: 0.75em;
  border-right: 1px solid var(--border);
  color: var(--muted-foreground);
  text-align: right;
  user-select: none;
}
.announcement-body .code-line-highlight { background: color-mix(in srgb, #eab308 20%, transparent); }
.announcement-body .token:is(.comment, .prolog, .doctype, .cdata) { color: var(--muted-foreground); }
.announcement-body .token:is(.keyword, .boolean, .constant) { color: #7c3aed; }
.announcement-body .token:is(.string, .char, .attr-value) { color: #15803d; }
.announcement-body .token:is(.number, .function) { color: #b45309; }
.announcement-body .token:is(.operator, .punctuation) { color: var(--muted-foreground); }
.announcement-body .token:is(.class-name, .builtin, .tag, .property) { color: #0369a1; }
.dark .announcement-body .token:is(.keyword, .boolean, .constant) { color: #c4b5fd; }
.dark .announcement-body .token:is(.string, .char, .attr-value) { color: #86efac; }
.dark .announcement-body .token:is(.number, .function) { color: #fcd34d; }
.dark .announcement-body .token:is(.class-name, .builtin, .tag, .property) { color: #7dd3fc; }
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
