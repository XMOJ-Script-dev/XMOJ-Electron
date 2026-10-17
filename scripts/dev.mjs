import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
function resolveViteBin() {
    const manifestPath = require.resolve('vite/package.json');
    const manifest = require(manifestPath);
    const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.vite;
    if (!bin)
        throw new Error('vite 的 package.json 中没有 bin.vite 字段');
    const binPath = path.join(path.dirname(manifestPath), bin);
    if (!existsSync(binPath))
        throw new Error(`找不到 Vite CLI: ${binPath}`);
    return binPath;
}
const viteBin = resolveViteBin();
const env = { ...process.env };
for (const key of Object.keys(env)) {
    if (key.toUpperCase() === 'ELECTRON_RUN_AS_NODE')
        delete env[key];
}
const child = spawn(process.execPath, [viteBin, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env,
});
child.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }
    process.exit(code ?? 0);
});
child.on('error', (error) => {
    console.error('[dev] 无法启动 Vite:', error.message);
    process.exit(1);
});
