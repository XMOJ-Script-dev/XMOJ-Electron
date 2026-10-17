const { contextBridge, ipcRenderer } = require('electron');
console.log('[preload] loaded, exposing __dshGmRequest');
contextBridge.exposeInMainWorld('__dshGmRequest', (payload) => ipcRenderer.invoke('dsh:gm-request', payload));
