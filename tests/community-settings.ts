import { createServer } from 'node:http';
import { CommunityApi, createMemoryTokenStore } from '../electron/community.ts';
import { HttpClient } from '../electron/http.ts';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
const received: {
    action: string;
    body: string;
}[] = [];
let stored = '{"theme":"dark","animations":false,"autoRefreshSeconds":30}';
const server = createServer((request, response) => {
    let raw = '';
    request.on('data', (chunk) => {
        raw += chunk;
    });
    request.on('end', () => {
        const url = new URL(request.url ?? '/', 'http://127.0.0.1');
        const action = url.pathname.split('/').filter(Boolean).pop() ?? '';
        received.push({ action, body: raw });
        let payload: {
            Authentication?: Record<string, unknown>;
            Data?: Record<string, unknown>;
        } = {};
        try {
            payload = JSON.parse(raw) as typeof payload;
        }
        catch {
        }
        response.setHeader('Content-Type', 'application/json');
        if (action === 'Login') {
            response.end(JSON.stringify({ Success: true, Message: '', Data: { Token: 'stub-token' } }));
            return;
        }
        if (action === 'SetUserSettings') {
            stored = String(payload.Data?.Settings ?? '');
            response.end(JSON.stringify({ Success: true, Message: '', Data: {} }));
            return;
        }
        if (action === 'GetUserSettings') {
            response.end(JSON.stringify({ Success: true, Message: '', Data: { Settings: stored } }));
            return;
        }
        response.end(JSON.stringify({ Success: false, Message: 'unknown action', Data: {} }));
    });
});
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const baseUrl = `http://127.0.0.1:${port}/api/`;
const http = new HttpClient();
const api = new CommunityApi(http, createMemoryTokenStore(), baseUrl);
const credentials = { sessionId: 'sid', username: 'tester' };
console.log('\n=== SetUserSettings ===');
{
    const settings = { theme: 'light', animations: true, autoRefreshSeconds: 15 };
    const result = await api.setUserSettings(credentials, settings);
    check('call succeeded', result.Success === true, (result as {
        Message?: string;
    }).Message ?? '');
    const pushed = received.find((entry) => entry.action === 'SetUserSettings');
    check('request reached the backend', Boolean(pushed));
    const body = (() => {
        try {
            return JSON.parse(pushed?.body ?? '{}') as {
                Data?: {
                    Settings?: unknown;
                };
                Authentication?: Record<string, unknown>;
            };
        }
        catch {
            return {};
        }
    })();
    const rawSettings = body.Data?.Settings;
    check('a Settings value was sent', rawSettings !== undefined, String(rawSettings));
    check('Settings is a JSON string, not an object', typeof rawSettings === 'string', typeof rawSettings);
    check('Settings is not "[object Object]"', rawSettings !== '[object Object]', String(rawSettings));
    check('Settings parses back to the same values', (() => {
        try {
            const parsed = JSON.parse(String(rawSettings)) as Record<string, unknown>;
            return (parsed.theme === 'light' &&
                parsed.animations === true &&
                parsed.autoRefreshSeconds === 15);
        }
        catch {
            return false;
        }
    })(), String(rawSettings));
    check('numbers keep their type through the round trip', (JSON.parse(String(rawSettings)) as Record<string, unknown>).autoRefreshSeconds === 15, typeof (JSON.parse(String(rawSettings)) as Record<string, unknown>).autoRefreshSeconds);
    check('an auth token was sent', body.Authentication?.Token === 'stub-token', JSON.stringify(body.Authentication));
    check('Action is SetUserSettings', pushed?.action === 'SetUserSettings');
}
console.log('\n=== GetUserSettings ===');
{
    const result = await api.getUserSettings(credentials);
    check('call succeeded', result.Success === true, (result as {
        Message?: string;
    }).Message ?? '');
    const settings = result.Data?.Settings;
    check('settings returned as an object', Boolean(settings) && typeof settings === 'object', typeof settings);
    check('theme available directly', settings?.theme === 'light', String(settings?.theme));
    check('boolean available directly', settings?.animations === true, String(settings?.animations));
    check('number available directly', settings?.autoRefreshSeconds === 15, String(settings?.autoRefreshSeconds));
}
console.log('\n=== the value the backend stored is what a later read sees ===');
{
    const written = { theme: 'auto', confirmLeave: true };
    await api.setUserSettings(credentials, written);
    const readBack = await api.getUserSettings(credentials);
    const settings = readBack.Data?.Settings;
    check('written settings survive a read', settings?.theme === 'auto' && settings?.confirmLeave === true, JSON.stringify(settings));
}
console.log('\n=== corrupt stored settings degrade to empty ===');
{
    stored = 'not json at all';
    const result = await api.getUserSettings(credentials);
    check('a corrupt value yields {} rather than throwing', JSON.stringify(result.Data?.Settings) === '{}', JSON.stringify(result.Data?.Settings));
    stored = '';
    const empty = await api.getUserSettings(credentials);
    check('an empty value yields {}', JSON.stringify(empty.Data?.Settings) === '{}', JSON.stringify(empty.Data?.Settings));
}
await new Promise<void>((resolve) => server.close(() => resolve()));
console.log(`\n${failures === 0 ? 'ALL CLOUD SETTINGS CHECKS PASSED' : `${failures} CLOUD SETTINGS CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
