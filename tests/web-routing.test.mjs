import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseWebRoute, pathForWebRoute, VIEWS } from '../src/stores/web-route.ts';

const pageUrl = (path) => new URL(path, 'https://webxmoj.example');

test('all Web views have stable direct-load routes', () => {
    for (const view of VIEWS) {
        const path = pathForWebRoute({ view: view.id, problemId: 0, contestId: 0, thread: null });
        assert.equal(parseWebRoute(pageUrl(path)).view, view.id, `${view.id} route`);
    }
});

test('problem and submission routes retain their problem IDs', () => {
    for (const view of ['problem', 'submit']) {
        const route = parseWebRoute(pageUrl(`/${view}/1234`));
        assert.equal(route.view, view);
        assert.equal(route.problemId, 1234);
        assert.equal(pathForWebRoute(route), `/${view}/1234`);
    }
    assert.equal(parseWebRoute(pageUrl('/problem?id=42')).problemId, 42);
});

test('contest submission routes preserve contest and problem context', () => {
    const route = parseWebRoute(pageUrl('/submit/1234?contest=52'));
    assert.equal(route.view, 'submit');
    assert.equal(route.problemId, 1234);
    assert.equal(route.contestId, 52);
    assert.equal(pathForWebRoute(route), '/submit/1234?contest=52');
});

test('contest and contest-problem routes retain both IDs', () => {
    const contest = parseWebRoute(pageUrl('/contests/52'));
    assert.equal(contest.view, 'contests');
    assert.equal(contest.contestId, 52);
    assert.equal(pathForWebRoute(contest), '/contests/52');

    const problem = parseWebRoute(pageUrl('/contests/52/problems/901'));
    assert.equal(problem.view, 'problem');
    assert.equal(problem.contestId, 52);
    assert.equal(problem.problemId, 901);
    assert.equal(pathForWebRoute(problem), '/contests/52/problems/901');
});

test('discussion thread routes retain the post and page', () => {
    const route = parseWebRoute(pageUrl('/discussion/88?page=3'));
    assert.deepEqual(route.thread, { postId: 88, page: 3 });
    assert.equal(pathForWebRoute(route), '/discussion/88?page=3');
});

test('Web CSP allows Turnstile scripts, frames, and connections', async () => {
    const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
    const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1];
    assert.ok(csp);
    for (const directive of ['script-src', 'frame-src', 'connect-src']) {
        assert.match(csp, new RegExp(`${directive}[^;]*https://challenges\\.cloudflare\\.com`));
    }
});

test('the Pages build denies framing through response headers', async () => {
    const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
    assert.match(headers, /^\s*Content-Security-Policy:\s*frame-ancestors 'none'\s*$/m);
    assert.match(headers, /^\s*X-Frame-Options:\s*DENY\s*$/m);
});

test('the Pages build keeps SPA deep links on the automatic index.html fallback', async () => {
    for (const relative of ['../public/404.html', '../web/404.html']) {
        await assert.rejects(readFile(new URL(relative, import.meta.url)), /ENOENT/);
    }
});
