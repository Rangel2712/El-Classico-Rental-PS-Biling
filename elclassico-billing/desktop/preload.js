'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ecDesktop', {
  getConfig: () => ipcRenderer.invoke('ec:getConfig'),
  apply: (c) => ipcRenderer.invoke('ec:apply', c),
  discover: () => ipcRenderer.invoke('ec:discover'),
});
