import { diffLines, splitLines, summariseDiff } from '../src/lib/diff.ts';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
console.log('\n=== splitLines ===');
{
    check('simple split', splitLines('a\nb').length === 2, String(splitLines('a\nb').length));
    check('crlf normalised', splitLines('a\r\nb').length === 2);
    check('cr normalised', splitLines('a\rb').length === 2);
    check('trailing newline dropped', splitLines('a\nb\n').length === 2, String(splitLines('a\nb\n').length));
    check('empty string yields one empty line', splitLines('').length === 1);
}
console.log('\n=== identical sources ===');
{
    const lines = diffLines('a\nb\nc', 'a\nb\nc');
    const summary = summariseDiff(lines);
    check('no changes', summary.added === 0 && summary.removed === 0, JSON.stringify(summary));
    check('all equal', summary.equal === 3, String(summary.equal));
}
console.log('\n=== pure insertion ===');
{
    const lines = diffLines('a\nc', 'a\nb\nc');
    const summary = summariseDiff(lines);
    check('one added', summary.added === 1, JSON.stringify(summary));
    check('none removed', summary.removed === 0);
    const added = lines.find((l) => l.kind === 'added');
    check('added line is b', added?.text === 'b', String(added?.text));
    check('added line has no left number', added?.left === null, String(added?.left));
    check('added line has right number 2', added?.right === 2, String(added?.right));
}
console.log('\n=== pure deletion ===');
{
    const lines = diffLines('a\nb\nc', 'a\nc');
    const summary = summariseDiff(lines);
    check('one removed', summary.removed === 1, JSON.stringify(summary));
    check('none added', summary.added === 0);
    const removed = lines.find((l) => l.kind === 'removed');
    check('removed line is b', removed?.text === 'b', String(removed?.text));
    check('removed has left number, no right', removed?.left === 2 && removed?.right === null);
}
console.log('\n=== modification shows as remove + add ===');
{
    const lines = diffLines('x = 1', 'x = 2');
    const summary = summariseDiff(lines);
    check('one added and one removed', summary.added === 1 && summary.removed === 1, JSON.stringify(summary));
}
console.log('\n=== line numbers stay consistent ===');
{
    const left = ['a', 'b', 'c', 'd'].join('\n');
    const right = ['a', 'B', 'c', 'd', 'e'].join('\n');
    const lines = diffLines(left, right);
    let lastLeft = 0;
    let lastRight = 0;
    let monotonic = true;
    for (const line of lines) {
        if (line.left !== null) {
            if (line.left <= lastLeft)
                monotonic = false;
            lastLeft = line.left;
        }
        if (line.right !== null) {
            if (line.right <= lastRight)
                monotonic = false;
            lastRight = line.right;
        }
    }
    check('left line numbers increase', monotonic);
    check('left numbering covers all lines', lastLeft === 4, String(lastLeft));
    check('right numbering covers all lines', lastRight === 5, String(lastRight));
}
console.log('\n=== empty side ===');
{
    const onlyLeft = diffLines('a\nb', '');
    check('everything removed', summariseDiff(onlyLeft).removed === 2, JSON.stringify(summariseDiff(onlyLeft)));
    const onlyRight = diffLines('', 'a\nb');
    check('everything added', summariseDiff(onlyRight).added === 2, JSON.stringify(summariseDiff(onlyRight)));
    const bothEmpty = diffLines('', '');
    check('both empty is a no-op diff', summariseDiff(bothEmpty).added === 0);
}
console.log('\n=== realistic C++ change ===');
{
    const before = `#include <cstdio>
int main(){
	int a;
	scanf("%d",&a);
	printf("%d",a);
	return 0;
}`;
    const after = `#include <cstdio>
int main(){
	freopen("cursor.in","r",stdin);
	freopen("cursor.out","w",stdout);
	int a;
	scanf("%d",&a);
	printf("%d",a);
	return 0;
}`;
    const lines = diffLines(before, after);
    const summary = summariseDiff(lines);
    check('two lines added', summary.added === 2, JSON.stringify(summary));
    check('nothing removed', summary.removed === 0, JSON.stringify(summary));
    check('added lines are the freopen calls', lines.filter((l) => l.kind === 'added').every((l) => l.text.includes('freopen')));
}
console.log('\n=== large input stays linear-ish ===');
{
    const big = Array.from({ length: 1500 }, (_, i) => `line ${i}`).join('\n');
    const changed = big.replace('line 750', 'line 750 changed');
    const started = Date.now();
    const lines = diffLines(big, changed);
    const elapsed = Date.now() - started;
    check('completes quickly', elapsed < 3000, `${elapsed}ms`);
    check('detects the change', summariseDiff(lines).added === 1, JSON.stringify(summariseDiff(lines)));
}
console.log(`\n${failures === 0 ? 'ALL DIFF CHECKS PASSED' : `${failures} DIFF CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
