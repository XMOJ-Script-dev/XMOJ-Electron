import type { CommunityCredentials } from './community.ts';
import type { CommunityNotification } from '../src/shared/types.ts';
type Channel = 'bbs' | 'mail';
export function createNoticePoller(
    load: (channel: Channel, credentials: CommunityCredentials) => Promise<CommunityNotification[]>,
    options: { now?: () => number; delay?: () => Promise<void>; onFailure?: (channel: Channel, error: unknown, retryMs: number) => void } = {},
): (credentials: CommunityCredentials) => Promise<CommunityNotification[]> {
    const now = options.now ?? Date.now;
    const delay = options.delay ?? (() => new Promise(resolve => setTimeout(resolve, 300)));
    let key = '';
    let inflight: Promise<CommunityNotification[]> | null = null;
    let channels = { bbs: { failures: 0, next: 0 }, mail: { failures: 0, next: 0 } };
    return credentials => {
        const accountKey = `${credentials.username}:${credentials.sessionId}`;
        if (key !== accountKey) {
            key = accountKey;
            inflight = null;
            channels = { bbs: { failures: 0, next: 0 }, mail: { failures: 0, next: 0 } };
        }
        if (inflight) return inflight;
        const run = async (channel: Channel): Promise<CommunityNotification[]> => {
            const state = channels[channel];
            if (now() < state.next) return [];
            try {
                let notices: CommunityNotification[];
                try { notices = await load(channel, credentials); }
                catch (error) {
                    if (!/fetch failed|network|timeout|超时|HTTP 5\d\d|ECONN|ENOTFOUND/i.test(String(error))) throw error;
                    await delay();
                    notices = await load(channel, credentials);
                }
                state.failures = 0;
                state.next = 0;
                return key === accountKey ? notices : [];
            } catch (error) {
                const retryMs = Math.min(300000, 30000 * 2 ** Math.min(state.failures++, 4));
                state.next = now() + retryMs;
                options.onFailure?.(channel, error, retryMs);
                return [];
            }
        };
        const request = Promise.all([run('bbs'), run('mail')]).then(results => results.flat());
        inflight = request;
        void request.finally(() => { if (inflight === request) inflight = null; });
        return request;
    };
}
