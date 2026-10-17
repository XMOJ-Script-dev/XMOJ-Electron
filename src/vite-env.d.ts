/// <reference types="vite/client" />
import type { XmojApi } from '../electron/preload';
export {};
declare global {
    interface Window {
        xmoj: XmojApi;
    }
}
