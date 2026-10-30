import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
const here = import.meta.dirname;
const root = path.join(here, '..');
const stubs = new Map([
    ['electron', pathToFileURL(path.join(here, 'electron-stub.mjs')).href],
    ['vue', pathToFileURL(path.join(here, 'vue-stub.mjs')).href],
    ['@/stores/dialog', pathToFileURL(path.join(here, 'stub-dialog.mjs')).href],
]);
export async function resolve(specifier, context, next) {
    const stub = stubs.get(specifier);
    if (stub)
        return { url: stub, shortCircuit: true };
    if (specifier.startsWith('@/')) {
        const rel = specifier.slice(2);
        for (const candidate of [path.join(root, 'src', rel), path.join(root, 'src', `${rel}.ts`), path.join(root, 'src', rel, 'index.ts')]) {
            if (existsSync(candidate))
                return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
    }
    return next(specifier, context);
}
