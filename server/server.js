// =============================================================
//  El Classico Rental PS Billing — Server
//  Node.js >= 16, tanpa dependensi eksternal.
//  Jalankan:  node server.js   (default port 8080)
// =============================================================
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const dgram = require('dgram');
const url = require('url');
const { execFile } = require('child_process');
const WS = require('./lib/ws');

const VERSION = '1.7.0';
const DISCOVERY_PORT = 41234;

// ---------- Default data ----------
function defaultDB() {
  return {
    version: 1,
    secret: crypto.randomBytes(16).toString('hex'),
    settings: {
      name: 'El Classico Rental PS',
      tagline: 'Main Puas, Harga Pas',
      address: 'Manokwari, Papua Barat',
      phone: '',
      warningSeconds: 60,
      rounding: 500,
      lockOnPause: true,
      autoHdmi: true,
      showTimerPill: true,
      receiptFooter: 'Terima kasih telah bermain di El Classico!',
      openBillingBlock: 1, // menit pembulatan untuk mode Main Bebas
      autoOffAfterCheckout: false, // matikan TV otomatis setelah pembayaran
      idleOffMinutes: 0,           // matikan TV kosong setelah N menit (0 = nonaktif)
      pillPosition: 'tr',          // posisi timer di TV: tr, tl, br, bl
      pillSize: 'm',               // ukuran timer: s, m, l
      bigCountdown: false,         // hitung mundur besar di tengah saat sisa waktu <= warningSeconds
      pillOpacity: 0.55,           // transparansi timer (0.2–1) agar tidak mengganggu permainan
      pillMode: 'always',          // always | peek (muncul sebentar tiap N menit) | last5 (hanya 5 menit terakhir)
      pillPeekEvery: 10,           // menit, untuk mode peek
      powerOffMode: 'black',       // black: standby layar hitam (TV tetap menyala & online, paling andal)
                                   // soft: layar dimatikan sistem, coba tetap online | deep: standby penuh (butuh Wake-on-LAN)
      tvTheme: 'elclassico',       // tema layar TV
      panelTheme: 'elclassico',    // tema bawaan panel untuk pengguna yang belum memilih
    },
    types: [
      { id: 'ps3', name: 'PlayStation 3', ratePerHour: 5000, ratePerHalfHour: 3000, color: '#3b82f6' },
      { id: 'ps4', name: 'PlayStation 4', ratePerHour: 8000, ratePerHalfHour: 5000, color: '#8b5cf6' },
      { id: 'ps5', name: 'PlayStation 5', ratePerHour: 15000, ratePerHalfHour: 8000, color: '#f5c518' },
    ],
    packages: [
      { id: 'p30', name: '30 Menit', minutes: 30, prices: {} },
      { id: 'p60', name: '1 Jam', minutes: 60, prices: {} },
      { id: 'p120', name: '2 Jam', minutes: 120, prices: {} },
      { id: 'p180', name: 'Paket 3 Jam', minutes: 180, prices: { ps3: 13000, ps4: 21000, ps5: 40000 } },
      { id: 'p300', name: 'Paket 5 Jam', minutes: 300, prices: { ps3: 20000, ps4: 33000, ps5: 62000 } },
    ],
    units: [
      { id: 'tv1', name: 'TV 01', type: 'ps4', mac: '', note: 'Ruang Utama' },
      { id: 'tv2', name: 'TV 02', type: 'ps4', mac: '', note: 'Ruang Utama' },
      { id: 'tv3', name: 'TV 03', type: 'ps5', mac: '', note: 'VIP' },
      { id: 'tv4', name: 'TV 04', type: 'ps3', mac: '', note: '' },
    ],
    menu: [
      { id: 'm1', name: 'Es Teh Manis', category: 'Minuman', price: 5000, emoji: '🧋', active: true, stock: null },
      { id: 'm2', name: 'Kopi Hitam', category: 'Minuman', price: 6000, emoji: '☕', active: true, stock: null },
      { id: 'm3', name: 'Air Mineral', category: 'Minuman', price: 4000, emoji: '💧', active: true, stock: null },
      { id: 'm4', name: 'Minuman Bersoda', category: 'Minuman', price: 8000, emoji: '🥤', active: true, stock: null },
      { id: 'm5', name: 'Mie Goreng Telur', category: 'Makanan', price: 12000, emoji: '🍜', active: true, stock: null },
      { id: 'm6', name: 'Nasi Goreng', category: 'Makanan', price: 15000, emoji: '🍛', active: true, stock: null },
      { id: 'm7', name: 'Pisang Goreng', category: 'Snack', price: 8000, emoji: '🍌', active: true, stock: null },
      { id: 'm8', name: 'Kentang Goreng', category: 'Snack', price: 10000, emoji: '🍟', active: true, stock: null },
      { id: 'm9', name: 'Sewa Stik Tambahan', category: 'Lainnya', price: 3000, emoji: '🎮', active: true, stock: null },
    ],
    users: [],          // pengguna panel (Admin Utama, Admin, Kasir)
    tokens: {},         // token login -> { userId, at }
    audit: [],          // log aktivitas
    sessions: {},       // unitId -> session
    transactions: [],   // transaksi selesai
    counters: { trx: 0 },
  };
}

// ---------- Hak akses ----------
const PERMS = {
  session: 'Sewa: mulai, tambah waktu, jeda, stop, pindah & bayar',
  fnb: 'Kasir F&B & menambah pesanan',
  tvControl: 'Kontrol TV (volume, HDMI, hidup/mati, pesan)',
  discount: 'Memberi diskon',
  reduceTime: 'Mengurangi waktu sewa',
  cancelOrder: 'Membatalkan pesanan',
  report: 'Melihat semua laporan & ekspor Excel',
  deleteTrx: 'Menghapus transaksi',
  settings: 'Ubah pengaturan, tarif, paket, unit TV & menu',
  users: 'Kelola pengguna (admin hanya bisa kelola kasir)',
  audit: 'Melihat log aktivitas',
  backup: 'Cadangan & pulihkan data',
};
const ROLE_LABEL = { owner: 'Admin Utama', admin: 'Admin', kasir: 'Kasir / Karyawan' };
const ROLE_DEFAULTS = {
  owner: Object.keys(PERMS).reduce((a, k) => (a[k] = true, a), {}),
  admin: Object.keys(PERMS).reduce((a, k) => (a[k] = k !== 'backup', a), {}),
  kasir: { session: true, fnb: true, tvControl: true },
};
function hashPin(pin, salt) { return crypto.scryptSync(String(pin), String(salt), 32).toString('hex'); }

// ---------- Utils ----------
const uid = (p) => (p || '') + crypto.randomBytes(5).toString('hex');
const now = () => Date.now();
function roundUp(v, step) { step = step || 1; return Math.ceil(v / step) * step; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
// Harga berdasarkan tarif per jam & per 30 menit.
// Kelipatan 60 menit memakai tarif jam; sisa <= 30 menit memakai tarif 30 menit (proporsional
// untuk sisa yang lebih pendek); sisa 30–60 menit naik bertahap sampai tarif 1 jam.
function priceMinutes(H, Hf, minutes) {
  H = Number(H) || 0; Hf = Number(Hf) || 0;
  if (!(Hf > 0)) Hf = H / 2;
  const h = Math.floor(minutes / 60), r = minutes - h * 60;
  const part = r <= 30 ? (r / 30) * Hf : Hf + ((r - 30) / 30) * (H - Hf);
  return h * H + part;
}
function localIPs() {
  const out = [];
  const ifs = os.networkInterfaces();
  Object.keys(ifs).forEach((k) => (ifs[k] || []).forEach((i) => {
    if ((i.family === 'IPv4' || i.family === 4) && !i.internal) out.push({ name: k, address: i.address, netmask: i.netmask });
  }));
  return out;
}
function broadcastAddrs() {
  const set = new Set(['255.255.255.255']);
  localIPs().forEach((i) => {
    try {
      const a = i.address.split('.').map(Number), m = i.netmask.split('.').map(Number);
      set.add(a.map((x, j) => (x & m[j]) | (~m[j] & 255)).join('.'));
    } catch (e) {}
  });
  return Array.from(set);
}

// =============================================================
function start(opts) {
  opts = opts || {};
  const PORT = Number(opts.port || process.env.PORT || 8080);
  const DATA_DIR = opts.dataDir || process.env.DATA_DIR || path.join(__dirname, 'data');
  const PUBLIC_DIR = path.join(__dirname, 'public');
  const DB_FILE = path.join(DATA_DIR, 'db.json');
  const log = opts.log || ((...a) => console.log('[ElClassico]', ...a));

  fs.mkdirSync(DATA_DIR, { recursive: true });
  function normalize(d0) {
    const d = defaultDB();
    const x = d0 && typeof d0 === 'object' ? d0 : d;
    const oldPin = x.settings && x.settings.pin;
    x.settings = Object.assign({}, d.settings, x.settings || {});
    delete x.settings.pin;
    if (!x.settings._pom2) { x.settings.powerOffMode = 'black'; x.settings._pom2 = true; } // v1.7: layar hitam jadi bawaan
    ['types', 'packages', 'units', 'menu', 'transactions'].forEach((k) => { if (!Array.isArray(x[k])) x[k] = d[k]; });
    x.sessions = x.sessions || {};
    x.counters = x.counters || { trx: 0 };
    x.secret = x.secret || d.secret;
    x.users = Array.isArray(x.users) ? x.users : [];
    x.tokens = x.tokens && typeof x.tokens === 'object' ? x.tokens : {};
    x.audit = Array.isArray(x.audit) ? x.audit : [];
    if (!x.users.some((u) => u.role === 'owner' && u.active !== false)) {
      // Migrasi: PIN lama menjadi PIN Admin Utama
      const salt = crypto.randomBytes(8).toString('hex');
      x.users.unshift({
        id: 'owner', name: 'Admin Utama', username: 'admin', role: 'owner', perms: ROLE_DEFAULTS.owner,
        salt, pinHash: hashPin(oldPin || '1234', salt), active: true, createdAt: Date.now(), lastLogin: null,
      });
    }
    return x;
  }
  let db;
  try { db = normalize(JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); }
  catch (e) { db = normalize(null); }

  let saveTimer = null;
  function save(immediate) {
    clearTimeout(saveTimer);
    const write = () => {
      try {
        const tmp = DB_FILE + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(db, null, 1));
        fs.renameSync(tmp, DB_FILE);
      } catch (e) { log('Gagal menyimpan data:', e.message); }
    };
    if (immediate) write(); else saveTimer = setTimeout(write, 400);
  }
  // Backup harian
  function backup() {
    try {
      const dir = path.join(DATA_DIR, 'backup');
      fs.mkdirSync(dir, { recursive: true });
      const f = path.join(dir, 'db-' + new Date().toISOString().slice(0, 10) + '.json');
      if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify(db));
      const files = fs.readdirSync(dir).filter((x) => x.startsWith('db-')).sort();
      while (files.length > 30) fs.unlinkSync(path.join(dir, files.shift()));
    } catch (e) {}
  }
  backup();
  setInterval(backup, 3600 * 1000);

  // ---------- Pengguna & sesi login ----------
  const userById = (id) => db.users.find((x) => x.id === id);
  const can = (user, perm) => !!user && (user.role === 'owner' || !!(user.perms || {})[perm]);
  function effectivePerms(user) {
    const o = {}; Object.keys(PERMS).forEach((k) => (o[k] = can(user, k))); return o;
  }
  function publicUser(x) {
    return { id: x.id, name: x.name, username: x.username, role: x.role, roleLabel: ROLE_LABEL[x.role] || x.role,
      perms: effectivePerms(x), active: x.active !== false, theme: x.theme || '', createdAt: x.createdAt, lastLogin: x.lastLogin || null, createdBy: x.createdBy || null };
  }
  function userFromToken(t) {
    if (!t) return null;
    const rec = db.tokens[t]; if (!rec) return null;
    const user = userById(rec.userId);
    if (!user || user.active === false) return null;
    return user;
  }
  function revokeTokens(userId, exceptToken) {
    Object.keys(db.tokens).forEach((t) => { if (db.tokens[t].userId === userId && t !== exceptToken) delete db.tokens[t]; });
    adminConns.forEach((c) => { if (c.user && c.user.id === userId && c.token !== exceptToken) { c.send({ t: 'auth', error: 'Sesi diakhiri' }); c.close(); } });
  }
  function audit(user, action, detail) {
    db.audit.push({ at: Date.now(), userId: user ? user.id : null, user: user ? user.name : 'Sistem', role: user ? user.role : '', action, detail: detail || '' });
    if (db.audit.length > 8000) db.audit.splice(0, db.audit.length - 8000);
  }
  // Bersihkan token lama (> 60 hari)
  Object.keys(db.tokens).forEach((t) => { if (Date.now() - (db.tokens[t].at || 0) > 60 * 86400000) delete db.tokens[t]; });
  const loginFails = {}; // userId -> { n, until }

  // ---------- Live state ----------
  const tvConns = new Map();     // unitId -> Set(conn)
  const adminConns = new Set();
  const tvInfo = {};             // unitId -> info dari TV
  const idleSince = {};          // unitId -> waktu mulai kosong (untuk mati otomatis)

  const unitById = (id) => db.units.find((u) => u.id === id);
  const typeById = (id) => db.types.find((t) => t.id === id) || { id: '?', name: 'PS', ratePerHour: 0 };

  // ---------- Kalkulasi sesi ----------
  function elapsedMs(s, t) {
    t = t || now();
    let paused = s.pausedMs || 0;
    if (s.pauseStartedAt) paused += t - s.pauseStartedAt;
    return Math.max(0, t - s.startedAt - paused);
  }
  function remainingMs(s, t) {
    if (s.mode !== 'timer') return null;
    return Math.max(0, s.durationMs - elapsedMs(s, t));
  }
  function statusOf(s) {
    if (s.expired) return 'expired';
    if (s.pauseStartedAt) return 'paused';
    return 'playing';
  }
  function rentalCost(s, t) {
    const unit = unitById(s.unitId);
    const rate = s.ratePerHour != null ? s.ratePerHour : typeById(unit && unit.type).ratePerHour;
    if (s.mode === 'timer') {
      return (s.charges || []).reduce((a, c) => a + (c.price || 0), 0);
    }
    const half = s.ratePerHalfHour != null ? s.ratePerHalfHour : typeById(unit && unit.type).ratePerHalfHour;
    const block = Math.max(1, db.settings.openBillingBlock || 1);
    const mins = roundUp(elapsedMs(s, t) / 60000, block);
    return roundUp(Math.round(priceMinutes(rate, half, mins)), db.settings.rounding || 1);
  }
  function ordersTotal(s) {
    return (s.orders || []).reduce((a, o) => a + o.price * o.qty, 0);
  }
  function priceFor(unit, minutes, pkg) {
    const type = typeById(unit.type);
    if (pkg && pkg.prices && pkg.prices[unit.type] != null && pkg.prices[unit.type] !== '') return Number(pkg.prices[unit.type]);
    return roundUp(Math.round(priceMinutes(type.ratePerHour, type.ratePerHalfHour, minutes)), db.settings.rounding || 1);
  }
  function sessionView(s) {
    if (!s) return null;
    const t = now();
    return {
      id: s.id, unitId: s.unitId, mode: s.mode, customer: s.customer || '',
      status: statusOf(s), startedAt: s.startedAt,
      durationMs: s.durationMs || null,
      elapsedMs: elapsedMs(s, t), remainingMs: remainingMs(s, t),
      ratePerHour: s.ratePerHour, ratePerHalfHour: s.ratePerHalfHour, charges: s.charges || [],
      orders: s.orders || [], rentalCost: rentalCost(s, t), ordersTotal: ordersTotal(s),
      total: rentalCost(s, t) + ordersTotal(s), note: s.note || '', startedBy: s.startedBy || '',
      log: (s.log || []).slice(-30),
    };
  }

  function snapshot() {
    return {
      t: 'snapshot', serverNow: now(), version: VERSION,
      settings: Object.assign({}, db.settings, { pin: undefined }),
      types: db.types, packages: db.packages, menu: db.menu,
      units: db.units.map((u) => ({
        ...u,
        online: (tvConns.get(u.id) || new Set()).size > 0,
        info: tvInfo[u.id] || null,
        session: sessionView(db.sessions[u.id]),
      })),
      ips: localIPs().map((i) => i.address), port: PORT,
    };
  }

  function tvState(unitId) {
    const unit = unitById(unitId);
    const s = db.sessions[unitId];
    const sv = sessionView(s);
    return {
      t: 'state', serverNow: now(),
      brand: { name: db.settings.name, tagline: db.settings.tagline, address: db.settings.address, phone: db.settings.phone },
      config: {
        warningSeconds: db.settings.warningSeconds, lockOnPause: db.settings.lockOnPause,
        autoHdmi: db.settings.autoHdmi, showTimerPill: db.settings.showTimerPill,
        pillPosition: db.settings.pillPosition, pillSize: db.settings.pillSize, bigCountdown: db.settings.bigCountdown,
        pillOpacity: db.settings.pillOpacity, pillMode: db.settings.pillMode, pillPeekEvery: db.settings.pillPeekEvery,
        theme: db.settings.tvTheme || 'elclassico',
      },
      unit: unit ? { id: unit.id, name: unit.name, type: unit.type, typeName: typeById(unit.type).name } : { id: unitId, name: unitId, unknown: true },
      session: sv ? {
        mode: sv.mode, status: sv.status, remainingMs: sv.remainingMs, elapsedMs: sv.elapsedMs,
        customer: sv.customer, rentalCost: sv.rentalCost, ordersTotal: sv.ordersTotal, total: sv.total,
        orders: sv.orders.map((o) => ({ id: o.id, name: o.name, qty: o.qty, status: o.status, emoji: o.emoji })),
      } : null,
      types: db.types.map((t) => ({ name: t.name, ratePerHour: t.ratePerHour, ratePerHalfHour: priceFor({ type: t.id }, 30, null), id: t.id, color: t.color })),
      packages: db.packages.map((p) => ({ name: p.name, minutes: p.minutes, price: unit ? priceFor(unit, p.minutes, p) : null })),
      menu: db.menu.filter((m) => m.active).map((m) => ({ name: m.name, price: m.price, emoji: m.emoji, category: m.category })),
    };
  }

  function sendTV(unitId, msg) {
    if (msg && msg.cmd === 'powerOff' && !msg.value) msg = Object.assign({}, msg, { value: db.settings.powerOffMode || 'soft' });
    if (msg && msg.cmd === 'powerOff') tvInfo[unitId] = Object.assign({}, tvInfo[unitId] || {}, { offAt: now(), offMode: msg.value });
    (tvConns.get(unitId) || new Set()).forEach((c) => c.send(msg));
  }
  function pushTV(unitId) { sendTV(unitId, tvState(unitId)); }
  function pushAdmins(extra) {
    const snap = JSON.stringify(snapshot());
    adminConns.forEach((c) => c.send(snap));
    if (extra) adminConns.forEach((c) => c.send(extra));
  }
  function notifyAdmins(text, level, unitId) {
    const m = { t: 'toast', text, level: level || 'info', unitId, at: now() };
    adminConns.forEach((c) => c.send(m));
  }
  function changed(unitId) {
    save();
    if (unitId) pushTV(unitId); else db.units.forEach((u) => pushTV(u.id));
    pushAdmins();
  }
  let actor = null; // pengguna yang sedang menjalankan aksi (untuk catatan sesi)
  function addLog(s, text) {
    s.log = s.log || [];
    s.log.push({ at: now(), text, by: actor ? actor.name : '' });
  }

  // ---------- Wake-on-LAN ----------
  function wake(mac, lastIp) {
    return new Promise((resolve, reject) => {
      const hex = String(mac || '').replace(/[^0-9a-fA-F]/g, '');
      if (hex.length !== 12) return reject(new Error('Alamat MAC tidak valid'));
      const macBuf = Buffer.from(hex, 'hex');
      const pkt = Buffer.alloc(102, 0xff);
      for (let i = 0; i < 16; i++) macBuf.copy(pkt, 6 + i * 6);
      const sock = dgram.createSocket('udp4');
      sock.bind(() => {
        sock.setBroadcast(true);
        const targets = broadcastAddrs();
        if (lastIp && /^\d+\.\d+\.\d+\.\d+$/.test(lastIp)) targets.push(lastIp);
        let n = 0;
        targets.forEach((addr) => [9, 7].forEach((port) => {
          n++;
          sock.send(pkt, port, addr, () => { if (--n === 0) { sock.close(); resolve(targets); } });
        }));
      });
    });
  }

  // ---------- Deteksi MAC TV otomatis dari tabel ARP komputer server ----------
  function lookupMac(ip) {
    return new Promise((resolve) => {
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip || '')) return resolve(null);
      execFile('arp', ['-a'], { timeout: 5000, windowsHide: true }, (err, out) => {
        if (err || !out) return resolve(null);
        const re = new RegExp('(^|[^0-9.])' + ip.replace(/\./g, '\\.') + '([^0-9.]|$)');
        const line = String(out).split(/\r?\n/).find((l) => re.test(l));
        const m = line && line.match(/([0-9a-f]{1,2}[:-]){5}[0-9a-f]{1,2}/i);
        if (!m) return resolve(null);
        const mac = m[0].split(/[:-]/).map((x) => x.padStart(2, '0')).join(':').toUpperCase();
        if (/^(FF:){5}FF$|^(00:){5}00$/.test(mac) || /^01:00:5E/.test(mac)) return resolve(null);
        resolve(mac);
      });
    });
  }
  async function autoMac(unitId) {
    const un = unitById(unitId); const inf = tvInfo[unitId] || {};
    if (!un || !inf.ip || (un.mac && !un.macAuto)) return;
    const mac = await lookupMac(inf.ip);
    if (mac && mac !== un.mac) { un.mac = mac; un.macAuto = true; save(); pushAdmins(); log(un.name + ': MAC terdeteksi otomatis ' + mac); }
  }
  setInterval(() => { tvConns.forEach((set, id) => { if (set.size) autoMac(id); }); }, 10 * 60000);

  // ---------- Aksi sesi ----------
  const actions = {
    start(b, user) {
      const unit = unitById(b.unitId);
      if (!unit) throw new Error('Unit tidak ditemukan');
      if (db.sessions[unit.id]) throw new Error(unit.name + ' sedang dipakai');
      const type = typeById(unit.type);
      const mode = b.mode === 'open' ? 'open' : 'timer';
      const s = {
        id: uid('S'), unitId: unit.id, mode, customer: (b.customer || '').slice(0, 40),
        startedAt: now(), pausedMs: 0, pauseStartedAt: null, expired: false, warned: false,
        startedBy: user ? user.name : '', startedById: user ? user.id : null,
        durationMs: 0, ratePerHour: type.ratePerHour, ratePerHalfHour: type.ratePerHalfHour || 0, charges: [], orders: [], log: [], note: b.note || '',
      };
      if (mode === 'timer') {
        const pkg = b.packageId ? db.packages.find((p) => p.id === b.packageId) : null;
        const minutes = pkg ? pkg.minutes : Number(b.minutes);
        if (!(minutes > 0)) throw new Error('Durasi tidak valid');
        s.durationMs = minutes * 60000;
        s.charges.push({ label: pkg ? pkg.name : minutes + ' menit', minutes, price: priceFor(unit, minutes, pkg), at: now() });
        addLog(s, 'Mulai ' + (pkg ? pkg.name : minutes + ' menit'));
      } else {
        addLog(s, 'Mulai Main Bebas (open billing)');
      }
      db.sessions[unit.id] = s;
      notifyAdmins(unit.name + ' mulai bermain', 'success', unit.id);
      sendTV(unit.id, { t: 'cmd', cmd: 'wake' });
      changed(unit.id);
      return sessionView(s);
    },
    extend(b, user) {
      const s = db.sessions[b.unitId]; const unit = unitById(b.unitId);
      if (!s || !unit) throw new Error('Tidak ada sesi aktif');
      if (s.mode !== 'timer') throw new Error('Mode Main Bebas tidak perlu tambah waktu');
      const pkg = b.packageId ? db.packages.find((p) => p.id === b.packageId) : null;
      const minutes = pkg ? pkg.minutes : Number(b.minutes);
      if (!minutes) throw new Error('Durasi tidak valid');
      if (minutes < 0 && s.durationMs + minutes * 60000 < elapsedMs(s) + 60000) throw new Error('Pengurangan melebihi sisa waktu');
      s.durationMs += minutes * 60000;
      const price = minutes > 0 ? priceFor(unit, minutes, pkg) : -priceFor(unit, -minutes, null);
      s.charges.push({ label: (minutes > 0 ? 'Tambah ' : 'Kurangi ') + (pkg ? pkg.name : Math.abs(minutes) + ' menit'), minutes, price, at: now() });
      if (s.expired) {
        s.expired = false;
        if (s.pauseStartedAt) { s.pausedMs += now() - s.pauseStartedAt; s.pauseStartedAt = null; }
      }
      if (remainingMs(s) > db.settings.warningSeconds * 1000) s.warned = false;
      addLog(s, (minutes > 0 ? 'Tambah ' : 'Kurangi ') + Math.abs(minutes) + ' menit');
      sendTV(unit.id, { t: 'cmd', cmd: 'toast', text: (minutes > 0 ? '⏱ Waktu ditambah ' : 'Waktu dikurangi ') + Math.abs(minutes) + ' menit' });
      changed(unit.id);
      return sessionView(s);
    },
    pause(b, user) {
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif');
      if (s.expired) throw new Error('Waktu sudah habis');
      if (!s.pauseStartedAt) { s.pauseStartedAt = now(); addLog(s, 'Dijeda'); }
      changed(b.unitId);
      return sessionView(s);
    },
    resume(b, user) {
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif');
      if (s.expired) throw new Error('Waktu habis — tambah waktu dahulu');
      if (s.pauseStartedAt) { s.pausedMs += now() - s.pauseStartedAt; s.pauseStartedAt = null; addLog(s, 'Dilanjutkan'); }
      changed(b.unitId);
      return sessionView(s);
    },
    stop(b, user) {
      // Hentikan permainan (kunci TV) tetapi belum dibayar
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif');
      if (s.mode === 'timer') {
        // potong durasi ke waktu terpakai, biaya tetap sesuai paket (tidak refund otomatis)
        s.durationMs = elapsedMs(s);
      }
      if (!s.pauseStartedAt) s.pauseStartedAt = now();
      s.expired = true; s.stopped = true;
      addLog(s, 'Dihentikan oleh kasir');
      changed(b.unitId);
      return sessionView(s);
    },
    checkout(b, user) {
      const s = db.sessions[b.unitId]; const unit = unitById(b.unitId);
      if (!s || !unit) throw new Error('Tidak ada sesi aktif');
      const t = now();
      const rent = rentalCost(s, t), ord = ordersTotal(s);
      const discount = Math.max(0, Number(b.discount) || 0);
      const total = Math.max(0, rent + ord - discount);
      db.counters.trx = (db.counters.trx || 0) + 1;
      const trx = {
        id: 'TRX-' + new Date(t).toISOString().slice(2, 10).replace(/-/g, '') + '-' + String(db.counters.trx).padStart(4, '0'),
        kind: 'rental', unitId: unit.id, unitName: unit.name, typeName: typeById(unit.type).name,
        customer: s.customer, mode: s.mode, startedAt: s.startedAt, endedAt: t, playedMs: elapsedMs(s, t),
        charges: s.charges, orders: s.orders, rentalCost: rent, ordersTotal: ord, discount, total,
        paid: Number(b.paid) || total, change: Math.max(0, (Number(b.paid) || total) - total),
        method: b.method || 'Tunai', note: b.note || '',
        cashierId: user ? user.id : null, cashierName: user ? user.name : '', startedBy: s.startedBy || '',
      };
      db.transactions.push(trx);
      delete db.sessions[unit.id];
      idleSince[unit.id] = t;
      sendTV(unit.id, { t: 'cmd', cmd: 'toast', text: 'Terima kasih sudah bermain! 🎮' });
      if (db.settings.autoOffAfterCheckout) setTimeout(() => { if (!db.sessions[unit.id]) sendTV(unit.id, { t: 'cmd', cmd: 'powerOff' }); }, 6000);
      notifyAdmins(unit.name + ' selesai — Rp ' + total.toLocaleString('id-ID'), 'success', unit.id);
      changed(unit.id);
      save(true);
      return trx;
    },
    move(b, user) {
      const s = db.sessions[b.unitId]; const to = unitById(b.toUnitId);
      if (!s) throw new Error('Tidak ada sesi aktif');
      if (!to) throw new Error('Unit tujuan tidak ada');
      if (db.sessions[to.id]) throw new Error(to.name + ' sedang dipakai');
      const from = unitById(b.unitId);
      s.unitId = to.id;
      addLog(s, 'Pindah dari ' + (from ? from.name : b.unitId) + ' ke ' + to.name);
      db.sessions[to.id] = s; delete db.sessions[b.unitId];
      sendTV(to.id, { t: 'cmd', cmd: 'wake' });
      changed(b.unitId); changed(to.id);
      return sessionView(s);
    },
    note(b, user) {
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif');
      if (b.customer != null) s.customer = String(b.customer).slice(0, 40);
      if (b.note != null) s.note = String(b.note).slice(0, 200);
      changed(b.unitId);
      return sessionView(s);
    },
    orderAdd(b, user) {
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif di unit ini');
      const items = Array.isArray(b.items) ? b.items : [{ itemId: b.itemId, qty: b.qty }];
      const added = [];
      items.forEach((it) => {
        const m = db.menu.find((x) => x.id === it.itemId);
        const qty = Math.max(1, Number(it.qty) || 1);
        if (!m) return;
        if (m.stock != null && m.stock !== '' && Number(m.stock) < qty) throw new Error('Stok ' + m.name + ' tidak cukup');
        if (m.stock != null && m.stock !== '') m.stock = Number(m.stock) - qty;
        const o = { id: uid('O'), itemId: m.id, name: m.name, emoji: m.emoji, price: m.price, qty, note: it.note || '', status: 'diproses', at: now() };
        s.orders.push(o); added.push(o);
      });
      if (!added.length) throw new Error('Item tidak ditemukan');
      addLog(s, 'Pesan: ' + added.map((o) => o.qty + 'x ' + o.name).join(', '));
      sendTV(b.unitId, { t: 'cmd', cmd: 'toast', text: '🧾 Pesanan diterima: ' + added.map((o) => o.qty + 'x ' + o.name).join(', ') });
      changed(b.unitId);
      return sessionView(s);
    },
    orderStatus(b, user) {
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif');
      const o = s.orders.find((x) => x.id === b.orderId);
      if (!o) throw new Error('Pesanan tidak ditemukan');
      o.status = b.status;
      if (b.status === 'diantar') sendTV(b.unitId, { t: 'cmd', cmd: 'toast', text: '🛎️ Pesanan diantar: ' + o.qty + 'x ' + o.name });
      changed(b.unitId);
      return sessionView(s);
    },
    orderRemove(b, user) {
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif');
      const i = s.orders.findIndex((x) => x.id === b.orderId);
      if (i < 0) throw new Error('Pesanan tidak ditemukan');
      const o = s.orders[i];
      const m = db.menu.find((x) => x.id === o.itemId);
      if (m && m.stock != null && m.stock !== '') m.stock = Number(m.stock) + o.qty;
      s.orders.splice(i, 1);
      addLog(s, 'Batal pesan ' + o.qty + 'x ' + o.name);
      changed(b.unitId);
      return sessionView(s);
    },
    sale(b, user) {
      // Penjualan F&B tanpa sesi (walk-in)
      const items = (b.items || []).map((it) => {
        const m = db.menu.find((x) => x.id === it.itemId);
        if (!m) return null;
        const qty = Math.max(1, Number(it.qty) || 1);
        if (m.stock != null && m.stock !== '') m.stock = Math.max(0, Number(m.stock) - qty);
        return { id: uid('O'), itemId: m.id, name: m.name, emoji: m.emoji, price: m.price, qty, status: 'diantar', at: now() };
      }).filter(Boolean);
      if (!items.length) throw new Error('Keranjang kosong');
      const ord = items.reduce((a, o) => a + o.price * o.qty, 0);
      const discount = Math.max(0, Number(b.discount) || 0);
      const total = Math.max(0, ord - discount);
      db.counters.trx = (db.counters.trx || 0) + 1;
      const t = now();
      const trx = {
        id: 'TRX-' + new Date(t).toISOString().slice(2, 10).replace(/-/g, '') + '-' + String(db.counters.trx).padStart(4, '0'),
        kind: 'fnb', unitId: null, unitName: 'Kasir', typeName: '-', customer: b.customer || '',
        startedAt: t, endedAt: t, playedMs: 0, charges: [], orders: items, rentalCost: 0, ordersTotal: ord,
        discount, total, paid: Number(b.paid) || total, change: Math.max(0, (Number(b.paid) || total) - total),
        method: b.method || 'Tunai',
        cashierId: user ? user.id : null, cashierName: user ? user.name : '',
      };
      db.transactions.push(trx);
      changed();
      save(true);
      return trx;
    },
  };

  // ---------- Perintah ke TV ----------
  const TV_CMDS = ['powerOff', 'setup', 'setHdmi', 'setOpenOnWake', 'volume', 'volumeUp', 'volumeDown', 'mute', 'settings', 'hdmi', 'home', 'lock', 'toast', 'message', 'wake', 'reload', 'beep', 'wifiSettings', 'inputs', 'unlock'];
  async function tvCommand(b) {
    const unit = unitById(b.unitId);
    if (b.unitId !== '*' && !unit) throw new Error('Unit tidak ditemukan');
    if (b.cmd === 'power') {
      idleSince[unit.id] = now();
      const online = (tvConns.get(unit.id) || new Set()).size > 0;
      if (online) sendTV(unit.id, { t: 'cmd', cmd: 'wake' });
      if (!unit.mac) {
        if (online) return { ok: true, note: 'Layar TV dinyalakan' };
        throw new Error('TV offline dan alamat MAC belum diketahui. Nyalakan TV sekali dengan remote; setelah tersambung, MAC terdeteksi otomatis sehingga TV bisa dinyalakan dari panel.');
      }
      const sent = await wake(unit.mac, (tvInfo[unit.id] || {}).ip);
      return { ok: true, sentTo: sent, note: online ? 'Layar TV dinyalakan' : 'Sinyal Wake-on-LAN dikirim ke ' + unit.mac + ' — TV menyala dalam ±5–15 detik bila fitur Wake on LAN aktif' };
    }
    if (TV_CMDS.indexOf(b.cmd) < 0) throw new Error('Perintah tidak dikenal');
    if (b.cmd === 'powerOff' && unit) idleSince[unit.id] = null;
    const msg = { t: 'cmd', cmd: b.cmd, value: b.value, text: b.text };
    const targets = b.unitId === '*' ? db.units.map((u) => u.id) : [unit.id];
    let delivered = 0;
    targets.forEach((id) => { const set = tvConns.get(id); if (set && set.size) { delivered++; sendTV(id, msg); } });
    if (!delivered) throw new Error('TV sedang offline');
    return { ok: true, delivered };
  }

  // Perintah ke banyak TV sekaligus (tanpa membuka unit satu per satu)
  async function tvBulk(b) {
    const ids = b.unitIds === '*' || !Array.isArray(b.unitIds) ? db.units.map((u) => u.id) : b.unitIds;
    const results = [];
    for (const id of ids) {
      const unit = unitById(id); if (!unit) continue;
      if (b.skipActive && db.sessions[id]) { results.push({ unitId: id, name: unit.name, ok: false, error: 'sedang dipakai — dilewati' }); continue; }
      try {
        if (b.cmd === 'power') {
          idleSince[id] = now(); sendTV(id, { t: 'cmd', cmd: 'wake' });
          if (unit.mac) await wake(unit.mac, (tvInfo[id] || {}).ip); else if (!(tvConns.get(id) || new Set()).size) throw new Error('offline & MAC belum diisi');
        } else {
          if (TV_CMDS.indexOf(b.cmd) < 0) throw new Error('Perintah tidak dikenal');
          const set = tvConns.get(id);
          if (!set || !set.size) throw new Error('offline');
          if (b.cmd === 'powerOff') idleSince[id] = null;
          sendTV(id, { t: 'cmd', cmd: b.cmd, value: b.value, text: b.text });
        }
        results.push({ unitId: id, name: unit.name, ok: true });
      } catch (e) { results.push({ unitId: id, name: unit.name, ok: false, error: e.message }); }
    }
    return { ok: true, sent: results.filter((r) => r.ok).length, results };
  }

  // ---------- Konfigurasi ----------
  function saveConfig(key, value) {
    if (key === 'settings') {
      const s = Object.assign({}, db.settings);
      ['name', 'tagline', 'address', 'phone', 'receiptFooter'].forEach((k) => { if (value[k] != null) s[k] = String(value[k]).slice(0, 120); });
      ['warningSeconds', 'rounding', 'openBillingBlock', 'idleOffMinutes'].forEach((k) => { if (value[k] != null) s[k] = clamp(Number(value[k]) || 0, 0, 100000); });
      ['lockOnPause', 'autoHdmi', 'showTimerPill', 'autoOffAfterCheckout', 'bigCountdown'].forEach((k) => { if (value[k] != null) s[k] = !!value[k]; });
      if (['tr', 'tl', 'br', 'bl'].indexOf(value.pillPosition) >= 0) s.pillPosition = value.pillPosition;
      if (['s', 'm', 'l'].indexOf(value.pillSize) >= 0) s.pillSize = value.pillSize;
      if (value.pillOpacity != null) s.pillOpacity = clamp(Number(value.pillOpacity) || 0.55, 0.2, 1);
      if (['always', 'peek', 'last5'].indexOf(value.pillMode) >= 0) s.pillMode = value.pillMode;
      if (['black', 'soft', 'deep'].indexOf(value.powerOffMode) >= 0) s.powerOffMode = value.powerOffMode;
      ['tvTheme', 'panelTheme'].forEach((k) => { if (typeof value[k] === 'string' && /^[a-z0-9-]{2,30}$/.test(value[k])) s[k] = value[k]; });
      if (value.pillPeekEvery != null) s.pillPeekEvery = clamp(Math.round(Number(value.pillPeekEvery) || 10), 1, 60);
      s.warningSeconds = clamp(s.warningSeconds || 60, 10, 600);
      db.settings = s;
    } else if (['types', 'packages', 'units', 'menu'].indexOf(key) >= 0) {
      if (!Array.isArray(value)) throw new Error('Format salah');
      const ids = new Set();
      value.forEach((x) => {
        if (!x.id) x.id = uid(key[0]);
        x.id = String(x.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || uid(key[0]);
        if (ids.has(x.id)) throw new Error('ID duplikat: ' + x.id);
        ids.add(x.id);
        if (!x.name) throw new Error('Nama wajib diisi');
        if (key === 'types') { x.ratePerHour = Math.max(0, Number(x.ratePerHour) || 0); x.ratePerHalfHour = Math.max(0, Number(x.ratePerHalfHour) || 0); }
        if (key === 'packages') { x.minutes = Math.max(1, Number(x.minutes) || 0); x.prices = x.prices || {}; }
        if (key === 'menu') { x.price = Math.max(0, Number(x.price) || 0); x.active = x.active !== false; if (x.stock === '' || x.stock == null) x.stock = null; else x.stock = Number(x.stock); }
      });
      if (key === 'units') {
        value.forEach((x) => { const old = db.units.find((o) => o.id === x.id); if (old && old.macAuto && old.mac === x.mac) x.macAuto = true; });
        const active = Object.keys(db.sessions);
        active.forEach((id) => { if (!ids.has(id)) throw new Error('Unit ' + id + ' masih punya sesi aktif'); });
      }
      db[key] = value;
    } else throw new Error('Kunci konfigurasi tidak dikenal');
    changed();
    return { ok: true };
  }

  // ---------- Laporan ----------
  function report(q) {
    const from = q.from ? new Date(q.from + 'T00:00:00').getTime() : new Date(new Date().toDateString()).getTime();
    const to = q.to ? new Date(q.to + 'T23:59:59.999').getTime() : from + 86400000 - 1;
    const list = db.transactions.filter((x) => x.endedAt >= from && x.endedAt <= to && (!q.cashier || x.cashierId === q.cashier));
    const byCashier = {}, byMethod = {};
    list.forEach((x) => {
      const k = x.cashierName || '(tanpa nama)';
      byCashier[k] = byCashier[k] || { name: k, count: 0, total: 0, rental: 0, fnb: 0 };
      byCashier[k].count++; byCashier[k].total += x.total; byCashier[k].rental += x.rentalCost || 0; byCashier[k].fnb += x.ordersTotal || 0;
      byMethod[x.method || 'Tunai'] = (byMethod[x.method || 'Tunai'] || 0) + x.total;
    });
    const sum = (f) => list.reduce((a, x) => a + (f(x) || 0), 0);
    const byUnit = {}, byItem = {}, byHour = Array(24).fill(0), byDay = {};
    list.forEach((x) => {
      const k = x.unitName || '-';
      byUnit[k] = byUnit[k] || { name: k, count: 0, playedMs: 0, total: 0 };
      byUnit[k].count++; byUnit[k].playedMs += x.playedMs || 0; byUnit[k].total += x.total;
      (x.orders || []).forEach((o) => {
        byItem[o.name] = byItem[o.name] || { name: o.name, qty: 0, total: 0 };
        byItem[o.name].qty += o.qty; byItem[o.name].total += o.qty * o.price;
      });
      byHour[new Date(x.startedAt).getHours()] += x.total;
      const d = new Date(x.endedAt); const dk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      byDay[dk] = (byDay[dk] || 0) + x.total;
    });
    return {
      from, to, count: list.length,
      rental: sum((x) => x.rentalCost), fnb: sum((x) => x.ordersTotal), discount: sum((x) => x.discount),
      total: sum((x) => x.total), playedMs: sum((x) => x.playedMs),
      byUnit: Object.values(byUnit).sort((a, b) => b.total - a.total),
      byItem: Object.values(byItem).sort((a, b) => b.qty - a.qty),
      byHour, byDay,
      byCashier: Object.values(byCashier).sort((a, b) => b.total - a.total), byMethod,
      transactions: list.slice().reverse(),
    };
  }
  function csv(q) {
    const r = report(q);
    const rows = [['ID', 'Waktu Selesai', 'Jenis', 'Unit', 'Tipe', 'Pelanggan', 'Durasi (menit)', 'Sewa', 'F&B', 'Diskon', 'Total', 'Metode', 'Kasir']];
    r.transactions.slice().reverse().forEach((x) => rows.push([
      x.id, new Date(x.endedAt).toLocaleString('id-ID'), x.kind === 'fnb' ? 'F&B' : 'Rental', x.unitName, x.typeName,
      x.customer || '', Math.round((x.playedMs || 0) / 60000), x.rentalCost, x.ordersTotal, x.discount || 0, x.total, x.method, x.cashierName || '',
    ]));
    return '﻿' + rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
  }

  // ---------- Tick: cek waktu habis & peringatan ----------
  setInterval(() => {
    const t = now();
    Object.keys(db.sessions).forEach((unitId) => {
      const s = db.sessions[unitId];
      if (s.mode !== 'timer' || s.expired || s.pauseStartedAt) return;
      const rem = remainingMs(s, t);
      const unit = unitById(unitId);
      const name = unit ? unit.name : unitId;
      if (!s.warned && rem <= db.settings.warningSeconds * 1000) {
        s.warned = true;
        notifyAdmins(name + ': sisa waktu ' + Math.ceil(rem / 1000) + ' detik', 'warning', unitId);
        sendTV(unitId, { t: 'cmd', cmd: 'warning' });
        pushTV(unitId);
      }
      if (rem <= 0) {
        s.expired = true;
        s.pauseStartedAt = t; // bekukan waktu agar tambah waktu tidak merugikan pelanggan
        addLog(s, 'Waktu habis');
        notifyAdmins(name + ': WAKTU HABIS', 'danger', unitId);
        changed(unitId);
      }
    });
  }, 500);
  // Mati otomatis untuk TV yang kosong terlalu lama
  setInterval(() => {
    const mins = Number(db.settings.idleOffMinutes) || 0;
    if (mins <= 0) return;
    const t = now();
    db.units.forEach((u) => {
      if (db.sessions[u.id]) { idleSince[u.id] = null; return; }
      const set = tvConns.get(u.id);
      if (!set || !set.size) return;
      const inf = tvInfo[u.id] || {};
      if (inf.screenOn === false) return;
      if (idleSince[u.id] === undefined) idleSince[u.id] = t;
      if (idleSince[u.id] && t - idleSince[u.id] >= mins * 60000) {
        idleSince[u.id] = null;
        sendTV(u.id, { t: 'cmd', cmd: 'powerOff' });
        notifyAdmins(u.name + ' dimatikan otomatis (kosong ' + mins + ' menit)', 'info', u.id);
      }
    });
  }, 30000);
  // Sinkron berkala
  setInterval(() => { pushAdmins(); db.units.forEach((u) => pushTV(u.id)); }, 10000);
  setInterval(() => { adminConns.forEach((c) => c.ping()); tvConns.forEach((set) => set.forEach((c) => c.ping())); }, 20000);

  // ---------- Kelola pengguna ----------
  const validPin = (pin) => /^\d{4,8}$/.test(String(pin || ''));
  function canManage(actor, target, newRole) {
    if (actor.role === 'owner') return true;
    if (!can(actor, 'users')) return false;
    // Admin hanya boleh mengelola kasir
    return (!target || target.role === 'kasir') && (!newRole || newRole === 'kasir');
  }
  function activeOwners(exceptId) { return db.users.filter((x) => x.role === 'owner' && x.active !== false && x.id !== exceptId).length; }
  function saveUser(actor, b) {
    const isNew = !b.id;
    const target = isNew ? null : userById(b.id);
    if (!isNew && !target) throw new Error('Pengguna tidak ditemukan');
    const role = ['owner', 'admin', 'kasir'].indexOf(b.role) >= 0 ? b.role : (target ? target.role : 'kasir');
    if (!canManage(actor, target, role)) throw new Error('Anda tidak berhak mengelola pengguna ini');
    const name = String(b.name || '').trim().slice(0, 40);
    const username = String(b.username || '').trim().toLowerCase();
    if (!name) throw new Error('Nama wajib diisi');
    if (!/^[a-z0-9._-]{3,20}$/.test(username)) throw new Error('Username 3–20 karakter (huruf kecil, angka, . _ -)');
    if (db.users.some((x) => x.username === username && x.id !== b.id)) throw new Error('Username sudah dipakai');
    if (isNew && !validPin(b.pin)) throw new Error('PIN harus 4–8 digit angka');
    if (b.pin && !validPin(b.pin)) throw new Error('PIN harus 4–8 digit angka');
    const active = b.active !== false;
    if (target && target.id === actor.id && !active) throw new Error('Tidak bisa menonaktifkan akun sendiri');
    if (target && target.role === 'owner' && (role !== 'owner' || !active) && activeOwners(target.id) === 0) throw new Error('Harus ada minimal satu Admin Utama aktif');
    // Izin: owner semua; selain itu dari input, dibatasi izin milik pembuat
    let perms = {};
    if (role === 'owner') perms = Object.assign({}, ROLE_DEFAULTS.owner);
    else Object.keys(PERMS).forEach((k) => {
      const want = b.perms && b.perms[k] != null ? !!b.perms[k] : !!ROLE_DEFAULTS[role][k];
      perms[k] = want && (actor.role === 'owner' || can(actor, k));
    });
    if (role === 'kasir') perms.users = false;
    const u = target || { id: uid('U'), createdAt: now(), createdBy: actor.name, lastLogin: null };
    Object.assign(u, { name, username, role, perms, active });
    if (b.pin) { u.salt = crypto.randomBytes(8).toString('hex'); u.pinHash = hashPin(b.pin, u.salt); }
    if (isNew) db.users.push(u);
    if (!active || (b.pin && target)) revokeTokens(u.id, actor.id === u.id ? actor._token : null);
    audit(actor, isNew ? 'Tambah pengguna' : 'Ubah pengguna', name + ' (' + (ROLE_LABEL[role] || role) + ')' + (b.pin && target ? ' · PIN direset' : '') + (!active ? ' · dinonaktifkan' : ''));
    save(); pushAdmins();
    return publicUser(u);
  }
  function deleteUser(actor, id) {
    const target = userById(id);
    if (!target) throw new Error('Pengguna tidak ditemukan');
    if (target.id === actor.id) throw new Error('Tidak bisa menghapus akun sendiri');
    if (!canManage(actor, target)) throw new Error('Anda tidak berhak menghapus pengguna ini');
    if (target.role === 'owner' && activeOwners(target.id) === 0) throw new Error('Harus ada minimal satu Admin Utama aktif');
    revokeTokens(target.id);
    db.users = db.users.filter((x) => x.id !== id);
    audit(actor, 'Hapus pengguna', target.name + ' (' + (ROLE_LABEL[target.role] || target.role) + ')');
    save();
    return { ok: true };
  }

  // ---------- HTTP ----------
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
  function sendJSON(res, code, obj) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(obj));
  }
  function readBody(req) {
    return new Promise((resolve) => {
      let d = '';
      req.on('data', (c) => { d += c; if (d.length > 2e6) req.destroy(); });
      req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { resolve({}); } });
    });
  }
  function serveStatic(res, file) {
    const p = path.normalize(path.join(PUBLIC_DIR, file));
    if (!p.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
    fs.readFile(p, (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Tidak ditemukan'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  }
  const forbid = (msg) => { const e = new Error(msg || 'Akses ditolak: Anda tidak punya izin untuk tindakan ini'); e.code = 403; return e; };
  const need = (user, perm) => { if (!can(user, perm)) throw forbid(); };
  const ACTION_PERM = { start: 'session', extend: 'session', pause: 'session', resume: 'session', stop: 'session', checkout: 'session', move: 'session', note: 'session', orderAdd: 'fnb', orderStatus: 'fnb', orderRemove: 'cancelOrder', sale: 'fnb' };
  const ACTION_LABEL = { start: 'Mulai sewa', extend: 'Ubah waktu', pause: 'Jeda', resume: 'Lanjutkan', stop: 'Hentikan sewa', checkout: 'Pembayaran', move: 'Pindah unit', note: 'Ubah data pelanggan', orderAdd: 'Tambah pesanan', orderStatus: 'Status pesanan', orderRemove: 'Batalkan pesanan', sale: 'Penjualan F&B' };
  const unitName = (id) => (unitById(id) || { name: id || '-' }).name;

  const server = http.createServer(async (req, res) => {
    const u = url.parse(req.url, true);
    const p = u.pathname;
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Token', 'Access-Control-Allow-Methods': 'GET, POST' });
      return res.end();
    }
    try {
      if (p === '/api/ping') return sendJSON(res, 200, { app: 'elclassico', name: db.settings.name, version: VERSION });
      if (p === '/api/users/public') {
        return sendJSON(res, 200, { name: db.settings.name, panelTheme: db.settings.panelTheme || 'elclassico', users: db.users.filter((x) => x.active !== false).map((x) => ({ id: x.id, name: x.name, role: x.role, roleLabel: ROLE_LABEL[x.role], theme: x.theme || '' })) });
      }
      if (p === '/api/login' && req.method === 'POST') {
        const b = await readBody(req);
        const user = db.users.find((x) => x.active !== false && (x.id === b.userId || (b.username && x.username === String(b.username).toLowerCase().trim())));
        if (!user) return sendJSON(res, 401, { error: 'Pengguna tidak ditemukan' });
        const f = loginFails[user.id] || { n: 0, until: 0 };
        if (f.until > now()) return sendJSON(res, 429, { error: 'Terlalu banyak percobaan. Coba lagi dalam ' + Math.ceil((f.until - now()) / 1000) + ' detik' });
        if (hashPin(b.pin, user.salt) !== user.pinHash) {
          f.n++; if (f.n >= 5) { f.until = now() + 60000; f.n = 0; }
          loginFails[user.id] = f;
          audit(user, 'Login gagal', 'PIN salah'); save();
          return sendJSON(res, 401, { error: 'PIN salah' });
        }
        delete loginFails[user.id];
        const token = crypto.randomBytes(24).toString('hex');
        db.tokens[token] = { userId: user.id, at: now() };
        user.lastLogin = now();
        audit(user, 'Login', ''); save();
        return sendJSON(res, 200, { token, user: publicUser(user) });
      }
      if (p.startsWith('/api/')) {
        const token = req.headers['x-token'] || u.query.token || '';
        const user = userFromToken(token);
        if (!user) return sendJSON(res, 401, { error: 'Belum login' });
        user._token = token;
        if (p === '/api/me') {
          return sendJSON(res, 200, {
            user: publicUser(user), permLabels: PERMS,
            defaultPin: hashPin('1234', user.salt) === user.pinHash,
            staffCount: db.users.filter((x) => x.role !== 'owner').length,
          });
        }
        if (p === '/api/state') return sendJSON(res, 200, snapshot());
        if (p === '/api/report' || p === '/api/export.csv') {
          const q = Object.assign({}, u.query);
          if (!can(user, 'report')) q.cashier = user.id; // kasir hanya melihat transaksinya sendiri
          if (p === '/api/report') return sendJSON(res, 200, Object.assign(report(q), { limited: !can(user, 'report') }));
          res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="elclassico-laporan.csv"' });
          return res.end(csv(q));
        }
        if (p === '/api/users') {
          need(user, 'users');
          return sendJSON(res, 200, { users: db.users.map(publicUser), permLabels: PERMS, roleDefaults: ROLE_DEFAULTS, roleLabels: ROLE_LABEL });
        }
        if (p === '/api/audit') {
          need(user, 'audit');
          const from = u.query.from ? new Date(u.query.from + 'T00:00:00').getTime() : 0;
          const to = u.query.to ? new Date(u.query.to + 'T23:59:59.999').getTime() : Infinity;
          const list = db.audit.filter((a) => a.at >= from && a.at <= to && (!u.query.user || a.userId === u.query.user));
          return sendJSON(res, 200, { items: list.slice(-1500).reverse() });
        }
        if (p === '/api/backup') {
          need(user, 'backup');
          audit(user, 'Unduh cadangan', ''); save();
          const copy = Object.assign({}, db, { tokens: {} });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="elclassico-backup.json"' });
          return res.end(JSON.stringify(copy));
        }
        if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Metode salah' });
        const b = await readBody(req);
        if (p === '/api/logout') { delete db.tokens[token]; audit(user, 'Logout', ''); save(); return sendJSON(res, 200, { ok: true }); }
        if (p === '/api/me/update') {
          if (b.name) user.name = String(b.name).trim().slice(0, 40) || user.name;
        if (typeof b.theme === 'string' && /^[a-z0-9-]{0,30}$/.test(b.theme)) {
          user.theme = b.theme;
          if (!b.name && !b.newPin) { save(); return sendJSON(res, 200, { user: publicUser(user) }); }
        }
          if (b.newPin) {
            if (hashPin(b.oldPin, user.salt) !== user.pinHash) throw new Error('PIN lama salah');
            if (!validPin(b.newPin)) throw new Error('PIN harus 4–8 digit angka');
            user.salt = crypto.randomBytes(8).toString('hex'); user.pinHash = hashPin(b.newPin, user.salt);
            revokeTokens(user.id, token);
          }
          audit(user, 'Ubah profil', b.newPin ? 'Ganti PIN' : 'Ganti nama'); save();
          return sendJSON(res, 200, { user: publicUser(user) });
        }
        if (p === '/api/users/save') return sendJSON(res, 200, saveUser(user, b));
        if (p === '/api/users/delete') return sendJSON(res, 200, deleteUser(user, b.id));
        const m = p.match(/^\/api\/session\/(\w+)$/);
        if (m && actions[m[1]]) {
          need(user, ACTION_PERM[m[1]]);
          if (m[1] === 'extend' && !b.packageId && Number(b.minutes) < 0) need(user, 'reduceTime');
          if ((m[1] === 'checkout' || m[1] === 'sale') && Number(b.discount) > 0) need(user, 'discount');
          actor = user;
          let result;
          try { result = actions[m[1]](b, user); } finally { actor = null; }
          let det = b.unitId ? unitName(b.unitId) : '';
          if (m[1] === 'start') det += ' · ' + (b.mode === 'open' ? 'Main Bebas' : (b.packageId ? ((db.packages.find((x) => x.id === b.packageId) || {}).name || '') : b.minutes + ' menit'));
          if (m[1] === 'extend') det += ' · ' + (b.packageId ? ((db.packages.find((x) => x.id === b.packageId) || {}).name || 'paket') : (Number(b.minutes) > 0 ? '+' : '') + b.minutes + ' menit');
          if (m[1] === 'move') det += ' → ' + unitName(b.toUnitId);
          if (m[1] === 'checkout' || m[1] === 'sale') det += ' · ' + result.id + ' · Rp ' + Number(result.total).toLocaleString('id-ID') + (result.discount ? ' (diskon Rp ' + Number(result.discount).toLocaleString('id-ID') + ')' : '') + ' · ' + result.method;
          if (m[1] === 'orderAdd') det += ' · ' + (b.items || []).map((it) => (it.qty || 1) + 'x ' + ((db.menu.find((x) => x.id === it.itemId) || {}).name || '?')).join(', ');
          audit(user, ACTION_LABEL[m[1]] || m[1], det.replace(/^ · /, '')); save();
          return sendJSON(res, 200, result);
        }
        if (p === '/api/tv/cmd' || p === '/api/tv/bulk') {
          need(user, 'tvControl');
          const r = p === '/api/tv/cmd' ? await tvCommand(b) : await tvBulk(b);
          if (['power', 'powerOff', 'setup', 'setHdmi', 'settings', 'lock', 'message'].indexOf(b.cmd) >= 0 || p === '/api/tv/bulk') {
            audit(user, 'Kontrol TV', (p === '/api/tv/bulk' ? 'Massal (' + (r.sent || 0) + ' TV)' : unitName(b.unitId)) + ' · ' + b.cmd + (b.text ? ' · "' + String(b.text).slice(0, 60) + '"' : '')); save();
          }
          return sendJSON(res, 200, r);
        }
        const c = p.match(/^\/api\/config\/(\w+)$/);
        if (c) {
          need(user, 'settings');
          const r = saveConfig(c[1], b.value);
          audit(user, 'Ubah pengaturan', { settings: 'Umum', types: 'Tipe & Tarif', packages: 'Paket', units: 'Unit TV', menu: 'Menu F&B' }[c[1]] || c[1]); save();
          return sendJSON(res, 200, r);
        }
        if (p === '/api/transaction/delete') {
          need(user, 'deleteTrx');
          const i = db.transactions.findIndex((x) => x.id === b.id);
          if (i < 0) throw new Error('Transaksi tidak ditemukan');
          const x = db.transactions[i];
          db.transactions.splice(i, 1);
          audit(user, 'Hapus transaksi', x.id + ' · Rp ' + Number(x.total).toLocaleString('id-ID') + ' · ' + (x.unitName || ''));
          changed(); return sendJSON(res, 200, { ok: true });
        }
        if (p === '/api/restore') {
          need(user, 'backup');
          if (!b.data || !Array.isArray(b.data.units)) throw new Error('File backup tidak valid');
          const keepUsers = db.users, keepTokens = db.tokens, keepAudit = db.audit;
          const next = Object.assign(defaultDB(), b.data);
          if (!Array.isArray(next.users) || !next.users.length) next.users = keepUsers;
          next.tokens = keepTokens;
          next.audit = keepAudit;
          db = normalize(next);
          audit(user, 'Pulihkan data', 'dari file cadangan');
          save(true); changed(); return sendJSON(res, 200, { ok: true });
        }
        return sendJSON(res, 404, { error: 'Endpoint tidak ada' });
      }
      // Halaman
      if (p === '/' || p === '/index.html') return serveStatic(res, 'index.html');
      if (p === '/tv' || p === '/tv/') return serveStatic(res, 'tv.html');
      return serveStatic(res, p.replace(/^\/+/, ''));
    } catch (e) {
      return sendJSON(res, e.code === 403 ? 403 : 400, { error: e.message || String(e) });
    }
  });

  // ---------- WebSocket ----------
  WS.attach(server, (conn) => {
    const q = url.parse(conn.req.url, true).query;
    const ip = (conn.req.socket.remoteAddress || '').replace('::ffff:', '');
    if (q.role === 'admin') {
      const user = userFromToken(q.token);
      if (!user) { conn.send({ t: 'auth', error: 'Belum login' }); return conn.close(); }
      conn.user = user; conn.token = q.token;
      adminConns.add(conn);
      conn.send(snapshot());
      conn.on('close', () => adminConns.delete(conn));
      return;
    }
    // TV (native service atau browser)
    const unitId = String(q.unit || '').slice(0, 24);
    if (!unitId) return conn.close();
    conn.meta = { unitId, ip, kind: q.kind || 'web' };
    if (!tvConns.has(unitId)) tvConns.set(unitId, new Set());
    const wasOnline = tvConns.get(unitId).size > 0;
    tvConns.get(unitId).add(conn);
    tvInfo[unitId] = Object.assign({}, tvInfo[unitId] || {}, { ip, kind: conn.meta.kind, connectedAt: now() });
    conn.send(tvState(unitId));
    setTimeout(() => autoMac(unitId), 2000);
    if (tvInfo[unitId]) { delete tvInfo[unitId].offAt; }
    if (!wasOnline) { const un = unitById(unitId); notifyAdmins((un ? un.name : unitId) + ' online', 'info', unitId); }
    pushAdmins();
    conn.on('message', (m) => {
      if (!m || typeof m !== 'object') return;
      if (m.t === 'hello' || m.t === 'status') {
        const wasOff = (tvInfo[unitId] || {}).screenOn === false;
        tvInfo[unitId] = Object.assign({}, tvInfo[unitId] || {}, m.info || {}, { ip, lastSeen: now() });
        if (wasOff && tvInfo[unitId].screenOn !== false && !db.sessions[unitId]) idleSince[unitId] = now();
        if (m.info && m.info.mac && /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(m.info.mac) && m.info.mac !== '02:00:00:00:00:00') {
          const un = unitById(unitId);
          if (un && !un.mac) { un.mac = m.info.mac.toUpperCase(); save(); }
        }
        pushAdmins();
      } else if (m.t === 'getState') {
        conn.send(tvState(unitId));
      } else if (m.t === 'ack') {
        notifyAdmins((unitById(unitId) || { name: unitId }).name + ': ' + (m.text || 'OK'), m.level || 'info', unitId);
      }
    });
    conn.on('close', () => {
      const set = tvConns.get(unitId);
      if (set) set.delete(conn);
      if (!set || set.size === 0) {
        const un = unitById(unitId);
        notifyAdmins((un ? un.name : unitId) + ' offline', 'warning', unitId);
      }
      pushAdmins();
    });
  });

  // ---------- Discovery UDP (TV & aplikasi desktop menemukan server otomatis) ----------
  let udp;
  try {
    udp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    udp.on('error', () => {});
    udp.bind(() => {
      udp.setBroadcast(true);
      const beacon = () => {
        const msg = Buffer.from('ELCLASSICO|' + PORT + '|' + db.settings.name);
        broadcastAddrs().forEach((a) => udp.send(msg, DISCOVERY_PORT, a, () => {}));
      };
      beacon();
      setInterval(beacon, 3000);
    });
  } catch (e) {}

  server.listen(PORT, '0.0.0.0', () => {
    const ips = localIPs();
    log('==============================================');
    log(db.settings.name + ' — Billing Server v' + VERSION);
    log('Panel kasir   : http://localhost:' + PORT);
    ips.forEach((i) => log('Dari jaringan : http://' + i.address + ':' + PORT + '  (' + i.name + ')'));
    log('Layar TV (web): http://<ip-server>:' + PORT + '/tv?unit=tv1');
    log('Login awal    : Admin Utama · PIN 1234 (segera ganti di Profil)');
    log('Data          : ' + DB_FILE);
    log('==============================================');
  });

  const shutdown = () => { save(true); };
  process.on('exit', shutdown);
  return { server, port: PORT, stop: () => { save(true); server.close(); try { udp && udp.close(); } catch (e) {} }, ips: () => localIPs() };
}

module.exports = { start, VERSION };

if (require.main === module) {
  const argPort = process.argv.find((a) => /^--port=/.test(a));
  start({ port: argPort ? argPort.split('=')[1] : undefined });
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
}
