// IPC 契约一致性测试：静态校验 types.ts / main.ts / preload.ts / api.ts 四端的
// IPC 通道名与 window.xmoj.* 方法路径一致，防住「接线」类改动的拼错/漏注册回归。
// 纯静态分析（读源码 + 正则），不运行 electron、不联网。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8');

const typesSrc = read('src/shared/types.ts');
const mainSrc = read('electron/main.ts');
const preloadSrc = read('electron/preload.ts');
const apiSrc = read('src/services/api.ts');

let failures = 0;
let passes = 0;
// 历史例外白名单（显式列出并说明原因）：
// - popupBlocked：preload 保留了 onPopupBlocked 监听与 IPC.popupBlocked 常量，但当前
//   main.ts 没有任何 .send(IPC.popupBlocked) 发送点（弹窗拦截提示从未接线，属遗留）。
//   若未来接线，应从白名单移除并让断言恢复严格。
const WHITELIST_MAIN_SEND: string[] = ['popupBlocked'];
const WHITELIST_PRELOAD_UNUSED: string[] = [];

function check(label: string, condition: boolean, detail = '') {
    if (condition) passes++;
    else failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}

// ---------- 解析 IPC 常量表 ----------
const ipcBlockMatch = typesSrc.match(/export const IPC = \{([\s\S]*?)\} as const;/);
check('types.ts 中存在 IPC 常量表（export const IPC = {...} as const）', !!ipcBlockMatch);
const ipcTable = new Map<string, string>();
if (ipcBlockMatch) {
    const re = /^\s*(\w+):\s*'([^']+)',?\s*$/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(ipcBlockMatch[1]))) ipcTable.set(m[1], m[2]);
}
check('IPC 常量表非空', ipcTable.size > 0, `${ipcTable.size} 个通道`);
const channelByKey = (key: string) => ipcTable.get(key);
// 通道字符串值不得重复（两个 key 指同一通道会造成混淆）
const seenChannels = new Map<string, string>();
for (const [key, channel] of ipcTable) {
    if (seenChannels.has(channel))
        check(`通道值唯一: ${key} vs ${seenChannels.get(channel)} -> ${channel}`, false);
    else
        seenChannels.set(channel, key);
}
check('IPC 常量表通道值无重复', seenChannels.size === ipcTable.size,
    `${seenChannels.size}/${ipcTable.size}`);

// ---------- 解析 preload 用法 ----------
function collect(src: string, re: RegExp): Set<string> {
    const out = new Set<string>();
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    while ((m = r.exec(src))) out.add(m[1]);
    return out;
}
// 泛型参数可含一层嵌套与内联 import('...').Type（含圆括号）：
// <(?:[^<>]|<[^<>]*>)*> 匹配一层嵌套泛型。
const preloadInvokes = collect(preloadSrc, /invoke(?:<(?:[^<>]|<[^<>]*>)*>)?\(\s*IPC\.(\w+)/g);
const preloadOns = collect(preloadSrc, /ipcRenderer\.on\(\s*IPC\.(\w+)/g);
const preloadSends = collect(preloadSrc, /ipcRenderer\.send\(\s*IPC\.(\w+)/g);

// ---------- 解析 main 注册/发送 ----------
const mainHandles = collect(mainSrc, /handle(?:<(?:[^<>]|<[^<>]*>)*>)?\(\s*IPC\.(\w+)/g);
const mainOns = collect(mainSrc, /ipcMain\.on\(\s*IPC\.(\w+)/g);
const mainSends = collect(mainSrc, /\.send\(\s*IPC\.(\w+)/g);
// main.ts 中有循环注册：for (const [channel, action] of [[IPC.bbsDeletePost, ...], ...]) { handle(channel, ...) }
const LOOP_HANDLE_CHANNELS = ['bbsDeletePost', 'bbsDeleteReply', 'bbsEditReply'] as const;
const loopRegistered = new Set<string>();
{
    const hasLoop = /for \(const \[channel, action\] of \[/.test(mainSrc) && /handle\(channel,/.test(mainSrc);
    for (const key of LOOP_HANDLE_CHANNELS) {
        if (hasLoop && new RegExp(`\\[\\s*IPC\\.${key}\\s*,`).test(mainSrc)) loopRegistered.add(key);
    }
}
const mainRegistered = new Set([...mainHandles, ...loopRegistered]);

// ---------- ① 正向：types.ts 每个通道在 main + preload 都有对应端 ----------
console.log('\n=== ① 正向：IPC 常量表 -> main handler + preload 暴露 ===');
for (const [key, channel] of ipcTable) {
    const invoked = preloadInvokes.has(key);
    const listened = preloadOns.has(key);
    const sentFromRenderer = preloadSends.has(key);
    const usedInPreload = invoked || listened || sentFromRenderer;
    check(`preload 使用 IPC.${key} (${channel})`,
        usedInPreload || WHITELIST_PRELOAD_UNUSED.includes(key),
        usedInPreload ? '' : 'preload 中无 invoke/on/send 引用');
    if (invoked) {
        check(`main 注册 handler: IPC.${key} (${channel})`, mainRegistered.has(key));
        check(`preload IPC.${key} 仅走 invoke（方向一致）`, !listened && !sentFromRenderer);
    }
    if (listened) {
        // 主 -> 渲染事件：main 必须 .send，或列入历史例外白名单
        check(`main 发送事件: IPC.${key} (${channel})`, mainSends.has(key) || WHITELIST_MAIN_SEND.includes(key),
            mainSends.has(key) ? '' : 'main.ts 中无 .send');
    }
    if (sentFromRenderer) {
        check(`main 接收 send: IPC.${key} (${channel})`, mainOns.has(key));
    }
}

// ---------- ② 反向：preload 中每个 IPC.x 引用都必须存在于 types.ts 常量表 ----------
console.log('\n=== ② 反向：preload IPC 引用 -> types.ts 常量表 ===');
for (const key of [...preloadInvokes, ...preloadOns, ...preloadSends]) {
    check(`types.ts 常量表存在 IPC.${key} (通道 ${channelByKey(key) ?? '缺失'})`, ipcTable.has(key));
}

// ---------- ③ api.ts 的 window.xmoj.* 调用点必须存在于 preload 暴露结构 ----------
console.log('\n=== ③ api.ts window.xmoj.* -> preload 暴露结构 ===');
// 解析 preload api 对象：组在 4 空格缩进，方法在 8 空格缩进
const apiBody = preloadSrc.match(/const api = \{([\s\S]*?)\n\} as const;/);
check('preload.ts 中存在 api 对象（const api = {...} as const）', !!apiBody);
const exposedPaths = new Set<string>();
if (apiBody) {
    let currentGroup: string | null = null;
    for (const line of apiBody[1].split('\n')) {
        // 组声明有两种形态：'    name: {' 和 '    }, name: {'（同行闭合上一组）
        const group = line.match(/^ {4}(?:\}, )?(\w+): \{/);
        if (group) { currentGroup = group[1]; continue; }
        const method = line.match(/^ {8}(\w+):/);
        if (method && currentGroup) exposedPaths.add(`${currentGroup}.${method[1]}`);
    }
}
check('preload api 结构解析出方法', exposedPaths.size > 0, `${exposedPaths.size} 个路径`);
const apiCalls = new Map<string, number>();
{
    const re = /window\.xmoj\.(\w+)\.(\w+)\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(apiSrc))) {
        const p = `${m[1]}.${m[2]}`;
        apiCalls.set(p, (apiCalls.get(p) ?? 0) + 1);
    }
}
check('api.ts 中存在 window.xmoj.* 调用点', apiCalls.size > 0, `${apiCalls.size} 个路径`);
for (const [p, count] of apiCalls) {
    check(`api.ts window.xmoj.${p} 在 preload 中暴露`, exposedPaths.has(p), `${count} 处调用`);
}

// ---------- ④ 新增通道专项：read-mention 三端一致性 ----------
console.log('\n=== ④ read-mention 通道三端一致性专项 ===');
const MENTION_PAIRS: { channel: string; key: string; bridgePath: string }[] = [
    { channel: 'xmoj:bbs:read-mention', key: 'bbsReadMention', bridgePath: 'bbs.readMention' },
    { channel: 'xmoj:mail:read-mention', key: 'mailReadMention', bridgePath: 'mail.readMention' },
];
for (const { channel, key, bridgePath } of MENTION_PAIRS) {
    const constantOk = channelByKey(key) === channel;
    check(`types.ts 常量 ${key} === '${channel}'`, constantOk, String(channelByKey(key)));
    if (!constantOk) continue;
    check(`preload 经 invoke 使用 IPC.${key}`, preloadInvokes.has(key));
    check(`main 注册 handler IPC.${key}`, mainRegistered.has(key));
    check(`api.ts 调用 window.xmoj.${bridgePath}`, apiCalls.has(bridgePath));
    check(`preload 暴露结构含 ${bridgePath}`, exposedPaths.has(bridgePath));
    // main handler 体必须做 mentionId 校验且调用 community 读标记
    const handlerIdx = mainSrc.indexOf(`IPC.${key}`);
    const handlerBody = mainSrc.slice(handlerIdx, handlerIdx + 500);
    check(`main IPC.${key} handler 校验 mentionId`, /mentionId/.test(handlerBody) && /isSafeInteger/.test(handlerBody));
}

// ---------- 汇总 ----------
console.log(`\nIPC 常量: ${ipcTable.size} | preload invoke/on/send: ${preloadInvokes.size}/${preloadOns.size}/${preloadSends.size} | main handle/on/send: ${mainRegistered.size}/${mainOns.size}/${mainSends.size} | api 路径: ${apiCalls.size}`);
console.log(`\n结果: ${passes} PASS, ${failures} FAIL`);
process.exit(failures ? 1 : 0);
