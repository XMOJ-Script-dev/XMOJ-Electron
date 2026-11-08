import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseWebRoute, pathForWebRoute, VIEWS } from '../src/stores/navigation.ts';

const pageUrl = (path) => new URL(path, 'https://webxmoj.example');

test('all Web views have stable direct-load routes', () => {
    for (const view of VIEWS) {
        const path = pathForWebRoute({ view: view.id, problemId: 0, thread: null });
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
