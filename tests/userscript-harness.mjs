import { app, BrowserWindow, ipcMain, session } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const argUrl = process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? 'https://www.xmoj.tech/';
const argDump = process.argv.find((a) => a.startsWith('--dump='))?.slice(7) ?? null;
const USERSCRIPT_PATH = process.env.XMOJ_USERSCRIPT ?? 'D:\\Git-repo\\XMOJ-Script\\XMOJ.user.js';
function readCredentials() {
    const raw = readFileSync(path.join(here, 'account.txt'), 'utf8');
    const fields = {};
    for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_]+)\s*[:=]\s*(.+?)\s*$/);
        if (m)
            fields[m[1].toLowerCase()] = m[2];
    }
    return fields;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const GM_SHIM = `
window.GM_info = { script: { version: '4.0.5', name: 'XMOJ' } };
window.GM = {
  cookie: {
    set: function (options) {
      try {
        document.cookie = options.name + '=' + options.value + ';path=' + (options.path || '/');
        return Promise.resolve();
      } catch (e) { return Promise.reject(e); }
    },
    get: function () { return Promise.resolve({ cookies: [] }); },
    list: function () { return Promise.resolve([]); },
  },
  xmlHttpRequest: function () { return { abort: function () {} }; },
};
window.GM_registerMenuCommand = function () {};
window.GM_getResourceText = function () { return ''; };
window.GM_setClipboard = function (text) { try { navigator.clipboard.writeText(String(text)); } catch (e) {} };
window.GM_getValue = function (key, fallback) {
  try { var v = localStorage.getItem('GM_' + key); return v === null ? fallback : JSON.parse(v); }
  catch (e) { return fallback; }
};
window.GM_setValue = function (key, value) {
  try { localStorage.setItem('GM_' + key, JSON.stringify(value)); } catch (e) {}
};
window.GM_cookie = {
  set: function (options) {
    try {
      document.cookie = options.name + '=' + options.value + ';path=' + (options.path || '/');
      return Promise.resolve();
    } catch (e) { return Promise.reject(e); }
  },
  get: function () { return Promise.resolve({ cookies: [] }); },
  list: function () { return Promise.resolve([]); },
};
window.GM_xmlhttpRequest = function (options) {
  var payload = {
    method: (options.method || 'GET').toUpperCase(),
    url: options.url,
    headers: options.headers || {},
    data: options.data,
  };
  window.__dshGmRequest(payload)
    .then(function (result) {
      if (options.onload) {
        options.onload({ status: result.status, responseText: result.body, responseHeaders: result.headers || '' });
      }
    })
    .catch(function (error) {
      if (options.onerror) options.onerror({ error: String(error) });
    });
  return { abort: function () {} };
};
`;
async function main() {
    const credentials = readCredentials();
    const userscript = readFileSync(USERSCRIPT_PATH, 'utf8');
    ipcMain.handle('dsh:gm-request', async (_event, payload) => {
        const headers = { ...(payload.headers || {}) };
        const response = await fetch(payload.url, {
            method: payload.method,
            headers,
            body: payload.method === 'GET' ? undefined : payload.data,
            redirect: 'follow',
        });
        const body = await response.text();
        const responseHeaders = [...response.headers.entries()]
            .map(([k, v]) => `${k}: ${v}`)
            .join('\r\n');
        return { status: response.status, body, headers: responseHeaders };
    });
    const loginSession = session.fromPartition('persist:xmoj-compare');
    const loginBody = new URLSearchParams({
        user_id: credentials.username,
        password: credentials.password,
        submit: '登录',
    });
    const loginResponse = await fetch('https://www.xmoj.tech/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody,
        redirect: 'manual',
    });
    const setCookie = loginResponse.headers.getSetCookie?.() ?? [];
    const sessionId = setCookie
        .map((cookie) => cookie.match(/PHPSESSID=([^;]+)/)?.[1])
        .find(Boolean);
    if (!sessionId) {
        throw new Error(`登录失败，未能取得 PHPSESSID（HTTP ${loginResponse.status}）`);
    }
    await loginSession.cookies.set({
        url: 'https://www.xmoj.tech/',
        name: 'PHPSESSID',
        value: sessionId,
        path: '/',
        httpOnly: true,
        secure: true,
    });
    const win = new BrowserWindow({
        show: false,
        width: 1440,
        height: 900,
        webPreferences: {
            partition: 'persist:xmoj-compare',
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(here, 'userscript-preload.cjs'),
        },
    });
    win.webContents.on('console-message', (_e, level, message) => {
        if (level >= 2)
            console.log(`  [console:${level}] ${String(message).slice(0, 200)}`);
    });
    let injectState = 'pending';
    win.webContents.on('did-start-loading', async () => {
        const shimSource = `${GM_SHIM}\n;void 0;`;
        const scriptSource = `${userscript}\n;void 0;`;
        try {
            await win.webContents.executeJavaScript(shimSource, true);
        }
        catch (error) {
            injectState = `GM_SHIM failed: ${String(error).slice(0, 160)}`;
            return;
        }
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await win.webContents.executeJavaScript(scriptSource, true);
                injectState = `injected (attempt ${attempt})`;
                return;
            }
            catch (error) {
                injectState = `attempt ${attempt} failed: ${String(error).slice(0, 160)}`;
                await wait(600);
            }
        }
    });
    console.log(`loading ${argUrl} with the userscript…`);
    await win.loadURL(argUrl);
    await wait(18000);
    console.log(`  inject state: ${injectState}`);
    const report = await win.webContents.executeJavaScript(`(() => {
    const q = (sel) => document.querySelector(sel)
    const qa = (sel) => Array.from(document.querySelectorAll(sel))
    const info = (el) => el ? { tag: el.tagName, cls: el.className, id: el.id, text: (el.innerText || '').slice(0, 120) } : null
    return {
      url: location.href,
      title: document.title,
      profile: info(q('#profile')),
      navbarClass: q('nav') ? q('nav').className : null,
      bodyClasses: document.body.className,
      injectedStyles: qa('style').length,
      hasToastContainer: !!q('.toast-container'),
      hasUpdateModal: !!q('#UpdateModal'),
      marquee: !!q('marquee'),
      footer: !!q('.footer'),
      tables: qa('table').length,
      problemsetRows: qa('#problemset tbody tr').length,
      problemsetCellTexts: q('#problemset tbody tr')
        ? Array.from(q('#problemset tbody tr').children).map((td) => (td.innerText || '').trim().slice(0, 40))
        : null,
      resultTabRows: qa('#result-tab tbody tr').length,
      statusFirstRowCells: q('#result-tab tbody tr')
        ? Array.from(q('#result-tab tbody tr').children).map((td) => (td.innerText || '').trim().slice(0, 40))
        : null,
      resultTabClassList: q('#result-tab') ? Array.from(q('#result-tab').classList) : null,
      statusPager: qa('.pagination a').map((a) => (a.innerText || '').trim()).slice(0, 8),
      cntRows: qa('.cnt-row').length,
      countdownItems: qa('#countdown_list .countdown').length,
      countdownTexts: qa('#countdown_list .countdown').map((d) => (d.innerText || '').replace(/\\s+/g, ' ').trim()).slice(0, 6),
      navDate: q('#nowdate') ? q('#nowdate').innerText : null,
      problemH3: q('.mt-3 h3') ? q('.mt-3 h3').innerText.replace(/\\s+/g, ' ').trim().slice(0, 120) : null,
      problemH2: q('.mt-3 h2') ? q('.mt-3 h2').innerText.trim().slice(0, 120) : null,
      sampleDataCount: qa('.sampledata').length,
      ioFilenameRaw: (function () {
        var el = document.querySelector('.mt-3 h3');
        if (!el) return null;
        var t = (el.innerText || '').replace(/\\s+/g, ' ').trim();
        return t || null;
      })(),
    }
  })()`);
    console.log('\n=== rendered page state (userscript active) ===');
    console.log(JSON.stringify(report, null, 2));
    if (argDump) {
        const html = await win.webContents.executeJavaScript('document.documentElement.outerHTML');
        writeFileSync(argDump, html, 'utf8');
        console.log(`\ndumped rendered HTML to ${argDump}`);
    }
    app.exit(0);
}
app.whenReady().then(() => main().catch((error) => {
    console.error('harness failed:', error);
    app.exit(1);
}));
