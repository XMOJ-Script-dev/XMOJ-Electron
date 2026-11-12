export function retryAfterDeadline(value: string | null, now = Date.now()): number | null {
    const header = value?.trim();
    if (!header) return null;
    if (/^\d+$/.test(header)) {
        const seconds = Number(header);
        return now + Math.max(1, Math.ceil(seconds)) * 1000;
    }
    const timestamp = Date.parse(header);
    return Number.isFinite(timestamp) && timestamp > now ? timestamp : null;
}

export function rateLimitMessage(deadline: number | null, now = Date.now()): string {
    if (deadline === null) return '请求过于频繁，请稍后重试。';
    const seconds = Math.max(1, Math.ceil((deadline - now) / 1000));
    if (seconds < 60) return `请求过于频繁，请在 ${seconds} 秒后重试。`;
    const minutes = Math.ceil(seconds / 60);
    return `请求过于频繁，请在 ${minutes} 分钟后重试。`;
}

export function createRateLimitedFetch(fetcher: typeof fetch): typeof fetch {
    const deadlines = new Map<string, number>();
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const path = input instanceof Request ? input.url : String(input);
        const key = new URL(path, 'https://xmoj.invalid').pathname;
        const now = Date.now();
        const deadline = deadlines.get(key);
        if (deadline && deadline > now) throw new Error(rateLimitMessage(deadline, now));
        if (deadline) deadlines.delete(key);

        const response = await fetcher(input, init);
        if (response.status === 429) {
            const retryAt = retryAfterDeadline(response.headers.get('Retry-After'));
            if (retryAt !== null) deadlines.set(key, retryAt);
        }
        return response;
    };
}
