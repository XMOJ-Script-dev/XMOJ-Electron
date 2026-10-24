import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useCachedResource } from '../src/composables/useAsyncResource.ts';

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

test('cache lookup and background refresh both remain busy', async () => {
    const cached = deferred<string | null>();
    const fresh = deferred<string>();
    const resource = useCachedResource(() => cached.promise, () => fresh.promise);
    const pending = resource.loadCacheFirst();
    assert.equal(resource.loading.value, true);
    cached.resolve('cached');
    await Promise.resolve();
    assert.equal(resource.data.value, 'cached');
    assert.equal(resource.stale.value, true);
    assert.equal(resource.loading.value, true);
    fresh.resolve('fresh');
    await pending;
    assert.equal(resource.data.value, 'fresh');
    assert.equal(resource.stale.value, false);
    assert.equal(resource.loading.value, false);
});

test('refresh failure keeps cached data and clears busy state', async () => {
    const resource = useCachedResource(async () => 'cached', async () => { throw new Error('offline'); });
    await resource.loadCacheFirst();
    assert.equal(resource.data.value, 'cached');
    assert.equal(resource.error.value, 'offline');
    assert.equal(resource.loading.value, false);
});

test('manual refresh is busy even when data is already rendered', async () => {
    const fresh = deferred<string>();
    let calls = 0;
    const resource = useCachedResource<string>(async () => null, () => ++calls === 1 ? Promise.resolve('first') : fresh.promise);
    await resource.run();
    const pending = resource.run();
    assert.equal(resource.data.value, 'first');
    assert.equal(resource.loading.value, true);
    fresh.resolve('second');
    await pending;
    assert.equal(resource.loading.value, false);
    assert.equal(resource.data.value, 'second');
});

test('superseded request cannot clear the active request busy state', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    let calls = 0;
    const resource = useCachedResource<string>(async () => null, () => ++calls === 1 ? first.promise : second.promise);
    const old = resource.run();
    const current = resource.run();
    first.resolve('old');
    await old;
    assert.equal(resource.loading.value, true);
    assert.equal(resource.data.value, null);
    second.resolve('current');
    await current;
    assert.equal(resource.data.value, 'current');
    assert.equal(resource.loading.value, false);
});
