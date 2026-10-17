import { buildFreopenSnippet, checkSource, parseProblemFileNames, } from '../src/lib/codecheck.ts';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
console.log('\n=== problem file-name extraction ===');
{
    const html = `<h3><span class=green>输入文件: </span>cursor.in&nbsp;&nbsp;&nbsp;<span class=green>输出文件: </span>cursor.out&nbsp;&nbsp;&nbsp;</h3>`;
    const parsed = parseProblemFileNames(html);
    check('input name', parsed.inputName === 'cursor', String(parsed.inputName));
    check('output name', parsed.outputName === 'cursor', String(parsed.outputName));
    check('no file io when absent', parseProblemFileNames('<h3>普通题目</h3>').inputName === null);
    check('colon variants accepted', parseProblemFileNames('<span>输入文件：</span>data.in').inputName === 'data');
}
console.log('\n=== missing freopen is reported ===');
{
    const code = `#include <cstdio>\nint main(){ int a; scanf("%d",&a); printf("%d",a); return 0; }`;
    const issues = checkSource(code, { inputName: 'cursor', outputName: 'cursor', languageId: 1 });
    const io = issues.find((i) => i.label === '文件输入输出');
    check('file-io issue raised', Boolean(io), JSON.stringify(issues.map((i) => i.label)));
    check('severity is error', io?.severity === 'error', String(io?.severity));
    check('message names the files', /cursor\.in/.test(io?.message ?? ''), io?.message ?? '');
    check('suggestion offered', (io?.suggestion ?? '').includes('freopen'), io?.suggestion ?? '');
}
console.log('\n=== correct freopen passes ===');
{
    const code = `#include <cstdio>
int main(){
	freopen("cursor.in", "r", stdin);
	freopen("cursor.out", "w", stdout);
	int a; scanf("%d",&a); printf("%d",a); return 0;
}`;
    const issues = checkSource(code, { inputName: 'cursor', outputName: 'cursor', languageId: 1 });
    check('no file-io issue', !issues.some((i) => i.label === '文件输入输出'), JSON.stringify(issues));
}
console.log('\n=== only input freopen is flagged ===');
{
    const code = `#include <cstdio>
int main(){ freopen("cursor.in","r",stdin); return 0; }`;
    const issues = checkSource(code, { inputName: 'cursor', outputName: 'cursor', languageId: 1 });
    const io = issues.find((i) => i.label === '文件输入输出');
    check('issue raised for missing output', Boolean(io));
    check('message mentions 输出', /输出/.test(io?.message ?? ''), io?.message ?? '');
}
console.log('\n=== no file io required ===');
{
    const code = `#include <iostream>\nint main(){ std::cout << 1; }`;
    const issues = checkSource(code, { languageId: 1 });
    check('no file-io issue', !issues.some((i) => i.label === '文件输入输出'));
}
console.log('\n=== empty source ===');
{
    const issues = checkSource('   ', { languageId: 1 });
    check('empty code reported', issues.some((i) => i.label === '空代码'), JSON.stringify(issues));
    check('only one issue for empty code', issues.length === 1, String(issues.length));
}
console.log('\n=== brace balance ===');
{
    const bad = `int main(){ if(1){ return 0; }`;
    const issues = checkSource(bad, { languageId: 1 });
    check('unbalanced braces flagged', issues.some((i) => i.label === '括号不匹配'), JSON.stringify(issues.map((i) => i.label)));
    const good = `int main(){ if(1){ return 0; } }`;
    check('balanced braces pass', !checkSource(good, { languageId: 1 }).some((i) => i.label === '括号不匹配'));
}
console.log('\n=== common typos ===');
{
    const issues = checkSource('int mian(){ return 0; }', { languageId: 1 });
    check('mian flagged', issues.some((i) => i.label === '可能的拼写错误'), JSON.stringify(issues.map((i) => i.label)));
}
console.log('\n=== missing header is only a warning ===');
{
    const code = `int main(){ printf("hi"); return 0; }`;
    const issues = checkSource(code, { languageId: 1 });
    const header = issues.find((i) => i.label === '缺少头文件');
    check('header warning raised', Boolean(header), JSON.stringify(issues.map((i) => i.label)));
    check('severity is warning', header?.severity === 'warning', String(header?.severity));
    const withHeader = `#include <cstdio>\nint main(){ printf("hi"); return 0; }`;
    check('no warning once included', !checkSource(withHeader, { languageId: 1 }).some((i) => i.label === '缺少头文件'));
    const withBits = `#include <bits/stdc++.h>\nint main(){ printf("hi"); return 0; }`;
    check('bits/stdc++.h counts as included', !checkSource(withBits, { languageId: 1 }).some((i) => i.label === '缺少头文件'));
}
console.log('\n=== language awareness ===');
{
    const py = `print(input())`;
    const issues = checkSource(py, { inputName: 'cursor', outputName: 'cursor', languageId: 3 });
    check('python skips freopen check', !issues.some((i) => i.label === '文件输入输出'), JSON.stringify(issues));
}
console.log('\n=== freopen snippet ===');
{
    const snippet = buildFreopenSnippet('cursor', 'cursor');
    check('contains input line', snippet.includes('freopen("cursor.in", "r", stdin);'), snippet);
    check('contains output line', snippet.includes('freopen("cursor.out", "w", stdout);'), snippet);
}
console.log(`\n${failures === 0 ? 'ALL CODECHECK CHECKS PASSED' : `${failures} CODECHECK CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
