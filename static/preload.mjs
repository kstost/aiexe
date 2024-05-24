// preload.js
import { contextBridge, ipcRenderer } from 'electron';
window.addEventListener('load', () => {
    // console.log("Loaded");
});

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => {
            try {
                return func(...args)
            } catch (e) { console.log(e) }
        });
    },
});
