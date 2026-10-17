import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const ROOTS = ['src', 'electron', 'tests', 'scripts'];
const EXTENSIONS = new Set(['.ts', '.vue', '.mjs', '.cjs', '.js']);
const write = process.argv.includes('--write');
function walk(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry === 'dist' || entry === 'dist-electron')
            continue;
        const full = path.join(dir, entry);
        const info = statSync(full);
        if (info.isDirectory())
            out.push(...walk(full));
        else if (EXTENSIONS.has(path.extname(entry)))
            out.push(full);
    }
    return out;
}
function stripTs(source, fileName) {
    const scriptKind = fileName.endsWith('.vue') ? ts.ScriptKind.TS : undefined;
    const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);
    const printer = ts.createPrinter({
        removeComments: true,
        newLine: ts.NewLineKind.LineFeed,
    });
    return printer.printFile(sf);
}
function stripVue(source, fileName) {
    return source.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g, (whole, open, body, close) => {
        if (!body.trim())
            return whole;
        const stripped = stripTs(body, `${fileName}.ts`);
        return `${open}${stripped}${close}`;
    });
}
let changed = 0;
for (const root of ROOTS) {
    let files;
    try {
        files = walk(root);
    }
    catch {
        continue;
    }
    for (const file of files) {
        const original = readFileSync(file, 'utf8');
        let next;
        try {
            next = file.endsWith('.vue') ? stripVue(original, file) : stripTs(original, file);
        }
        catch (error) {
            console.log(`SKIP ${file}: ${error}`);
            continue;
        }
        if (next === original)
            continue;
        changed++;
        if (write)
            writeFileSync(file, next, 'utf8');
    }
}
console.log(`${write ? 'rewrote' : 'would rewrite'} ${changed} file(s)`);
