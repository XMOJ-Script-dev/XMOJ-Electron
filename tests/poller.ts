import { createPoller } from '../src/lib/poller.ts';
let failures = 0;
function check(label: string, condition: boolean, detail = '') {
    if (!condition)
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
console.log('\n=== polls while work is outstanding ===');
{
    let calls = 0;
    let pending = true;
    const poller = createPoller({
        tick: () => {
            calls += 1;
        },
        shouldContinue: () => pending,
        intervalMs: 30,
    });
    poller.start();
    await wait(200);
    check('repeated ticks happened', calls >= 3, `calls=${calls}`);
    check('reports running', poller.isRunning());
    poller.stop();
}
console.log('\n=== stops once nothing is outstanding ===');
{
    let calls = 0;
    let pending = true;
    const poller = createPoller({
        tick: () => {
            calls += 1;
            if (calls >= 2)
                pending = false;
        },
        shouldContinue: () => pending,
        intervalMs: 30,
    });
    poller.start();
    await wait(300);
    const settled = calls;
    check('stopped itself after work completed', !poller.isRunning(), `running=${poller.isRunning()}`);
    check('did not keep ticking', settled <= 3, `calls=${settled}`);
    await wait(150);
    check('no further ticks after stopping', calls === settled, `${settled} -> ${calls}`);
}
console.log('\n=== start is idempotent ===');
{
    let calls = 0;
    const poller = createPoller({
        tick: () => {
            calls += 1;
        },
        shouldContinue: () => true,
        intervalMs: 40,
    });
    poller.start();
    poller.start();
    poller.start();
    await wait(200);
    poller.stop();
    check('did not stack timers', calls <= 6, `calls=${calls} in ~200ms @40ms`);
}
console.log('\n=== stop clears the timer ===');
{
    let calls = 0;
    const poller = createPoller({
        tick: () => {
            calls += 1;
        },
        shouldContinue: () => true,
        intervalMs: 30,
    });
    poller.start();
    await wait(100);
    poller.stop();
    const atStop = calls;
    await wait(150);
    check('no ticks after stop', calls === atStop, `${atStop} -> ${calls}`);
    check('reports not running', !poller.isRunning());
}
console.log('\n=== slow ticks are not overlapped ===');
{
    let concurrent = 0;
    let maxConcurrent = 0;
    let completed = 0;
    const poller = createPoller({
        tick: async () => {
            concurrent += 1;
            maxConcurrent = Math.max(maxConcurrent, concurrent);
            await wait(60);
            concurrent -= 1;
            completed += 1;
        },
        shouldContinue: () => true,
        intervalMs: 20,
    });
    poller.start();
    await wait(260);
    poller.stop();
    check('never ran two ticks concurrently', maxConcurrent === 1, `max=${maxConcurrent}`);
    check('completed some ticks', completed >= 2, `completed=${completed}`);
}
console.log('\n=== a throwing tick does not kill the loop ===');
{
    let calls = 0;
    const errors: unknown[] = [];
    const poller = createPoller({
        tick: () => {
            calls += 1;
            if (calls === 1)
                throw new Error('boom');
        },
        shouldContinue: () => true,
        intervalMs: 30,
        onError: (error) => errors.push(error),
    });
    poller.start();
    await wait(200);
    poller.stop();
    check('kept polling after a failure', calls >= 2, `calls=${calls}`);
    check('failure was reported to onError', errors.length === 1, `errors=${errors.length}`);
    check('still running after the failure', calls >= 2);
}
console.log(`\n${failures === 0 ? 'ALL POLLER CHECKS PASSED' : `${failures} POLLER CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
