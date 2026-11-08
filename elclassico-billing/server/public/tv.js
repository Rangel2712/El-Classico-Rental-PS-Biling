/* El Classico — Layar TV
 * Mode:
 *  - lock    : layar kunci penuh (dipakai APK saat kosong / jeda / habis)
 *  - overlay : transparan, timer kecil + hitung mundur 1 menit (dipakai APK saat bermain di HDMI)
 *  - web     : untuk browser TV tanpa APK (otomatis berganti lock/bermain)
 * Data: dari APK lewat window.ec.push(json) atau WebSocket langsung (mode web).
 */
(function () {
  'use strict';
  const q = new URLSearchParams(location.search);
  const NATIVE = typeof window.ElNative !== 'undefined';
  let mode = q.get('mode') || (NATIVE ? 'lock' : 'web');
  const unitId = q.get('unit') || (NATIVE && ElNative.getUnit ? ElNative.getUnit() : 'tv1');
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const rp = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
  const hms = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60); };
  const short = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(s / 3600); return (h ? h + ':' : '') + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60); };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let st = null, recvAt = 0, connected = false, lastStatus = null, beeped = {};
  document.body.classList.add(mode === 'overlay' ? 'overlaymode' : mode === 'lock' ? 'lockmode' : 'web');

  // ---------- Suara ----------
  let ac;
  function tone(f, d, type, v) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.25, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
    } catch (e) {}
  }
  const sfx = {
    warn: () => [0, 300, 600].forEach((t) => setTimeout(() => tone(880, .22, 'square', .18), t)),
    tick: () => tone(1000, .08, 'square', .15),
    end: () => { tone(440, .6, 'sawtooth', .25); setTimeout(() => tone(330, .9, 'sawtooth', .25), 600); },
    ding: () => { tone(880, .15); setTimeout(() => tone(1320, .25), 150); },
  };

  // ---------- Data masuk ----------
  function onMessage(m) {
    if (typeof m === 'string') { try { m = JSON.parse(m); } catch (e) { return; } }
    if (!m) return;
    if (m.t === 'state') { st = m; recvAt = Date.now(); render(); }
    else if (m.t === 'cmd') onCmd(m);
  }
  function onCmd(m) {
    if (m.cmd === 'toast') toast(m.text);
    else if (m.cmd === 'message') showMsg(m.text);
    else if (m.cmd === 'beep') { sfx.ding(); setTimeout(sfx.ding, 500); toast('🔔 Panggilan dari kasir'); }
    else if (m.cmd === 'warning') { /* ditangani render */ }
    else if (m.cmd === 'reload' && !NATIVE) location.reload();
    else if (!NATIVE && ['volume', 'volumeUp', 'volumeDown', 'mute', 'settings', 'hdmi'].indexOf(m.cmd) >= 0) toast('Perintah "' + m.cmd + '" butuh aplikasi APK El Classico');
  }
  function setConn(on) {
    connected = on;
    const d = $('cdot'); if (d) d.className = on ? 'on' : '';
    $('ctext').textContent = on ? 'Terhubung ke server' : 'Menghubungkan ke server…';
    render();
  }
  window.ec = { push: onMessage, conn: setConn, mode: (m) => { mode = m; document.body.className = m === 'overlay' ? 'overlaymode' : 'lockmode'; render(); } };

  // ---------- WebSocket (mode browser) ----------
  function connect() {
    const host = q.get('server') || location.host;
    let ws;
    try { ws = new WebSocket((location.protocol === 'https:' ? 'wss' : 'ws') + '://' + host + '/ws?role=tv&kind=web&unit=' + encodeURIComponent(unitId)); }
    catch (e) { return setTimeout(connect, 3000); }
    ws.onopen = () => {
      setConn(true);
      ws.send(JSON.stringify({ t: 'hello', info: { model: navigator.userAgent.slice(0, 60), kind: 'web' } }));
    };
    ws.onmessage = (e) => onMessage(e.data);
    ws.onclose = () => { setConn(false); setTimeout(connect, 2500); };
    ws.onerror = () => {};
  }
  if (!NATIVE) connect();
  else if (ElNative.ready) setTimeout(() => ElNative.ready(mode), 50);

  // ---------- Render ----------
  function liveRem() {
    const s = st && st.session; if (!s) return 0;
    const d = s.status === 'playing' ? Date.now() - recvAt : 0;
    return s.mode === 'timer' ? Math.max(0, s.remainingMs - d) : s.elapsedMs + d;
  }
  function status() {
    const s = st && st.session; if (!s) return 'idle';
    if (s.status === 'playing' && s.mode === 'timer' && liveRem() <= 0) return 'expired';
    return s.status;
  }
  function render() {
    const s = st && st.session; const stt = st ? status() : 'offline';
    const showLock = mode === 'lock' || (mode === 'web' && stt !== 'playing');
    const showPlay = mode === 'web' && stt === 'playing';
    $('lock').classList.toggle('hidden', !showLock);
    $('play').classList.toggle('hidden', !showPlay);
    if (st) {
      $('bName').textContent = st.brand.name; $('bTag').textContent = st.brand.tagline || '';
      $('addr').textContent = [st.brand.address, st.brand.phone].filter(Boolean).join(' · ');
      $('uName').textContent = st.unit.name; $('uType').textContent = st.unit.typeName || '';
      $('pBrand').textContent = st.brand.name; $('pUnit').textContent = st.unit.name + ' · ' + (st.unit.typeName || '');
      $('pillU').textContent = st.unit.name;
      if (st.unit.unknown) { $('setupHint').textContent = 'ID unit "' + unitId + '" belum terdaftar di server — tambahkan di Pengaturan › Unit TV'; $('setupHint').classList.remove('hidden'); }
      else $('setupHint').classList.add('hidden');
    }
    $('lock').className = 'lock s-' + stt + (showLock ? '' : ' hidden');
    const bill = $('bill'), ht = $('hTime');
    bill.classList.add('hidden'); ht.classList.add('hidden'); $('info').classList.remove('hidden');
    if (!st || (!connected && !st)) { $('hTitle').textContent = 'MENGHUBUNGKAN'; $('hSub').textContent = 'Menunggu server billing…'; }
    else if (stt === 'idle') { $('hTitle').textContent = 'SIAP DIMAINKAN'; $('hSub').textContent = 'Hubungi kasir untuk mulai bermain 🎮'; }
    else if (stt === 'paused') {
      $('hTitle').textContent = 'PERMAINAN DIJEDA'; $('hSub').textContent = 'Waktu Anda aman tersimpan — hubungi kasir untuk melanjutkan';
      ht.classList.remove('hidden'); ht.textContent = hms(liveRem());
    } else if (stt === 'expired') {
      $('hTitle').textContent = 'WAKTU HABIS'; $('hSub').textContent = 'Terima kasih! Silakan ke kasir untuk tambah waktu atau pembayaran';
      $('info').classList.add('hidden'); bill.classList.remove('hidden');
      bill.innerHTML = '<div class="r"><span>Sewa ' + esc(st.unit.typeName) + '</span><b>' + rp(s.rentalCost) + '</b></div>' +
        (s.orders || []).map((o) => '<div class="r"><span>' + esc(o.emoji || '') + ' ' + o.qty + '× ' + esc(o.name) + '</span></div>').join('') +
        (s.ordersTotal ? '<div class="r"><span>Makanan &amp; minuman</span><b>' + rp(s.ordersTotal) + '</b></div>' : '') +
        '<div class="r t"><span>TOTAL</span><span>' + rp(s.total) + '</span></div>';
    } else if (stt === 'playing') {
      $('hTitle').textContent = 'SELAMAT BERMAIN'; $('hSub').textContent = s.mode === 'timer' ? 'Sisa waktu ' + hms(liveRem()) : 'Main bebas';
    }
    if (st) {
      $('rates').innerHTML = st.types.map((t) => '<div class="rate"><span><i class="c" style="background:' + esc(t.color || '#888') + '"></i>' + esc(t.name) + '</span><b>' + rp(t.ratePerHour) + '</b></div>').join('');
      $('pkgs').innerHTML = st.packages.slice(0, 6).map((p) => '<div class="pk"><span>' + esc(p.name) + '</span><b>' + rp(p.price) + '</b></div>').join('');
      const items = st.menu.map((m) => '<div class="mi"><div class="e">' + esc(m.emoji || '🍽️') + '</div><div class="n">' + esc(m.name) + '</div><div class="p">' + rp(m.price) + '</div></div>').join('');
      const sig = st.menu.map((m) => m.name + m.price).join('|');
      if ($('menu').dataset.sig !== sig) { $('menu').innerHTML = items + items; $('menu').dataset.sig = sig; }
    }
    if (stt !== lastStatus) {
      if (stt === 'expired' && lastStatus === 'playing') sfx.end();
      if (stt === 'playing' && lastStatus && lastStatus !== 'playing') { beeped = {}; sfx.ding(); }
      lastStatus = stt;
    }
    tick();
  }

  function tick() {
    const now = new Date();
    $('clk').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
    $('date').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const s = st && st.session;
    const stt = st ? status() : 'offline';
    const pill = $('pill'), warn = $('warn');
    const overlayOn = mode === 'overlay' || mode === 'web';
    if (!s || stt !== 'playing' || !overlayOn) { pill.classList.add('hidden'); warn.classList.add('hidden'); if (stt !== lastStatus) render(); return; }
    const v = liveRem();
    const wSec = (st.config && st.config.warningSeconds) || 60;
    if (s.mode === 'timer') {
      const secs = Math.ceil(v / 1000);
      // pill
      if (mode === 'overlay' && st.config.showTimerPill !== false) {
        pill.classList.remove('hidden'); $('pillT').textContent = short(v);
        pill.classList.toggle('low', secs <= 300 && secs > wSec); pill.classList.toggle('crit', secs <= wSec);
      } else pill.classList.add('hidden');
      // web play screen
      if (mode === 'web') {
        $('pLbl').textContent = 'SISA WAKTU'; $('pTime').textContent = hms(v);
        const total = (s.remainingMs + (Date.now() - recvAt)) || 1;
        $('pBar').style.width = Math.min(100, v / Math.max(v, s.remainingMs + s.elapsedMs) * 100) + '%';
        $('play').classList.toggle('warn', secs <= wSec);
      }
      // hitung mundur 1 menit
      if (secs <= wSec && secs > 0) {
        warn.classList.remove('hidden'); $('wNum').textContent = secs;
        $('ringF').style.strokeDashoffset = String(326.7 * (1 - secs / wSec));
        warn.classList.toggle('small', secs > 10);
        if (!beeped.w) { beeped.w = 1; sfx.warn(); }
        if (secs <= 10 && !beeped['t' + secs]) { beeped['t' + secs] = 1; sfx.tick(); }
      } else { warn.classList.add('hidden'); if (secs > wSec) beeped = {}; }
      if (secs <= 0 && lastStatus === 'playing') render();
    } else {
      warn.classList.add('hidden');
      if (mode === 'overlay' && st.config.showTimerPill !== false) { pill.classList.remove('hidden'); $('pillT').textContent = '▶ ' + short(v); pill.classList.remove('low', 'crit'); }
      if (mode === 'web') { $('pLbl').textContent = 'MAIN BEBAS · WAKTU BERJALAN'; $('pTime').textContent = hms(v); $('pBar').style.width = '100%'; }
    }
  }
  setInterval(tick, 250);
  setInterval(() => { if (st && (status() === 'paused')) render(); }, 5000);

  // ---------- Toast & pesan ----------
  function toast(text) {
    if (!text) return;
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = text;
    $('toasts').appendChild(el); sfx.ding();
    setTimeout(() => { el.style.transition = '.4s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 5000);
  }
  let msgT;
  function showMsg(text) {
    $('msgT').textContent = text; $('msg').classList.remove('hidden'); sfx.ding(); setTimeout(sfx.ding, 400);
    clearTimeout(msgT); msgT = setTimeout(() => $('msg').classList.add('hidden'), 12000);
  }
  // Tombol rahasia di browser: tekan "S" 5x untuk ganti unit
  let sk = 0, skT;
  document.addEventListener('keydown', (e) => {
    if (NATIVE) return;
    if (e.key === 's' || e.key === 'S') { sk++; clearTimeout(skT); skT = setTimeout(() => (sk = 0), 1500); if (sk >= 5) { const u = prompt('ID unit TV ini:', unitId); if (u) location.search = '?unit=' + encodeURIComponent(u); } }
  });
  render();
})();
