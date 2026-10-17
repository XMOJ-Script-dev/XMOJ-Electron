import { watch, type Ref } from 'vue';
import { useToasts } from '@/stores/toasts';
export function useErrorToast(error: Ref<string | null>): void {
    const toasts = useToasts();
    watch(error, (message) => {
        if (!message)
            return;
        toasts.error(message);
        error.value = null;
    });
}
