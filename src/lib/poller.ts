export interface PollerOptions {
    tick: () => Promise<void> | void;
    shouldContinue: () => boolean;
    intervalMs: number;
    onError?: (error: unknown) => void;
}
export interface Poller {
    start: () => void;
    stop: () => void;
    ticks: () => number;
    isRunning: () => boolean;
}
export function createPoller(options: PollerOptions): Poller {
    let timer: ReturnType<typeof setInterval> | undefined;
    let busy = false;
    let count = 0;
    function stop(): void {
        if (timer !== undefined) {
            clearInterval(timer);
            timer = undefined;
        }
    }
    async function runTick(): Promise<void> {
        if (busy)
            return;
        if (!options.shouldContinue()) {
            stop();
            return;
        }
        busy = true;
        count += 1;
        try {
            await options.tick();
        }
        catch (error) {
            if (options.onError)
                options.onError(error);
            else
                console.error('[poller] tick failed:', error);
        }
        finally {
            busy = false;
        }
    }
    function start(): void {
        if (timer !== undefined)
            return;
        timer = setInterval(() => {
            void runTick();
        }, options.intervalMs);
    }
    return {
        start,
        stop,
        ticks: () => count,
        isRunning: () => timer !== undefined,
    };
}
