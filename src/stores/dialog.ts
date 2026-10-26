import { shallowRef } from 'vue';
import type { DialogRequest } from '@/shared/types';
export const activeDialog = shallowRef<DialogRequest | null>(null);
let resolveDialog: ((value: { buttonId: string | null }) => void) | null = null;
export function closeDialog(buttonId = activeDialog.value?.cancelId ?? null): void {
    activeDialog.value = null;
    resolveDialog?.({ buttonId });
    resolveDialog = null;
}
export function showDialog(request: DialogRequest): Promise<{ buttonId: string | null }> {
    closeDialog();
    activeDialog.value = request;
    return new Promise(resolve => { resolveDialog = resolve; });
}
