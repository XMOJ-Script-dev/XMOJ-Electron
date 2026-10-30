// Store state-machine tests: navigation / mail-target / panel / dialog / preferences.
// Run: node --experimental-strip-types --loader ./tests/loader-stores.mjs tests/stores.ts
//
// All data is inline-synthetic; the only "environment" faked here is the minimal
// DOM surface (window.matchMedia / documentElement / localStorage) that
// preferences.ts touches at module scope.

let failures = 0;
let passes = 0;
function check(label: string, condition: boolean, detail = '') {
    if (condition)
        passes++;
    else
        failures++;
    const status = condition ? 'PASS' : 'FAIL';
    console.log(`  [${status}] ${label}${condition ? '' : ` :: ${detail}`}`);
}

// ---------- minimal DOM environment for src/stores/preferences.ts ----------
const g = globalThis as Record<string, any>;
const mediaListeners: Array<() => void> = [];
let mediaMatches = false;
const rootClasses = new Set<string>();
const rootStyle: Record<string, string> = {};
const rootDataset: Record<string, string> = {};
const storageMap = new Map<string, string>();

g.localStorage = {
    getItem: (key: string) => (storageMap.has(key) ? storageMap.get(key)! : null),
    setItem: (key: string, value: string) => void storageMap.set(key, String(value)),
    removeItem: (key: string) => void storageMap.delete(key),
    clear: () => storageMap.clear(),
};
g.window = {
    matchMedia: (query: string) => ({
        get matches() {
            return mediaMatches;
        },
        media: query,
        addEventListener: (_event: string, cb: () => void) => void mediaListeners.push(cb),
        removeEventListener: () => undefined,
    }),
};
g.document = {
    documentElement: {
        classList: {
            toggle: (cls: string, force?: boolean) => {
                const on = force ?? !rootClasses.has(cls);
                if (on)
                    rootClasses.add(cls);
                else
                    rootClasses.delete(cls);
                return on;
            },
            contains: (cls: string) => rootClasses.has(cls),
        },
        style: rootStyle,
        dataset: rootDataset,
    },
};
const KEY = 'xmoj.preferences.v1';

// ---------- imports (after globals; stores import the stubbed 'vue') ----------
const navigation = await import('../src/stores/navigation.ts');
const mailTarget = await import('../src/stores/mail-target.ts');
const panel = await import('../src/stores/panel.ts');
const dialog = await import('../src/stores/dialog.ts');
const prefs = await import('../src/stores/preferences.ts');

// ============================ navigation ============================
console.log('\n=== navigation: view switching ===');
{
    const a = navigation.useNavigation();
    const b = navigation.useNavigation();
    check('initial view is home', a.currentView.value === 'home', String(a.currentView.value));
    a.navigate('problemset');
    check('navigate sets currentView', a.currentView.value === 'problemset', String(a.currentView.value));
    check('state is module-level singleton (b sees a change)', b.currentView.value === 'problemset', String(b.currentView.value));
    check('initial activeContest is null', a.activeContest.value === null);
    check('initial activeThread is null', a.activeThread.value === null);
    check('views registry covers submit/discussion', a.views.some((v) => v.id === 'submit') && a.views.some((v) => v.id === 'discussion'));
}
console.log('\n=== navigation: viewProblem / activeProblem semantics ===');
{
    const nav = navigation.useNavigation();
    nav.viewProblem(1000);
    check('viewProblem sets activeProblemId', nav.activeProblemId.value === 1000, String(nav.activeProblemId.value));
    check('viewProblem switches to problem view', nav.currentView.value === 'problem', String(nav.currentView.value));
    check('viewProblem does not touch contest context', nav.activeContest.value === null);
    nav.navigate('home');
    check('activeProblemId persists across unrelated navigation', nav.activeProblemId.value === 1000, String(nav.activeProblemId.value));
}
console.log('\n=== navigation: submitProblem contest context ===');
{
    const nav = navigation.useNavigation();
    nav.submitProblem(1001, { contestId: 10786, contestPid: 3 });
    check('submitProblem sets problem id', nav.activeProblemId.value === 1001, String(nav.activeProblemId.value));
    check('submitProblem switches to submit view', nav.currentView.value === 'submit', String(nav.currentView.value));
    check('contest context stored', JSON.stringify(nav.activeContest.value) === JSON.stringify({ contestId: 10786, contestPid: 3 }), JSON.stringify(nav.activeContest.value));
    nav.submitProblem(1002);
    check('submitProblem without contest clears activeContest', nav.activeContest.value === null, JSON.stringify(nav.activeContest.value));
    nav.submitProblem(1003, null);
    check('submitProblem with explicit null clears activeContest', nav.activeContest.value === null, JSON.stringify(nav.activeContest.value));
    nav.submitProblem(1004, { contestId: 5, contestPid: 1 });
    check('contest context restored on next submit', nav.activeContest.value?.contestId === 5, JSON.stringify(nav.activeContest.value));
}
console.log('\n=== navigation: viewThread ===');
{
    const nav = navigation.useNavigation();
    nav.viewThread(42);
    check('viewThread defaults page to 1', JSON.stringify(nav.activeThread.value) === JSON.stringify({ postId: 42, page: 1 }), JSON.stringify(nav.activeThread.value));
    check('viewThread switches to discussion view', nav.currentView.value === 'discussion', String(nav.currentView.value));
    nav.viewThread(77, 3);
    check('viewThread honors explicit page', JSON.stringify(nav.activeThread.value) === JSON.stringify({ postId: 77, page: 3 }), JSON.stringify(nav.activeThread.value));
}

// ============================ mail-target ============================
console.log('\n=== mail-target: set/clear semantics ===');
{
    const a = mailTarget.useMailTarget();
    const b = mailTarget.useMailTarget();
    check('initial target is null', a.targetUser.value === null);
    a.setTarget('alice');
    check('setTarget stores username', a.targetUser.value === 'alice', String(a.targetUser.value));
    check('target shared across hook instances', b.targetUser.value === 'alice', String(b.targetUser.value));
    b.setTarget('bob');
    check('setTarget overwrites previous target', a.targetUser.value === 'bob', String(a.targetUser.value));
    a.clearTarget();
    check('clearTarget resets to null', a.targetUser.value === null && b.targetUser.value === null);
    a.setTarget('');
    check('empty-string target is stored as-is (callers guard)', a.targetUser.value === '', JSON.stringify(a.targetUser.value));
    a.clearTarget();
}

// ============================ panel ============================
console.log('\n=== panel: open/close/switch ===');
{
    const p = panel.usePanel();
    check('initial kind is null (closed)', p.kind.value === null, String(p.kind.value));
    p.openRank(10786, '周五赛', false);
    check('openRank sets kind', p.kind.value === 'rank', String(p.kind.value));
    check('openRank stores contestId/title/oi', p.rankContestId.value === 10786 && p.rankTitle.value === '周五赛' && p.rankOi.value === false, JSON.stringify([p.rankContestId.value, p.rankTitle.value, p.rankOi.value]));
    p.openRank(1, 'x');
    check('openRank defaults oi to true', p.rankOi.value === true, String(p.rankOi.value));
    p.openSource(1623001);
    check('openSource switches kind', p.kind.value === 'source', String(p.kind.value));
    check('openSource defaults title to 提交 #id', p.sourceTitle.value === '提交 #1623001', p.sourceTitle.value);
    check('openSource stores solutionId', p.sourceSolutionId.value === 1623001, String(p.sourceSolutionId.value));
    p.close();
    check('close resets kind to null', p.kind.value === null, String(p.kind.value));
}
console.log('\n=== panel: openSource language mapping ===');
{
    const p = panel.usePanel();
    const cases: Array<[string, number]> = [
        ['C++', 1],
        ['C', 0],
        ['C (gcc)', 0],
        ['Python 3', 3],
        ['PyPy', 1],
        ['Python', 3],
        ['Python3', 3],
        ['JavaScript', 6],
        ['Node.js', 6],
        ['Java', 4],
        ['Pascal', 2],
        ['C#', 5],
        ['csharp', 5],
    ];
    for (const [lang, code] of cases) {
        p.openSource(1, 't', lang);
        check(`language "${lang}" -> ${code}`, p.sourceLanguage.value === code, String(p.sourceLanguage.value));
    }
    p.openSource(9, '自定义标题', 'Java');
    check('explicit title wins over default', p.sourceTitle.value === '自定义标题', p.sourceTitle.value);
    check('source params do not disturb rank params', p.rankContestId.value === 1, String(p.rankContestId.value));
}
console.log('\n=== panel: openProfile ===');
{
    const p = panel.usePanel();
    p.openProfile('alice');
    check('openProfile sets kind', p.kind.value === 'profile', String(p.kind.value));
    check('openProfile stores username', p.profileUsername.value === 'alice', p.profileUsername.value);
    p.openRank(2, 'y');
    check('panel switches between kinds', p.kind.value === 'rank' && p.profileUsername.value === 'alice');
    p.close();
}

// ============================ dialog ============================
console.log('\n=== dialog: show/close resolution semantics ===');
{
    const req = { title: '确认', message: '确定吗？', buttons: [{ id: 'ok', label: '确定' }, { id: 'cancel', label: '取消' }], cancelId: 'cancel' };
    let resolved: { buttonId: string | null } | null = null;
    const shown = dialog.showDialog(req);
    shown.then((r) => { resolved = r; });
    check('showDialog exposes the request', dialog.activeDialog.value === req);
    dialog.closeDialog('ok');
    await shown;
    check('closeDialog resolves with chosen buttonId', JSON.stringify(resolved) === JSON.stringify({ buttonId: 'ok' }), JSON.stringify(resolved));
    check('closeDialog clears activeDialog', dialog.activeDialog.value === null);
}
{
    const req = { title: 't', message: 'm', buttons: [{ id: 'yes', label: 'Y' }], cancelId: 'no' };
    const shown = dialog.showDialog(req);
    dialog.closeDialog();
    const r = await shown;
    check('closeDialog defaults to request cancelId', JSON.stringify(r) === JSON.stringify({ buttonId: 'no' }), JSON.stringify(r));
}
{
    const first = dialog.showDialog({ title: 'a', message: '', buttons: [{ id: 'x', label: 'x' }], cancelId: 'x' });
    const second = dialog.showDialog({ title: 'b', message: '', buttons: [{ id: 'y', label: 'y' }] });
    const r1 = await first;
    check('second showDialog resolves the pending one with its cancelId', JSON.stringify(r1) === JSON.stringify({ buttonId: 'x' }), JSON.stringify(r1));
    check('second dialog becomes active', dialog.activeDialog.value?.title === 'b', String(dialog.activeDialog.value?.title));
    dialog.closeDialog(null);
    const r2 = await second;
    check('closeDialog(null) resolves with null buttonId', JSON.stringify(r2) === JSON.stringify({ buttonId: null }), JSON.stringify(r2));
    check('closeDialog clears activeDialog', dialog.activeDialog.value === null);
    dialog.closeDialog();
    check('closeDialog with nothing active is a no-op', dialog.activeDialog.value === null);
    const third = dialog.showDialog({ title: 'c', message: '', buttons: [{ id: 'z', label: 'z' }], cancelId: 'z' });
    const fourth = dialog.showDialog({ title: 'd', message: '', buttons: [] });
    const rPrior = await third;
    check('showDialog resolves prior dialog with its cancelId', JSON.stringify(rPrior) === JSON.stringify({ buttonId: 'z' }), JSON.stringify(rPrior));
    check('latest dialog stays active', dialog.activeDialog.value?.title === 'd');
    dialog.closeDialog();
    const r4 = await fourth;
    check('closeDialog() with no cancelId resolves null', JSON.stringify(r4) === JSON.stringify({ buttonId: null }), JSON.stringify(r4));
    check('final close leaves no active dialog', dialog.activeDialog.value === null);
}

// ============================ preferences ============================
console.log('\n=== preferences: exposed constants ===');
{
    check('schema version is 2', prefs.PREFERENCES_SCHEMA_VERSION === 2, String(prefs.PREFERENCES_SCHEMA_VERSION));
    check('storage key stable', prefs.PREFERENCES_STORAGE_KEY === KEY, prefs.PREFERENCES_STORAGE_KEY);
    check('7 synced keys', prefs.SYNCED_PREFERENCE_KEYS.length === 7, String(prefs.SYNCED_PREFERENCE_KEYS.length));
    check('theme default auto', prefs.DEFAULT_PREFERENCES.theme === 'auto', prefs.DEFAULT_PREFERENCES.theme);
    check('animations default true', prefs.DEFAULT_PREFERENCES.animations === true);
    check('autoRefreshSeconds default 10', prefs.DEFAULT_PREFERENCES.autoRefreshSeconds === 10, String(prefs.DEFAULT_PREFERENCES.autoRefreshSeconds));
}
console.log('\n=== preferences: initial state & computed ===');
{
    const { preferences, theme, resolvedTheme } = prefs.usePreferences();
    check('initial theme is auto', theme.value === 'auto', String(theme.value));
    check('resolvedTheme light when media prefers light', resolvedTheme.value === 'light', resolvedTheme.value);
    check('initial animations on', preferences.animations === true);
    check('confirmLeave default off', preferences.confirmLeave === false);
    prefs.initPreferences();
    check('initPreferences marks animations dataset', rootDataset.animations === 'on', String(rootDataset.animations));
    check('initPreferences leaves dark class off (light media)', !rootClasses.has('dark'));
}
console.log('\n=== preferences: mutation -> watch -> DOM + persist ===');
{
    const { preferences, theme, resolvedTheme } = prefs.usePreferences();
    preferences.theme = 'dark';
    check('theme computed tracks state', theme.value === 'dark', String(theme.value));
    check('resolvedTheme dark after explicit dark', resolvedTheme.value === 'dark', resolvedTheme.value);
    check('dark class applied to root', rootClasses.has('dark'));
    check('colorScheme style set', rootStyle.colorScheme === 'dark', String(rootStyle.colorScheme));
    const persisted = JSON.parse(storageMap.get(KEY) ?? '{}');
    check('mutation persisted to localStorage', persisted.theme === 'dark', JSON.stringify(persisted));
    preferences.animations = false;
    check('animations dataset off', rootDataset.animations === 'off', String(rootDataset.animations));
    check('animations persisted', (JSON.parse(storageMap.get(KEY) ?? '{}') as any).animations === false);
    preferences.theme = 'auto';
    mediaMatches = true;
    for (const l of mediaListeners)
        l();
    check('auto theme follows dark media query', rootClasses.has('dark') && rootStyle.colorScheme === 'dark');
    mediaMatches = false;
    for (const l of mediaListeners)
        l();
    check('auto theme follows light media query', !rootClasses.has('dark') && rootStyle.colorScheme === 'light');
}
console.log('\n=== preferences: collectSyncedSettings ===');
{
    const collected = prefs.collectSyncedSettings();
    check('carries schema version', (collected as any).__version === 2, String((collected as any).__version));
    const missing = prefs.SYNCED_PREFERENCE_KEYS.filter((k) => !(k in collected));
    check('includes every synced key', missing.length === 0, missing.join(','));
}
console.log('\n=== preferences: applySyncedSettings ===');
{
    prefs.usePreferences().reset();
    const good: Record<string, unknown> = { __version: 2 };
    for (const k of prefs.SYNCED_PREFERENCE_KEYS)
        good[k] = prefs.DEFAULT_PREFERENCES[k as keyof typeof prefs.DEFAULT_PREFERENCES];
    good.theme = 'dark';
    good.autoRefreshSeconds = 30;
    const r = prefs.applySyncedSettings(good);
    check('valid payload fully applied', r.applied === 7 && r.rejected.length === 0, JSON.stringify(r));
    check('theme applied to state', prefs.usePreferences().preferences.theme === 'dark', String(prefs.usePreferences().preferences.theme));
    check('autoRefreshSeconds applied', prefs.usePreferences().preferences.autoRefreshSeconds === 30);
    const bad = prefs.applySyncedSettings({ __version: 2, animations: 'yes' as unknown as boolean });
    check('wrong type rejected', bad.rejected.includes('animations') && bad.applied === 0, JSON.stringify(bad));
    check('rejected key does not corrupt state', prefs.usePreferences().preferences.animations === true);
    const badTheme = prefs.applySyncedSettings({ __version: 2, theme: 'blue' as unknown as prefs.ThemePreference });
    check('invalid theme enum rejected', badTheme.rejected.includes('theme') && prefs.usePreferences().preferences.theme === 'dark', JSON.stringify(badTheme));
    const low = prefs.applySyncedSettings({ __version: 2, autoRefreshSeconds: 3 });
    check('autoRefreshSeconds below 5 rejected', low.rejected.includes('autoRefreshSeconds'), JSON.stringify(low));
    const high = prefs.applySyncedSettings({ __version: 2, autoRefreshSeconds: 61 });
    check('autoRefreshSeconds above 60 rejected', high.rejected.includes('autoRefreshSeconds'), JSON.stringify(high));
    const edge = prefs.applySyncedSettings({ __version: 2, autoRefreshSeconds: 60 });
    check('autoRefreshSeconds boundary 60 accepted', edge.applied === 1 && prefs.usePreferences().preferences.autoRefreshSeconds === 60, JSON.stringify(edge));
    check('nullish remote is a no-op', JSON.stringify(prefs.applySyncedSettings(null)) === JSON.stringify({ applied: 0, rejected: [] }));
    const partialOld = prefs.applySyncedSettings({ __version: 1, theme: 'light' });
    check('legacy version: present key applied', partialOld.applied === 1 && prefs.usePreferences().preferences.theme === 'light', JSON.stringify(partialOld));
    check('legacy version: missing keys reported rejected', partialOld.rejected.length === 6, partialOld.rejected.join(','));
    const partialNew = prefs.applySyncedSettings({ __version: 2 });
    check('current version: missing keys silently skipped', partialNew.applied === 0 && partialNew.rejected.length === 0, JSON.stringify(partialNew));
    prefs.usePreferences().reset();
    check('reset restores defaults', prefs.usePreferences().preferences.theme === 'auto' && prefs.usePreferences().preferences.autoRefreshSeconds === 10);
    check('reset persisted', (JSON.parse(storageMap.get(KEY) ?? '{}') as any).theme === 'auto');
}
console.log('\n=== preferences: load() merge & corruption (fresh module instances) ===');
{
    storageMap.set(KEY, '{"theme":"dark","animations":"no","units":false,"bogus":1}');
    const fresh = await import('../src/stores/preferences.ts?seed=merge');
    check('valid keys merged over defaults', fresh.usePreferences().preferences.theme === 'dark', String(fresh.usePreferences().preferences.theme));
    check('wrong-typed value falls back to default', fresh.usePreferences().preferences.animations === true);
    check('explicit false survives merge', fresh.usePreferences().preferences.units === false);
    check('unknown keys ignored', !('bogus' in fresh.usePreferences().preferences));
    storageMap.set(KEY, '{{{not json');
    const corrupt = await import('../src/stores/preferences.ts?seed=corrupt');
    check('corrupt storage falls back to defaults', corrupt.usePreferences().preferences.theme === 'auto' && corrupt.usePreferences().preferences.autoRefreshSeconds === 10);
    check('corrupt storage: collect still works', (corrupt.collectSyncedSettings() as any).__version === 2);
    storageMap.delete(KEY);
}

console.log(`\n${passes} passed, ${failures} failed`);
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
console.log('');
process.exit(failures === 0 ? 0 : 1);
