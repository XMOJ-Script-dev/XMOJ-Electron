import { app, BrowserWindow, dialog } from 'electron';
import { createServer } from 'node:http';
import { mkdtempSync, statSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = process.platform === 'win32' && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode') : app.getPath('temp');
const directory = mkdtempSync(path.join(root, 'download-progress-'));
app.setPath('userData', directory);
const savedPath = path.join(directory, 'saved-name.bin');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
app.whenReady().then(async () => {
    let server;
    try {
        await import('../dist-electron/main.js');
        let win;
        for (let i = 0; i < 100 && !win; i++) { [win] = BrowserWindow.getAllWindows(); if (!win) await pause(50); }
        assert.ok(win);
        if (win.webContents.isLoading()) await new Promise(resolve => win.webContents.once('did-finish-load', resolve));
        const run = script => win.webContents.executeJavaScript(script);
        const until = async script => {
            for (let i = 0; i < 400; i++) { if (await run(script)) return; await pause(50); }
            throw new Error(`Download UI did not reach expected state: ${script}`);
        };
        await until(`!!document.querySelector('[data-slot="sidebar-wrapper"]')`);
        const bytes = 32 * 16384;
        let requests = 0;
        server = createServer((_request, response) => {
            requests++;
            response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="original.bin"', 'Content-Length': bytes });
            let sent = 0;
            const timer = setInterval(() => { response.write(Buffer.alloc(16384)); sent += 16384; if (sent === bytes) { clearInterval(timer); response.end(); } }, 70);
            response.on('close', () => clearInterval(timer));
        });
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const url = 'https://www.xmoj.tech/downloads/test.bin';
        win.webContents.session.webRequest.onBeforeRequest({ urls: [url] }, (_details, callback) => callback({ redirectURL: `http://127.0.0.1:${server.address().port}/test.bin` }));
        dialog.showSaveDialog = async () => ({ canceled: true });
        await run(`window.xmoj.app.openLink(${JSON.stringify(url)})`);
        assert.equal(requests, 0, 'cancelled save dialog sends no file request');
        let confirm;
        dialog.showSaveDialog = () => new Promise(resolve => { confirm = resolve; });
        const opening = run(`window.xmoj.app.openLink(${JSON.stringify(url)})`);
        for (let i = 0; i < 100 && !confirm; i++) await pause(20);
        assert.ok(confirm);
        assert.equal(requests, 0, 'no file request before confirming path');
        const done = new Promise(resolve => win.webContents.session.once('will-download', (_event, item) => { item.once('done', (_done, state) => resolve(state)); }));
        confirm({ canceled: false, filePath: savedPath });
        await opening;
        await until(`(() => { const card=document.querySelector('[data-slot="download-progress"]'); return card?.textContent.includes('saved-name.bin') && Number(card.getAttribute('aria-valuenow')) > 0 && Number(card.getAttribute('aria-valuenow')) < 100; })()`);
        assert.equal(await run(`document.querySelector('[data-slot="download-progress"]').querySelectorAll('button').length`), 1);
        assert.equal(await done, 'completed');
        assert.equal(statSync(savedPath).size, bytes);
        await until(`!document.querySelector('[data-slot="download-progress"]')`);
        dialog.showSaveDialog = async () => ({ canceled: false, filePath: savedPath });
        const cancelled = new Promise(resolve => win.webContents.session.once('will-download', (_event, item) => item.once('done', (_done, state) => resolve(state))));
        await run(`window.xmoj.app.openLink(${JSON.stringify(url)})`);
        await until(`!!document.querySelector('[data-slot="download-progress"] button')`);
        await run(`document.querySelector('[data-slot="download-progress"] button').click()`);
        assert.equal(await cancelled, 'cancelled');
        await until(`!document.querySelector('[data-slot="download-progress"]')`);
        console.log('Native download passed: save-before-request, dialog cancellation, saved filename, progress, completion, and X cancellation.');
        server.close(); if (existsSync(savedPath)) unlinkSync(savedPath); app.exit(0);
    } catch (error) {
        console.error(error);
        server?.close();
        if (existsSync(savedPath)) { try { unlinkSync(savedPath); } catch {} }
        app.exit(1);
    }
});
