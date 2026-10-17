import { ref } from 'vue';
export type ToastTone = 'error' | 'warning' | 'success' | 'info';
export interface Toast {
    id: number;
    tone: ToastTone;
    message: string;
    timeout: number;
}
const DEFAULTS: Record<ToastTone, number> = {
    error: 8000,
    warning: 6000,
    success: 3500,
    info: 4000,
};
const items = ref<Toast[]>([]);
let nextId = 1;
function push(tone: ToastTone, message: string, timeout?: number): number {
    const text = String(message ?? '').trim();
    if (!text)
        return 0;
    const existing = items.value.find((toast) => toast.tone === tone && toast.message === text);
    if (existing)
        return existing.id;
    const id = nextId++;
    const toast: Toast = {
        id,
        tone,
        message: text,
        timeout: timeout ?? DEFAULTS[tone],
    };
    items.value = [...items.value, toast];
    if (toast.timeout > 0) {
        window.setTimeout(() => dismiss(id), toast.timeout);
    }
    return id;
}
function dismiss(id: number): void {
    items.value = items.value.filter((toast) => toast.id !== id);
}
function clear(): void {
    items.value = [];
}
export function useToasts() {
    return {
        items,
        dismiss,
        clear,
        error: (message: string, timeout?: number) => push('error', message, timeout),
        warning: (message: string, timeout?: number) => push('warning', message, timeout),
        success: (message: string, timeout?: number) => push('success', message, timeout),
        info: (message: string, timeout?: number) => push('info', message, timeout),
    };
}
