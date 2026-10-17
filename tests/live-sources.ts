import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { unzipSync } from 'fflate';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpClient } from '../electron/http.ts';
import { buildSubmitForm, parseContestProblems } from '../electron/problems.ts';
import { extensionForLanguage, findAcceptedSubmissionId, fetchSource } from '../electron/sources.ts';
import { diffLines, summariseDiff } from '../src/lib/diff.ts';
import { XMOJ_ORIGIN } from '../src/shared/types.ts';
import { parseStatusPage } from '../electron/parsers.ts';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
const here = path.dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(path.join(here, 'account.txt'), 'utf8');
const fields: Record<string, string> = {};
for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_]+)\s*[:=]\s*(.+?)\s*$/);
    if (m)
        fields[m[1].toLowerCase()] = m[2];
}
const http = new HttpClient();
await http.post(`${XMOJ_ORIGIN}/login.php`, {
    user_id: fields.username!,
    password: fields.password!,
    submit: '登录',
});
const user = fields.username!;
console.log(`signed in as ${user[0]}***${user.at(-1)}`);
console.log('\n=== accepted submission lookup ===');
const problemId = 1841;
const solutionId = await findAcceptedSubmissionId(http, problemId, user);
check('found an accepted submission', solutionId !== null, String(solutionId));
console.log('\n=== source retrieval ===');
if (solutionId !== null) {
    const source = await fetchSource(http, solutionId);
    check('source fetched', Boolean(source && source.trim().length > 0), `${source?.length ?? 0} chars`);
    check('source looks like code, not HTML', !/<html|<body|<!DOCTYPE/i.test(source ?? ''));
    if (source) {
        console.log('    first line:', JSON.stringify(source.split('\n')[0]?.slice(0, 60)));
        check('contains a code keyword', /#include|int main|import |print/i.test(source), '');
    }
}
console.log('\n=== comparing two of my own submissions ===');
{
    const response = await http.get(`${XMOJ_ORIGIN}/status.php?user_id=${encodeURIComponent(user)}`);
    const page = parseStatusPage(response.body);
    const ids = page.submissions.map((s) => s.id);
    check('status page yielded submissions', ids.length >= 2, `${ids.length}`);
    if (ids.length >= 2) {
        const [a, b] = await Promise.all([fetchSource(http, ids[0]), fetchSource(http, ids[1])]);
        check('both sources fetched', a !== null && b !== null);
        if (a !== null && b !== null) {
            const lines = diffLines(a, b);
            const summary = summariseDiff(lines);
            console.log(`    diff: +${summary.added} -${summary.removed} =${summary.equal}`);
            check('diff produced lines', lines.length > 0, String(lines.length));
            check('line counts make sense', summary.equal + summary.added + summary.removed === lines.length);
        }
    }
}
console.log('\n=== language -> extension ===');
{
    const cases: [
        string,
        string
    ][] = [
        ['C++', 'cpp'],
        ['G++', 'cpp'],
        ['GCC', 'c'],
        ['Python3', 'py'],
        ['Java', 'java'],
        ['Pascal', 'pas'],
        ['SomethingElse', 'txt'],
    ];
    for (const [language, expected] of cases) {
        check(`${language} -> .${expected}`, extensionForLanguage(language) === expected, extensionForLanguage(language));
    }
}
console.log('\n=== AC code export (archive contents) ===');
{
    const ids = [1841, 1842];
    const collected: {
        id: number;
        name: string;
        body: string;
    }[] = [];
    for (const id of ids) {
        const sid = await findAcceptedSubmissionId(http, id, user);
        if (sid === null)
            continue;
        const source = await fetchSource(http, sid);
        if (!source)
            continue;
        collected.push({ id, name: `${id}.cpp`, body: source });
    }
    check('collected sources for export', collected.length > 0, `${collected.length} problems`);
    const { zipSync, strToU8 } = await import('fflate');
    const files: Record<string, Uint8Array> = {};
    for (const entry of collected)
        files[entry.name] = strToU8(entry.body);
    const archive = zipSync(files, { level: 6 });
    const tempPath = path.join(here, '.tmp-export.zip');
    const { writeFileSync } = await import('node:fs');
    writeFileSync(tempPath, archive);
    check('archive written to disk', existsSync(tempPath), `${statSync(tempPath).size} bytes`);
    const roundTrip = unzipSync(new Uint8Array(readFileSync(tempPath)));
    const names = Object.keys(roundTrip);
    check('archive contains the expected files', names.length === collected.length, names.join(','));
    check('extracted content matches', names.every((name) => {
        const original = collected.find((c) => c.name === name);
        return original ? Buffer.from(roundTrip[name]).toString('utf8') === original.body : false;
    }));
    rmSync(tempPath, { force: true });
}
console.log('\n=== contest problem list ===');
{
    const response = await http.get(`${XMOJ_ORIGIN}/contest.php?cid=10739`);
    const problems = parseContestProblems(response.body);
    check('contest problems parsed', problems.length > 0, `${problems.length} problems`);
    if (problems.length) {
        console.log('    first 3:', JSON.stringify(problems.slice(0, 3)));
        check('labels assigned', problems[0].label === 'A', problems[0].label);
        check('link indices parsed from pid', problems.every((p) => Number.isInteger(p.index)));
        check('titles non-empty', problems.every((p) => p.title.length > 0), JSON.stringify(problems.slice(0, 2).map((p) => p.title)));
    }
    const gated = parseContestProblems('<div>比赛尚未开始或私有，不能查看题目。</div>');
    check('gated contest yields no problems', gated.length === 0, String(gated.length));
}
console.log('\n=== submit form shape ===');
{
    const normal = buildSubmitForm({ problemId: 1841, languageId: 1, source: 'x', enableO2: true });
    check('problemset submission uses id', normal.id === '1841', JSON.stringify(normal));
    check('O2 flag present', normal.enable_O2 === 'on');
    const contest = buildSubmitForm({
        contestId: 10739,
        contestPid: 6,
        languageId: 1,
        source: 'x',
        enableO2: false,
    });
    check('contest submission uses cid+pid', contest.cid === '10739' && contest.pid === '6', JSON.stringify(contest));
    check('O2 omitted when off', contest.enable_O2 === undefined);
}
console.log(`\n${failures === 0 ? 'ALL LIVE SOURCE CHECKS PASSED' : `${failures} LIVE SOURCE CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
