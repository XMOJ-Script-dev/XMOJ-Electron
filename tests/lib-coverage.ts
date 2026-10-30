import assert from 'node:assert/strict';
import { markdown } from '../src/lib/markdown-extensions.ts';
import { quoteReply, attachOpeningComment, canManageDiscussion, isDiscussionAdmin } from '../src/shared/discussion.ts';
import type { BbsPostDetail } from '../src/shared/community.ts';
import { userColor } from '../src/lib/user-color.ts';
import { formatMemory, formatTime, formatRatio, formatDateTime } from '../src/lib/format.ts';
import { judgeLanguageToMonaco } from '../src/lib/languages.ts';
import { createPoller } from '../src/lib/poller.ts';

let failures = 0;
let passes = 0;
function check(label: string, condition: boolean, detail = '') {
    if (condition) {
        passes++;
        console.log(`  [PASS] ${label}`);
    }
    else {
        failures++;
        console.log(`  [FAIL] ${label}${detail ? ` :: ${detail}` : ''}`);
    }
}

console.log('\n=== markdown-extensions: 折叠块（:::info/success/warning/error） ===');
{
    const html = markdown.parse(':::info\nhello **world**\n:::');
    check('info 折叠块 details 结构', html.includes('<details class="markdown-callout callout-info">'), html);
    check('info 默认 summary 为指令名', html.includes('<summary>info</summary>'), html);
    check('info 内容保留', html.includes('hello <strong>world</strong>'), html);
}
{
    const html = markdown.parse(':::success{open}\nyes\n:::');
    check('success{open} 带 open 属性', html.includes('<details class="markdown-callout callout-success" open>'), html);
}
{
    const html = markdown.parse(':::warning[注意标题]\nbe careful\n:::');
    check('warning[label] 自定义 summary', html.includes('<summary>注意标题</summary>'), html);
    check('warning callout class', html.includes('callout-warning'), html);
}
{
    const html = markdown.parse(':::error\nbroken\n:::');
    check('error 折叠块', html.includes('<details class="markdown-callout callout-error">'), html);
    check('error 内容', html.includes('broken'), html);
}

console.log('\n=== markdown-extensions: 未知指令保留原文 ===');
{
    const html = markdown.parse(':::unknown\nsecret content\n:::');
    check('未知指令不产生 details', !html.includes('<details'), html);
    check('未知指令保留原文', html.includes(':::unknown') && html.includes('secret content'), html);
}

console.log('\n=== markdown-extensions: 未闭合指令不吞内容 ===');
{
    const html = markdown.parse(':::info\nnever closed\n\nafter paragraph');
    check('未闭合指令不产生 details', !html.includes('<details'), html);
    check('未闭合指令保留标记行', html.includes(':::info'), html);
    check('未闭合指令后续内容仍在', html.includes('never closed') && html.includes('after paragraph'), html);
}

console.log('\n=== markdown-extensions: :::align ===');
{
    const center = markdown.parse(':::align{center}\n居中\n:::');
    check('align{center} 生成 center 类', center.includes('<div class="markdown-align markdown-align-center">'), center);
    const right = markdown.parse(':::align{right}\n右\n:::');
    check('align{right} 生成 right 类', right.includes('markdown-align-right'), right);
    const fallback = markdown.parse(':::align\n默认\n:::');
    check('align 无属性默认 left', fallback.includes('markdown-align-left'), fallback);
    const body = markdown.parse(':::align{center}\n多行**内容**\n:::');
    check('align 内容被解析', body.includes('<strong>内容</strong>'), body);
}

console.log('\n=== markdown-extensions: 表格 < 合并 / ^ 纵向合并 ===');
{
    const html = markdown.parse('| A | B |\n|---|---|\n| a | < |\n| b | c |');
    check('`<` 触发 colspan=2', html.includes('<td colspan="2">a</td>'), html);
    check('合并后第二个单元格消失', !/<td[^>]*>&lt;<\?\/td>/.test(html) && !html.includes('<>'), html);
    check('普通行不受影响', html.includes('<td>b</td>') && html.includes('<td>c</td>'), html);
}
{
    const html = markdown.parse('| A | B |\n|---|---|\n| x | y |\n| ^ | z |');
    check('`^` 触发 rowspan=2', html.includes('<td rowspan="2">x</td>'), html);
    check('首列第二行被吞并', (html.match(/<td rowspan="2">x<\/td><td>y<\/td>/g) ?? []).length === 1, html);
}
{
    const html = markdown.parse('| A | B |\n|---|---|\n| a | b |\n| < | c |');
    check('行首 `<`（c=0）不合并，保留原文', html.includes('&lt;'), html);
}

console.log('\n=== markdown-extensions: 代码块 lines= 高亮 ===');
{
    const html = markdown.parse('```cpp lines=2\nint a;\nint b;\nint c;\n```');
    check('生成 3 行 code-line 结构', (html.match(/data-line="/g) ?? []).length === 3, html);
    check('第 2 行高亮', html.includes('class="code-line code-line-highlight" data-line="2"'), html);
    check('第 1、3 行不高亮', !html.includes('code-line-highlight" data-line="1"') && !html.includes('code-line-highlight" data-line="3"'), html);
    const range = markdown.parse('```python lines=1-2\nx = 1\ny = 2\nz = 3\n```');
    check('lines=1-2 区间高亮两行', (range.match(/code-line-highlight/g) ?? []).length === 2, range);
    const none = markdown.parse('```cpp\nint a;\n```');
    check('无 lines= 不高亮', !none.includes('code-line-highlight'), none);
    check('语言 class 保留', html.includes('class="language-cpp"'), html);
}

console.log('\n=== discussion: quoteReply ===');
{
    const quoted = quoteReply('第一行\n第二行', 'bob');
    assert.equal(quoted, '> 第一行\n> 第二行\n\n@bob ');
    check('多行引用 + @提及', true);
    const noUser = quoteReply('hi');
    assert.equal(noUser, '> hi\n\n');
    check('无用户名不带 @', true);
    const nested = quoteReply('> 已引用\n新行');
    assert.equal(nested, '> > 已引用\n> 新行\n\n');
    check('单层 > 再包一层', true);
    const double = quoteReply('>> 双重引用');
    assert.equal(double, '\n\n');
    check('已双重引用的行被清空（防嵌套爆炸）', true);
    const empty = quoteReply('');
    assert.equal(empty, '> \n\n');
    check('空内容', true);
}

console.log('\n=== discussion: attachOpeningComment ===');
{
    const firstPage: BbsPostDetail = {
        Title: 't',
        Reply: [{ ReplyID: 100, Content: '首楼内容', UserID: 'author', ReplyTime: 1700000000 } as never],
    };
    const detail: BbsPostDetail = { Title: 't', Content: '   ' };
    const filled = attachOpeningComment(detail, firstPage);
    check('空 Content 补齐首楼', filled.Content === '首楼内容', JSON.stringify(filled.Content));
    check('补齐 RootReplyID', filled.RootReplyID === 100, String(filled.RootReplyID));
    check('补齐 UserID', filled.UserID === 'author', String(filled.UserID));
    check('补齐 PostTime', filled.PostTime === 1700000000, String(filled.PostTime));
    check('原对象不被修改', detail.Content === '   ' && detail.RootReplyID === undefined);
}
{
    const firstPage: BbsPostDetail = {
        Title: 't',
        Reply: [{ ReplyID: 7, Content: 'same', UserID: 'author', ReplyTime: 1 } as never],
    };
    const detail: BbsPostDetail = { Title: 't', Content: 'same', UserID: 'me', PostTime: 9 };
    const result = attachOpeningComment(detail, firstPage);
    check('Content 相同则去重并关联 RootReplyID', result.RootReplyID === 7 && result.Content === 'same', JSON.stringify(result));
    check('已有 UserID/PostTime 不被覆盖', result.UserID === 'me' && result.PostTime === 9, JSON.stringify(result));
}
{
    const firstPage: BbsPostDetail = {
        Title: 't',
        Reply: [{ ReplyID: 7, Content: 'open', UserID: 'author', ReplyTime: 1 } as never],
    };
    const detail: BbsPostDetail = { Title: 't', Content: '不同内容' };
    check('Content 不同则原样返回', attachOpeningComment(detail, firstPage) === detail);
    const noReply: BbsPostDetail = { Title: 't', Content: '' };
    check('无 Reply 时原样返回', attachOpeningComment(noReply, noReply) === noReply);
}

console.log('\n=== discussion: canManageDiscussion 权限矩阵 ===');
{
    check('管理员可管理（未锁定）', canManageDiscussion('zhuchenrui2', 'someone') === true);
    check('管理员可管理（锁定帖）', canManageDiscussion('shanwenxiao', 'someone', true) === true);
    check('作者可管理（未锁定）', canManageDiscussion('alice', 'alice') === true);
    check('作者不可管理（锁定帖）', canManageDiscussion('alice', 'alice', true) === false);
    check('非作者非管理员不可', canManageDiscussion('alice', 'bob') === false);
    check('空用户名不可', canManageDiscussion('', 'bob') === false);
    check('isDiscussionAdmin 命中', isDiscussionAdmin('admin') === true);
    check('isDiscussionAdmin 未命中', isDiscussionAdmin('nobody') === false);
}

console.log('\n=== user-color: rating 档位与边界 ===');
{
    check('管理员固定紫色', userColor('zhuchenrui2') === '#a855f7');
    check('管理员大小写不敏感', userColor('Admin') === '#a855f7');
    check('rating 299 -> 灰', userColor('u', 299) === '#78828c');
    check('rating 300 -> 灰', userColor('u', 300) === '#78828c');
    check('rating 400/500 -> 灰', userColor('u', 400) === '#78828c' && userColor('u', 500) === '#78828c');
    check('rating 799/800 边界', userColor('u', 799) === '#78828c' && userColor('u', 800) === '#1798b0');
    check('rating 1199/1200 边界', userColor('u', 1199) === '#1798b0' && userColor('u', 1200) === '#2b9f4f');
    check('rating 1599/1600 边界', userColor('u', 1599) === '#2b9f4f' && userColor('u', 1600) === '#337cf2');
    check('rating 1999/2000 边界', userColor('u', 1999) === '#337cf2' && userColor('u', 2000) === '#e8590c');
    check('rating 2399/2400 边界', userColor('u', 2399) === '#e8590c' && userColor('u', 2400) === '#dc2f5a');
    check('默认 rating=0 -> 灰', userColor('u') === '#78828c');
}

console.log('\n=== format: formatMemory / formatTime / formatRatio ===');
{
    check('formatMemory null/NaN', formatMemory(null) === '—' && formatMemory(Number.NaN) === '—');
    check('formatMemory KB', formatMemory(512) === '512KB');
    check('formatMemory MB', formatMemory(2048) === '2.00MB');
    check('formatMemory GB', formatMemory(2048 * 1024) === '2.00GB');
    check('formatTime null', formatTime(null) === '—');
    check('formatTime ms', formatTime(999) === '999ms');
    check('formatTime s', formatTime(1500) === '1.50s');
    check('formatTime min', formatTime(90000) === '1.50min');
    check('formatRatio null', formatRatio(null, 10) === '—' && formatRatio(1, null) === '—');
    check('formatRatio total=0', formatRatio(0, 0) === '—');
    check('formatRatio 50%', formatRatio(1, 2) === '50.0%');
    check('formatRatio 33.3%', formatRatio(1, 3) === '33.3%');
    check('formatDateTime null', formatDateTime(null) === '—');
    check('formatDateTime 原样返回', formatDateTime('2026-01-01') === '2026-01-01');
}

console.log('\n=== languages: languageId -> Monaco ===');
{
    const expected: [number, string][] = [[0, 'c'], [1, 'cpp'], [2, 'pascal'], [3, 'python'], [4, 'java'], [5, 'csharp'], [6, 'javascript']];
    for (const [id, lang] of expected)
        check(`languageId ${id} -> ${lang}`, judgeLanguageToMonaco(id) === lang);
    check('未知 id 回退 cpp', judgeLanguageToMonaco(99) === 'cpp' && judgeLanguageToMonaco(-1) === 'cpp');
}

console.log('\n=== poller: 启动/停止/计数 ===');
async function waitFor(cond: () => boolean, timeoutMs = 2000): Promise<boolean> {
    const start = Date.now();
    while (!cond()) {
        if (Date.now() - start > timeoutMs)
            return false;
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    return true;
}
{
    let ticks = 0;
    const poller = createPoller({ tick: () => { ticks++; }, shouldContinue: () => true, intervalMs: 10 });
    check('初始未运行', !poller.isRunning());
    poller.start();
    check('start 后运行中', poller.isRunning());
    poller.start();
    check('重复 start 幂等', true);
    assert.ok(await waitFor(() => poller.ticks() >= 3), `ticks=${poller.ticks()}`);
    check('tick 持续递增', poller.ticks() >= 3, `ticks=${poller.ticks()}`);
    poller.stop();
    check('stop 后停止运行', !poller.isRunning());
    const frozen = poller.ticks();
    await new Promise(resolve => setTimeout(resolve, 50));
    check('stop 后不再 tick', poller.ticks() === frozen, `before=${frozen} after=${poller.ticks()}`);
}
{
    let ticks = 0;
    const poller = createPoller({ tick: () => { ticks++; }, shouldContinue: () => false, intervalMs: 10 });
    poller.start();
    await new Promise(resolve => setTimeout(resolve, 40));
    check('shouldContinue=false 自动停止', !poller.isRunning() && ticks === 0, `running=${poller.isRunning()} ticks=${ticks}`);
}
{
    let calls = 0;
    const errors: unknown[] = [];
    const poller = createPoller({
        tick: () => { calls++; throw new Error('boom'); },
        shouldContinue: () => calls < 3,
        intervalMs: 10,
        onError: (error) => { errors.push(error); },
    });
    poller.start();
    assert.ok(await waitFor(() => calls >= 3));
    poller.stop();
    check('异常后 onError 收到错误', errors.length >= 3 && errors.every(e => e instanceof Error && e.message === 'boom'), `errors=${errors.length}`);
    check('异常后仍继续轮询', calls >= 3, `calls=${calls}`);
}
{
    let active = 0;
    let maxActive = 0;
    let ticks = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const poller = createPoller({
        tick: async () => {
            ticks++;
            active++;
            maxActive = Math.max(maxActive, active);
            await gate;
            active--;
        },
        shouldContinue: () => true,
        intervalMs: 10,
    });
    poller.start();
    await new Promise(resolve => setTimeout(resolve, 60));
    check('忙碌时跳过重叠 tick', ticks === 1 && maxActive === 1, `ticks=${ticks} maxActive=${maxActive}`);
    release();
    await new Promise(resolve => setTimeout(resolve, 60));
    poller.stop();
    check('释放后恢复 ticking', ticks >= 2, `ticks=${ticks}`);
}

console.log('\n=== update: checkAppUpdate 三态（mock window.xmoj.app） ===');
{
    interface FetchJsonResult { ok: boolean; status: number; data: unknown; error?: string }
    let currentVersion = '1.1.0';
    let fetchResult: FetchJsonResult = { ok: true, status: 200, data: null };
    const requested: string[] = [];
    (globalThis as Record<string, unknown>).window = {
        xmoj: {
            app: {
                version: async () => currentVersion,
                fetchJson: async (url: string) => { requested.push(url); return fetchResult; },
            },
        },
    };
    const checkAppUpdate = async () => {
        const mod = await import('../src/services/update.ts');
        return mod.checkAppUpdate();
    };
    const manifest = {
        UpdateHistory: {
            '1.0.0': { UpdateDate: 1690000000, Prerelease: false, UpdateContents: [{ PR: 1, Description: '初始' }], Notes: 'n1' },
            '1.1.1': { UpdateDate: 1700000000, Prerelease: false, UpdateContents: [{ PR: 7, Description: '修复' }], Notes: 'n2' },
        },
    };

    currentVersion = '1.1.0';
    fetchResult = { ok: true, status: 200, data: manifest };
    let result = await checkAppUpdate();
    check('1.1.0 vs 1.1.1 -> available', result.status === 'available', result.status);
    check('latest 为 1.1.1', result.latest === '1.1.1', result.latest);
    check('entries 含最新版本条目', result.entries.some(e => e.version === '1.1.1' && e.items[0]?.title === '#7' && e.items[0]?.description === '修复'), JSON.stringify(result.entries));
    check('请求 Update.json', requested.length === 1 && requested[0]!.endsWith('/Update.json'), JSON.stringify(requested));

    currentVersion = '1.10.0';
    fetchResult = { ok: true, status: 200, data: { UpdateHistory: { '1.9.9': { Prerelease: false } } } };
    result = await checkAppUpdate();
    check('1.10.0 vs 1.9.9 -> current（数值比较非字典序）', result.status === 'current', result.status);
    check('latest 为 1.9.9', result.latest === '1.9.9', result.latest);

    currentVersion = '1.1.1';
    fetchResult = { ok: true, status: 200, data: manifest };
    result = await checkAppUpdate();
    check('版本相等 -> current', result.status === 'current', result.status);

    currentVersion = '2.0.0';
    result = await checkAppUpdate();
    check('当前更新 -> current', result.status === 'current', result.status);

    fetchResult = { ok: false, status: 500, data: null, error: 'HTTP 500' };
    result = await checkAppUpdate();
    check('请求失败 -> unknown', result.status === 'unknown', result.status);
    check('unknown 带 message', result.message === 'HTTP 500', result.message);
    check('unknown 无 latest/entries', result.latest === null && result.entries.length === 0, JSON.stringify(result));

    fetchResult = { ok: true, status: 200, data: {} };
    result = await checkAppUpdate();
    check('空历史 -> unknown', result.status === 'unknown', result.status);

    fetchResult = { ok: true, status: 200, data: { UpdateHistory: { '2.0.0': { Prerelease: true }, '1.5.0': { Prerelease: false } } } };
    currentVersion = '1.5.0';
    result = await checkAppUpdate();
    check('最新为预览版时 latest 取最新正式版', result.latest === '1.5.0' && result.status === 'current', JSON.stringify({ latest: result.latest, status: result.status }));
    check('entries 同时包含正式版与预览版', result.entries.length === 2 && result.entries.some(e => e.version === '2.0.0' && e.prerelease), JSON.stringify(result.entries));

    fetchResult = { ok: true, status: 200, data: { UpdateHistory: { '2.0.0': { Prerelease: true } } } };
    result = await checkAppUpdate();
    check('全是预览版 -> unknown', result.status === 'unknown', result.status);
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
