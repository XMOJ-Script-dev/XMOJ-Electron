import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CachedValue } from '../src/shared/types.ts';
interface Entry {
    value: unknown;
    fetchedAt: number;
}
const CACHE_VERSION = 3;
interface DiskPayload {
    version?: number;
    entries?: Record<string, Entry>;
}
const PERSISTED_PREFIXES = [
    'home:snapshot',
    'monthly:board',
    'downloads:list',
    'contest:list:',
    'contest:detail:',
    'contest:problems:',
    'problemset:all',
    'problem:',
];
function isPersisted(key: string): boolean {
    return PERSISTED_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix));
}
export class PageCache {
    private readonly entries = new Map<string, Entry>();
    private diskLoaded = false;
    private readonly directory: string | null;
    constructor(userDataDirectory: string | null = null) {
        this.directory = userDataDirectory;
    }
    get<T>(key: string, maxAgeMs = 0): CachedValue<T> | null {
        this.loadFromDisk();
        const entry = this.entries.get(key);
        if (!entry)
            return null;
        if (maxAgeMs > 0 && Date.now() - entry.fetchedAt > maxAgeMs)
            return null;
        return { value: entry.value as T, fetchedAt: entry.fetchedAt, fromCache: true };
    }
    set<T>(key: string, value: T): CachedValue<T> {
        const fetchedAt = Date.now();
        this.entries.set(key, { value, fetchedAt });
        if (isPersisted(key))
            this.saveToDisk();
        return { value, fetchedAt, fromCache: false };
    }
    clear(key?: string): void {
        if (key)
            this.entries.delete(key);
        else
            this.entries.clear();
        this.saveToDisk();
    }
    keys(): string[] {
        this.loadFromDisk();
        return [...this.entries.keys()];
    }
    private resolvePath(): string | null {
        if (!this.directory)
            return null;
        return path.join(this.directory, 'page-cache.json');
    }
    private loadFromDisk(): void {
        if (this.diskLoaded)
            return;
        this.diskLoaded = true;
        const file = this.resolvePath();
        if (!file)
            return;
        try {
            const raw = JSON.parse(readFileSync(file, 'utf8')) as DiskPayload | Record<string, Entry>;
            const payload = raw as DiskPayload;
            if (payload.version !== CACHE_VERSION || !payload.entries)
                return;
            for (const [key, entry] of Object.entries(payload.entries)) {
                if (entry && typeof entry.fetchedAt === 'number')
                    this.entries.set(key, entry);
            }
        }
        catch {
        }
    }
    private saveToDisk(): void {
        const file = this.resolvePath();
        if (!file)
            return;
        try {
            const entries: Record<string, Entry> = {};
            for (const [key, entry] of this.entries) {
                if (isPersisted(key))
                    entries[key] = entry;
            }
            const payload: DiskPayload = { version: CACHE_VERSION, entries };
            mkdirSync(path.dirname(file), { recursive: true });
            writeFileSync(file, JSON.stringify(payload), 'utf8');
        }
        catch {
        }
    }
}
