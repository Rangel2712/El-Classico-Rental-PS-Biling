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
const WS = require('./lib/ws');

const VERSION = '1.1.0';
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
      pin: '1234',
      warningSeconds: 60,
      rounding: 500,
      lockOnPause: true,
      autoHdmi: true,
      showTimerPill: true,
      receiptFooter: 'Terima kasih telah bermain di El Classico!',
      openBillingBlock: 1, // menit pembulatan untuk mode Main Bebas
      autoOffAfterCheckout: false, // matikan TV otomatis setelah pembayaran
      idleOffMinutes: 0,           // matikan TV kosong setelah N menit (0 = nonaktif)
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
    sessions: {},       // unitId -> session
    transactions: [],   // transaksi selesai
    counters: { trx: 0 },
  };
}

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
  let db;
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const d = defaultDB();
    db.settings = Object.assign({}, d.settings, db.settings || {});
    ['types', 'packages', 'units', 'menu', 'transactions'].forEach((k) => { if (!Array.isArray(db[k])) db[k] = d[k]; });
    db.sessions = db.sessions || {};
    db.counters = db.counters || { trx: 0 };
    db.secret = db.secret || d.secret;
  } catch (e) {
    db = defaultDB();
  }

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

  const tokenFor = (pin) => crypto.createHmac('sha256', db.secret).update(String(pin)).digest('hex').slice(0, 40);

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
      total: rentalCost(s, t) + ordersTotal(s), note: s.note || '',
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
  function addLog(s, text) {
    s.log = s.log || [];
    s.log.push({ at: now(), text });
  }

  // ---------- Wake-on-LAN ----------
  function wake(mac) {
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
        let n = 0;
        targets.forEach((addr) => [9, 7].forEach((port) => {
          n++;
          sock.send(pkt, port, addr, () => { if (--n === 0) { sock.close(); resolve(targets); } });
        }));
      });
    });
  }

  // ---------- Aksi sesi ----------
  const actions = {
    start(b) {
      const unit = unitById(b.unitId);
      if (!unit) throw new Error('Unit tidak ditemukan');
      if (db.sessions[unit.id]) throw new Error(unit.name + ' sedang dipakai');
      const type = typeById(unit.type);
      const mode = b.mode === 'open' ? 'open' : 'timer';
      const s = {
        id: uid('S'), unitId: unit.id, mode, customer: (b.customer || '').slice(0, 40),
        startedAt: now(), pausedMs: 0, pauseStartedAt: null, expired: false, warned: false,
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
    extend(b) {
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
    pause(b) {
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif');
      if (s.expired) throw new Error('Waktu sudah habis');
      if (!s.pauseStartedAt) { s.pauseStartedAt = now(); addLog(s, 'Dijeda'); }
      changed(b.unitId);
      return sessionView(s);
    },
    resume(b) {
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif');
      if (s.expired) throw new Error('Waktu habis — tambah waktu dahulu');
      if (s.pauseStartedAt) { s.pausedMs += now() - s.pauseStartedAt; s.pauseStartedAt = null; addLog(s, 'Dilanjutkan'); }
      changed(b.unitId);
      return sessionView(s);
    },
    stop(b) {
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
    checkout(b) {
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
    move(b) {
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
    note(b) {
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif');
      if (b.customer != null) s.customer = String(b.customer).slice(0, 40);
      if (b.note != null) s.note = String(b.note).slice(0, 200);
      changed(b.unitId);
      return sessionView(s);
    },
    orderAdd(b) {
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
    orderStatus(b) {
      const s = db.sessions[b.unitId];
      if (!s) throw new Error('Tidak ada sesi aktif');
      const o = s.orders.find((x) => x.id === b.orderId);
      if (!o) throw new Error('Pesanan tidak ditemukan');
      o.status = b.status;
      if (b.status === 'diantar') sendTV(b.unitId, { t: 'cmd', cmd: 'toast', text: '🛎️ Pesanan diantar: ' + o.qty + 'x ' + o.name });
      changed(b.unitId);
      return sessionView(s);
    },
    orderRemove(b) {
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
    sale(b) {
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
      };
      db.transactions.push(trx);
      changed();
      save(true);
      return trx;
    },
  };

  // ---------- Perintah ke TV ----------
  const TV_CMDS = ['powerOff', 'volume', 'volumeUp', 'volumeDown', 'mute', 'settings', 'hdmi', 'home', 'lock', 'toast', 'message', 'wake', 'reload', 'beep', 'wifiSettings', 'inputs', 'unlock'];
  async function tvCommand(b) {
    const unit = unitById(b.unitId);
    if (b.unitId !== '*' && !unit) throw new Error('Unit tidak ditemukan');
    if (b.cmd === 'power') {
      idleSince[unit.id] = now();
      const online = (tvConns.get(unit.id) || new Set()).size > 0;
      if (online) sendTV(unit.id, { t: 'cmd', cmd: 'wake' });
      if (!unit.mac) {
        if (online) return { ok: true, note: 'Layar dibangunkan (MAC belum diisi, Wake-on-LAN dilewati)' };
        throw new Error('TV offline & alamat MAC belum diisi (Pengaturan › Unit TV) untuk Wake-on-LAN');
      }
      const sent = await wake(unit.mac);
      return { ok: true, sentTo: sent };
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
          if (unit.mac) await wake(unit.mac); else if (!(tvConns.get(id) || new Set()).size) throw new Error('offline & MAC belum diisi');
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
      ['lockOnPause', 'autoHdmi', 'showTimerPill', 'autoOffAfterCheckout'].forEach((k) => { if (value[k] != null) s[k] = !!value[k]; });
      if (value.newPin) {
        if (!/^\d{4,8}$/.test(String(value.newPin))) throw new Error('PIN harus 4–8 digit angka');
        s.pin = String(value.newPin);
      }
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
    const list = db.transactions.filter((x) => x.endedAt >= from && x.endedAt <= to);
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
      transactions: list.slice().reverse(),
    };
  }
  function csv(q) {
    const r = report(q);
    const rows = [['ID', 'Waktu Selesai', 'Jenis', 'Unit', 'Tipe', 'Pelanggan', 'Durasi (menit)', 'Sewa', 'F&B', 'Diskon', 'Total', 'Metode']];
    r.transactions.slice().reverse().forEach((x) => rows.push([
      x.id, new Date(x.endedAt).toLocaleString('id-ID'), x.kind === 'fnb' ? 'F&B' : 'Rental', x.unitName, x.typeName,
      x.customer || '', Math.round((x.playedMs || 0) / 60000), x.rentalCost, x.ordersTotal, x.discount || 0, x.total, x.method,
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
  const authed = (req) => (req.headers['x-token'] || '') === tokenFor(db.settings.pin);

  const server = http.createServer(async (req, res) => {
    const u = url.parse(req.url, true);
    const p = u.pathname;
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Token', 'Access-Control-Allow-Methods': 'GET, POST' });
      return res.end();
    }
    try {
      if (p === '/api/ping') return sendJSON(res, 200, { app: 'elclassico', name: db.settings.name, version: VERSION });
      if (p === '/api/login' && req.method === 'POST') {
        const b = await readBody(req);
        if (String(b.pin) === String(db.settings.pin)) return sendJSON(res, 200, { token: tokenFor(db.settings.pin) });
        return sendJSON(res, 401, { error: 'PIN salah' });
      }
      if (p.startsWith('/api/')) {
        if (!authed(req) && !(p === '/api/export.csv' && u.query.token === tokenFor(db.settings.pin))) return sendJSON(res, 401, { error: 'Belum login' });
        if (p === '/api/state') return sendJSON(res, 200, snapshot());
        if (p === '/api/report') return sendJSON(res, 200, report(u.query));
        if (p === '/api/export.csv') {
          res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="elclassico-laporan.csv"' });
          return res.end(csv(u.query));
        }
        if (p === '/api/backup') {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="elclassico-backup.json"' });
          return res.end(JSON.stringify(db));
        }
        if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Metode salah' });
        const b = await readBody(req);
        const m = p.match(/^\/api\/session\/(\w+)$/);
        if (m && actions[m[1]]) return sendJSON(res, 200, actions[m[1]](b));
        if (p === '/api/tv/cmd') return sendJSON(res, 200, await tvCommand(b));
        if (p === '/api/tv/bulk') return sendJSON(res, 200, await tvBulk(b));
        const c = p.match(/^\/api\/config\/(\w+)$/);
        if (c) return sendJSON(res, 200, saveConfig(c[1], b.value));
        if (p === '/api/transaction/delete') {
          const i = db.transactions.findIndex((x) => x.id === b.id);
          if (i < 0) throw new Error('Transaksi tidak ditemukan');
          db.transactions.splice(i, 1); changed(); return sendJSON(res, 200, { ok: true });
        }
        if (p === '/api/restore') {
          if (!b.data || !Array.isArray(b.data.units)) throw new Error('File backup tidak valid');
          db = Object.assign(defaultDB(), b.data); save(true); changed(); return sendJSON(res, 200, { ok: true });
        }
        return sendJSON(res, 404, { error: 'Endpoint tidak ada' });
      }
      // Halaman
      if (p === '/' || p === '/index.html') return serveStatic(res, 'index.html');
      if (p === '/tv' || p === '/tv/') return serveStatic(res, 'tv.html');
      return serveStatic(res, p.replace(/^\/+/, ''));
    } catch (e) {
      return sendJSON(res, 400, { error: e.message || String(e) });
    }
  });

  // ---------- WebSocket ----------
  WS.attach(server, (conn) => {
    const q = url.parse(conn.req.url, true).query;
    const ip = (conn.req.socket.remoteAddress || '').replace('::ffff:', '');
    if (q.role === 'admin') {
      if (q.token !== tokenFor(db.settings.pin)) { conn.send({ t: 'auth', error: 'Belum login' }); return conn.close(); }
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
    log('PIN default   : 1234 (segera ganti di Pengaturan)');
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
