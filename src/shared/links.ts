export function isJudgeUrl(value: string | URL): boolean {
    try {
        const url = value instanceof URL ? value : new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && (url.hostname === 'xmoj.tech' || url.hostname.endsWith('.xmoj.tech'));
    } catch { return false; }
}
export function isExternalWebUrl(value: string | URL): boolean {
    try {
        const url = value instanceof URL ? value : new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && !isJudgeUrl(url);
    } catch { return false; }
}
