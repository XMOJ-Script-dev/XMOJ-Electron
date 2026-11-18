export const activeDialog = { value: null };
export function closeDialog() { activeDialog.value = null; }
export async function showDialog(request) {
    activeDialog.value = request;
    return { buttonId: request?.cancelId ?? null };
}
