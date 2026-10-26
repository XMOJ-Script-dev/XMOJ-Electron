import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isViewSettled } from './lib/e2e-readiness.mjs';
const require = createRequire(import.meta.url);
const { app, BrowserWindow } = require('electron');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const logs = [];
function record(ok, label, detail) {
    if (!ok)
        failures.push(label);
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
app.on('ready', async () => {
    await import(new URL('../dist-electron/main.js', import.meta.url).href);
    let win = null;
    for (let i = 0; i < 120; i++) {
        ;
        [win] = BrowserWindow.getAllWindows();
        if (win)
            break;
        await wait(100);
    }
    if (!win) {
        console.log('  [FAIL] the app did not create a BrowserWindow');
        app.exit(1);
        return;
    }
    record(true, 'app created a BrowserWindow');
    win.webContents.on('console-message', (_event, level, message) => {
        logs.push(`[renderer:${level}] ${message}`);
    });
    if (win.webContents.isLoading()) {
        await new Promise((resolve) => win.webContents.once('did-finish-load', resolve));
    }
    record(true, 'renderer finished loading');
    const waitForApp = async (timeoutMs = 120000) => {
        const deadline = Date.now() + timeoutMs;
        let last = null;
        while (Date.now() < deadline) {
            last = await win.webContents.executeJavaScript(`(() => {
        const h1 = document.querySelector('h1')
        const text = document.body.textContent
        return {
          heading: h1 ? h1.textContent.trim() : null,
          restoring: /正在恢复登录状态/.test(text),
          sidebarReady: document.querySelector('[data-slot="sidebar-menu-item"]') !== null,
          skeletons: document.querySelectorAll('[data-slot="skeleton"]').length,
          busy: !!document.querySelector('[aria-busy="true"]'),
          homeLoaded: /服务器时间/.test(text) && /公告/.test(text),
        }
      })()`);
            const settled = last.heading &&
                last.sidebarReady &&
                !last.restoring &&
                !last.busy &&
                last.skeletons === 0 &&
                last.homeLoaded;
            if (settled)
                return last;
            await wait(400);
        }
        return last;
    };
    const ready = await waitForApp();
    record(Boolean(ready?.homeLoaded && !ready?.restoring && !ready?.busy && ready?.skeletons === 0), 'app finished restoring and loading home data', JSON.stringify(ready));
    const probe = await win.webContents.executeJavaScript(`(() => {
    const root = document.querySelector('#app')
    const text = document.body.textContent
    return {
      childCount: root ? root.childElementCount : 0,
      text,
      hasBridge: typeof window.xmoj === 'object' && window.xmoj !== null,
      bridgeKeys: window.xmoj ? Object.keys(window.xmoj) : [],
      hasRawIpc: typeof window.ipcRenderer !== 'undefined',
      navItems: document.querySelectorAll('[data-slot="sidebar-menu-item"]').length,
    }
  })()`);
    record(probe.childCount > 0, 'Vue mounted into #app', `children=${probe.childCount}`);
    record(probe.hasBridge, 'window.xmoj bridge exposed');
    record(['session', 'home', 'problemset', 'status'].every((k) => probe.bridgeKeys.includes(k)), 'bridge exposes all four namespaces', probe.bridgeKeys.join(','));
    record(!probe.hasRawIpc, 'raw ipcRenderer is NOT exposed to the renderer');
    const text = probe.text || '';
    record(text.includes('服务器时间'), 'home rendered the live server clock');
    record(text.includes('公告'), 'home rendered the announcements section');
    const upcoming = await win.webContents.executeJavaScript(`(async () => {
    const snapshot = await window.xmoj.home.snapshot(true)
    return snapshot.countdown.length
  })()`);
    if (upcoming > 0) {
        record(text.includes('倒计时'), 'home rendered the countdown section', `${upcoming} upcoming`);
    }
    else {
        console.log('  (no upcoming events published: countdown section correctly hidden)');
        record(!text.includes('倒计时'), 'countdown section hidden when no events are upcoming');
    }
    record(text.includes('题库') && text.includes('状态'), 'sidebar rendered its navigation');
    record(probe.navItems >= 3, 'sidebar exposes the native views', `items=${probe.navItems}`);
    const sidebarMeasure = () => win.webContents.executeJavaScript(`(() => {
      const sidebar = document.querySelector('[data-slot="sidebar"]')
      const spacer = sidebar ? sidebar.firstElementChild : null
      const panels = sidebar
        ? Array.from(sidebar.children).filter((el) => getComputedStyle(el).position === 'fixed')
        : []
      const panel = panels[0] ?? null
      const inset = document.querySelector('[data-slot="sidebar-inset"]')
      const rect = (el) => {
        if (!el) return null
        const b = el.getBoundingClientRect()
        return { x: Math.round(b.x), w: Math.round(b.width) }
      }
      const items = sidebar ? Array.from(sidebar.querySelectorAll('[data-slot="sidebar-menu-item"]')) : []
      const navItems = items.filter((it) => it.querySelector('[data-slot="tooltip-trigger"]'))
      const iconVisible = (it) => {
        const svg = it.querySelector('svg')
        if (!svg) return false
        const b = svg.getBoundingClientRect()
        return b.width > 0 && b.height > 0
      }
      const inner = panel ? panel.firstElementChild : null
      return {
        state: sidebar ? sidebar.getAttribute('data-state') : null,
        spacer: rect(spacer),
        panel: rect(panel),
        inner: rect(inner),
        panelPosition: panel ? getComputedStyle(panel).position : null,
        inset: rect(inset),
        navCount: navItems.length,
        navVisible: navItems.filter(iconVisible).length,
      }
    })()`);
    const sidebarHover = (type) => win.webContents.executeJavaScript(`(() => {
      const s = document.querySelector('[data-slot="sidebar"]')
      if (s && s.lastElementChild) {
        s.lastElementChild.dispatchEvent(new MouseEvent(${JSON.stringify(type)}, { bubbles: false }))
      }
    })()`);
    const sidebarCollapsed = await sidebarMeasure();
    record(sidebarCollapsed.state === 'collapsed', 'sidebar is collapsed by default', String(sidebarCollapsed.state));
    record(sidebarCollapsed.navVisible === sidebarCollapsed.navCount && sidebarCollapsed.navCount >= 6, 'nav icons remain visible while collapsed', `${sidebarCollapsed.navVisible}/${sidebarCollapsed.navCount}`);
    record(sidebarCollapsed.spacer.w > 0, 'collapsed sidebar keeps an icon rail', `${sidebarCollapsed.spacer.w}px`);
    record(sidebarCollapsed.panel.w === sidebarCollapsed.spacer.w, 'collapsed panel collapses to the icon rail width', `panel=${sidebarCollapsed.panel.w} rail=${sidebarCollapsed.spacer.w}`);
    record(sidebarCollapsed.panelPosition === 'fixed', 'sidebar panel is position:fixed', String(sidebarCollapsed.panelPosition));
    record(sidebarCollapsed.inner.w > sidebarCollapsed.panel.w, 'inner sidebar content keeps its full width while clipped', `inner=${sidebarCollapsed.inner.w} visible=${sidebarCollapsed.panel.w}`);
    await sidebarHover('mouseenter');
    let sidebarExpanded = await sidebarMeasure();
    const expandDeadline = Date.now() + 8000;
    while (Date.now() < expandDeadline) {
        if (sidebarExpanded.state === 'expanded' && sidebarExpanded.panel.w > sidebarExpanded.spacer.w)
            break;
        await wait(400);
        sidebarExpanded = await sidebarMeasure();
    }
    record(sidebarExpanded.state === 'expanded', 'hovering expands the sidebar', String(sidebarExpanded.state));
    record(sidebarExpanded.panel.w > sidebarExpanded.spacer.w, 'expanded panel is wider than the rail', `panel=${sidebarExpanded.panel.w} rail=${sidebarExpanded.spacer.w}`);
    record(sidebarExpanded.panel.x === sidebarCollapsed.panel.x, 'panel anchored edge does not move between states', `${sidebarCollapsed.panel.x} -> ${sidebarExpanded.panel.x}`);
    record(sidebarExpanded.inner.w === sidebarCollapsed.inner.w, 'panel inner layout is identical in both states', `${sidebarCollapsed.inner.w} -> ${sidebarExpanded.inner.w}`);
    record(sidebarExpanded.inset.x === sidebarCollapsed.inset.x &&
        sidebarExpanded.inset.w === sidebarCollapsed.inset.w, 'content offset is identical collapsed vs expanded', `${sidebarCollapsed.inset.x}/${sidebarCollapsed.inset.w} -> ${sidebarExpanded.inset.x}/${sidebarExpanded.inset.w}`);
    await win.webContents.executeJavaScript(`(() => {
    const b = Array.from(document.querySelectorAll('button'))
      .find((x) => /未登录|请登录|@/.test(x.textContent) || x.getAttribute('data-slot') === 'dropdown-menu-trigger')
    if (b) b.click()
  })()`);
    await wait(1400);
    const menuVisible = await win.webContents.executeJavaScript(`!!document.querySelector('[data-slot="dropdown-menu-content"][data-state="open"]')`);
    record(menuVisible, 'footer popover opened');
    await sidebarHover('mouseleave');
    await wait(1800);
    const stillOpen = await sidebarMeasure();
    record(stillOpen.state === 'expanded', 'sidebar stays expanded while the popover is open', String(stillOpen.state));
    await win.webContents.executeJavaScript(`document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))`);
    await wait(1200);
    const popoverGone = await win.webContents.executeJavaScript(`(() => {
    const n = document.querySelector('[data-slot="dropdown-menu-content"][data-state="open"]')
    return !n || n.offsetParent === null
  })()`);
    record(popoverGone, 'footer popover dismissed');
    await sidebarHover('mouseenter');
    await wait(400);
    await win.webContents.executeJavaScript(`document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))`);
    let closedAgain = await sidebarMeasure();
    const closeDeadline = Date.now() + 8000;
    while (Date.now() < closeDeadline && closedAgain.state !== 'collapsed') {
        await wait(400);
        closedAgain = await sidebarMeasure();
    }
    record(closedAgain.state === 'collapsed', 'sidebar collapses after an outside press', String(closedAgain.state));
    console.log('\n  --- rendered text (first 300 chars) ---');
    console.log('  ' + text.slice(0, 300).replace(/\n+/g, ' | '));
    let credentials = null;
    try {
        const raw = readFileSync(path.join(ROOT, 'tests', 'account.txt'), 'utf8');
        const fields = {};
        for (const line of raw.split(/\r?\n/)) {
            const m = line.match(/^\s*([A-Za-z_]+)\s*[:=]\s*(.+?)\s*$/);
            if (m)
                fields[m[1].toLowerCase()] = m[2];
        }
        if (fields.username && fields.password) {
            credentials = { username: fields.username, password: fields.password };
            console.log(`\n  signing in as ${fields.username[0]}***${fields.username.at(-1)}`);
        }
    }
    catch {
        console.log('\n  (tests/account.txt not present: skipping the signed-in flow)');
    }
    if (credentials) {
        const loginResult = await win.webContents.executeJavaScript(`(async () => {
      try {
        const result = await window.xmoj.session.login({
          username: ${JSON.stringify(credentials.username)},
          password: ${JSON.stringify(credentials.password)},
          remember: false,
        })
        return { ok: result.ok, message: result.message ?? null, authenticated: result.state.authenticated }
      } catch (error) {
        return { ok: false, message: String(error), authenticated: false }
      }
    })()`);
        record(loginResult.ok, 'signed in through the app bridge', loginResult.message ?? '');
        record(loginResult.authenticated, 'bridge reports an authenticated session');
        win.webContents.reload();
        await new Promise((resolve) => win.webContents.once('did-finish-load', resolve));
        await wait(6000);
    }
    const afterLogin = await win.webContents.executeJavaScript('document.body.textContent');
    const authenticated = Boolean(credentials) && !/请登录后继续操作/.test(afterLogin);
    const clickFooterItem = async (label) => {
        const before = await win.webContents.executeJavaScript('document.querySelector("h1")?.textContent.trim() ?? null');
        await win.webContents.executeJavaScript(`(() => {
      const trigger = document.querySelector('[data-slot="sidebar"] [data-slot="dropdown-menu-trigger"]')
      if (trigger) trigger.click()
    })()`);
        await wait(800);
        await win.webContents.executeJavaScript(`(() => {
      const item = Array.from(
        document.querySelectorAll('[role="menuitem"], [data-slot="dropdown-menu-item"]'),
      ).find((el) => el.textContent.trim() === ${JSON.stringify(label)})
      if (item) {
        item.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
        item.click()
      }
    })()`);
        const deadline = Date.now() + 30000;
        let heading = null;
        while (Date.now() < deadline) {
            const state = await win.webContents.executeJavaScript(`(() => ({
        heading: document.querySelector('h1')?.textContent.trim() ?? null,
        skeletons: document.querySelectorAll('[data-slot="skeleton"]').length,
        text: document.body.textContent,
      }))()`);
            heading = state.heading;
            if (heading !== null && heading !== before && state.skeletons === 0) {
                return { heading, text: state.text };
            }
            await wait(400);
        }
        return { heading, text: await win.webContents.executeJavaScript('document.body.textContent') };
    };
    const clickSidebar = async (label) => {
        const before = await win.webContents.executeJavaScript('document.querySelector("h1")?.textContent.trim() ?? null');
        await win.webContents.executeJavaScript(`(() => {
      const target = Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent.trim() === ${JSON.stringify(label)})
      if (target) target.click()
    })()`);
        const deadline = Date.now() + 120000;
        let heading = null;
        let settledAt = 0;
        while (Date.now() < deadline) {
            const state = await win.webContents.executeJavaScript(`(() => ({
        heading: document.querySelector('h1')?.textContent.trim() ?? null,
        rows: document.querySelectorAll('tbody tr').length,
        listItems: document.querySelectorAll('.divide-y > button').length,
        skeletons: document.querySelectorAll('[data-slot="skeleton"]').length,
        busy: !!document.querySelector('[aria-busy="true"]'),
        text: document.body.textContent,
      }))()`);
            heading = state.heading;
            const switched = heading !== null && heading !== before;
            const settled = isViewSettled(state);
            if (switched && settled) {
                if (state.rows > 0 || state.listItems > 0)
                    return { heading, rows: state.rows, text: state.text };
                if (!settledAt)
                    settledAt = Date.now();
                if (Date.now() - settledAt > 9000) {
                    return { heading, rows: state.rows, text: state.text };
                }
            }
            await wait(400);
        }
        record(false, `${label} finished loading within 120 seconds`, `heading=${heading}`);
        return {
            heading,
            rows: await win.webContents.executeJavaScript('document.querySelectorAll("tbody tr").length'),
            text: await win.webContents.executeJavaScript('document.body.textContent'),
        };
    };
    if (authenticated) {
        console.log('\n  --- authenticated views ---');
        const problemset = await clickSidebar('题库');
        record(problemset.heading === '题库', 'navigated to 题库', String(problemset.heading));
        record(problemset.rows > 0, '题库 rendered problem rows', `rows=${problemset.rows}`);
        record(/通过率/.test(problemset.text), '题库 shows the acceptance-rate column');
        record(/\d+\s*\/\s*\d+/.test(problemset.text), '题库 shows accepted/total counts');
        const status = await clickSidebar('状态');
        record(status.heading === '状态', 'navigated to 状态', String(status.heading));
        record(status.rows > 0, '状态 rendered submission rows', `rows=${status.rows}`);
        const verdict = (status.text.match(/Accepted|Wrong Answer|Compile Error|Time Limit Exceeded|Runtime Error|Presentation Error/) ?? [])[0];
        record(Boolean(verdict), '状态 shows readable verdict labels', verdict ?? 'none');
        const statusCells = await win.webContents.executeJavaScript(`(() => {
      const row = document.querySelector('tbody tr')
      return row ? Array.from(row.querySelectorAll('td')).map((td) => td.textContent.trim()) : []
    })()`);
        record(statusCells.some((c) => /^\d+(\.\d+)?(KB|MB|GB)$/.test(c)), '状态 renders a memory cell with units', statusCells.join(' | '));
        record(statusCells.some((c) => /^\d+(\.\d+)?(ms|min)$/.test(c) || /^\d+\.\d+s$/.test(c)), '状态 renders a time cell with units', statusCells.join(' | '));
        const firstRow = statusCells;
        console.log('\n  --- first 状态 row as rendered ---');
        console.log('  ' + JSON.stringify(firstRow));
        const headId = firstRow[0];
        const clickButton = async (label) => {
            const clicked = await win.webContents.executeJavaScript(`(() => {
        const b = Array.from(document.querySelectorAll('button'))
          .find((x) => x.textContent.trim() === ${JSON.stringify(label)})
        if (!b || b.disabled) return false
        b.click()
        return true
      })()`);
            if (!clicked)
                return false;
            const deadline = Date.now() + 60000;
            while (Date.now() < deadline) {
                const settled = await win.webContents.executeJavaScript(`(() => {
          const b = Array.from(document.querySelectorAll('button'))
            .find((x) => x.textContent.trim() === ${JSON.stringify(label)})
          return !!b && !b.disabled && !document.querySelector('[aria-busy="true"]')
        })()`);
                if (settled)
                    return true;
                await wait(400);
            }
            console.log(`  (timed out waiting for ${label} to finish loading)`);
            return false;
        };
        const headAfter = () => win.webContents.executeJavaScript('document.querySelector("tbody tr td")?.textContent.trim() ?? null');
        record(await clickButton('下一页'), '状态 下一页 is enabled and clickable');
        const page2Head = await headAfter();
        record(page2Head !== null && Number(page2Head) < Number(headId), '状态 下一页 advanced to older submissions', `${headId} -> ${page2Head}`);
        record(await clickButton('上一页'), '状态 上一页 is enabled and clickable');
        record((await headAfter()) === headId, '状态 上一页 returned to the first page');
        const avatar = await win.webContents.executeJavaScript(`(async () => {
      const info = await window.xmoj.session.avatar()
      const img = document.querySelector('img[src*="cravatar"]')
      return {
        hash: info?.hash ?? null,
        url: info?.url ?? null,
        rendered: img ? { complete: img.complete, natural: img.naturalWidth } : null,
      }
    })()`);
        record(/^[0-9a-f]{32}$/.test(avatar.hash ?? ''), 'avatar hash is a lower-case MD5', String(avatar.hash));
        record((avatar.url ?? '').includes('cravatar') && (avatar.url ?? '').includes('retro=1'), 'avatar URL uses cravatar with retro=1', avatar.url ?? 'none');
        record(Boolean(avatar.rendered?.complete && avatar.rendered?.natural > 0), 'sidebar avatar image actually loaded', JSON.stringify(avatar.rendered));
    }
    else {
        console.log('\n  (not signed in: asserting the login gate instead)');
        record(/登录/.test(afterLogin), 'unauthenticated UI shows a sign-in prompt');
        const passwordInputs = await win.webContents.executeJavaScript('document.querySelectorAll("input[type=password]").length');
        record(passwordInputs > 0, 'sign-in form has a password field', `inputs=${passwordInputs}`);
    }
    console.log('\n  --- home page details ---');
    await win.webContents.executeJavaScript(`(() => {
    const b = Array.from(document.querySelectorAll('button'))
      .find((x) => x.textContent.trim() === '首页')
    if (b) b.click()
  })()`);
    await wait(6000);
    await win.webContents.executeJavaScript(`(() => {
    const s = document.querySelector('[data-slot="sidebar"]')
    if (s && s.lastElementChild) {
      s.lastElementChild.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }))
    }
  })()`);
    await wait(2200);
    const home = await win.webContents.executeJavaScript(`(() => {
    const banners = Array.from(document.querySelectorAll('[data-slot="promo-banner"]'))
      .map((banner) => {
        const img = banner.querySelector('img')
        if (!img) return null
        return {
          h: Math.round(img.getBoundingClientRect().height),
          fit: getComputedStyle(img).objectFit,
          complete: img.complete,
          natural: img.naturalWidth,
          src: img.src.split('/').pop(),
        }
      })
      .filter(Boolean)
    const body = document.querySelector('.announcement-body')
    return {
      banners,
      hasAnnouncementBody: !!body,
      katexCss: Array.from(document.styleSheets).some((sh) => {
        try { return Array.from(sh.cssRules || []).some((r) => /katex/i.test(r.cssText || '')) } catch { return false }
      }),
      spacerWidth: Math.round(
        document.querySelector('[data-slot="sidebar"]')?.firstElementChild
          ?.getBoundingClientRect().width ?? -1,
      ),
      collapsedPanelWidth: Math.round(
        Array.from(document.querySelector('[data-slot="sidebar"]')?.children ?? [])
          .filter((el) => getComputedStyle(el).position === 'fixed')
          .map((el) => el.getBoundingClientRect().width)[0] ?? -1,
      ),
    }
  })()`);
    record(home.banners.length > 0, '推荐 banners present', String(home.banners.length));
    record(home.banners.every((b) => b.h > 100 && b.complete && b.natural > 0), '推荐 banners loaded with a real height', JSON.stringify(home.banners));
    record(home.banners.every((b) => b.fit === 'contain'), '推荐 banners are not cropped');
    record(home.hasAnnouncementBody, '公告 rendered through the markdown pipeline');
    record(home.katexCss, 'KaTeX stylesheet loaded');
    record(home.spacerWidth === 48, 'sidebar reserves a constant icon rail (content never shifts)', `${home.spacerWidth}px`);
    record(home.collapsedPanelWidth === 48, 'collapsed panel stays at rail width so icons remain visible', `${home.collapsedPanelWidth}px`);
    const communityRowCount = () => win.webContents.executeJavaScript(`(() => {
      const list = document.querySelector('.divide-y')
      return list ? list.children.length : 0
    })()`);
    console.log('\n  --- community ---');
    const bridgeKeys = await win.webContents.executeJavaScript('Object.keys(window.xmoj).join(",")');
    record(['bbs', 'mail', 'notices', 'problem', 'submit'].every((k) => bridgeKeys.includes(k)), 'bridge exposes the community namespaces', bridgeKeys);
    const navDiag = await win.webContents.executeJavaScript(`(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const target = buttons.find((b) => b.textContent.trim() === '讨论')
    return {
      heading: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : null,
      found: !!target,
    }
  })()`);
    record(navDiag.found, 'sidebar exposes a 讨论 entry', JSON.stringify(navDiag));
    await clickSidebar('讨论');
    await wait(4000);
    const discussionHeading = await win.webContents.executeJavaScript('document.querySelector("h1")?.textContent.trim() ?? null');
    record(discussionHeading === '讨论', 'navigated to 讨论', String(discussionHeading));
    const postRows = await communityRowCount();
    record(postRows > 0, '讨论 rendered post rows', `rows=${postRows}`);
    const discussionText = await win.webContents.executeJavaScript('document.body.textContent');
    record(!/加载失败|请先登录后再使用/.test(discussionText), '讨论 loaded without error');
    await win.webContents.executeJavaScript(`(() => {
    const list = document.querySelector('.divide-y')
    const first = list ? list.querySelector('button') : null
    if (first) first.click()
  })()`);
    await wait(6000);
    const threadText = await win.webContents.executeJavaScript('document.body.textContent');
    record(/回复/.test(threadText), 'thread view shows the reply form');
    record((await win.webContents.executeJavaScript('document.querySelectorAll("textarea").length')) > 0, 'thread view has a reply textarea');
    await clickFooterItem('短消息');
    await wait(6000);
    const mailHeading = await win.webContents.executeJavaScript('document.querySelector("h1")?.textContent.trim() ?? null');
    record(mailHeading === '短消息', 'navigated to 短消息', String(mailHeading));
    const mailText = await win.webContents.executeJavaScript('document.body.textContent');
    record(/新建会话|还没有会话/.test(mailText) && !/加载失败/.test(mailText), '短消息 rendered its list/empty state without error');
    console.log('\n  --- problem cards ---');
    await clickSidebar('题库');
    await wait(2500);
    const openedFromList = await win.webContents.executeJavaScript(`(() => {
    const row = document.querySelector('tbody tr')
    if (!row) return false
    row.click()
    return true
  })()`);
    record(openedFromList, 'clicking a 题库 row opens the statement');
    let controlsReady = false;
    const controlsDeadline = Date.now() + 20000;
    while (Date.now() < controlsDeadline) {
        controlsReady = await win.webContents.executeJavaScript(`!!document.getElementById('problem-view-id')`);
        if (controlsReady)
            break;
        await wait(500);
    }
    record(controlsReady, 'problem view rendered its controls');
    await wait(4000);
    await win.webContents.executeJavaScript(`(() => {
    const input = document.getElementById('problem-view-id')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(input, '1841')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })()`);
    await wait(500);
    await win.webContents.executeJavaScript(`(() => {
    const button = Array.from(document.querySelectorAll('button')).find((b) => /载入/.test(b.textContent))
    if (button) button.click()
  })()`);
    let cardState = { cards: 0, chips: 0, pre: 0, titles: [], copies: [], escaped: false };
    const cardDeadline = Date.now() + 30000;
    while (Date.now() < cardDeadline) {
        cardState = await win.webContents.executeJavaScript(`(() => {
      const cards = Array.from(document.querySelectorAll('[data-slot="problem-card"]'))
      const head = document.querySelector('[data-slot="problem-head"]')
      return {
        cards: cards.length,
        chips: head ? head.querySelectorAll('span.rounded-md').length : 0,
        pre: cards.reduce((n, c) => n + c.querySelectorAll('pre').length, 0),
        titles: cards.map((c) => c.querySelector('h2')?.textContent.trim() ?? ''),
        copies: cards.map((c) => Array.from(c.querySelectorAll('button')).some((b) => /复制/.test(b.textContent))),
        escaped: cards.some((c) => /&lt;|&gt;|&amp;/.test(c.textContent)),
      }
    })()`);
        if (cardState.cards > 1 && cardState.chips > 0 && cardState.pre > 0)
            break;
        await wait(600);
    }
    record(cardState.cards >= 4, '题目 rendered one card per .cnt-row', `cards=${cardState.cards}`);
    record(cardState.chips >= 4, '题目 rendered the problem info header', `chips=${cardState.chips}`);
    record(Array.isArray(cardState.copies) && cardState.copies.length > 0 && cardState.copies.every(Boolean), 'every statement card has a copy button', JSON.stringify(cardState.copies));
    record(cardState.pre >= 2, 'sample boxes rendered inside a card', `pre=${cardState.pre}`);
    record(Array.isArray(cardState.titles) && cardState.titles.includes('题目描述'), 'card titles come from .cnt-row-head', JSON.stringify(cardState.titles));
    record(!cardState.escaped, 'statement entities are decoded, not shown as &lt;');
    console.log('\n  --- native navigation ---');
    const shellState = await win.webContents.executeJavaScript(`(() => ({
    webviews: document.querySelectorAll('webview').length,
    blankTargets: document.querySelectorAll('a[target="_blank"]').length,
    sidebarEntries: Array.from(document.querySelectorAll('[data-slot="sidebar"] button'))
      .map((b) => b.textContent.trim())
      .filter(Boolean),
  }))()`);
    record(shellState.webviews === 0, 'no in-app browser webview remains');
    record(shellState.blankTargets === 0, 'no link opens a browser tab', `${shellState.blankTargets}`);
    record(!shellState.sidebarEntries.some((label) => /站内浏览/.test(label)), 'the 站内浏览 entry is gone', JSON.stringify(shellState.sidebarEntries));
    await clickSidebar('竞赛&作业');
    await wait(7000);
    await win.webContents.executeJavaScript(`(() => {
    const list = document.querySelector('.divide-y')
    const first = list ? list.querySelector('button') : null
    if (first) first.click()
  })()`);
    await wait(7000);
    const rankOpened = await win.webContents.executeJavaScript(`(() => {
    const button = Array.from(document.querySelectorAll('button')).find((b) => /OI 排名/.test(b.textContent))
    if (!button) return false
    button.click()
    return true
  })()`);
    record(rankOpened, 'contest detail offers the native OI ranking');
    let rankTable = { rows: 0, headers: 0, text: '' };
    const rankDeadline = Date.now() + 25000;
    while (Date.now() < rankDeadline) {
        rankTable = await win.webContents.executeJavaScript(`(() => {
      const rows = document.querySelectorAll('table tbody tr').length
      const text = document.body.textContent
      return { rows, headers: document.querySelectorAll('table thead th').length, text: text.slice(0, 120) }
    })()`);
        if (rankTable.rows > 0)
            break;
        await wait(700);
    }
    record(rankTable.rows > 0, 'ranking table rendered rows', `rows=${rankTable.rows}`);
    record(!/加载失败/.test(rankTable.text), 'ranking loaded without error');
    await win.webContents.executeJavaScript(`(() => {
    const close = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '关闭')
    if (close) close.click()
  })()`);
    await wait(1500);
    if (authenticated) {
        console.log('\n  --- signed-out footer menu ---');
        await win.webContents.executeJavaScript('window.xmoj.session.logout()');
        win.webContents.reload();
        await new Promise((resolve) => win.webContents.once('did-finish-load', resolve));
        await wait(7000);
        await win.webContents.executeJavaScript(`(() => {
      const trigger = document.querySelector('[data-slot="sidebar"] [data-slot="dropdown-menu-trigger"]')
        ?? Array.from(document.querySelectorAll('button')).find((x) => /未登录|请登录/.test(x.textContent))
      if (!trigger) return
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, isPrimary: true }))
      trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, isPrimary: true }))
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    })()`);
        await wait(1500);
        const menu = await win.webContents.executeJavaScript('document.querySelector(\'[role="menu"], [data-slot="dropdown-menu-content"]\')?.textContent ?? null');
        record(/登录/.test(menu ?? ''), 'signed-out menu offers 登录', menu ?? 'none');
        record(!/重新登录/.test(menu ?? ''), 'signed-out menu no longer says 重新登录');
        await win.webContents.executeJavaScript(`(() => {
      const item = Array.from(document.querySelectorAll('[role="menuitem"], [data-slot="dropdown-menu-item"]'))
        .find((x) => x.textContent.trim() === '登录')
      if (!item) return
      item.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, isPrimary: true }))
      item.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, isPrimary: true }))
      item.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    })()`);
        await wait(3000);
        const signIn = await win.webContents.executeJavaScript(`({
      password: document.querySelectorAll('input[type=password]').length,
      heading: /登录小明的 OJ/.test(document.body.textContent),
    })`);
        record(signIn.password > 0 && signIn.heading, 'clicking 登录 actually shows the sign-in form', JSON.stringify(signIn));
    }
    const errors = logs.filter((l) => /renderer:3|uncaught|failed to/i.test(l));
    record(errors.length === 0, 'no renderer errors', errors.slice(0, 3).join(' || '));
    console.log(`\n${failures.length === 0 ? 'ALL E2E CHECKS PASSED' : `${failures.length} E2E CHECK(S) FAILED: ${failures.join(', ')}`}\n`);
    app.exit(failures.length === 0 ? 0 : 1);
});
