import { ref } from 'vue';
import type { DownloadProgress } from '@/shared/types';
export const activeDownloads = ref<DownloadProgress[]>([]);
export function updateDownload(progress: DownloadProgress): void {
    const index = activeDownloads.value.findIndex(item => item.id === progress.id);
    if (progress.state === 'cancelled' || progress.state === 'interrupted') {
        removeDownload(progress.id);
    } else if (index === -1) activeDownloads.value.push(progress);
    else activeDownloads.value[index] = progress;
}
export function removeDownload(id: string): void {
    activeDownloads.value = activeDownloads.value.filter(item => item.id !== id);
}
