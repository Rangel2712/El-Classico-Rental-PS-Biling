// El Classico Billing — aplikasi desktop (Windows .exe / macOS .dmg)
// Mode SERVER  : laptop ini menjalankan server billing + panel kasir.
// Mode KONTROL : laptop ini hanya membuka panel kasir dari server lain di WiFi yang sama.
'use strict';
const { app, BrowserWindow, Tray, Menu, ipcMain, shell, powerSaveBlocker, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const dgram = require('dgram');
const os = require('os');

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

const CFG_FILE = path.join(app.getPath('userData'), 'config.json');
const ICON = path.join(__dirname, 'build', 'icon.png');
let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')); } catch (e) { cfg = {}; }
const saveCfg = () => { try { fs.mkdirSync(path.dirname(CFG_FILE), { recursive: true }); fs.writeFileSync(CFG_FILE, JSON.stringify(cfg, null, 2)); } catch (e) {} };

let win = null, tray = null, server = null, psb = null, quitting = false;

function serverModulePath() {
  const packed = path.join(process.resourcesPath || '', 'server', 'server.js');
  if (fs.existsSync(packed)) return packed;
  return path.join(__dirname, '..', 'server', 'server.js');
}
function localIPs() {
  const out = [];
  Object.values(os.networkInterfaces()).forEach((l) => (l || []).forEach((i) => { if ((i.family === 'IPv4' || i.family === 4) && !i.internal) out.push(i.address); }));
  return out;
}

function startServer(port) {
  if (server) return server.port;
  const mod = require(serverModulePath());
  server = mod.start({ port, dataDir: path.join(app.getPath('userData'), 'data'), log: (...a) => console.log(...a) });
  server.server.on('error', (e) => {
    dialog.showErrorBox('Server gagal berjalan', e.code === 'EADDRINUSE'
      ? 'Port ' + port + ' sudah dipakai aplikasi lain. Ganti port lewat menu Billing › Ganti Mode.'
      : String(e.message || e));
  });
  if (psb == null) psb = powerSaveBlocker.start('prevent-app-suspension');
  return port;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 880, minWidth: 900, minHeight: 600,
    backgroundColor: '#060a13', title: 'El Classico Billing', icon: ICON, show: false,
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.once('ready-to-show', () => win.show());
  win.on('close', (e) => {
    if (cfg.mode === 'server' && !quitting) {
      e.preventDefault(); win.hide();
      if (tray && process.platform === 'win32') tray.displayBalloon({ title: 'El Classico Billing', content: 'Server tetap berjalan di latar belakang. Klik ikon tray untuk membuka.' });
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    if (url && url.startsWith('http')) win.loadFile(path.join(__dirname, 'launcher.html'), { query: { error: 'Tidak bisa membuka ' + url + ' (' + desc + ')' } });
  });
  route();
}

function route() {
  if (cfg.mode === 'server') {
    const port = startServer(cfg.port || 8080);
    setTimeout(() => win.loadURL('http://localhost:' + port), 300);
  } else if (cfg.mode === 'client' && cfg.url) {
    win.loadURL(cfg.url);
  } else {
    win.loadFile(path.join(__dirname, 'launcher.html'));
  }
  buildMenu();
}

function buildMenu() {
  const tmpl = [
    {
      label: 'Billing',
      submenu: [
        { label: 'Buka Panel Kasir', click: () => { win.show(); route(); } },
        { label: 'Ganti Mode (Server / Kontrol)', click: () => { cfg.remember = false; saveCfg(); win.show(); win.loadFile(path.join(__dirname, 'launcher.html')); } },
        { type: 'separator' },
        { label: 'Buka di Browser', enabled: cfg.mode === 'server', click: () => shell.openExternal('http://localhost:' + (cfg.port || 8080)) },
        { label: 'Folder Data & Cadangan', enabled: cfg.mode === 'server', click: () => shell.openPath(path.join(app.getPath('userData'), 'data')) },
        { label: 'Jalankan saat komputer menyala', type: 'checkbox', checked: !!cfg.autoLaunch, click: (m) => { cfg.autoLaunch = m.checked; saveCfg(); app.setLoginItemSettings({ openAtLogin: m.checked }); } },
        { type: 'separator' },
        { label: 'Keluar', accelerator: 'CmdOrCtrl+Q', click: () => { quitting = true; app.quit(); } },
      ],
    },
    { label: 'Tampilan', submenu: [{ role: 'reload', label: 'Muat ulang' }, { role: 'togglefullscreen', label: 'Layar penuh' }, { role: 'zoomIn', label: 'Perbesar' }, { role: 'zoomOut', label: 'Perkecil' }, { role: 'resetZoom', label: 'Ukuran normal' }, { type: 'separator' }, { role: 'toggleDevTools', label: 'Developer Tools' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tmpl));
  if (cfg.mode === 'server') {
    if (!tray) {
      let img = nativeImage.createFromPath(ICON); if (!img.isEmpty()) img = img.resize({ width: 18, height: 18 });
      tray = new Tray(img);
      tray.on('click', () => { win.show(); win.focus(); });
    }
    const ips = localIPs();
    tray.setToolTip('El Classico Billing — Server aktif\n' + ips.map((i) => 'http://' + i + ':' + (cfg.port || 8080)).join('\n'));
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Buka Panel Kasir', click: () => { win.show(); win.focus(); } },
      ...ips.map((i) => ({ label: 'Server: ' + i + ':' + (cfg.port || 8080), enabled: false })),
      { type: 'separator' },
      { label: 'Keluar & Matikan Server', click: () => { quitting = true; app.quit(); } },
    ]));
  }
}

// ---------- IPC dari halaman launcher ----------
ipcMain.handle('ec:getConfig', () => ({ ...cfg, ips: localIPs(), version: app.getVersion(), platform: process.platform }));
ipcMain.handle('ec:apply', (e, c) => {
  cfg = Object.assign(cfg, c); saveCfg();
  if (cfg.mode !== 'server' && server) { /* server tetap jalan sampai aplikasi ditutup */ }
  route();
  return true;
});
ipcMain.handle('ec:discover', () => new Promise((resolve) => {
  const found = {};
  const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  sock.on('message', (msg, rinfo) => {
    const s = msg.toString();
    if (s.startsWith('ELCLASSICO|')) {
      const [, port, name] = s.split('|');
      found[rinfo.address + ':' + port] = { host: rinfo.address, port: Number(port), name };
    }
  });
  sock.on('error', () => { try { sock.close(); } catch (e) {} resolve(Object.values(found)); });
  sock.bind(41234, () => { try { sock.setBroadcast(true); } catch (e) {} });
  setTimeout(() => { try { sock.close(); } catch (e) {} resolve(Object.values(found)); }, 4000);
}));

app.on('second-instance', () => { if (win) { win.show(); win.focus(); } });
app.on('before-quit', () => { quitting = true; if (server) server.stop(); });
app.on('window-all-closed', () => { if (cfg.mode !== 'server') app.quit(); });
app.on('activate', () => { if (win) win.show(); });
app.whenReady().then(createWindow);
