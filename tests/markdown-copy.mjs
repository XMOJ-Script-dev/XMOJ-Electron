import { app, BrowserWindow } from 'electron';
import { mkdtempSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import assert from 'node:assert/strict';
import path from 'node:path';
const tempRoot = process.platform === 'win32' && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode') : app.getPath('temp');
app.setPath('userData', mkdtempSync(path.join(tempRoot, 'markdown-copy-')));
app.whenReady().then(async () => {
const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } });
try {
    await win.loadURL('about:blank');
    const source = stripTypeScriptTypes(readFileSync(new URL('../src/lib/markdown-copy.ts', import.meta.url), 'utf8')).replace('export function', 'function');
    const convert = html => win.webContents.executeJavaScript(`(() => { ${source}; return htmlToMarkdown(${JSON.stringify(html)}); })()`);
    assert.equal(await convert('<p>\n\t第一段。\n</p>\n\n<p>\t第二段 $x_1$。</p>'), '第一段。\n\n第二段 $x_1$。');
    assert.equal(await convert('<p>程序</p><pre>\tint x;\n\n\n\treturn 0;</pre><p>结束</p>'), '程序\n\n```\n\tint x;\n\n\n\treturn 0;\n```\n\n结束');
    assert.equal(await convert('<p><strong>粗体</strong><br>下一行 <a href="https://example.com">链接</a></p>'), '**粗体**\n下一行 [链接](https://example.com)');
    assert.equal(await convert('<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>'), '| A | B |\n| --- | --- |\n| 1 | 2 |');
    assert.equal(await convert('<ul><li>一</li><li>二</li></ul>'), '- 一\n- 二');
    assert.equal(await convert('<strong>公告</strong><br><br>\n- 第一条<br><br>\n- 第二条<p>\t补充</p>'), '**公告**\n\n- 第一条\n\n- 第二条\n\n补充');
    assert.equal(await convert('第一段<br> 第二段<br>\t第三段'), '第一段\n第二段\n第三段');
    assert.equal(await convert('<p>第一段</p> \n<p>第二段</p> \n 第三段'), '第一段\n\n第二段\n\n第三段');
    assert.equal(await convert('  普通文本\n\n\n  下一段\n\n  - 嵌套列表'), '普通文本\n\n下一段\n\n  - 嵌套列表');
    const enterSource = stripTypeScriptTypes(readFileSync(new URL('../src/lib/enter-submit.ts', import.meta.url), 'utf8')).replaceAll('export function', 'function');
    const enter = await win.webContents.executeJavaScript(`(() => {
        ${enterSource};
        const form=document.createElement('form'), textarea=document.createElement('textarea'), button=document.createElement('button');
        button.type='submit'; form.append(textarea,button); document.body.append(form);
        let count=0; form.addEventListener('submit',e=>{e.preventDefault();count++}); textarea.addEventListener('keydown',submitOnEnter);
        const key=options=>{const event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true,...options});textarea.dispatchEvent(event);return event.defaultPrevented};
        const plain=key({}), shift=key({shiftKey:true}), ime=key({isComposing:true}), repeat=key({repeat:true});
        const input=document.createElement('input'); form.prepend(input); input.addEventListener('keydown',submitOnEnter);
        const inputKey=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});input.dispatchEvent(inputKey);
        button.disabled=true; const disabled=key({}); form.remove();
        return {plain,shift,ime,repeat,disabled,input:inputKey.defaultPrevented,count};
    })()`);
    assert.deepEqual(enter, { plain: true, shift: false, ime: false, repeat: false, disabled: true, input: true, count: 2 });
    const markdownEnter = await win.webContents.executeJavaScript(`(() => {
        ${enterSource};
        const form=document.createElement('form'), textarea=document.createElement('textarea'), button=document.createElement('button');
        textarea.dataset.enterSubmit='ctrl'; button.type='submit'; form.append(textarea,button); document.body.append(form);
        let count=0; form.addEventListener('submit',e=>{e.preventDefault();count++});
        document.addEventListener('keydown',submitOnEnter);
        const key=options=>{const event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true,...options});textarea.dispatchEvent(event);return event.defaultPrevented};
        const plain=key({}), ctrl=key({ctrlKey:true}), shift=key({shiftKey:true}), ime=key({ctrlKey:true,isComposing:true}), legacyIme=key({ctrlKey:true,keyCode:229}), repeat=key({ctrlKey:true,repeat:true}), alt=key({ctrlKey:true,altKey:true}), meta=key({metaKey:true}), ctrlShift=key({ctrlKey:true,shiftKey:true});
        button.disabled=true; const disabled=key({ctrlKey:true});
        button.disabled=false; textarea.readOnly=true; const readOnly=key({ctrlKey:true});
        textarea.readOnly=false; textarea.disabled=true; const locked=key({ctrlKey:true});
        document.removeEventListener('keydown',submitOnEnter); form.remove();
        return {plain,ctrl,shift,ime,legacyIme,repeat,alt,meta,ctrlShift,disabled,readOnly,locked,count};
    })()`);
    assert.deepEqual(markdownEnter, { plain: false, ctrl: true, shift: false, ime: false, legacyIme: false, repeat: false, alt: false, meta: false, ctrlShift: false, disabled: true, readOnly: false, locked: false, count: 1 });
    console.log('Markdown copy DOM regressions passed (paragraphs, tabs, code, links, tables, lists).');
    app.exit(0);
} catch (error) {
    console.error(error);
    app.exit(1);
}
});
