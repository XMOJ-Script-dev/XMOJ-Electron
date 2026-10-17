import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const userData = mkdtempSync(path.join(tmpdir(), 'xmoj-smoke-'));
export const app = {
    getPath(name) {
        if (name === 'userData')
            return userData;
        return tmpdir();
    },
};
export const safeStorage = {
    isEncryptionAvailable: () => true,
    encryptString: (plain) => Buffer.from(`stub:${plain}`, 'utf8'),
    decryptString: (buffer) => {
        const text = buffer.toString('utf8');
        if (!text.startsWith('stub:'))
            throw new Error('bad ciphertext');
        return text.slice(5);
    },
};
export const ipcMain = { handle() { } };
export const shell = { openExternal() { } };
export class BrowserWindow {
}
export const session = {
    fromPartition(partition) {
        if (!sessions.has(partition)) {
            const cookies = [];
            sessions.set(partition, {
                cookies: {
                    set: async (cookie) => {
                        cookies.push(cookie);
                    },
                    get: async () => cookies,
                },
            });
        }
        return sessions.get(partition);
    },
};
export const sessions = new Map();
export async function writtenCookies(partition = 'persist:xmoj') {
    const target = session.fromPartition(partition);
    return target.cookies.get();
}
