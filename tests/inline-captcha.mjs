import { app, BrowserWindow, WebContentsView, session, ipcMain, net, shell } from 'electron';
import { mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const temp = process.platform === 'win32' && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode') : app.getPath('temp');
app.setPath('userData', mkdtempSync(path.join(temp, 'inline-captcha-')));
app.whenReady().then(async () => {
    try {
        const openedLinks = [];
        shell.openExternal = async url => { openedLinks.push(url); };
        const captchaActions = [];
        const originalHandle = ipcMain.handle.bind(ipcMain);
        ipcMain.handle = (channel, listener) => originalHandle(channel, channel === 'xmoj:bbs:captcha' ? (event, request) => {
            if (request.action !== 'bounds') captchaActions.push(request.action);
            return listener(event, request);
        } : listener);
        const fields = { username: 'fixture-user', password: 'fixture-password' };
        let signedIn = false;
        globalThis.fetch = async value => {
            const url = new URL(String(value));
            if (url.pathname === '/login.php') { signedIn = true; return new Response('', { headers: { 'set-cookie': 'PHPSESSID=fixture-session; Path=/; Secure' } }); }
            if (url.pathname === '/loginpage.php') return new Response(signedIn ? '<a href=logout.php>Please logout First!</a>' : '<form id="login"></form>');
            if (url.pathname === '/index.php') return new Response(`<span id="profile">${signedIn ? fields.username : 'Login'}</span>`);
            if (url.pathname === '/api/nav') return Response.json({ loggedIn: signedIn, userId: fields.username, nick: '', serverTime: '', lang: 'zh', isAdmin: false });
            return new Response('');
        };
        net.fetch = async () => Response.json({ Success: true, Data: { Token: 'fixture-token', Notice: '', Count: 0, Boards: [], Posts: [] } });
        let synchronousSuccess = false;
        await session.fromPartition('xmoj-turnstile').protocol.handle('https', request => {
            if (new URL(request.url).pathname === '/slow.png') return new Promise(() => {});
            if (new URL(request.url).hostname === 'challenges.cloudflare.com') return new Response(`window.turnstile = {
                render: (selector, options) => {
                    window.__testOptions = { ...options,
                        callback: token => { window.__testToken=token;options.callback(token); },
                        'error-callback': () => {window.__testToken='';options['error-callback']();},
                        'expired-callback': () => {window.__testToken='';options['expired-callback']();}
                    };
                    document.querySelector(selector).textContent = 'Mock verification widget';
                    ${synchronousSuccess ? "window.__testOptions.callback('fixture-sync-token');" : ''}
                    return 'mock-widget';
                },
                getResponse: () => window.__testToken || '',
                reset: () => { window.__testToken='';window.__testResets = (window.__testResets || 0) + 1; }
            };`, { headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } });
            return new Response('<!doctype html><html><head></head><body>Fixture only<img src="/slow.png"></body></html>', { headers: { 'content-type': 'text/html', 'cache-control': 'no-store' } });
        });
        await import('../dist-electron/main.js');
        let win;
        for (let i = 0; i < 100 && !win; i++) { [win] = BrowserWindow.getAllWindows(); if (!win) await pause(50); }
        assert.ok(win);
        if (win.webContents.isLoading()) await new Promise(resolve => win.webContents.once('did-finish-load', resolve));
        const run = code => win.webContents.executeJavaScript(code).catch(error => { console.error('Renderer test script failed:', code); throw error; });
        const until = async (predicate, label) => {
            for (let i = 0; i < 300; i++) { if (await predicate()) return; await pause(50); }
            throw new Error(`Timed out: ${label}`);
        };
        await until(() => run(`!!document.querySelector('h1') && !document.body.textContent.includes('正在恢复登录状态')`), 'home');
        const login = await run(`window.xmoj.session.login(${JSON.stringify({ username: fields.username, password: fields.password, remember: false })})`);
        assert.ok(login.ok, login.message || 'Read-only test login failed');
        ipcMain.removeHandler('xmoj:user:info');
        ipcMain.handle('xmoj:user:info', (_event, { username }) => ({ ok: true, data: { username, nick: null, rating: 1600, isAdmin: false, badge: { content: '测试标签', backgroundColor: '#123456', color: '#ffffff' } } }));
        ipcMain.removeHandler('xmoj:bbs:boards');
        ipcMain.handle('xmoj:bbs:boards', () => ({ ok: true, data: { value: { Success: true, Data: { Boards: [{ BoardID: 1, BoardName: '测试板块' }] } } } }));
        ipcMain.removeHandler('xmoj:bbs:posts');
        ipcMain.handle('xmoj:bbs:posts', () => ({ ok: true, data: { value: { Success: true, Data: { Posts: [{ PostID: 7, Title: 'Fixture discussion', UserID: fields.username }], PageCount: 1 } } } }));
        const thread = { PostID: 7, Title: 'Fixture discussion', UserID: fields.username, RootReplyID: 10, Content: 'Opening content', PageCount: 1, Lock: { Locked: false }, Reply: Array.from({ length: 14 }, (_, index) => ({ ReplyID: 10 + index, UserID: fields.username, Content: index ? `Reply ${index}` : 'Opening content' })) };
        ipcMain.removeHandler('xmoj:bbs:post');
        ipcMain.handle('xmoj:bbs:post', () => ({ ok: true, data: { value: { Success: true, Data: thread } } }));
        const edits = [];
        ipcMain.removeHandler('xmoj:bbs:editReply');
        ipcMain.handle('xmoj:bbs:editReply', (_event, payload) => {
            edits.push(payload);
            thread.Reply.find(reply => reply.ReplyID === payload.replyId).Content = payload.content;
            if (payload.replyId === 10) thread.Content = payload.content;
            return { ok: true, data: { Success: true, Data: {} } };
        });
        const repliesSent = [];
        ipcMain.removeHandler('xmoj:bbs:new-reply');
        ipcMain.handle('xmoj:bbs:new-reply', (_event, payload) => { repliesSent.push(payload); return { ok: true, data: { Success: true, Data: {} } }; });
        ipcMain.removeHandler('xmoj:status:list');
        ipcMain.handle('xmoj:status:list', () => ({ ok: true, data: { submissions: [{ id: 1, verdict: 'accepted', verdictCode: 4, verdictLabel: 'Accepted', verdictText: 'Accepted', problemId: 1000, problemTitle: 'Fixture', problemUrl: null, user: 'long-fixture-username', memoryKb: 128, timeMs: 1, language: 'C++', codeLength: 10, userRating: null, submittedAt: '2026-01-01' }], paging: { nextTop: null, nextPrevTop: null, prevTop: null } } }));
        ipcMain.removeHandler('xmoj:monthly:board');
        ipcMain.handle('xmoj:monthly:board', () => ({ ok: true, data: {
            intro: 'Intro that must not appear', url: 'https://www.xmoj.tech/open_contest.php', serverTime: Date.now(),
            countdown: [{ event: 'Fixture upcoming contest', date: '2099-01-01', days: 3 }],
            cards: [
                { title: '关于月赛', date: null, html: '<p>Monthly introduction links</p>', text: '' },
                { title: '月赛公告一', date: '2026-10-01', html: '<p><strong>公告正文</strong></p>', text: '' },
                { title: '月赛公告二', date: null, html: '<p>第二条公告</p>', text: '' },
                { title: '我的月赛', date: null, html: '<p><a href="/open_contest_score.php">成绩查询</a></p>', text: '' },
            ],
        } }));
        await new Promise(resolve => { win.webContents.once('did-finish-load', resolve); win.webContents.reload(); });
        await until(() => run(`!!document.querySelector('h1') && !document.body.textContent.includes('正在恢复登录状态')`), 'signed-in home');
        await until(() => run(`document.querySelector('[data-slot="sidebar-footer"] [data-slot="user-badge"]')?.textContent.trim()==='测试标签'`), 'custom tag beside username');
        await run(`(() => { const content=document.createElement('div'); content.className='announcement-body'; content.id='badge-test'; content.innerHTML='<a href="https://www.xmoj.tech/userinfo.php?user=fixture-user">fixture-user</a>'; document.querySelector('main').append(content); })()`);
        await until(() => run(`document.querySelector('#badge-test [data-rich-user-badge]')?.textContent==='测试标签'`), 'rich username link tag');
        await run(`document.getElementById('badge-test').remove()`);
        await run(`Array.from(document.querySelectorAll('[data-sidebar="menu-button"]')).find(button=>button.textContent.trim()==='讨论').click()`);
        await until(() => run(`Array.from(document.querySelectorAll('main button')).some(button=>button.textContent.trim()==='发帖')`), 'discussion');
        await run(`Array.from(document.querySelectorAll('main button')).find(button=>button.textContent.trim()==='发帖').click()`);
        await until(() => run(`!!document.querySelector('[data-slot="cloudflare-widget"]')`), 'inline placeholder');
        await run(`document.querySelector('[data-slot="cloudflare-widget"]').scrollIntoView({block:'center'})`);
        let view;
        await until(() => { view = win.contentView.children.find(child => child instanceof WebContentsView); return !!view; }, 'native inline widget');
        await until(() => run(`document.querySelector('[data-slot="cloudflare-verification"]').dataset.state==='ready'`), 'widget ready');
        assert.equal(BrowserWindow.getAllWindows().length, 1, 'no verification popup');
        assert.equal(view.webContents.getLastWebPreferences().sandbox, true);
        assert.equal(await view.webContents.executeJavaScript('typeof window.xmoj'), 'undefined', 'verification view never gets application APIs');
        assert.equal(await view.webContents.executeJavaScript('Object.keys(window.turnstileBridge).join(",")'), 'report', 'verification bridge is one-way and minimal');
        await until(() => view.getVisible(), 'inline view visible');
        await run(`(() => { const menu=document.createElement('div'); menu.id='captcha-test-menu'; menu.setAttribute('role','menu'); document.body.append(menu); })()`);
        await until(() => !view.getVisible(), 'menus are not covered by the native widget');
        await run(`document.getElementById('captcha-test-menu').remove()`);
        await until(() => view.getVisible(), 'widget visible again after closing menu');
        await view.webContents.executeJavaScript(`window.__testToken='fixture-api-only-token'`);
        await until(() => run(`document.querySelector('[data-slot="cloudflare-verification"]').dataset.state==='success'`), 'official API recovers a token even when no success callback was delivered');
        await view.webContents.executeJavaScript(`window.__testOptions.callback('fixture-token-not-valid-for-posting')`);
        await until(() => run(`document.querySelector('[data-slot="cloudflare-verification"]').dataset.state==='success'`), 'success');
        await run(`(() => {const title=document.querySelector('main input[placeholder="标题"]');title.value='Fixture post';title.dispatchEvent(new Event('input',{bubbles:true}));const content=document.querySelector('[data-slot="markdown-composer"] textarea');content.value='Fixture content';content.dispatchEvent(new Event('input',{bubbles:true}));})()`);
        await until(() => run(`!document.querySelector('[data-slot="cloudflare-verification"]').closest('form').querySelector('button[type="submit"]').disabled`), 'successful verification enables publishing when required fields are filled');
        await pause(2500);
        assert.ok(view.getVisible(), 'successful widget remains displayed: ' + JSON.stringify(await run(`({host:document.querySelector('[data-slot="cloudflare-widget"]').getBoundingClientRect().toJSON(),sidebar:document.querySelector('[data-slot="sidebar"]').dataset.state,menu:!!document.querySelector('[role="menu"]'),dialog:!!document.querySelector('[role="dialog"]'),viewport:[innerWidth,innerHeight]})`)));
        assert.ok(win.contentView.children.includes(view), 'success keeps the same widget');
        const fullBounds = view.getBounds();
        await run(`document.querySelector('[data-slot="sidebar-hover-rail"]').dispatchEvent(new MouseEvent('mouseenter'))`);
        await until(() => view.getVisible() && view.getBounds().x > fullBounds.x && view.getBounds().width < fullBounds.width, 'expanded sidebar clips only the covered part, without hiding the widget');
        assert.ok(await run(`document.querySelector('[data-slot="cloudflare-verification"]').dataset.state==='success'`), 'sidebar does not reset verification');
        await run(`document.querySelector('[data-slot="sidebar"] .fixed').dispatchEvent(new MouseEvent('mouseleave',{clientX:700,clientY:100}))`);
        await until(() => view.getVisible() && view.getBounds().x === fullBounds.x && view.getBounds().width === fullBounds.width, 'widget restored after sidebar collapses');
        await run(`(() => {const host=document.querySelector('[data-slot="cloudflare-widget"]');for(const position of ['beforebegin','afterend']) {const spacer=document.createElement('div');spacer.className='captcha-test-spacer';spacer.style.height='900px';host.insertAdjacentElement(position,spacer);}const r=host.getBoundingClientRect();window.scrollTo(0,scrollY+r.top-innerHeight+24);})()`);
        await until(() => view.getVisible() && view.getBounds().height > 0 && view.getBounds().height <= 24, 'bottom-edge widget is clipped rather than hidden');
        await run(`(() => {const r=document.querySelector('[data-slot="cloudflare-widget"]').getBoundingClientRect();window.scrollTo(0,scrollY+r.top+20);})()`);
        await until(() => view.getVisible() && view.getBounds().y === 0 && view.getBounds().height <= 60, 'top-edge widget remains partly visible');
        await run(`document.querySelectorAll('.captcha-test-spacer').forEach(node=>node.remove());document.querySelector('[data-slot="cloudflare-widget"]').scrollIntoView({block:'center'})`);
        await view.webContents.executeJavaScript(`window.__testOptions['error-callback']()`);
        await until(() => run(`document.querySelector('[data-slot="cloudflare-verification"]').dataset.state==='error'`), 'failure clears success');
        assert.ok(await run(`document.querySelector('[data-slot="cloudflare-verification"]').closest('form').querySelector('button[type="submit"]').disabled`), 'failed verification disables submission again');
        try { await until(() => view.webContents?.executeJavaScript('window.__testResets >= 1'), 'automatic retry'); }
        catch (error) { console.log('Captcha lifecycle actions:', captchaActions); throw error; }
        await view.webContents.executeJavaScript(`window.__testOptions.callback('fixture-token-2'); window.__testOptions['expired-callback']()`);
        await until(() => view.webContents.executeJavaScript('window.__testResets >= 2'), 'expiry resets widget');
        const contents = view.webContents;
        await run(`Array.from(document.querySelectorAll('main button')).find(button=>button.textContent.trim()==='发帖').click()`);
        await until(() => !win.contentView.children.includes(view), 'unmount removes native widget');
        await until(() => contents.isDestroyed(), 'verification contents destroyed on unmount');
        synchronousSuccess = true;
        await run(`Array.from(document.querySelectorAll('main button')).find(button=>button.textContent.includes('Fixture discussion')).click()`);
        await until(() => run(`!!document.querySelector('[data-slot="discussion-comment"]')`), 'fixture thread');
        await until(() => run(`document.querySelector('[data-slot="cloudflare-verification"]')?.dataset.state==='success'`), 'synchronous success callback is not overwritten by ready');
        await run(`(() => {const textarea=document.querySelector('[data-slot="markdown-composer"] textarea');textarea.value='Mock reply only';textarea.dispatchEvent(new Event('input',{bubbles:true}));textarea.scrollIntoView({block:'center'});})()`);
        await until(() => run(`!document.querySelector('[data-slot="markdown-composer"]').closest('form').querySelector('button[type="submit"]').disabled`), 'verification token enables reply submit');
        await run(`document.querySelector('[data-slot="markdown-composer"]').closest('form').querySelector('button[type="submit"]').click()`);
        await until(() => repliesSent.length === 1, 'mock reply request');
        assert.equal(repliesSent[0].captchaSecretKey, 'fixture-sync-token');
        await run(`(() => {const comments=document.querySelectorAll('[data-slot="discussion-comment"]');const card=comments[comments.length-1];card.scrollIntoView({block:'center'});Array.from(card.querySelectorAll('button')).find(button=>button.textContent.trim()==='编辑').click();})()`);
        await until(() => run(`document.activeElement===document.querySelector('textarea[aria-label="编辑 Markdown"]') && document.activeElement.getBoundingClientRect().top>=0 && document.activeElement.getBoundingClientRect().top<innerHeight`), 'editing a distant reply focuses and reveals its editor');
        await run(`(() => {const textarea=document.querySelector('textarea[aria-label="编辑 Markdown"]');textarea.value='Edited mock reply';textarea.dispatchEvent(new Event('input',{bubbles:true}));})()`);
        await run(`document.querySelector('[data-slot="discussion-edit-form"] button[type="submit"]').click()`);
        await until(() => edits.length === 1 && run(`!document.querySelector('[data-slot="discussion-edit-form"]') && document.querySelector('main').textContent.includes('Edited mock reply')`), 'edit saves and refreshes the displayed reply');
        assert.deepEqual(edits[0], { replyId: 23, content: 'Edited mock reply' });
        console.log('Discussion passed: success enables publish/reply and forwards the token; distant edit button opens, focuses, saves and refreshes correctly. All mutations were mocked.');
        await run(`Array.from(document.querySelectorAll('[data-sidebar="menu-button"]')).find(button=>button.textContent.trim()==='状态').click()`);
        await until(() => run(`document.querySelector('main [data-slot="user-badge"]')?.textContent.trim()==='测试标签'`), 'status row user tag');
        assert.ok(await run(`(() => {const badge=document.querySelector('main [data-slot="user-badge"]');const cell=badge.closest('td');const b=badge.getBoundingClientRect(),c=cell.getBoundingClientRect();return b.left>=c.left && b.right<=c.right && getComputedStyle(badge).backgroundColor==='rgb(18, 52, 86)';})()`), 'long username must not clip its custom tag');
        win.setMinimumSize(800, 600);
        win.webContents.setZoomFactor(1);
        win.setContentSize(800, 600);
        await until(() => run(`Math.abs(innerWidth-800)<=2 && Math.abs(innerHeight-600)<=2`), '800x600 viewport resize');
        await run(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
        assert.ok(await run(`document.documentElement.scrollWidth <= innerWidth`), '800x600 must not have page-wide horizontal overflow');
        assert.ok(await run(`Array.from(document.querySelectorAll('[data-slot="status-filters"] input,[data-slot="status-filters"] select,[data-slot="status-filters"] button')).every(control=>{const r=control.getBoundingClientRect();return r.width>0 && r.left>=0 && r.right<=innerWidth;})`), 'all filter controls fit at 800x600');
        const tableLayout = await run(`(() => { const region=document.querySelector('[data-slot="status-table-scroll"]');region.scrollLeft=150;return {width:region.clientWidth,scrollWidth:region.scrollWidth,left:region.scrollLeft,columns:document.querySelectorAll('thead th').length,viewport:innerWidth};})()`);
        writeFileSync(path.join(temp, 'xmoj-status-800x600.png'), (await win.webContents.capturePage()).toPNG());
        assert.ok(tableLayout.scrollWidth>tableLayout.width && tableLayout.left>0 && tableLayout.columns===8, 'all eight columns remain available through local table scrolling: ' + JSON.stringify(tableLayout));
        await run(`document.querySelector('[data-slot="status-table-scroll"]').scrollLeft=0`);
        writeFileSync(path.join(temp, 'xmoj-status-800x600.png'), (await win.webContents.capturePage()).toPNG());
        console.log('Status 800x600 passed: filter controls fit, no page-wide overflow, all eight columns available in the scrollable table.');
        win.setContentSize(1200, 800);
        await run(`Array.from(document.querySelectorAll('[data-sidebar="menu-button"]')).find(button=>button.textContent.trim()==='月赛').click()`);
        await until(() => run(`document.querySelector('h1')?.textContent==='小明的月赛' && !!document.querySelector('[data-slot="monthly-mine"]')`), 'monthly home-style layout');
        assert.ok(await run(`(() => {const main=document.querySelector('main');return main.textContent.includes('关于月赛') && main.textContent.includes('Monthly introduction links') && !main.textContent.includes('Intro that must not appear') && !main.textContent.includes('复制') && !main.textContent.includes('QQ群') && !main.querySelector('.service-notice,[data-slot="promo-banner"]');})()`));
        assert.equal(await run(`document.querySelectorAll('[data-slot="monthly-announcements"] [data-slot="monthly-card"]').length`), 3);
        assert.equal(await run(`document.querySelector('[data-slot="monthly-card"] h2').textContent`), '关于月赛');
        assert.ok(await run(`(() => {const a=document.querySelector('[data-slot="monthly-announcements"]').getBoundingClientRect();const mine=document.querySelector('[data-slot="monthly-mine"]').getBoundingClientRect();const countdown=document.querySelector('[data-slot="monthly-countdown"]').getBoundingClientRect();return mine.left>a.left && countdown.top>=mine.bottom;})()`), 'my monthly sits on the right, countdown below it');
        await run(`document.querySelector('[data-slot="monthly-mine"] a').click();window.open('https://www.xmoj.tech/feature-not-implemented.php')`);
        await until(() => openedLinks.includes('https://www.xmoj.tech/open_contest_score.php') && openedLinks.includes('https://www.xmoj.tech/feature-not-implemented.php'), 'unimplemented judge features open in default browser');
        assert.equal(await run(`document.querySelector('h1').textContent`), '小明的月赛', 'external fallback does not navigate the application');
        writeFileSync(path.join(temp, 'xmoj-monthly-layout.png'), (await win.webContents.capturePage()).toPNG());
        console.log('Monthly passed: homepage-style columns, retained about card first, removed intro and copy buttons, my monthly above countdown, and external fallback for unimplemented judge links.');
        console.log('Inline captcha passed: sidebar/menu occlusion, persistent success, error retry, expiry reset, cleanup, and username tags in UserChip/rich links. All challenge and badge responses were mocked; no posts sent.');
        app.exit(0);
    } catch (error) { console.error(error); app.exit(1); }
});
