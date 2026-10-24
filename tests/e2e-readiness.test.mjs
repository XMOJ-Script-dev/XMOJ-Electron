import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isViewSettled } from './lib/e2e-readiness.mjs';

const state = { busy: false, skeletons: 0, rows: 0, listItems: 0, text: '竞赛&作业 共 104 场比赛' };

test('contest button lists settle without table rows or empty-state text', () => {
    assert.equal(isViewSettled({ ...state, listItems: 20 }), true);
});

test('table rows and empty states still settle', () => {
    assert.equal(isViewSettled({ ...state, rows: 20 }), true);
    assert.equal(isViewSettled({ ...state, text: '没有比赛' }), true);
});

test('cached lists remain unsettled during refresh', () => {
    assert.equal(isViewSettled({ ...state, listItems: 20, busy: true }), false);
    assert.equal(isViewSettled({ ...state, listItems: 20, skeletons: 6 }), false);
});

test('heading alone is not a loaded view', () => {
    assert.equal(isViewSettled(state), false);
});
