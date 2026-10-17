export function formatMemory(kb: number | null): string {
    if (kb === null || !Number.isFinite(kb))
        return '—';
    if (kb < 1024)
        return `${Math.round(kb)}KB`;
    const mb = kb / 1024;
    if (mb < 1024)
        return `${mb.toFixed(2)}MB`;
    return `${(mb / 1024).toFixed(2)}GB`;
}
export function formatTime(ms: number | null): string {
    if (ms === null || !Number.isFinite(ms))
        return '—';
    if (ms < 1000)
        return `${Math.round(ms)}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}min`;
}
export function formatRatio(accepted: number | null, total: number | null): string {
    if (accepted === null || total === null || total <= 0)
        return '—';
    return `${((accepted / total) * 100).toFixed(1)}%`;
}
export function formatDateTime(value: string | null): string {
    if (!value)
        return '—';
    return value;
}
