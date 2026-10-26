import { app, BrowserWindow } from 'electron';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
app.whenReady().then(async () => {
    try {
        const root = path.resolve('website');
        const win = new BrowserWindow({ show: false, width: 1440, height: 1000, webPreferences: { sandbox: true } });
        await win.loadFile(path.join(root, 'index.html'));
        const run = code => win.webContents.executeJavaScript(code);
        assert.equal(await run(`document.querySelector('h1').textContent`), '让专注回到解题。');
        assert.ok(await run(`Array.from(document.querySelectorAll('a[href^="#"]')).every(a=>document.getElementById(a.hash.slice(1)))`));
        for (const href of await run(`Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(a=>a.getAttribute('href'))`)) assert.ok(existsSync(path.join(root, href)));
        assert.equal(await run(`document.querySelectorAll('input[type="password"]').length`), 0);
        for (const width of [1440, 390]) {
            win.setSize(width, 1000);
            await run(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
            assert.ok(await run(`document.documentElement.scrollWidth <= innerWidth`), `no horizontal overflow at ${width}px`);
            const screenshot = await win.webContents.capturePage();
            const temp = process.platform === 'win32' && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode') : app.getPath('temp');
            writeFileSync(path.join(temp, `xmoj-pages-${width}.png`), screenshot.toPNG());
        }
        assert.ok(readFileSync('.github/workflows/pages.yml', 'utf8').includes('path: website'));
        console.log('Pages passed: desktop/mobile layout, anchors, stylesheet, no login form, and deployment artifact.');
        app.exit(0);
    } catch (error) { console.error(error); app.exit(1); }
});
