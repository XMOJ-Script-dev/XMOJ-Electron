<script setup lang="ts">import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import { cn } from '@/lib/utils';
import { judgeLanguageToMonaco } from '@/lib/languages';
import { usePreferences } from '@/stores/preferences';
const props = withDefaults(defineProps<{
    modelValue: string;
    languageId?: number;
    readonly?: boolean;
    height?: string;
    class?: string;
}>(), {
    languageId: 1,
    readonly: false,
    height: '24rem',
});
const emit = defineEmits<{
    (event: 'update:modelValue', value: string): void;
}>();
let workersConfigured = false;
function configureWorkers(): void {
    if (workersConfigured)
        return;
    workersConfigured = true;
    (self as unknown as {
        MonacoEnvironment: unknown;
    }).MonacoEnvironment = {
        getWorker() {
            return new editorWorker();
        },
    };
}
const container = ref<HTMLElement | null>(null);
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);
const { resolvedTheme } = usePreferences();
function applyTheme(): void {
    monaco.editor.setTheme(resolvedTheme.value === 'dark' ? 'vs-dark' : 'vs');
}
onMounted(() => {
    configureWorkers();
    if (!container.value)
        return;
    editor.value = monaco.editor.create(container.value, {
        value: props.modelValue,
        language: judgeLanguageToMonaco(props.languageId),
        theme: resolvedTheme.value === 'dark' ? 'vs-dark' : 'vs',
        readOnly: props.readonly,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        tabSize: 4,
        insertSpaces: true,
        scrollBeyondLastLine: false,
        renderWhitespace: 'selection',
        fontFamily: "'JetBrains Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace",
    });
    editor.value.onDidChangeModelContent(() => {
        const value = editor.value?.getValue() ?? '';
        if (value !== props.modelValue)
            emit('update:modelValue', value);
    });
    applyTheme();
});
watch(() => props.modelValue, (value) => {
    const instance = editor.value;
    if (!instance)
        return;
    if (instance.getValue() !== value)
        instance.setValue(value);
});
watch(() => props.languageId, (id) => {
    const model = editor.value?.getModel();
    if (model)
        monaco.editor.setModelLanguage(model, judgeLanguageToMonaco(id));
});
watch(resolvedTheme, applyTheme);
onBeforeUnmount(() => {
    editor.value?.dispose();
    editor.value = null;
});
defineExpose({
    insert(text: string) {
        const instance = editor.value;
        if (!instance)
            return;
        const selection = instance.getSelection();
        if (!selection)
            return;
        instance.executeEdits('insert', [{ range: selection, text, forceMoveMarkers: true }]);
        instance.focus();
    },
    getValue() {
        return editor.value?.getValue() ?? props.modelValue;
    },
});
</script>

<template>
  <div
    ref="container"
    :class="cn('overflow-hidden rounded-lg border', props.class)"
    :style="{ height }"
  />
</template>
