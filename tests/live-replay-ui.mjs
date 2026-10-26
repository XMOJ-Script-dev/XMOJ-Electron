import { app, BrowserWindow, net } from 'electron';
import { readFileSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const temp = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode') : app.getPath('temp');
app.setPath('userData', mkdtempSync(path.join(temp, 'replay-ui-')));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
app.whenReady().then(async () => {
    try {
        // Use system networking for this live test environment's proxy configuration.
        globalThis.fetch = (url, options = {}) => {
            const headers = new Headers(options.headers); headers.delete('Content-Length');
            return net.fetch(String(url), { ...options, headers, credentials: 'omit' });
        };
        await import('../dist-electron/main.js');
        let win;
        for (let i=0;i<100&&!win;i++) { [win]=BrowserWindow.getAllWindows(); if(!win) await pause(50); }
        assert.ok(win);
        if (win.webContents.isLoading()) await new Promise(resolve=>win.webContents.once('did-finish-load',resolve));
        const mediaErrors = [];
        win.webContents.session.webRequest.onErrorOccurred(details => {
            if (details.resourceType === 'media') mediaErrors.push({ host: new URL(details.url).hostname, error: details.error });
        });
        const run = code => win.webContents.executeJavaScript(code, true);
        const until = async (code,label) => { for(let i=0;i<600;i++){if(await run(code))return;await pause(100);}throw new Error(`Timed out: ${label}`); };
        await until(`!!document.querySelector('h1')&&!document.body.textContent.includes('正在恢复登录状态')`,'home');
        const fields=Object.fromEntries(readFileSync('tests/account.txt','utf8').split(/\r?\n/).flatMap(line=>{const m=line.match(/^\s*(\w+)\s*[:=]\s*(.+?)\s*$/);return m?[[m[1].toLowerCase(),m[2]]]:[]}));
        const login=await run(`window.xmoj.session.login(${JSON.stringify({username:fields.username,password:fields.password,remember:false})})`);
        assert.ok(login.ok,'test login succeeded');
        await new Promise(resolve=>{win.webContents.once('did-finish-load',resolve);win.webContents.reload();});
        await until(`!!document.querySelector('h1')&&!document.body.textContent.includes('正在恢复登录状态')`,'signed-in home');
        await run(`Array.from(document.querySelectorAll('[data-sidebar="menu-button"]')).find(button=>button.textContent.trim()==='竞赛&作业').click()`);
        const listing=await run(`window.xmoj.contest.list(1,false)`);
        const contest=listing.value.list.find(c=>c.contestId===10865);
        assert.ok(contest,'requested contest is available to the test account');
        await until(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.includes(${JSON.stringify(contest.title)}))`,'contest row');
        await run(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.includes(${JSON.stringify(contest.title)})).click()`);
        await until(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.trim()==='比赛回放'&&!b.disabled)`,'replay entry');
        assert.ok(await run(`(()=>{const buttons=Array.from(document.querySelectorAll('main button')).map(b=>b.textContent.trim());return buttons.indexOf('返回列表')<buttons.indexOf('比赛回放')&&buttons.indexOf('比赛回放')<buttons.indexOf('OI 排名');})()`));
        await run(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.trim()==='比赛回放').click()`);
        try { await until(`!!document.querySelector('[data-slot="contest-replay"] video')&&document.querySelector('video').readyState>=1`,'actual video metadata'); }
        catch (error) {
            console.log('Replay diagnostics:', await run(`({message:document.querySelector('[data-slot="contest-replay"] [role="alert"]')?.textContent,video:(()=>{const v=document.querySelector('video');return v?{ready:v.readyState,network:v.networkState,error:v.error?.code}:null})()})`), mediaErrors);
            throw error;
        }
        const layout = await run(`(()=>{const root=document.querySelector('[data-slot="contest-replay"]');const r=root.getBoundingClientRect();const main=document.querySelector('[data-slot="sidebar-inset"]');return {left:r.left,expected:main.getBoundingClientRect().left,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,controls:!!root.querySelector('[data-slot="replay-controls"]')};})()`);
        assert.ok(Math.abs(layout.left-layout.expected)<2&&Math.abs(layout.right-layout.width)<2&&Math.abs(layout.bottom-layout.height)<2&&layout.controls,'player covers content, not sidebar: '+JSON.stringify(layout));
        await run(`document.querySelector('[aria-label="播放"]').click()`);
        await until(`document.querySelector('video').currentTime>0.2`,'actual playback progresses');
        await run(`document.querySelector('[aria-label="播放速度"]').value='1.5';document.querySelector('[aria-label="播放速度"]').dispatchEvent(new Event('change',{bubbles:true}))`);
        await until(`document.querySelector('video').playbackRate===1.5`,'speed control');
        await run(`window.__replayVideo=document.querySelector('video');document.querySelector('[aria-label="关闭回放"]').click()`);
        await until(`!document.querySelector('[data-slot="contest-replay"]')&&window.__replayVideo.paused&&!window.__replayVideo.getAttribute('src')`,'close stops media and restores contest');
        console.log('Live contest 10865 replay passed: entry placement, authorized MP4 metadata/playback, content-only fullscreen, speed control, close and media cleanup. No submissions or comments sent.');
        app.exit(0);
    } catch(error){console.error(error);app.exit(1);}
});
