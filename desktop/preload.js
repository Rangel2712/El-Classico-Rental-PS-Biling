'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ecDesktop', {
  getConfig: () => ipcRenderer.invoke('ec:getConfig'),
  apply: (c) => ipcRenderer.invoke('ec:apply', c),
  discover: () => ipcRenderer.invoke('ec:discover'),
  // Printer
  getPrinters: () => ipcRenderer.invoke('ec:printers'),
  getSerialPorts: () => ipcRenderer.invoke('ec:serialPorts'),
  printHtml: (o) => ipcRenderer.invoke('ec:printHtml', o),
  printRaw: (o) => ipcRenderer.invoke('ec:printRaw', o),
});
