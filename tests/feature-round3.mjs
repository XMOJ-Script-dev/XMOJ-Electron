import { app, BrowserWindow, dialog, shell } from 'electron';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const opened = [];
const originalOpen = shell.openExternal;
const originalSave = dialog.showSaveDialog;
const archivePath = path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode', `round3-ac-${Date.now()}.zip`);
shell.openExternal = async url => { opened.push(url); };
app.whenReady().then(async () => {
    try {
        await import('../dist-electron/main.js');
        let win;
        for (let i = 0; i < 100 && !win; i++) { [win] = BrowserWindow.getAllWindows(); if (!win) await pause(50); }
        assert.ok(win);
        if (win.webContents.isLoading()) await new Promise(resolve => win.webContents.once('did-finish-load', resolve));
        const run = script => win.webContents.executeJavaScript(script);
        const until = async (script, label) => {
            for (let i = 0; i < 300; i++) { if (await run(script)) return; await pause(200); }
            throw new Error(`Timed out: ${label}`);
        };
        await until(`!!document.querySelector('h1') && !document.body.textContent.includes('正在恢复登录状态')`, 'home');
        await until(`document.querySelectorAll('[data-slot="promo-banner"]').length > 0`, 'recommendations');
        assert.ok(await run(`Array.from(document.querySelectorAll('[data-slot="promo-banner"]')).every(a=>a.tagName==='A' && /^https?:/.test(a.href))`));
        await until(`!!document.querySelector('.service-notice .badge')`, 'service status badge');
        const badge = await run(`getComputedStyle(document.querySelector('.service-notice .badge')).backgroundColor`);
        assert.equal(badge, 'rgb(64, 136, 91)');
        assert.ok(await run(`Array.from(document.querySelectorAll('article .announcement-body ul')).length > 0`), 'announcement markdown lists render');
        await run(`(() => { const a=document.createElement('a'); a.href='https://example.com/round3'; document.body.append(a); a.click(); a.remove(); window.open('https://example.com/round3-popup'); })()`);
        for (let i = 0; i < 100 && opened.length < 2; i++) await pause(50);
        assert.ok(opened.includes('https://example.com/round3'));
        assert.ok(opened.includes('https://example.com/round3-popup'));
        assert.equal(BrowserWindow.getAllWindows().length, 1, 'external URLs do not create in-app windows');
        console.log('PASS: announcement Markdown, service badge, recommendation hrefs and default-browser routing');
        const fields = Object.fromEntries(readFileSync(new URL('./account.txt', import.meta.url), 'utf8').split(/\r?\n/).flatMap(line => { const match=line.match(/^\s*(\w+)\s*[:=]\s*(.+?)\s*$/); return match ? [[match[1].toLowerCase(),match[2]]] : []; }));
        const login = await run(`window.xmoj.session.login(${JSON.stringify({ username: fields.username, password: fields.password, remember: false })})`);
        assert.ok(login.ok);
        await new Promise(resolve => { win.webContents.once('did-finish-load', resolve); win.webContents.reload(); });
        await until(`!!document.querySelector('h1') && !document.body.textContent.includes('正在恢复登录状态')`, 'signed-in home');
        const listing = await run(`window.xmoj.bbs.posts({},false)`);
        assert.ok(listing.Success);
        const post = listing.Data.Posts.find(post=>!post.Lock?.Locked) ?? listing.Data.Posts[0];
        const detail = await run(`window.xmoj.bbs.post(${post.PostID},1,false)`);
        assert.ok(detail.Success);
        await run(`(() => { const a=document.createElement('a'); a.href='https://www.xmoj.tech/discuss3/thread.php?tid=${post.PostID}'; document.body.append(a); a.click(); a.remove(); })()`);
        await until(`!!document.querySelector('[data-slot="discussion-post"]')`, 'discussion body');
        assert.equal(await run(`document.querySelector('[data-slot="discussion-post"] h2').textContent`), detail.Data.Title);
        if (detail.Data.Content?.trim()) assert.ok(await run(`!!document.querySelector('[data-slot="discussion-post"] .announcement-body').textContent.trim()`));
        assert.equal(await run(`document.querySelectorAll('[data-slot="discussion-comment"]').length`), detail.Data.Reply.filter(reply=>reply.ReplyID!==detail.Data.RootReplyID).length);
        const markdown = '> 引用内容\n\n**正文** $x_1$\n\n| A | B |\n| --- | --- |\n| 1 | 2 |';
        await run(`(() => { const textarea=document.querySelector('[data-slot="markdown-composer"] textarea'); textarea.value=${JSON.stringify(markdown)}; textarea.dispatchEvent(new Event('input',{bubbles:true})); })()`);
        await until(`!!document.querySelector('[data-slot="markdown-preview"] blockquote') && !!document.querySelector('[data-slot="markdown-preview"] table') && !!document.querySelector('[data-slot="markdown-preview"] .katex')`, 'live Markdown preview');
        assert.ok(await run(`(() => {const form=document.querySelector('[data-slot="markdown-composer"]').closest('form'); return form.querySelector('button[type="submit"]').disabled && !!form.querySelector('[data-slot="cloudflare-verification"]');})()`));
        assert.ok(await run(`document.querySelector('[data-slot="markdown-composer"] textarea').getBoundingClientRect().x < document.querySelector('[data-slot="markdown-preview"]').getBoundingClientRect().x`));
        console.log('PASS: unchanged thread title, opening comment in body, quote/table/math preview and captcha-gated submission (no posts sent)');
        await run(`Array.from(document.querySelectorAll('[data-slot="discussion-post"] button')).find(button=>button.textContent.trim()==='回复').click()`);
        await until(`document.querySelector('[data-slot="markdown-composer"] textarea').value.includes('> ') && document.activeElement === document.querySelector('[data-slot="markdown-composer"] textarea')`, 'quoted reply and editor focus');
        if (['zhuchenrui2','shanwenxiao','chenlangning','liushangchen','admin'].includes(fields.username)) {
            assert.ok(await run(`Array.from(document.querySelectorAll('[data-slot="discussion-post"] button')).some(button=>button.textContent.includes('删除讨论'))`));
            if (detail.Data.RootReplyID) {
                await run(`Array.from(document.querySelectorAll('[data-slot="discussion-post"] button')).find(button=>button.textContent.trim()==='编辑').click()`);
                await until(`!!document.querySelector('textarea[aria-label="编辑 Markdown"]')`, 'edit form');
                await run(`Array.from(document.querySelectorAll('form button')).find(button=>button.textContent.trim()==='取消').click()`);
            }
        }
        console.log('PASS: quoted reply focuses composer; script-admin controls and edit/cancel UI (no mutations sent)');
        const profile = await run(`window.xmoj.user.profile(${JSON.stringify(fields.username)},false)`);
        await run(`document.querySelector('[data-slot="sidebar-footer"] [data-sidebar="menu-button"]').click()`);
        await until(`Array.from(document.querySelectorAll('[role="menuitem"]')).some(item=>item.textContent.includes('导出 AC 代码'))`, 'export menu');
        await run(`Array.from(document.querySelectorAll('[role="menuitem"]')).find(item=>item.textContent.includes('导出 AC 代码')).click()`);
        await until(`document.body.textContent.includes('将导出 ${profile.problems.length} 题')`, 'complete solved-problem export list');
        const status = await run(`window.xmoj.status.list({user:${JSON.stringify(fields.username)},result:'4'})`);
        const problemId = status.submissions.find(submission=>submission.verdict==='accepted'&&submission.problemId)?.problemId ?? profile.problems.at(-1)?.id;
        assert.ok(Number.isFinite(problemId));
        await run(`(() => {const input=document.querySelector('main input');input.value='${problemId}';input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
        await until(`Array.from(document.querySelectorAll('main button')).some(button=>!button.disabled && button.textContent.replace(/\\s/g,'')==='导出1题')`, 'single-problem export filter');
        let saveCalls = 0;
        dialog.showSaveDialog = async () => { saveCalls++; return { canceled: false, filePath: archivePath }; };
        await run(`Array.from(document.querySelectorAll('main button')).find(button=>button.textContent.replace(/\\s/g,'')==='导出1题').click()`);
        for (let i = 0; i < 100 && !saveCalls; i++) await pause(20);
        assert.equal(saveCalls, 1, 'UI invokes save dialog');
        try { await until(`/已导出\\s*1\\s*份代码/.test(document.querySelector('main').textContent)`, 'real AC archive'); }
        catch (error) { console.log(await run(`document.querySelector('main').textContent`)); throw error; }
        const files = unzipSync(readFileSync(archivePath));
        assert.equal(Object.keys(files).length, 1);
        assert.ok(Object.keys(files)[0].startsWith(`${problemId}.`));
        assert.ok(strFromU8(Object.values(files)[0]).trim().length > 0);
        assert.ok(!strFromU8(Object.values(files)[0]).includes('<!-- not-cached -->'));
        console.log(`PASS: all ${profile.problems.length} solved problems available and a real one-problem ZIP exported successfully`);
        await run(`window.xmoj.problemset.list({page:2}, false)`);
        const first = await run(`window.xmoj.problemset.list({page:1}, false)`);
        const all = await run(`window.xmoj.problemset.all(false)`);
        assert.deepEqual(all.problems.slice(0, first.value.problems.length).map(p=>p.id), first.value.problems.map(p=>p.id));
        assert.equal(new Set(all.problems.map(p=>p.id)).size, all.problems.length);
        console.log('PASS: explicit first page is restored after page 2; full problemset starts with that page and has no duplicates');
        dialog.showSaveDialog = originalSave; shell.openExternal = originalOpen;
        unlinkSync(archivePath); app.exit(0);
    } catch (error) {
        console.error(error);
        dialog.showSaveDialog = originalSave; shell.openExternal = originalOpen;
        if (existsSync(archivePath)) unlinkSync(archivePath);
        app.exit(1);
    }
});
