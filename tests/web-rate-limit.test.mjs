import assert from 'node:assert/strict';
import test from 'node:test';
import { createRateLimitedFetch, rateLimitMessage, retryAfterDeadline } from '../src/lib/rate-limit.ts';

test('Retry-After delta-seconds and HTTP dates become deadlines', () => {
    const now = Date.parse('2026-11-08T03:00:00Z');
    assert.equal(retryAfterDeadline('60', now), now + 60_000);
    assert.equal(
        retryAfterDeadline('Sun, 08 Nov 2026 03:02:00 GMT', now),
        now + 120_000,
    );
});

test('invalid or expired Retry-After values do not produce a misleading delay', () => {
    const now = Date.parse('2026-11-08T03:00:00Z');
    assert.equal(retryAfterDeadline(null, now), null);
    assert.equal(retryAfterDeadline('', now), null);
    assert.equal(retryAfterDeadline('not-a-date', now), null);
    assert.equal(retryAfterDeadline('1.5', now), null);
    assert.equal(retryAfterDeadline('Sun, 08 Nov 2026 02:59:00 GMT', now), null);
    assert.equal(retryAfterDeadline('0', now), now + 1_000);
});

test('rate-limit errors provide a wait hint', () => {
    const now = Date.parse('2026-11-08T03:00:00Z');
    assert.equal(rateLimitMessage(now + 31_000, now), '请求过于频繁，请在 31 秒后重试。');
    assert.equal(rateLimitMessage(now + 61_000, now), '请求过于频繁，请在 2 分钟后重试。');
    assert.equal(rateLimitMessage(null, now), '请求过于频繁，请稍后重试。');
});

test('Retry-After temporarily blocks requests to the same API path only', async () => {
    let calls = 0;
    const fetchApi = createRateLimitedFetch(async () => {
        calls += 1;
        return new Response('rate limited', {
            status: 429,
            headers: { 'Retry-After': '60' },
        });
    });

    await fetchApi('/api/community?action=read');
    await assert.rejects(fetchApi('/api/community?action=write'), /请求过于频繁，请在 1 分钟后重试/);
    await fetchApi('/api/session');
    assert.equal(calls, 2);
});

test('429 without Retry-After does not impose a guessed client cooldown', async () => {
    let calls = 0;
    const fetchApi = createRateLimitedFetch(async () => {
        calls += 1;
        return new Response('rate limited', { status: 429 });
    });

    await fetchApi('/api/community');
    await fetchApi('/api/community');
    assert.equal(calls, 2);
});
