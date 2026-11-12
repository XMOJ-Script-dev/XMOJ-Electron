/// <reference types="vite/client" />
import type { XmojApi } from '../electron/preload';
export {};
declare global {
    interface Window {
        xmoj: XmojApi;
    }
    interface ImportMetaEnv {
        readonly VITE_WEB_BUILD?: string;
    }
    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}
