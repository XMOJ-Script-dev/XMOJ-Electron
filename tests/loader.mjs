import { pathToFileURL } from 'node:url';
import path from 'node:path';
const here = import.meta.dirname;
const stubs = new Map([
    ['electron', pathToFileURL(path.join(here, 'electron-stub.mjs')).href],
    ['dompurify', pathToFileURL(path.join(here, 'dompurify-stub.mjs')).href],
]);
export async function resolve(specifier, context, next) {
    const stub = stubs.get(specifier);
    if (stub)
        return { url: stub, shortCircuit: true };
    return next(specifier, context);
}
