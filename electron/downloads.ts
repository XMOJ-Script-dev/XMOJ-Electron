import path from 'node:path';
import type { DownloadItem } from 'electron';
import type { DownloadProgress } from '../src/shared/types.ts';
let sequence = 0;
const active = new Map<string, DownloadItem>();
export function cancelDownload(id: string): void { active.get(id)?.cancel(); }
export function trackDownload(item: DownloadItem, emit: (progress: DownloadProgress) => void): void {
    const id = `download-${++sequence}`;
    active.set(id, item);
    const publish = (state: DownloadProgress['state']) => emit({
        id,
        fileName: path.basename(item.getSavePath() || item.getFilename()),
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        state,
    });
    publish('progressing');
    item.on('updated', (_event, state) => publish(state === 'interrupted' || item.isPaused() ? 'paused' : 'progressing'));
    item.once('done', (_event, state) => { active.delete(id); publish(state); });
}
