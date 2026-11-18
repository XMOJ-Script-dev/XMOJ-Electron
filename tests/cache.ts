import { PageCache } from '../electron/cache.ts';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
console.log('\n=== basic set/get ===');
{
    const cache = new PageCache();
    check('missing key returns null', cache.get('nope') === null);
    cache.set('a', { value: 1 });
    const hit = cache.get<{
        value: number;
    }>('a');
    check('set then get works', hit?.value.value === 1, JSON.stringify(hit?.value));
    check('a fresh set is not fromCache', cache.set('b', 2).fromCache === false);
    check('a read is fromCache', cache.get('b')?.fromCache === true);
}
console.log('\n=== maxAge ===');
{
    const cache = new PageCache();
    cache.set('x', 'value');
    check('maxAge 0 ignores age', cache.get('x', 0) !== null);
    check('a large maxAge accepts', cache.get('x', 60000) !== null);
    const entry = cache as unknown as {
        entries: Map<string, {
            value: unknown;
            fetchedAt: number;
        }>;
    };
    const stored = entry.entries.get('x');
    if (stored)
        stored.fetchedAt = Date.now() - 10000;
    check('a small maxAge rejects an old entry', cache.get('x', 1000) === null);
    check('maxAge 0 still returns the old entry', cache.get('x', 0) !== null);
}
console.log('\n=== clear ===');
{
    const cache = new PageCache();
    cache.set('one', 1);
    cache.set('two', 2);
    check('keys lists what is stored', cache.keys().length >= 2, cache.keys().join(','));
    cache.clear('one');
    check('clearing one key removes only it', cache.get('one') === null && cache.get('two') !== null);
    cache.clear();
    check('clearing all removes everything', cache.keys().length === 0, cache.keys().join(','));
}
console.log('\n=== values survive as-is ===');
{
    const cache = new PageCache();
    const payload = { list: [{ id: 1, title: '题目' }], total: 1, totalPages: 1 };
    cache.set('contest:list:1', payload);
    const back = cache.get<typeof payload>('contest:list:1')?.value;
    check('object identity preserved in memory', back === payload);
    check('nested values intact', back?.list[0]?.title === '题目', String(back?.list[0]?.title));
}
console.log('\n=== persisted cache migration ===');
{
    const directory = mkdtempSync(path.join(tmpdir(), 'xmoj-cache-migration-'));
    try {
        const file = path.join(directory, 'page-cache.json');
        writeFileSync(file, JSON.stringify({
            version: 3,
            entries: {
                'problemset:v2:all': { value: { problems: [{ id: 11710, title: '小时降水量' }] }, fetchedAt: Date.now() },
                'contest:list:1': { value: { list: [{ createdBy: 'alice' }] }, fetchedAt: Date.now() },
                'home:snapshot': { value: { countdown: [] }, fetchedAt: Date.now() },
            },
        }));
        const cache = new PageCache(directory);
        check('v3 题库标题缓存失效', cache.get('problemset:v2:all') === null);
        check('v3 比赛创建者缓存失效', cache.get('contest:list:1') === null);
        check('v3 倒计时缓存失效', cache.get('home:snapshot') === null);
        const payload = { problems: [{ id: 11710, title: '24小时降水量' }] };
        cache.set('problemset:v2:all', payload);
        const saved = JSON.parse(readFileSync(file, 'utf8'));
        check('新缓存写入 v4 格式', saved.version === 4);
        const restored = new PageCache(directory).get<typeof payload>('problemset:v2:all');
        check('新缓存可跨实例恢复正确标题', restored?.value.problems[0]?.title === '24小时降水量' && restored.fromCache);
    }
    finally {
        rmSync(directory, { recursive: true, force: true });
    }
}
console.log(`\n${failures === 0 ? 'ALL CACHE CHECKS PASSED' : `${failures} CACHE CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
