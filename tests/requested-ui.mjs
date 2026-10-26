import { app, BrowserWindow, Menu, clipboard } from 'electron';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
app.whenReady().then(async () => {
    try {
        await import('../dist-electron/main.js');
        let win;
        for (let i = 0; i < 100 && !win; i++) { [win] = BrowserWindow.getAllWindows(); if (!win) await pause(50); }
        assert.ok(win);
        if (win.webContents.isLoading()) await new Promise(resolve => win.webContents.once('did-finish-load', resolve));
        win.webContents.on('console-message', event => { if (event.level === 'error') console.error('Renderer:', event.message); });
        const run = async script => {
            try { return await win.webContents.executeJavaScript(script); }
            catch (error) { throw new Error(`Renderer step failed: ${script.includes('session.login') ? '<login redacted>' : script.slice(0, 160)}`, { cause: error }); }
        };
        const until = async (script, label) => {
            for (let i = 0; i < 300; i++) { if (await run(script)) return; await pause(200); }
            const state = await run(`({ heading: document.querySelector('h1')?.textContent, content: document.querySelector('main')?.textContent.slice(0, 400), dialog: !!document.querySelector('[data-slot="dialog-content"]') })`);
            throw new Error(`Timed out: ${label}; ${JSON.stringify(state)}`);
        };
        await until(`!!document.querySelector('[data-slot="sidebar-menu-button"]') && !document.body.textContent.includes('正在恢复登录状态')`, 'home');
        assert.equal(Menu.getApplicationMenu(), null);
        await run(`localStorage.removeItem('xmoj-sidebar-pinned'); document.querySelector('[data-slot="sidebar-hover-rail"]').dispatchEvent(new MouseEvent('mouseenter'))`);
        await until(`!!document.querySelector('button[title="常驻侧栏"]')`, 'pin button');
        await run(`document.querySelector('button[title="常驻侧栏"]').click()`);
        await pause(100);
        await run(`document.querySelector('[data-slot="sidebar"] [ref]')?.dispatchEvent(new MouseEvent('mouseleave')); document.body.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true}));`);
        assert.equal(await run(`document.querySelector('[data-slot="sidebar"][data-state]').dataset.state`), 'expanded');
        await run(`document.querySelector('button[title="取消常驻"]').click(); document.body.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true}));`);
        await pause(200);
        assert.equal(await run(`document.querySelector('[data-slot="sidebar"][data-state]').dataset.state`), 'collapsed');
        await run(`document.querySelector('[data-slot="sidebar-hover-rail"]').dispatchEvent(new MouseEvent('mouseenter'));`);
        await pause(150);
        await run(`(() => { document.dispatchEvent(new MouseEvent('mousemove', {clientX:800,clientY:300,bubbles:true})); const panel=Array.from(document.querySelectorAll('[data-slot="sidebar"][data-state] > div')).find(n=>getComputedStyle(n).position==='fixed'); panel.dispatchEvent(new MouseEvent('mouseleave',{clientX:800,clientY:300})); })()`);
        await pause(250);
        assert.equal(await run(`document.querySelector('[data-slot="sidebar"][data-state]').dataset.state`), 'collapsed');
        await run(`document.querySelector('[data-slot="sidebar-hover-rail"]').dispatchEvent(new MouseEvent('mouseenter'));`);
        await pause(150);
        await run(`(() => { const panel=Array.from(document.querySelectorAll('[data-slot="sidebar"][data-state] > div')).find(n=>getComputedStyle(n).position==='fixed'); const right=panel.getBoundingClientRect().right; document.dispatchEvent(new MouseEvent('mousemove',{clientX:right-0.1,clientY:300,bubbles:true})); panel.dispatchEvent(new MouseEvent('mouseleave',{clientX:right,clientY:300})); document.dispatchEvent(new MouseEvent('mousemove',{clientX:right+0.1,clientY:300,bubbles:true})); })()`);
        await pause(250);
        assert.equal(await run(`document.querySelector('[data-slot="sidebar"][data-state]').dataset.state`), 'collapsed', 'slow boundary crossing collapses sidebar without clicking');
        console.log('PASS: hidden menu, sidebar persistent mode and collapse');
        const progress = { id: 'ui-progress-test', fileName: '保存名.zip', receivedBytes: 25, totalBytes: 100, state: 'progressing' };
        win.webContents.send('xmoj:download-progress', progress);
        await until(`!!document.querySelector('[data-slot="download-progress"]')`, 'download progress toast');
        const toast = await run(`(() => { const card=document.querySelector('[data-slot="download-progress"]'); return {text:card.textContent.trim(), color:getComputedStyle(card).color, background:getComputedStyle(card).backgroundColor, progress:card.getAttribute('aria-valuenow'), buttons:card.querySelectorAll('button').length, width:card.firstElementChild.style.width}; })()`);
        assert.deepEqual(toast, { text: '正在下载：保存名.zip', color: 'rgb(0, 0, 0)', background: 'rgb(255, 255, 255)', progress: '25', buttons: 0, width: '25%' });
        win.webContents.send('xmoj:download-progress', { ...progress, receivedBytes: 100, state: 'completed' });
        await until(`!document.querySelector('[data-slot="download-progress"]')`, 'completed download disappears');
        console.log('PASS: white download toast uses entire card as progress fill and has no close button');
        const fields = Object.fromEntries(readFileSync(new URL('./account.txt', import.meta.url), 'utf8').split(/\r?\n/).flatMap(line => { const m = line.match(/^\s*(\w+)\s*[:=]\s*(.+?)\s*$/); return m ? [[m[1].toLowerCase(), m[2]]] : []; }));
        const result = await run(`window.xmoj.session.login(${JSON.stringify({ username: fields.username, password: fields.password, remember: false })})`);
        assert.ok(result.ok, 'login');
        await new Promise(resolve => { win.webContents.once('did-finish-load', resolve); win.webContents.reload(); });
        await until(`!!document.querySelector('h1') && !document.body.textContent.includes('正在恢复登录状态')`, 'restored login');
        const boards = await run(`window.xmoj.bbs.boards(false)`);
        assert.ok(boards.Success, 'community requests succeed through the Electron network transport');
        assert.ok(Array.isArray(await run(`window.xmoj.notices.poll()`)));
        console.log('PASS: live community requests and independent notice polling');
        await run(`(() => { const p = document.createElement('p'); p.id='test-mention'; p.textContent='@liushangchen 你好'; document.body.append(p); })()`);
        await until(`!!document.querySelector('#test-mention a')`, 'mention highlighting');
        await run(`document.querySelector('#test-mention a').click(); document.querySelector('#test-mention').remove();`);
        await until(`!!document.querySelector('[data-slot="dialog-content"] [data-slot="chart"] svg')`, 'profile charts');
        assert.ok(await run(`document.querySelector('[data-slot="dialog-content"]').textContent.includes('Rating')`));
        assert.ok(await run(`document.querySelector('[data-slot="dialog-content"]').textContent.includes('判题结果分布')`));
        await run(`document.querySelector('[data-slot="dialog-close"]').click()`);
        await until(`!document.querySelector('[data-slot="dialog-content"]')`, 'close profile');
        console.log('PASS: user profile rating, charts and close control');
        await run(`Array.from(document.querySelectorAll('[data-sidebar="menu-button"]')).find(b=>b.textContent.trim()==='状态').click()`);
        await until(`!!document.querySelector('tbody tr')`, 'status rows');
        await run(`document.querySelector('tbody tr').click()`);
        await until(`!!document.querySelector('[data-slot="dialog-content"] .monaco-editor') && document.querySelector('[data-slot="dialog-content"]').textContent.includes('ms ·')`, 'judge details and Monaco');
        assert.ok(!await run(`document.querySelector('[data-slot="dialog-content"]').textContent.includes('not-cached')`));
        await run(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
        await until(`!document.querySelector('[data-slot="dialog-content"]')`, 'escape closes panel');
        console.log('PASS: judge test details, Monaco and Escape dismissal');
        await run(`(() => { const a=document.createElement('a'); a.href='https://www.xmoj.tech/problem.php?id=11959'; document.body.append(a); a.click(); a.remove(); })()`);
        await until(`document.querySelector('h1')?.textContent.includes('梦境迷宫') && !!document.querySelector('.announcement-body .katex')`, '11959 rendering');
        const loadProblem = async id => {
            await run(`(() => {const input=document.querySelector('#problem-view-id'); input.value='${id}'; input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
            await run(`document.querySelector('#problem-view-id').focus()`);
            win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' });
            win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Enter' });
        };
        await loadProblem(9275);
        assert.ok(await run(`document.querySelector('h1').textContent.includes('梦境迷宫') && !document.querySelector('[data-slot="skeleton"]')`), 'previous statement retained while loading');
        await until(`document.querySelector('h1')?.textContent.includes('超速检测') && !document.querySelector('button[disabled] .animate-spin')`, '9275 rendering');
        assert.equal(await run(`document.querySelectorAll('.katex-error').length`), 0);
        const previousClipboard = clipboard.readText();
        try {
            await run(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='复制完整题面').click()`);
            await until(`document.body.textContent.includes('已复制')`, 'Markdown copied');
            const markdown = clipboard.readText();
            assert.ok(markdown.includes('## 题目描述') && markdown.includes('```') && markdown.includes('$L$'));
            assert.ok(!/^\t/m.test(markdown.replace(/```[\s\S]*?```/g, '')));
            assert.ok(!/^[ \t]+[\u4e00-\u9fffA-Za-z]/m.test(markdown.replace(/```[\s\S]*?```/g, '')), 'prose paragraphs have no leading spaces');
            assert.ok(!/\n{3,}/.test(markdown.replace(/```[\s\S]*?```/g, '')));
        } finally { clipboard.writeText(previousClipboard); }
        const download = new Promise(resolve => win.webContents.session.once('will-download', (event, item) => { const url = item.getURL(); event.preventDefault(); resolve(url); }));
        await run(`document.querySelector('a[href*="/upload/file/"]').click()`);
        const downloadedUrl = await Promise.race([download, new Promise((_, reject) => setTimeout(() => reject(new Error('Download did not start')), 30000))]);
        assert.ok(downloadedUrl.includes('/upload/file/'));
        console.log('PASS: upload/file link starts a native download (intercepted without saving)');
        await loadProblem(99999999);
        await until(`document.body.textContent.includes('题目不可用')`, 'unavailable statement error');
        assert.ok(await run(`document.querySelector('h1').textContent.includes('超速检测')`), 'unavailable problem leaves prior statement intact');
        console.log('PASS: 11959/9275 rendering, Markdown copy and stale statement retention');
        await run(`window.xmoj.app.setConfirmLeave(true)`);
        win.close();
        await until(`!!document.querySelector('[data-slot="dialog-content"]') && document.body.textContent.includes('离开前确认')`, 'shadcn quit dialog');
        await run(`document.querySelector('[data-slot="dialog-close"]').click()`);
        await until(`!document.querySelector('[data-slot="dialog-content"]')`, 'cancel quit');
        console.log('PASS: centered MessageBox with close control');
        win.close();
        await until(`!!document.querySelector('[data-slot="dialog-content"]')`, 'second quit dialog');
        win.webContents.sendInputEvent({ type: 'mouseDown', x: 10, y: 10, button: 'left', clickCount: 1 });
        win.webContents.sendInputEvent({ type: 'mouseUp', x: 10, y: 10, button: 'left', clickCount: 1 });
        await until(`!document.querySelector('[data-slot="dialog-content"]')`, 'backdrop dismissal');
        console.log('PASS: clicking dark backdrop dismisses MessageBox');
        app.exit(0);
    } catch (error) { console.error(error); app.exit(1); }
});
