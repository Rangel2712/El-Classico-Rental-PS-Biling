/* El Classico Rental PS Billing — Panel Kasir */
(function () {
  'use strict';
  // ================= Ikon =================
  const I = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    play: '<polygon points="6 4 20 12 6 20 6 4"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    food: '<path d="M3 11h18M5 11a7 7 0 0 1 14 0M4 15h16l-1.5 4.5a2 2 0 0 1-1.9 1.5H7.4a2 2 0 0 1-1.9-1.5z"/>',
    pay: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
    power: '<path d="M18.4 6.6a9 9 0 1 1-12.8 0"/><path d="M12 2v10"/>',
    powerOff: '<path d="M18.4 6.6a9 9 0 1 1-12.8 0"/><path d="M12 2v10"/><path d="M3 3l18 18"/>',
    tvs: '<rect x="2" y="3" width="13" height="9" rx="2"/><rect x="9" y="11" width="13" height="9" rx="2"/>',
    tv: '<rect x="2" y="4" width="20" height="13" rx="2.5"/><path d="M8 21h8M12 17v4"/>',
    vol: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    volDown: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
    mute: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M22 9l-6 6M16 9l6 6"/>',
    hdmi: '<path d="M3 8h18v5l-3 3H6l-3-3z"/><path d="M8 11h8"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><circle cx="12" cy="19.5" r="1"/>',
    reload: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    move: '<path d="M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    print: '<path d="M6 9V2h12v7"/><rect x="2" y="9" width="20" height="9" rx="2"/><path d="M6 14h12v8H6z"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    sound: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
    soundOff: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M22 9l-6 6M16 9l6 6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    beep: '<path d="M12 2a7 7 0 0 0-7 7v4l-2 3h18l-2-3V9a7 7 0 0 0-7-7z"/><path d="M9 20a3 3 0 0 0 6 0"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="M11.5 11.5L21 2M17 6l3 3M15 8l2 2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    gamepad: '<path d="M6 11h4M8 9v4"/><circle cx="15.5" cy="11" r=".9"/><circle cx="17.5" cy="13" r=".9"/><path d="M7.5 6h9A5.5 5.5 0 0 1 22 11.5v1.7a3.3 3.3 0 0 1-6 1.9L14.8 14H9.2L8 15.1a3.3 3.3 0 0 1-6-1.9v-1.7A5.5 5.5 0 0 1 7.5 6z"/>',
  };
  const ic = (n, s) => '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (I[n] || '') + '</svg>';
  document.querySelectorAll('[data-i]').forEach((e) => (e.innerHTML = ic(e.dataset.i)));

  // ================= Utils =================
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rp = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
  const pad2 = (n) => String(n).padStart(2, '0');
  function hms(ms) {
    ms = Math.max(0, ms || 0);
    const s = Math.floor(ms / 1000);
    return pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor((s % 3600) / 60)) + ':' + pad2(s % 60);
  }
  function hm(ms) { const m = Math.round((ms || 0) / 60000); return m >= 60 ? Math.floor(m / 60) + ' jam ' + (m % 60 ? (m % 60) + ' mnt' : '') : m + ' mnt'; }
  const dt = (t) => new Date(t).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const tm = (t) => new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const ymd = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const STATUS = { playing: 'Bermain', paused: 'Dijeda', expired: 'Waktu Habis', idle: 'Kosong' };

  // ================= State =================
  const S = {
    token: localStorage.getItem('ec_token') || '',
    snap: null, recvAt: 0, ws: null, view: 'dashboard', filter: 'all',
    sound: localStorage.getItem('ec_sound') !== '0',
    cart: [], posCat: 'Semua', posTarget: '', today: null,
    rep: { range: 'today', from: ymd(new Date()), to: ymd(new Date()) },
    setTab: 'general', edit: {}, modalRefresh: null,
    me: null, loginUser: localStorage.getItem('ec_last_user') || '', pubUsers: [],
  };
  const can = (perm) => !!(S.me && S.me.perms && S.me.perms[perm]);
  const initials = (n) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const ROLE_TXT = { owner: 'Admin Utama', admin: 'Admin', kasir: 'Kasir' };

  // ================= Suara =================
  let actx;
  function beep(freq, dur, type, vol) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq || 880;
      g.gain.setValueAtTime(vol || 0.15, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (dur || 0.2));
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + (dur || 0.2));
    } catch (e) {}
  }
  const chime = { success: () => { beep(660, .12); setTimeout(() => beep(990, .18), 120); }, warning: () => { beep(880, .15, 'square', .08); setTimeout(() => beep(880, .15, 'square', .08), 220); }, danger: () => { [0, 250, 500].forEach((d) => setTimeout(() => beep(520, .2, 'sawtooth', .1), d)); }, info: () => beep(740, .1) };
  function renderSoundBtn() { $('#soundBtn').innerHTML = ic(S.sound ? 'sound' : 'soundOff'); }
  $('#soundBtn').onclick = () => { S.sound = !S.sound; localStorage.setItem('ec_sound', S.sound ? '1' : '0'); renderSoundBtn(); beep(800, .1); };
  renderSoundBtn();

  // ================= Toast =================
  function toast(text, level) {
    const el = document.createElement('div');
    el.className = 'toast ' + (level || 'info');
    el.innerHTML = '<span>' + esc(text) + '</span>';
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, level === 'danger' ? 8000 : 4000);
    while ($('#toasts').children.length > 5) $('#toasts').firstChild.remove();
  }

  // ================= API =================
  async function api(p, body) {
    const r = await fetch(p, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Token': S.token },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && p !== '/api/login') { logout(true); throw new Error('Sesi login berakhir'); }
    if (!r.ok) throw new Error(j.error || 'Gagal');
    return j;
  }
  async function act(p, body, okMsg) {
    try { const r = await api(p, body); if (okMsg) toast(okMsg, 'success'); return r; }
    catch (e) { toast(e.message, 'danger'); throw e; }
  }

  // ================= Login =================
  let pin = '';
  function renderPin() { $('#pinDots').innerHTML = Array.from({ length: Math.max(4, pin.length) }, (_, i) => '<i class="' + (i < pin.length ? 'f' : '') + '"></i>').join(''); }
  $('#pad').innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⏎'].map((k) => '<button data-k="' + k + '">' + k + '</button>').join('');
  async function loadPublicUsers() {
    try {
      const r = await fetch('/api/users/public').then((x) => x.json());
      S.pubUsers = r.users || [];
      $('#loginBrand').textContent = (r.name || 'El Classico').replace(/ Rental PS$/i, '');
      if (!S.pubUsers.find((x) => x.id === S.loginUser)) S.loginUser = S.pubUsers.length ? S.pubUsers[0].id : '';
      $('#loginFoot').style.display = S.pubUsers.length === 1 ? '' : 'none';
      renderUserPick();
    } catch (e) { $('#loginErr').textContent = 'Server tidak dapat dihubungi'; }
  }
  function renderUserPick() {
    $('#userPick').innerHTML = S.pubUsers.map((x) => '<div class="upick ' + (x.id === S.loginUser ? 'on' : '') + '" data-u="' + esc(x.id) + '"><span class="avatar ' + x.role + '">' + esc(initials(x.name)) + '</span><b>' + esc(x.name) + '</b><small>' + esc(ROLE_TXT[x.role] || x.role) + '</small></div>').join('');
    $$('#userPick .upick').forEach((el) => (el.onclick = () => { S.loginUser = el.dataset.u; pin = ''; renderPin(); $('#loginErr').textContent = ''; renderUserPick(); }));
  }
  async function tryLogin() {
    if (!S.loginUser) return;
    try {
      const r = await api('/api/login', { userId: S.loginUser, pin });
      S.token = r.token; S.me = r.user; localStorage.setItem('ec_token', S.token); localStorage.setItem('ec_last_user', S.loginUser);
      pin = ''; $('#loginErr').textContent = ''; boot();
    } catch (e) {
      pin = ''; renderPin(); $('#loginErr').textContent = e.message;
      $('.login .box').classList.add('shake'); setTimeout(() => $('.login .box').classList.remove('shake'), 400);
    }
  }
  function pinKey(k) {
    if (k === 'C') pin = pin.slice(0, -1);
    else if (k === '⏎') return tryLogin();
    else if (pin.length < 8) pin += k;
    renderPin();
  }
  $('#pad').onclick = (e) => { const k = e.target.dataset.k; if (k) pinKey(k); };
  document.addEventListener('keydown', (e) => {
    if ($('#login').classList.contains('hidden')) return;
    if (/^\d$/.test(e.key)) pinKey(e.key); else if (e.key === 'Backspace') pinKey('C'); else if (e.key === 'Enter') pinKey('⏎');
  });
  function logout(silent) {
    if (S.token && silent !== true) fetch('/api/logout', { method: 'POST', headers: { 'X-Token': S.token } }).catch(() => {});
    S.token = ''; S.me = null; localStorage.removeItem('ec_token');
    if (S.ws) { S.ws.onclose = null; S.ws.close(); }
    closeModal();
    $('#app').classList.add('hidden'); $('#login').classList.remove('hidden'); pin = ''; renderPin(); loadPublicUsers();
  }

  // ================= Profil & menu sesuai izin =================
  function applyMe() {
    const me = S.me; if (!me) return;
    $('#meCard').innerHTML = '<span class="avatar ' + me.role + '">' + esc(initials(me.name)) + '</span><div class="who"><b>' + esc(me.name) + '</b><small>' + esc(me.roleLabel || ROLE_TXT[me.role]) + '</small></div>' +
      '<div class="meacts"><button class="btn sm" id="meEdit" title="Profil & ganti PIN">' + ic('key', 14) + 'Profil</button><button class="btn sm" id="meOut" title="Keluar">' + ic('logout', 14) + 'Keluar</button></div>';
    $('#meEdit').onclick = openProfile; $('#meOut').onclick = () => logout();
    const vis = { dashboard: true, pos: can('fnb'), orders: can('fnb'), report: true, settings: can('settings') || can('backup'), users: can('users'), audit: can('audit') };
    $$('.nav').forEach((n) => n.classList.toggle('hidden', !vis[n.dataset.view]));
    $$('.nav[data-view="report"] span')[1].textContent = can('report') ? 'Laporan' : 'Shift Saya';
    if (!vis[S.view]) S.view = 'dashboard';
  }
  function openProfile() {
    const me = S.me;
    const m = modal(ic('key') + ' Profil Saya',
      '<div class="row" style="margin-bottom:16px"><span class="avatar ' + me.role + '" style="width:52px;height:52px;font-size:18px">' + esc(initials(me.name)) + '</span><div><b style="font-size:16px">' + esc(me.name) + '</b><div class="muted">@' + esc(me.username) + ' · <span class="role ' + me.role + '">' + esc(me.roleLabel) + '</span></div></div></div>' +
      '<div class="field"><label class="f">Nama tampilan</label><input id="pn" value="' + esc(me.name) + '"></div><div class="sep"></div><h3>Ganti PIN</h3>' +
      '<div class="row"><div class="field" style="flex:1"><label class="f">PIN lama</label><input type="password" id="po" inputmode="numeric" maxlength="8"></div><div class="field" style="flex:1"><label class="f">PIN baru (4–8 angka)</label><input type="password" id="p1" inputmode="numeric" maxlength="8"></div><div class="field" style="flex:1"><label class="f">Ulangi PIN baru</label><input type="password" id="p2" inputmode="numeric" maxlength="8"></div></div>' +
      '<div class="dim" style="font-size:12px">Hak akses Anda: ' + Object.keys(me.perms).filter((k) => me.perms[k]).length + ' dari ' + Object.keys(me.perms).length + ' izin.</div>',
      '<button class="btn" data-x>Tutup</button><button class="btn gold" id="ps">' + ic('check', 15) + 'Simpan</button>');
    $('[data-x]', m).onclick = closeModal;
    $('#ps', m).onclick = async () => {
      const body = { name: $('#pn', m).value };
      if ($('#p1', m).value) {
        if ($('#p1', m).value !== $('#p2', m).value) return toast('PIN baru tidak sama', 'warning');
        body.oldPin = $('#po', m).value; body.newPin = $('#p1', m).value;
      }
      try { const r = await act('/api/me/update', body, 'Profil disimpan'); S.me = r.user; applyMe(); closeModal(); } catch (e) {}
    };
  }

  // ================= WebSocket =================
  function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(proto + '://' + location.host + '/ws?role=admin&token=' + encodeURIComponent(S.token));
    S.ws = ws;
    ws.onopen = () => { $('#connDot').className = 'dot on'; $('#connTxt').textContent = 'Server terhubung'; };
    ws.onclose = () => {
      $('#connDot').className = 'dot off'; $('#connTxt').textContent = 'Terputus — mencoba lagi…';
      setTimeout(() => { if (S.token) connect(); }, 2000);
    };
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'auth') { toast(m.error || 'Sesi berakhir', 'warning'); return logout(true); }
      if (m.t === 'snapshot') { S.snap = m; S.recvAt = Date.now(); onSnapshot(); }
      if (m.t === 'toast') {
        toast(m.text, m.level); (chime[m.level] || chime.info)();
        if (m.level === 'success' && /selesai/.test(m.text)) loadToday();
      }
    };
  }
  let lastToday = 0;
  async function loadToday(force) {
    if (!force && Date.now() - lastToday < 3000) return;
    lastToday = Date.now();
    try { S.today = await api('/api/report'); if (S.view === 'dashboard') renderStats(); } catch (e) {}
  }

  async function boot() {
    try { const r = await api('/api/me'); S.me = r.user; } catch (e) { return; }
    $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
    applyMe();
    connect(); loadToday(true); setView(S.view);
  }

  // ================= Waktu live =================
  function live(s) {
    if (!s) return null;
    const d = s.status === 'playing' ? Date.now() - S.recvAt : 0;
    return {
      elapsed: s.elapsedMs + d,
      remaining: s.remainingMs == null ? null : Math.max(0, s.remainingMs - d),
    };
  }
  // Sama dengan server: kelipatan jam pakai tarif jam, sisa memakai tarif 30 menit
  function priceMinutes(H, Hf, minutes) {
    H = Number(H) || 0; Hf = Number(Hf) || 0; if (!(Hf > 0)) Hf = H / 2;
    const h = Math.floor(minutes / 60), r = minutes - h * 60;
    return h * H + (r <= 30 ? (r / 30) * Hf : Hf + ((r - 30) / 30) * (H - Hf));
  }
  const roundStep = (v) => { const step = (S.snap && S.snap.settings.rounding) || 1; return Math.ceil(Math.round(v) / step) * step; };
  function openCost(u, s, elapsed) {
    if (s.mode === 'timer') return s.rentalCost;
    const st = S.snap.settings; const block = Math.max(1, st.openBillingBlock || 1);
    const mins = Math.ceil(elapsed / 60000 / block) * block;
    const half = s.ratePerHalfHour != null ? s.ratePerHalfHour : typeOf(u.type).ratePerHalfHour;
    return roundStep(priceMinutes(s.ratePerHour, half, mins));
  }
  const halfRate = (ty) => roundStep(priceMinutes(ty.ratePerHour, ty.ratePerHalfHour, 30));
  setInterval(() => {
    $('#clock').textContent = new Date().toLocaleTimeString('id-ID', { hour12: false });
    if (!S.snap) return;
    const warnMs = (S.snap.settings.warningSeconds || 60) * 1000;
    S.snap.units.forEach((u) => {
      const s = u.session;
      const el = document.querySelector('.unit[data-id="' + u.id + '"]');
      if (!el || !s) return;
      const L = live(s);
      const tmEl = el.querySelector('.tm');
      if (s.mode === 'timer') {
        tmEl.textContent = hms(L.remaining);
        const pct = s.durationMs ? Math.min(100, (L.remaining / s.durationMs) * 100) : 0;
        const bar = el.querySelector('.bar i'); if (bar) bar.style.width = pct + '%';
        el.classList.toggle('warn', s.status === 'playing' && L.remaining <= warnMs);
      } else {
        tmEl.textContent = hms(L.elapsed);
        const c = el.querySelector('.cost'); if (c) c.textContent = rp(openCost(u, s, L.elapsed) + s.ordersTotal);
      }
    });
    if (S.modalRefresh) S.modalRefresh(true);
  }, 500);

  // ================= Navigasi =================
  const TITLES = { dashboard: ['Dashboard', 'Pantau & kendalikan semua unit PS secara langsung'], pos: ['Kasir F&B', 'Pesanan makanan, minuman & lainnya'], orders: ['Pesanan', 'Antrian pesanan dari setiap unit'], report: ['Laporan', 'Pendapatan & riwayat transaksi'], settings: ['Pengaturan', 'Tarif, paket, unit TV, menu & sistem'], users: ['Pengguna', 'Kelola Admin & Karyawan beserta hak aksesnya'], audit: ['Aktivitas', 'Catatan siapa melakukan apa & kapan'] };
  $$('.nav').forEach((n) => (n.onclick = () => setView(n.dataset.view)));
  function setView(v) {
    S.view = v;
    $$('.nav').forEach((n) => n.classList.toggle('active', n.dataset.view === v));
    $('#viewTitle').textContent = v === 'report' && !can('report') ? 'Shift Saya' : TITLES[v][0];
    $('#viewSub').textContent = v === 'report' && !can('report') ? 'Transaksi yang Anda selesaikan' : TITLES[v][1];
    if (v === 'settings') S.edit = {};
    render();
    if (v === 'report') loadReport();
    if (v === 'users') loadUsers();
    if (v === 'audit') loadAudit();
  }
  function onSnapshot() {
    const s = S.snap;
    $('#brandName').textContent = s.settings.name.replace(/ Rental PS$/i, '');
    document.title = s.settings.name + ' — Billing';
    const pending = s.units.reduce((a, u) => a + (u.session ? u.session.orders.filter((o) => o.status === 'diproses').length : 0), 0);
    $('#ordBadge').textContent = pending; $('#ordBadge').classList.toggle('hidden', !pending);
    $('#sideFoot').innerHTML = '<div><b>Alamat server</b></div>' + (s.ips.length ? s.ips.map((ip) => '<div class="mono">' + ip + ':' + s.port + '</div>').join('') : '<div class="mono">localhost:' + s.port + '</div>') + '<div class="dim" style="margin-top:6px">v' + s.version + ' · ' + s.units.filter((u) => u.online).length + '/' + s.units.length + ' TV online</div>';
    if (S.view === 'dashboard' || S.view === 'orders') render();
    else if (S.view === 'pos') renderPosTargets();
    if (S.modalRefresh) S.modalRefresh(false);
  }
  function render() {
    const c = $('#content');
    if (!S.snap) { c.innerHTML = '<div class="empty"><div class="big">⏳</div>Memuat data…</div>'; return; }
    ({ dashboard: renderDashboard, pos: renderPos, orders: renderOrders, report: renderReport, settings: renderSettings, users: renderUsers, audit: renderAudit })[S.view]();
  }

  // ================= Dashboard =================
  function unitStatus(u) { return u.session ? u.session.status : 'idle'; }
  function typeOf(id) { return (S.snap.types.find((t) => t.id === id) || { name: '-', color: '#64748b', ratePerHour: 0 }); }
  function renderStats() {
    const el = $('#stats'); if (!el || !S.snap) return;
    const us = S.snap.units;
    const active = us.filter((u) => u.session).length;
    const pending = us.reduce((a, u) => a + (u.session ? u.session.orders.filter((o) => o.status === 'diproses').length : 0), 0);
    const running = us.reduce((a, u) => a + (u.session ? u.session.total : 0), 0);
    const t = S.today || { total: 0, count: 0 };
    el.innerHTML =
      stat('Unit Aktif', active + ' / ' + us.length, us.filter((u) => unitStatus(u) === 'expired').length + ' waktu habis', 'rgba(34,197,94,.1)', 'gamepad') +
      stat(can('report') ? 'Pendapatan Hari Ini' : 'Pendapatan Saya Hari Ini', rp(t.total), t.count + ' transaksi · berjalan ' + rp(running), 'rgba(245,197,24,.12)', 'pay') +
      stat('Pesanan Diproses', pending, 'menunggu diantar', 'rgba(239,68,68,.1)', 'food') +
      stat('TV Online', us.filter((u) => u.online).length + ' / ' + us.length, 'terhubung ke WiFi', 'rgba(29,95,214,.14)', 'wifi');
  }
  const stat = (k, v, s, glow, icon) => '<div class="stat" style="--glow:' + glow + '"><div class="k">' + ic(icon, 16) + esc(k) + '</div><div class="v num">' + esc(v) + '</div><div class="s">' + esc(s) + '</div></div>';

  function renderDashboard() {
    const us = S.snap.units;
    const counts = { all: us.length, idle: 0, playing: 0, paused: 0, expired: 0 };
    us.forEach((u) => counts[unitStatus(u)]++);
    const list = us.filter((u) => S.filter === 'all' || unitStatus(u) === S.filter);
    $('#content').innerHTML =
      '<div class="stats" id="stats"></div>' +
      '<div class="toolbar"><div class="seg" id="seg">' +
      [['all', 'Semua'], ['idle', 'Kosong'], ['playing', 'Bermain'], ['paused', 'Dijeda'], ['expired', 'Habis']].map(([k, l]) => '<button class="' + (S.filter === k ? 'on' : '') + '" data-f="' + k + '">' + l + ' (' + counts[k] + ')</button>').join('') +
      '</div><div class="grow" style="flex:1"></div>' +
      (can('tvControl') ? '<button class="btn" id="bulkBtn">' + ic('tvs', 16) + 'Kontrol Semua TV</button>' +
      '<button class="btn" id="allMsg">' + ic('msg', 16) + 'Pesan ke semua TV</button>' : '') +
      (can('settings') ? '<button class="btn" id="addUnit">' + ic('plus', 16) + 'Tambah Unit</button>' : '') + '</div>' +
      (list.length ? '<div class="units">' + list.map(unitCard).join('') + '</div>' : '<div class="empty card"><div class="big">🎮</div>Tidak ada unit pada filter ini</div>');
    renderStats();
    $$('#seg button').forEach((b) => (b.onclick = () => { S.filter = b.dataset.f; renderDashboard(); }));
    if ($('#addUnit')) $('#addUnit').onclick = () => { S.setTab = 'units'; setView('settings'); };
    if ($('#allMsg')) $('#allMsg').onclick = () => promptMsg('*');
    if ($('#bulkBtn')) $('#bulkBtn').onclick = openBulk;
    $$('.unit [data-a]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); unitAction(b.dataset.a, b.closest('.unit').dataset.id); }));
    $$('.unit .timebox').forEach((b) => (b.onclick = () => openUnit(b.closest('.unit').dataset.id)));
  }
  function unitCard(u) {
    const s = u.session, st = unitStatus(u), ty = typeOf(u.type);
    const L = live(s);
    let time, label, bar = '';
    if (!s) { time = '<div class="tm idle">Siap Dimainkan</div>'; label = ty.ratePerHour ? rp(halfRate(ty)) + ' / 30 mnt · ' + rp(ty.ratePerHour) + ' / jam' : 'Kosong'; }
    else if (s.mode === 'timer') {
      time = '<div class="tm num">' + hms(L.remaining) + '</div>'; label = st === 'expired' ? 'Waktu habis' : 'Sisa waktu';
      bar = '<div class="bar"><i style="width:' + (s.durationMs ? Math.min(100, L.remaining / s.durationMs * 100) : 0) + '%"></i></div>';
    } else { time = '<div class="tm num">' + hms(L.elapsed) + '</div>'; label = 'Main bebas · berjalan'; }
    const warn = s && s.mode === 'timer' && st === 'playing' && L.remaining <= S.snap.settings.warningSeconds * 1000;
    const pend = s ? s.orders.filter((o) => o.status === 'diproses') : [];
    let acts;
    if (!can('session')) acts = '';
    else if (!s) acts = !can('tvControl') ? '<div class="acts" style="grid-template-columns:1fr"><button class="btn gold" data-a="start">' + ic('play', 15) + 'Mulai Sewa</button></div>' : '<div class="acts three"><button class="btn gold" data-a="start">' + ic('play', 15) + 'Mulai Sewa</button><button class="btn green" data-a="power" title="Hidupkan TV">' + ic('power', 15) + '</button><button class="btn red" data-a="powerOff" title="Matikan TV">' + ic('powerOff', 15) + '</button><button class="btn" data-a="tv" title="Kontrol TV">' + ic('tv', 15) + '</button></div>';
    else acts = '<div class="acts">' +
      (s.mode === 'timer' ? '<button class="btn green" data-a="extend" title="Tambah waktu">' + ic('plus', 15) + 'Waktu</button>' : '<button class="btn" data-a="tv" title="Kontrol TV" ' + (can('tvControl') ? '' : 'disabled') + '>' + ic('tv', 15) + 'TV</button>') +
      (st === 'paused' ? '<button class="btn amber" data-a="resume">' + ic('play', 15) + 'Lanjut</button>' : '<button class="btn" data-a="pause" ' + (st === 'expired' ? 'disabled' : '') + '>' + ic('pause', 15) + 'Jeda</button>') +
      (can('fnb') ? '<button class="btn" data-a="order">' + ic('food', 15) + 'Pesan</button>' : '<button class="btn" disabled>' + ic('food', 15) + 'Pesan</button>') +
      '<button class="btn ' + (st === 'expired' ? 'gold' : 'red') + '" data-a="checkout">' + ic('pay', 15) + 'Bayar</button></div>';
    return '<div class="unit ' + st + (warn ? ' warn' : '') + '" data-id="' + esc(u.id) + '" style="--tc:' + esc(ty.color || '#64748b') + '">' +
      '<div class="head"><div class="tv">' + ic('tv', 20) + '</div><div><div class="nm">' + esc(u.name) + '</div><div class="ty">' + esc(ty.name.toUpperCase()) + (u.note ? ' · <span class="muted">' + esc(u.note) + '</span>' : '') + '</div></div>' +
      '<div class="right">' + (u.online && u.info && u.info.kind === 'native' && u.info.overlayMode === 'toast' ? '<span class="chip paused" title="Timer di atas game belum aktif — buka Kontrol TV">Timer ⚠</span>' : '') + (u.online && u.info && u.info.screenOn === false ? '<span class="chip off" title="Layar TV mati / standby">Layar mati</span>' : '') + '<span class="chip ' + (s && s.mode === 'open' && st === 'playing' ? 'open' : st) + '">' + (s && s.mode === 'open' && st === 'playing' ? 'Main Bebas' : STATUS[st]) + '</span><span class="dot ' + (u.online ? 'on' : 'off') + '" title="' + (u.online ? 'TV online' : 'TV offline') + '"></span></div></div>' +
      '<div class="timebox" title="Detail & kontrol"><div class="lbl">' + label + '</div>' + time + bar + '</div>' +
      (s ? '<div class="meta"><span>' + ic('user', 13) + ' ' + esc(s.customer || 'Pelanggan') + ' · mulai ' + tm(s.startedAt) + '</span><b class="cost num">' + rp(s.mode === 'open' ? openCost(u, s, L.elapsed) + s.ordersTotal : s.total) + '</b></div>' : '') +
      (pend.length ? '<div class="ordersmini">' + pend.map((o) => '<span class="new">' + esc(o.emoji || '') + ' ' + o.qty + '× ' + esc(o.name) + '</span>').join('') + '</div>' : '') +
      acts + '</div>';
  }
  async function unitAction(a, id) {
    const u = S.snap.units.find((x) => x.id === id);
    if (a === 'start') return openStart(id);
    if (a === 'extend') return openExtend(id);
    if (a === 'order') return openOrder(id);
    if (a === 'checkout') return openCheckout(id);
    if (a === 'tv') return openUnit(id, 'tv');
    if (a === 'pause') return act('/api/session/pause', { unitId: id }, u.name + ' dijeda');
    if (a === 'resume') return act('/api/session/resume', { unitId: id }, u.name + ' dilanjutkan');
    if (a === 'power') return tvCmd(id, 'power');
    if (a === 'powerOff') return powerOff(id);
  }
  async function powerOff(id) {
    const u = unitOf(id);
    if (u.session && !(await confirmBox('Matikan ' + esc(u.name) + '?', 'Unit ini masih punya sesi <b>' + STATUS[u.session.status] + '</b>. Waktu sewa tetap berjalan kecuali Anda menjedanya dulu.', 'Tetap Matikan', 'red'))) return;
    return tvCmd(id, 'powerOff');
  }
  async function tvCmd(unitId, cmd, value, text) {
    try {
      const r = await api('/api/tv/cmd', { unitId, cmd, value, text });
      if (cmd === 'power') toast(r.note || 'Perintah hidupkan terkirim (Wake-on-LAN)', 'success');
      else if (cmd === 'powerOff') toast('Perintah matikan terkirim ke ' + (unitOf(unitId) || { name: 'TV' }).name, 'success');
      else if (['setHdmi', 'setOpenOnWake', 'setup'].indexOf(cmd) >= 0) { /* TV membalas sendiri */ }
      else toast('Perintah terkirim ke TV', 'info');
      return r;
    } catch (e) { toast(e.message, 'danger'); }
  }

  // ================= Modal =================
  function modal(title, body, foot, cls) {
    closeModal();
    const root = $('#modalRoot');
    root.innerHTML = '<div class="overlay"><div class="modal ' + (cls || '') + '"><div class="mh"><h2>' + title + '</h2><button class="btn icon ghost x">' + ic('x') + '</button></div><div class="mb">' + body + '</div>' + (foot ? '<div class="mf">' + foot + '</div>' : '') + '</div></div>';
    $('.x', root).onclick = closeModal;
    $('.overlay', root).onmousedown = (e) => { if (e.target.classList.contains('overlay')) closeModal(); };
    return $('.modal', root);
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; S.modalRefresh = null; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  function confirmBox(title, text, okLabel, cls) {
    return new Promise((res) => {
      const m = modal(title, '<p style="margin:0;line-height:1.6">' + text + '</p>', '<button class="btn" data-c="0">Batal</button><button class="btn ' + (cls || 'gold') + '" data-c="1">' + (okLabel || 'Ya') + '</button>');
      $$('[data-c]', m).forEach((b) => (b.onclick = () => { closeModal(); res(b.dataset.c === '1'); }));
    });
  }
  function unitOf(id) { return S.snap.units.find((x) => x.id === id); }
  function priceFor(u, minutes, pkg) {
    if (pkg && pkg.prices && pkg.prices[u.type] != null && pkg.prices[u.type] !== '') return Number(pkg.prices[u.type]);
    const ty = typeOf(u.type);
    return roundStep(priceMinutes(ty.ratePerHour, ty.ratePerHalfHour, minutes));
  }

  // ---- Mulai sewa ----
  function openStart(id) {
    const u = unitOf(id); const ty = typeOf(u.type);
    let mode = 'pkg', pkgId = S.snap.packages[1] ? S.snap.packages[1].id : (S.snap.packages[0] || {}).id, minutes = 60;
    const m = modal('Mulai Sewa · ' + esc(u.name) + ' <span class="chip" style="margin-left:6px">' + esc(ty.name) + '</span>',
      '<div class="tabs" id="mtabs"><button data-m="pkg">Paket Waktu</button><button data-m="custom">Menit Bebas</button><button data-m="open">Main Bebas (Open)</button></div>' +
      '<div id="mbody"></div>' +
      '<div class="field" style="margin-top:16px"><label class="f">Nama pelanggan (opsional)</label><input id="cust" placeholder="mis. Bang Yoel"></div>' +
      '<div class="total"><span class="muted" id="sumLbl">Total sewa</span><b class="num" id="sum">-</b></div>' +
      (u.online ? '' : '<p class="dim" style="font-size:12px;margin:12px 0 0">⚠️ TV sedang offline. Sesi tetap berjalan; TV otomatis mengikuti saat tersambung.</p>'),
      '<button class="btn" data-x>Batal</button><button class="btn gold lg" id="go">' + ic('play', 16) + 'Mulai & Nyalakan</button>');
    $('[data-x]', m).onclick = closeModal;
    function draw() {
      $$('#mtabs button', m).forEach((b) => b.classList.toggle('on', b.dataset.m === mode));
      const body = $('#mbody', m);
      if (mode === 'pkg') {
        body.innerHTML = '<div class="opts">' + S.snap.packages.map((p) => '<div class="opt ' + (p.id === pkgId ? 'on' : '') + '" data-p="' + esc(p.id) + '"><b>' + esc(p.name) + '</b><small>' + hm(p.minutes * 60000) + '</small><div class="pr">' + rp(priceFor(u, p.minutes, p)) + '</div></div>').join('') + '</div>';
        $$('[data-p]', body).forEach((o) => (o.onclick = () => { pkgId = o.dataset.p; draw(); }));
        const p = S.snap.packages.find((x) => x.id === pkgId);
        $('#sum', m).textContent = p ? rp(priceFor(u, p.minutes, p)) : '-'; $('#sumLbl', m).textContent = 'Total sewa';
      } else if (mode === 'custom') {
        body.innerHTML = '<label class="f">Durasi (menit)</label><div class="row"><button class="btn icon" id="mm">' + ic('minus') + '</button><input type="number" id="mins" value="' + minutes + '" min="1" style="text-align:center;font-size:20px;font-weight:700"><button class="btn icon" id="mp">' + ic('plus') + '</button></div>' +
          '<div class="row wrap" style="margin-top:10px">' + [15, 30, 45, 60, 90, 120, 180, 240].map((x) => '<button class="btn sm" data-q="' + x + '">' + hm(x * 60000) + '</button>').join('') + '</div>' +
          '<p class="dim" style="font-size:12px">Tarif ' + rp(halfRate(ty)) + '/30 menit · ' + rp(ty.ratePerHour) + '/jam, dibulatkan ke ' + rp(S.snap.settings.rounding) + '</p>';
        const upd = () => { minutes = Math.max(1, Number($('#mins', m).value) || 0); $('#sum', m).textContent = rp(priceFor(u, minutes)); };
        $('#mins', m).oninput = upd;
        $('#mm', m).onclick = () => { $('#mins', m).value = Math.max(5, minutes - 5); upd(); };
        $('#mp', m).onclick = () => { $('#mins', m).value = minutes + 5; upd(); };
        $$('[data-q]', body).forEach((b) => (b.onclick = () => { $('#mins', m).value = b.dataset.q; upd(); }));
        upd(); $('#sumLbl', m).textContent = 'Total sewa';
      } else {
        body.innerHTML = '<div class="card" style="text-align:center"><div style="font-size:40px">♾️</div><b>Main sepuasnya, bayar di akhir</b><p class="muted" style="margin:6px 0 0">Biaya dihitung dari durasi bermain (' + rp(halfRate(ty)) + '/30 menit · ' + rp(ty.ratePerHour) + '/jam). TV menampilkan waktu berjalan.</p></div>';
        $('#sum', m).textContent = rp(halfRate(ty)) + '/30m · ' + rp(ty.ratePerHour) + '/jam'; $('#sumLbl', m).textContent = 'Tarif';
      }
    }
    $$('#mtabs button', m).forEach((b) => (b.onclick = () => { mode = b.dataset.m; draw(); }));
    draw();
    $('#go', m).onclick = async () => {
      const body = { unitId: id, customer: $('#cust', m).value };
      if (mode === 'pkg') { body.mode = 'timer'; body.packageId = pkgId; }
      else if (mode === 'custom') { body.mode = 'timer'; body.minutes = minutes; }
      else body.mode = 'open';
      try { await act('/api/session/start', body); closeModal(); } catch (e) {}
    };
  }

  // ---- Tambah waktu ----
  function openExtend(id) {
    const u = unitOf(id); let minutes = 30, pkgId = null, minus = false;
    const m = modal('Tambah Waktu · ' + esc(u.name),
      '<div id="liveRem" class="card" style="text-align:center;margin-bottom:16px"></div>' +
      '<label class="f">Pilih paket</label><div class="opts" id="pk">' + S.snap.packages.map((p) => '<div class="opt" data-p="' + esc(p.id) + '"><b>+ ' + esc(p.name) + '</b><div class="pr">' + rp(priceFor(u, p.minutes, p)) + '</div></div>').join('') + '</div>' +
      '<div class="sep"></div><label class="f">Atau menit bebas</label><div class="row wrap" id="qk">' + [5, 10, 15, 30, 45, 60].map((x) => '<button class="btn sm" data-q="' + x + '">+' + x + ' mnt</button>').join('') + '</div>' +
      '<div class="row" style="margin-top:10px"><input type="number" id="mins" value="30" min="1" style="max-width:140px"><span class="muted">menit</span>' + (can('reduceTime') ? '<label class="row" style="margin-left:auto;gap:8px;font-size:12px"><span class="switch"><input type="checkbox" id="minus"><span></span></span>Kurangi waktu</label>' : '') + '</div>' +
      '<div class="total"><span class="muted" id="lbl">Biaya tambahan</span><b class="num" id="sum"></b></div>',
      '<button class="btn" data-x>Batal</button><button class="btn green lg" id="go">' + ic('plus', 16) + 'Tambahkan</button>');
    $('[data-x]', m).onclick = closeModal;
    const upd = () => {
      $$('#pk .opt', m).forEach((o) => o.classList.toggle('on', o.dataset.p === pkgId));
      const p = pkgId && S.snap.packages.find((x) => x.id === pkgId);
      const price = p ? priceFor(u, p.minutes, p) : priceFor(u, minutes);
      $('#sum', m).textContent = (minus && !p ? '− ' : '') + rp(price);
      $('#lbl', m).textContent = minus && !p ? 'Pengurangan biaya' : 'Biaya tambahan';
      $('#go', m).innerHTML = ic(minus && !p ? 'minus' : 'plus', 16) + (minus && !p ? 'Kurangi ' + minutes + ' menit' : 'Tambah ' + (p ? p.name : minutes + ' menit'));
    };
    $$('#pk .opt', m).forEach((o) => (o.onclick = () => { pkgId = pkgId === o.dataset.p ? null : o.dataset.p; upd(); }));
    $$('#qk [data-q]', m).forEach((b) => (b.onclick = () => { pkgId = null; minutes = Number(b.dataset.q); $('#mins', m).value = minutes; upd(); }));
    $('#mins', m).oninput = () => { pkgId = null; minutes = Math.max(1, Number($('#mins', m).value) || 0); upd(); };
    if ($('#minus', m)) $('#minus', m).onchange = (e) => { minus = e.target.checked; pkgId = null; upd(); };
    S.modalRefresh = () => {
      const uu = unitOf(id); if (!uu || !uu.session) return closeModal();
      const L = live(uu.session);
      $('#liveRem', m).innerHTML = '<div class="muted" style="font-size:12px;font-weight:700;letter-spacing:1px">SISA WAKTU SAAT INI</div><div class="mono" style="font-size:34px;font-weight:700;color:' + (uu.session.status === 'expired' ? 'var(--red)' : 'var(--gold)') + '">' + hms(L.remaining) + '</div>';
    };
    S.modalRefresh(); upd();
    $('#go', m).onclick = async () => {
      const body = { unitId: id };
      if (pkgId) body.packageId = pkgId; else body.minutes = minus ? -minutes : minutes;
      try { await act('/api/session/extend', body, 'Waktu ' + u.name + ' diperbarui'); closeModal(); } catch (e) {}
    };
  }

  // ---- Pesan F&B untuk unit ----
  function openOrder(id) {
    const u = unitOf(id); const cart = {};
    let cat = 'Semua';
    const cats = ['Semua'].concat(Array.from(new Set(S.snap.menu.map((x) => x.category))));
    const m = modal('Pesanan · ' + esc(u.name),
      '<div class="seg" id="cats" style="margin-bottom:14px"></div><div class="menu-grid" id="mg"></div><div class="sep"></div><div id="sel"></div>',
      '<button class="btn" data-x>Batal</button><button class="btn gold lg" id="go">' + ic('check', 16) + 'Tambahkan ke Tagihan</button>', 'wide');
    $('[data-x]', m).onclick = closeModal;
    function draw() {
      $('#cats', m).innerHTML = cats.map((c) => '<button class="' + (c === cat ? 'on' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('');
      $$('#cats button', m).forEach((b) => (b.onclick = () => { cat = b.dataset.c; draw(); }));
      $('#mg', m).innerHTML = S.snap.menu.filter((x) => x.active && (cat === 'Semua' || x.category === cat)).map((x) =>
        '<div class="mi ' + (x.stock === 0 ? 'off' : '') + '" data-id="' + esc(x.id) + '">' + (cart[x.id] ? '<span class="badge" style="position:absolute;top:10px;right:10px;background:var(--gold);color:#1b1400">' + cart[x.id] + '</span>' : (x.stock != null ? '<span class="st">stok ' + x.stock + '</span>' : '')) + '<div class="e">' + esc(x.emoji || '🍽️') + '</div><div class="n">' + esc(x.name) + '</div><div class="p">' + rp(x.price) + '</div></div>').join('');
      $$('#mg .mi', m).forEach((el) => (el.onclick = () => { cart[el.dataset.id] = (cart[el.dataset.id] || 0) + 1; draw(); }));
      const ids = Object.keys(cart).filter((k) => cart[k] > 0);
      const total = ids.reduce((a, k) => a + cart[k] * (S.snap.menu.find((x) => x.id === k) || { price: 0 }).price, 0);
      $('#sel', m).innerHTML = ids.length ? ids.map((k) => { const it = S.snap.menu.find((x) => x.id === k); return '<div class="ci"><span style="font-size:20px">' + esc(it.emoji) + '</span><div style="flex:1"><b>' + esc(it.name) + '</b><div class="muted">' + rp(it.price) + '</div></div><div class="q"><button data-d="' + k + '">−</button><b class="num">' + cart[k] + '</b><button data-u="' + k + '">+</button></div><b class="num" style="width:90px;text-align:right">' + rp(it.price * cart[k]) + '</b></div>'; }).join('') + '<div class="total"><span class="muted">Total pesanan</span><b>' + rp(total) + '</b></div>' : '<div class="empty" style="padding:16px">Ketuk menu untuk menambahkan</div>';
      $$('[data-d]', m).forEach((b) => (b.onclick = () => { cart[b.dataset.d]--; draw(); }));
      $$('[data-u]', m).forEach((b) => (b.onclick = () => { cart[b.dataset.u]++; draw(); }));
    }
    draw();
    $('#go', m).onclick = async () => {
      const items = Object.keys(cart).filter((k) => cart[k] > 0).map((k) => ({ itemId: k, qty: cart[k] }));
      if (!items.length) return toast('Pilih menu dahulu', 'warning');
      try { await act('/api/session/orderAdd', { unitId: id, items }, 'Pesanan ditambahkan ke ' + u.name); closeModal(); } catch (e) {}
    };
  }

  // ---- Pembayaran ----
  function billLines(s, cost) {
    let h = '';
    if (s.mode === 'timer') h += s.charges.map((c) => '<div class="spread"><span>' + esc(c.label) + '</span><span class="num">' + rp(c.price) + '</span></div>').join('');
    else h += '<div class="spread"><span>Main bebas ' + hm(live(s).elapsed) + '</span><span class="num">' + rp(cost) + '</span></div>';
    h += s.orders.map((o) => '<div class="spread"><span>' + esc(o.emoji || '') + ' ' + o.qty + '× ' + esc(o.name) + '</span><span class="num">' + rp(o.qty * o.price) + '</span></div>').join('');
    return h;
  }
  function openCheckout(id) {
    const u = unitOf(id); const s = u.session;
    const m = modal('Pembayaran · ' + esc(u.name),
      '<div class="kv" id="kv"></div><div class="sep"></div><div id="lines" style="display:grid;gap:8px"></div><div class="sep"></div>' +
      '<div class="row"><div class="field" style="flex:1"><label class="f">Diskon (Rp)</label><input type="number" id="disc" value="0" min="0" ' + (can('discount') ? '' : 'disabled title="Tidak punya izin diskon"') + '></div><div class="field" style="flex:1"><label class="f">Metode</label><select id="meth"><option>Tunai</option><option>QRIS</option><option>Transfer</option><option>E-Wallet</option><option>Kartu Member</option></select></div></div>' +
      '<div class="total"><span class="muted">TOTAL BAYAR</span><b class="num" id="tot"></b></div>' +
      '<div class="field" style="margin-top:14px"><label class="f">Uang diterima</label><input type="number" id="paid" style="font-size:18px;font-weight:700"></div>' +
      '<div class="row wrap" id="cash"></div><div class="spread" style="margin-top:12px"><span class="muted">Kembalian</span><b class="num gold-t" id="chg" style="font-size:18px">Rp 0</b></div>',
      (s.status !== 'expired' ? '<button class="btn red" id="stopOnly">' + ic('stop', 15) + 'Hentikan Saja</button>' : '') + '<span style="flex:1"></span><button class="btn" data-x>Batal</button><button class="btn gold lg" id="go">' + ic('check', 16) + 'Bayar & Selesai</button>');
    $('[data-x]', m).onclick = closeModal;
    let total = 0, paidTouched = false;
    const calc = () => {
      const uu = unitOf(id); if (!uu || !uu.session) return closeModal();
      const ss = uu.session; const L = live(ss);
      const cost = ss.mode === 'open' ? openCost(uu, ss, L.elapsed) : ss.rentalCost;
      $('#kv', m).innerHTML = '<div>Pelanggan</div><div>' + esc(ss.customer || '-') + '</div><div>Mulai</div><div>' + dt(ss.startedAt) + '</div><div>Durasi main</div><div class="num">' + hms(L.elapsed) + '</div><div>Status</div><div>' + STATUS[ss.status] + '</div>';
      $('#lines', m).innerHTML = billLines(ss, cost);
      total = Math.max(0, cost + ss.ordersTotal - (Number($('#disc', m).value) || 0));
      $('#tot', m).textContent = rp(total);
      if (!paidTouched) $('#paid', m).value = total;
      $('#chg', m).textContent = rp(Math.max(0, (Number($('#paid', m).value) || 0) - total));
      const cs = [total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000].filter((v, i, a) => v > 0 && a.indexOf(v) === i);
      $('#cash', m).innerHTML = cs.map((v) => '<button class="btn sm" data-v="' + v + '">' + rp(v) + '</button>').join('');
      $$('#cash [data-v]', m).forEach((b) => (b.onclick = () => { paidTouched = true; $('#paid', m).value = b.dataset.v; calc(); }));
    };
    $('#disc', m).oninput = calc; $('#paid', m).oninput = () => { paidTouched = true; calc(); };
    S.modalRefresh = (tick) => {
      const uu = unitOf(id); if (!uu || !uu.session) return closeModal();
      if (!tick || uu.session.mode === 'open') return calc();
      const kv = $$('#kv div', m); if (kv[5]) kv[5].textContent = hms(live(uu.session).elapsed);
    };
    calc();
    if ($('#stopOnly', m)) $('#stopOnly', m).onclick = async () => { try { await act('/api/session/stop', { unitId: id }, u.name + ' dihentikan, TV terkunci'); } catch (e) {} };
    $('#go', m).onclick = async () => {
      const paid = Number($('#paid', m).value) || 0;
      if (paid < total && $('#meth', m).value === 'Tunai') return toast('Uang diterima kurang dari total', 'warning');
      try {
        const trx = await act('/api/session/checkout', { unitId: id, discount: Number($('#disc', m).value) || 0, paid, method: $('#meth', m).value });
        closeModal(); showReceipt(trx); loadToday(true);
      } catch (e) {}
    };
  }

  // ---- Struk ----
  function receiptHTML(x) {
    const st = S.snap.settings;
    return '<div class="receipt"><h4>' + esc(st.name) + '</h4><div class="c">' + esc(st.address || '') + (st.phone ? '<br>' + esc(st.phone) : '') + '</div><div class="ln"></div>' +
      '<div class="rw"><span>' + esc(x.id) + '</span></div><div class="rw"><span>' + new Date(x.endedAt).toLocaleString('id-ID') + '</span></div>' +
      (x.kind === 'rental' ? '<div class="rw"><span>Unit</span><span>' + esc(x.unitName) + ' (' + esc(x.typeName) + ')</span></div><div class="rw"><span>Main</span><span>' + tm(x.startedAt) + '–' + tm(x.endedAt) + '</span></div><div class="rw"><span>Durasi</span><span>' + hms(x.playedMs) + '</span></div>' : '') +
      (x.customer ? '<div class="rw"><span>Pelanggan</span><span>' + esc(x.customer) + '</span></div>' : '') + (x.cashierName ? '<div class="rw"><span>Kasir</span><span>' + esc(x.cashierName) + '</span></div>' : '') + '<div class="ln"></div>' +
      (x.kind === 'rental' ? (x.mode === 'timer' ? x.charges.map((c) => '<div class="rw"><span>' + esc(c.label) + '</span><span>' + rp(c.price) + '</span></div>').join('') : '<div class="rw"><span>Main bebas</span><span>' + rp(x.rentalCost) + '</span></div>') : '') +
      x.orders.map((o) => '<div class="rw"><span>' + o.qty + 'x ' + esc(o.name) + '</span><span>' + rp(o.qty * o.price) + '</span></div>').join('') +
      '<div class="ln"></div>' + (x.discount ? '<div class="rw"><span>Diskon</span><span>-' + rp(x.discount) + '</span></div>' : '') +
      '<div class="rw big"><span>TOTAL</span><span>' + rp(x.total) + '</span></div><div class="rw"><span>' + esc(x.method) + '</span><span>' + rp(x.paid) + '</span></div><div class="rw"><span>Kembali</span><span>' + rp(x.change) + '</span></div>' +
      '<div class="ln"></div><div class="c">' + esc(st.receiptFooter || '') + '</div></div>';
  }
  function showReceipt(x) {
    const m = modal('Transaksi Berhasil ✅', '<div style="background:#e5e7eb;padding:16px;border-radius:14px">' + receiptHTML(x) + '</div>', '<button class="btn" data-x>Tutup</button><button class="btn gold" id="pr">' + ic('print', 16) + 'Cetak Struk</button>');
    $('[data-x]', m).onclick = closeModal;
    $('#pr', m).onclick = () => { $('#printArea').innerHTML = receiptHTML(x); window.print(); };
  }

  // ---- Detail unit + kontrol TV ----
  function openUnit(id, tab) {
    let t = tab === 'tv' && !can('tvControl') ? 'session' : (tab || 'session');
    const u0 = unitOf(id);
    const m = modal(ic('tv') + ' ' + esc(u0.name), '<div class="tabs" id="ut"><button data-t="session">Sesi</button>' + (can('tvControl') ? '<button data-t="tv">Kontrol TV</button>' : '') + '<button data-t="log">Riwayat</button></div><div id="ub"></div>', '', 'wide');
    function draw() {
      const u = unitOf(id); if (!u) return closeModal();
      $$('#ut button', m).forEach((b) => b.classList.toggle('on', b.dataset.t === t));
      const b = $('#ub', m); const s = u.session;
      if (t === 'session') {
        if (!s) {
          b.innerHTML = '<div class="empty"><div class="big">🎮</div>Unit kosong — siap disewa</div><div class="row" style="justify-content:center"><button class="btn gold lg" id="st">' + ic('play') + 'Mulai Sewa</button></div>';
          $('#st', b).onclick = () => openStart(id); return;
        }
        const L = live(s);
        b.innerHTML = '<div class="grid" style="grid-template-columns:1fr 1fr">' +
          '<div class="card" style="text-align:center"><div class="muted" style="font-size:11px;font-weight:700;letter-spacing:1px">' + (s.mode === 'timer' ? 'SISA WAKTU' : 'WAKTU BERJALAN') + '</div><div class="mono" id="bigT" style="font-size:44px;font-weight:700;color:var(--gold)">' + hms(s.mode === 'timer' ? L.remaining : L.elapsed) + '</div><span class="chip ' + s.status + '">' + STATUS[s.status] + '</span></div>' +
          '<div class="card"><div class="kv"><div>Pelanggan</div><div>' + esc(s.customer || '-') + '</div><div>Mulai</div><div>' + dt(s.startedAt) + '</div>' + (s.startedBy ? '<div>Dimulai oleh</div><div>' + esc(s.startedBy) + '</div>' : '') + '<div>Mode</div><div>' + (s.mode === 'timer' ? 'Paket waktu' : 'Main bebas') + '</div><div>Sewa</div><div class="num">' + rp(s.mode === 'open' ? openCost(u, s, L.elapsed) : s.rentalCost) + '</div><div>F&amp;B</div><div class="num">' + rp(s.ordersTotal) + '</div></div></div></div>' +
          '<div class="row wrap" style="margin-top:16px">' +
          (s.mode === 'timer' ? '<button class="btn green" data-a="extend">' + ic('plus', 15) + 'Tambah Waktu</button>' : '') +
          (s.status === 'paused' ? '<button class="btn amber" data-a="resume">' + ic('play', 15) + 'Lanjutkan</button>' : '<button class="btn" data-a="pause">' + ic('pause', 15) + 'Jeda</button>') +
          '<button class="btn" data-a="order">' + ic('food', 15) + 'Pesan F&amp;B</button><button class="btn" data-a="move">' + ic('move', 15) + 'Pindah Unit</button><button class="btn" data-a="rename">' + ic('user', 15) + 'Ubah Pelanggan</button><span style="flex:1"></span><button class="btn gold" data-a="checkout">' + ic('pay', 15) + 'Bayar</button></div>' +
          '<h3 style="margin:20px 0 8px">Pesanan</h3>' + (s.orders.length ? '<table class="t"><tbody>' + s.orders.map((o) => '<tr><td>' + esc(o.emoji) + ' ' + o.qty + '× ' + esc(o.name) + '</td><td class="muted">' + tm(o.at) + '</td><td><span class="chip ' + (o.status === 'diantar' ? 'playing' : 'paused') + '">' + esc(o.status) + '</span></td><td class="r num">' + rp(o.price * o.qty) + '</td></tr>').join('') + '</tbody></table>' : '<div class="dim">Belum ada pesanan</div>');
        $$('[data-a]', b).forEach((x) => (x.onclick = () => {
          const a = x.dataset.a;
          if (a === 'move') return openMove(id);
          if (a === 'rename') { const n = prompt('Nama pelanggan', s.customer || ''); if (n != null) act('/api/session/note', { unitId: id, customer: n }); return; }
          unitAction(a, id);
        }));
      } else if (t === 'tv') {
        const inf = u.info || {};
        b.innerHTML = '<div class="spread" style="margin-bottom:14px"><div><span class="dot ' + (u.online ? 'on' : 'off') + '" style="display:inline-block;margin-right:8px"></span><b>' + (u.online ? 'TV Online' : 'TV Offline') + '</b><div class="muted" style="font-size:12px;margin-top:4px">' + esc([inf.model, inf.android ? 'Android ' + inf.android : '', inf.ip, inf.kind === 'native' ? 'APK v' + (inf.appVersion || '') : inf.kind === 'web' ? 'Mode browser' : ''].filter(Boolean).join(' · ') || 'Belum ada info perangkat') + '</div></div><div class="muted mono" style="font-size:12px">MAC: ' + esc(u.mac || '— belum diisi') + '</div></div>' +
          (inf.kind === 'native' ? tvSetupPanel(u, inf) : '') +
          '<div class="vol">' + ic('vol', 20) + '<input type="range" id="vr" min="0" max="' + (inf.maxVolume || 100) + '" value="' + (inf.volume != null ? inf.volume : 10) + '"><span class="v" id="vv">' + (inf.volume != null ? inf.volume : '–') + '</span></div>' +
          '<div class="tvctl" style="margin-top:12px">' +
          [['power', 'power', 'Hidupkan TV'], ['powerOff', 'powerOff', 'Matikan TV'], ['hdmi', 'hdmi', 'Ke Input HDMI'], ['lock', 'lock', 'Layar Kunci'],
            ['volumeDown', 'volDown', 'Volume −'], ['volumeUp', 'vol', 'Volume +'], ['mute', 'mute', 'Bisu / Suara'], ['beep', 'beep', 'Bunyikan TV'],
            ['settings', 'gear', 'Menu Pengaturan'], ['wifiSettings', 'wifi', 'Pengaturan WiFi'], ['home', 'home', 'Beranda TV'], ['reload', 'reload', 'Muat Ulang App']]
            .map(([c, i, l]) => '<button class="btn ' + (c === 'power' ? 'green' : c === 'powerOff' ? 'red' : '') + '" data-c="' + c + '">' + ic(i, 22) + l + '</button>').join('') + '</div>' +
          '<div class="row" style="margin-top:14px"><input id="msgT" placeholder="Tulis pesan untuk ditampilkan di TV…"><button class="btn blue" id="msgB">' + ic('msg', 15) + 'Kirim</button></div>' +
          (inf.kind === 'native' && inf.canPowerOff === false ? '<p style="font-size:12px;line-height:1.6;margin-top:14px;color:#fcd34d">⚠️ Izin “Matikan TV” belum aktif di aplikasi TV ini — saat ini “Matikan” hanya menghitamkan layar. Aktifkan di menu teknisi TV › <b>Izin Matikan TV</b>.</p>' : '') +
          '<p class="dim" style="font-size:12px;line-height:1.6;margin-top:14px">Hidupkan TV dari kondisi mati butuh fitur <i>Wake on LAN / Networked Standby</i> aktif di TV dan alamat MAC terisi. "Menu Pengaturan" membuka Settings Android TV; sesi tetap berjalan. Layar TV versi browser: <a href="/tv?unit=' + encodeURIComponent(u.id) + '" target="_blank">/tv?unit=' + esc(u.id) + '</a></p>';
        let vt;
        $('#vr', b).oninput = (e) => { $('#vv', b).textContent = e.target.value; clearTimeout(vt); vt = setTimeout(() => tvCmd(id, 'volume', Number(e.target.value)), 150); };
        $$('[data-c]', b).forEach((x) => (x.onclick = () => (x.dataset.c === 'powerOff' ? powerOff(id) : tvCmd(id, x.dataset.c))));
        $('#msgB', b).onclick = () => { const v = $('#msgT', b).value.trim(); if (v) { tvCmd(id, 'message', null, v); $('#msgT', b).value = ''; } };
        if ($('#hdmiSel', b)) $('#hdmiSel', b).onchange = (e) => tvCmd(id, 'setHdmi', e.target.value);
        if ($('#wakeSw', b)) $('#wakeSw', b).onchange = (e) => tvCmd(id, 'setOpenOnWake', e.target.checked);
        if ($('#setupBtn', b)) $('#setupBtn', b).onclick = () => tvCmd(id, 'setup');
      } else {
        const s2 = u.session;
        b.innerHTML = s2 && s2.log.length ? '<table class="t"><tbody>' + s2.log.slice().reverse().map((l) => '<tr><td class="muted mono" style="width:90px">' + tm(l.at) + '</td><td>' + esc(l.text) + '</td><td class="muted r">' + esc(l.by || '') + '</td></tr>').join('') + '</tbody></table>' : '<div class="empty">Belum ada aktivitas sesi</div>';
      }
    }
    $$('#ut button', m).forEach((x) => (x.onclick = () => { t = x.dataset.t; draw(); }));
    S.modalRefresh = (tick) => {
      if (tick) { const u = unitOf(id); const el = $('#bigT', m); if (el && u && u.session) { const L = live(u.session); el.textContent = hms(u.session.mode === 'timer' ? L.remaining : L.elapsed); } return; }
      if (t === 'tv' && document.activeElement && m.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
      draw();
    };
    draw();
  }
  function openMove(id) {
    const u = unitOf(id);
    const free = S.snap.units.filter((x) => !x.session && x.id !== id);
    const m = modal('Pindah Unit · ' + esc(u.name), free.length ? '<p class="muted" style="margin-top:0">Pilih unit tujuan. Sisa waktu & pesanan ikut pindah.</p><div class="opts">' + free.map((x) => '<div class="opt" data-u="' + esc(x.id) + '"><b>' + esc(x.name) + '</b><small>' + esc(typeOf(x.type).name) + '</small></div>').join('') + '</div>' : '<div class="empty">Tidak ada unit kosong</div>');
    $$('[data-u]', m).forEach((o) => (o.onclick = async () => { try { await act('/api/session/move', { unitId: id, toUnitId: o.dataset.u }, 'Sesi dipindahkan'); closeModal(); } catch (e) {} }));
  }
  // Status & pengaturan aplikasi TV yang bisa diubah dari panel
  function tvSetupPanel(u, inf) {
    const om = inf.overlayMode;
    const omTxt = om === 'window' ? '<span class="chip playing">aktif · overlay</span>' : om === 'accessibility' ? '<span class="chip playing">aktif · aksesibilitas</span>' : '<span class="chip expired">belum aktif</span>';
    const inputs = inf.inputs || [];
    return '<div class="card" style="margin-bottom:12px;padding:14px">' +
      '<div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">' +
      '<div><div class="muted" style="font-size:12px;font-weight:600;margin-bottom:6px">Timer di pojok layar saat bermain</div>' + omTxt +
      (om === 'toast' || !om ? '<div class="dim" style="font-size:12px;margin-top:6px;line-height:1.5">Hanya notifikasi singkat. Klik <b>Buka Menu Teknisi</b> lalu tekan <b>Aktifkan Aksesibilitas El Classico</b> di TV.</div>' : '') + '</div>' +
      '<div><div class="muted" style="font-size:12px;font-weight:600;margin-bottom:6px">Matikan TV</div>' + (inf.canPowerOff ? '<span class="chip playing">siap</span>' : '<span class="chip paused">layar hitam saja</span>') + '</div>' +
      '<div><label class="f">Input HDMI PlayStation</label><select id="hdmiSel"><option value="">— Tidak pindah otomatis —</option>' + inputs.map((x) => '<option value="' + esc(x.id) + '" ' + (x.id === inf.hdmiId ? 'selected' : '') + '>' + esc(x.label) + '</option>').join('') + '</select>' + (inputs.length ? '' : '<div class="dim" style="font-size:12px;margin-top:4px">TV tidak melaporkan daftar HDMI</div>') + '</div>' +
      '<div><label class="f">Saat TV dinyalakan</label><label class="row" style="gap:10px;font-size:13px;margin-top:8px"><span class="switch"><input type="checkbox" id="wakeSw" ' + (inf.openOnWake !== false ? 'checked' : '') + '><span></span></span>Buka El Classico otomatis</label></div>' +
      '</div><button class="btn blue" id="setupBtn" style="margin-top:12px">' + ic('gear', 15) + 'Buka Menu Teknisi di TV</button></div>';
  }

  // ---- Kontrol banyak TV sekaligus ----
  function openBulk() {
    const sel = new Set(S.snap.units.map((u) => u.id));
    let skipActive = true;
    const m = modal(ic('tvs') + ' Kontrol Semua TV',
      '<div class="spread" style="margin-bottom:10px"><b>Pilih TV</b><div class="row"><button class="btn sm" id="sa">Pilih semua</button><button class="btn sm" id="si">Hanya yang kosong</button><button class="btn sm ghost" id="sn">Kosongkan</button></div></div>' +
      '<div class="opts" id="ul"></div>' +
      '<label class="row" style="margin:14px 0 4px;gap:10px;font-size:13px"><span class="switch"><input type="checkbox" id="skip" checked><span></span></span>Lewati TV yang sedang dipakai (sesi aktif)</label>' +
      '<div class="sep"></div><b>Aksi</b>' +
      '<div class="tvctl" style="margin-top:10px">' +
      [['powerOff', 'powerOff', 'Matikan TV', 'red'], ['power', 'power', 'Hidupkan TV', 'green'], ['lock', 'lock', 'Layar Kunci', ''], ['mute', 'mute', 'Bisu / Suara', ''],
        ['volumeDown', 'volDown', 'Volume −', ''], ['volumeUp', 'vol', 'Volume +', ''], ['beep', 'beep', 'Bunyikan', ''], ['reload', 'reload', 'Muat Ulang App', '']]
        .map(([c, i, l, k]) => '<button class="btn ' + k + '" data-c="' + c + '">' + ic(i, 22) + l + '</button>').join('') + '</div>' +
      '<div class="vol" style="margin-top:12px">' + ic('vol', 20) + '<span class="muted" style="font-size:12px">Atur volume</span><input type="range" id="bv" min="0" max="100" value="30"><span class="v" id="bvv">30%</span><button class="btn sm" id="bvs">Terapkan</button></div>' +
      '<div class="row" style="margin-top:12px"><input id="bm" placeholder="Pesan untuk TV terpilih…"><button class="btn blue" id="bms">' + ic('msg', 15) + 'Kirim</button></div>' +
      '<div id="res" style="margin-top:14px"></div>', '', 'wide');
    function draw() {
      $('#ul', m).innerHTML = S.snap.units.map((u) => '<div class="opt ' + (sel.has(u.id) ? 'on' : '') + '" data-u="' + esc(u.id) + '"><b>' + esc(u.name) + '</b><small>' + (u.session ? STATUS[u.session.status] : 'Kosong') + ' · ' + (u.online ? (u.info && u.info.screenOn === false ? 'layar mati' : 'online') : 'offline') + '</small></div>').join('');
      $$('#ul [data-u]', m).forEach((o) => (o.onclick = () => { sel.has(o.dataset.u) ? sel.delete(o.dataset.u) : sel.add(o.dataset.u); draw(); }));
    }
    draw();
    $('#sa', m).onclick = () => { S.snap.units.forEach((u) => sel.add(u.id)); draw(); };
    $('#sn', m).onclick = () => { sel.clear(); draw(); };
    $('#si', m).onclick = () => { sel.clear(); S.snap.units.filter((u) => !u.session).forEach((u) => sel.add(u.id)); draw(); };
    $('#skip', m).onchange = (e) => { skipActive = e.target.checked; };
    $('#bv', m).oninput = (e) => { $('#bvv', m).textContent = e.target.value + '%'; };
    async function run(cmd, value, text) {
      if (!sel.size) return toast('Pilih minimal satu TV', 'warning');
      if (cmd === 'powerOff' && !skipActive && S.snap.units.some((u) => sel.has(u.id) && u.session) &&
        !(await confirmBox('Matikan TV yang sedang dipakai?', 'Beberapa TV terpilih masih punya sesi aktif. Waktu sewa tetap berjalan.', 'Tetap Matikan', 'red'))) return;
      try {
        const r = await api('/api/tv/bulk', { unitIds: Array.from(sel), cmd, value, text, skipActive });
        toast(r.sent + ' TV menerima perintah', r.sent ? 'success' : 'warning');
        $('#res', m).innerHTML = '<table class="t"><tbody>' + r.results.map((x) => '<tr><td>' + esc(x.name) + '</td><td class="r">' + (x.ok ? '<span class="chip playing">terkirim</span>' : '<span class="chip expired">' + esc(x.error) + '</span>') + '</td></tr>').join('') + '</tbody></table>';
      } catch (e) { toast(e.message, 'danger'); }
    }
    $$('.tvctl [data-c]', m).forEach((b) => (b.onclick = () => run(b.dataset.c)));
    $('#bvs', m).onclick = () => run('volume', -Number($('#bv', m).value)); // negatif = persen
    $('#bms', m).onclick = () => { const v = $('#bm', m).value.trim(); if (v) run('message', null, v); };
    S.modalRefresh = (tick) => { if (!tick) draw(); };
  }

  function promptMsg(unitId) {
    const m = modal('Kirim Pesan ke ' + (unitId === '*' ? 'Semua TV' : esc(unitOf(unitId).name)), '<textarea id="t" rows="3" placeholder="mis. Rental tutup pukul 23.00 — terima kasih!"></textarea>', '<button class="btn" data-x>Batal</button><button class="btn blue" id="go">' + ic('msg', 15) + 'Kirim</button>');
    $('[data-x]', m).onclick = closeModal;
    $('#go', m).onclick = async () => { const v = $('#t', m).value.trim(); if (!v) return; await tvCmd(unitId, 'message', null, v); closeModal(); };
  }

  // ================= POS =================
  function renderPos() {
    const cats = ['Semua'].concat(Array.from(new Set(S.snap.menu.map((x) => x.category))));
    $('#content').innerHTML = '<div class="pos"><div><div class="toolbar"><div class="seg" id="pc">' + cats.map((c) => '<button class="' + (c === S.posCat ? 'on' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div></div><div class="menu-grid" id="pm"></div></div>' +
      '<div class="card cart"><h3>' + ic('cart', 16) + ' Keranjang</h3><div class="field"><label class="f">Tagihkan ke</label><select id="ptg"></select></div><div id="pcart"></div></div></div>';
    $$('#pc button').forEach((b) => (b.onclick = () => { S.posCat = b.dataset.c; renderPos(); }));
    $('#pm').innerHTML = S.snap.menu.filter((x) => x.active && (S.posCat === 'Semua' || x.category === S.posCat)).map((x) => '<div class="mi ' + (x.stock === 0 ? 'off' : '') + '" data-id="' + esc(x.id) + '">' + (x.stock != null ? '<span class="st">stok ' + x.stock + '</span>' : '') + '<div class="e">' + esc(x.emoji || '🍽️') + '</div><div class="n">' + esc(x.name) + '</div><div class="p">' + rp(x.price) + '</div></div>').join('') || '<div class="empty">Menu kosong — tambahkan di Pengaturan</div>';
    $$('#pm .mi').forEach((el) => (el.onclick = () => { const c = S.cart.find((x) => x.itemId === el.dataset.id); if (c) c.qty++; else S.cart.push({ itemId: el.dataset.id, qty: 1 }); beep(1200, .04); drawCart(); }));
    renderPosTargets(); drawCart();
  }
  function renderPosTargets() {
    const sel = $('#ptg'); if (!sel) return;
    const act2 = S.snap.units.filter((u) => u.session);
    if (S.posTarget && !act2.find((u) => u.id === S.posTarget)) S.posTarget = '';
    sel.innerHTML = '<option value="">💵 Bayar langsung (tanpa unit)</option>' + act2.map((u) => '<option value="' + esc(u.id) + '" ' + (S.posTarget === u.id ? 'selected' : '') + '>🎮 ' + esc(u.name) + (u.session.customer ? ' — ' + esc(u.session.customer) : '') + '</option>').join('');
    sel.onchange = () => { S.posTarget = sel.value; drawCart(); };
  }
  function drawCart() {
    const el = $('#pcart'); if (!el) return;
    S.cart = S.cart.filter((c) => c.qty > 0);
    const total = S.cart.reduce((a, c) => a + c.qty * ((S.snap.menu.find((x) => x.id === c.itemId) || {}).price || 0), 0);
    if (!S.cart.length) { el.innerHTML = '<div class="empty"><div class="big">🧺</div>Ketuk menu untuk menambahkan</div>'; return; }
    el.innerHTML = S.cart.map((c, i) => { const it = S.snap.menu.find((x) => x.id === c.itemId) || { name: '?', price: 0 }; return '<div class="ci"><span style="font-size:22px">' + esc(it.emoji) + '</span><div style="flex:1"><b>' + esc(it.name) + '</b><div class="muted">' + rp(it.price) + '</div></div><div class="q"><button data-d="' + i + '">−</button><b class="num">' + c.qty + '</b><button data-u="' + i + '">+</button></div></div>'; }).join('') +
      '<div class="total"><span class="muted">Total</span><b class="num">' + rp(total) + '</b></div>' +
      (S.posTarget ? '<button class="btn gold lg block" style="margin-top:14px" id="pgo">' + ic('check', 16) + 'Tambahkan ke Tagihan Unit</button>'
        : '<div class="row" style="margin-top:14px"><select id="pmeth" style="flex:1"><option>Tunai</option><option>QRIS</option><option>Transfer</option><option>E-Wallet</option></select><input type="number" id="ppaid" placeholder="Uang diterima" style="flex:1" value="' + total + '"></div><button class="btn gold lg block" style="margin-top:10px" id="pgo">' + ic('pay', 16) + 'Bayar ' + rp(total) + '</button>') +
      '<button class="btn ghost block" style="margin-top:8px" id="pclr">Kosongkan</button>';
    $$('[data-d]', el).forEach((b) => (b.onclick = () => { S.cart[b.dataset.d].qty--; drawCart(); }));
    $$('[data-u]', el).forEach((b) => (b.onclick = () => { S.cart[b.dataset.u].qty++; drawCart(); }));
    $('#pclr').onclick = () => { S.cart = []; drawCart(); };
    $('#pgo').onclick = async () => {
      try {
        if (S.posTarget) { await act('/api/session/orderAdd', { unitId: S.posTarget, items: S.cart }, 'Pesanan masuk tagihan ' + unitOf(S.posTarget).name); }
        else { const trx = await act('/api/session/sale', { items: S.cart, method: $('#pmeth').value, paid: Number($('#ppaid').value) || total }); showReceipt(trx); loadToday(true); }
        S.cart = []; drawCart();
      } catch (e) {}
    };
  }

  // ================= Pesanan =================
  function renderOrders() {
    const rows = [];
    S.snap.units.forEach((u) => u.session && u.session.orders.forEach((o) => rows.push({ u, o })));
    rows.sort((a, b) => (a.o.status === b.o.status ? b.o.at - a.o.at : a.o.status === 'diproses' ? -1 : 1));
    $('#content').innerHTML = '<div class="card">' + (rows.length ? '<table class="t"><thead><tr><th>Waktu</th><th>Unit</th><th>Pesanan</th><th>Status</th><th class="r">Subtotal</th><th></th></tr></thead><tbody>' + rows.map(({ u, o }) =>
      '<tr><td class="mono muted">' + tm(o.at) + '</td><td><b>' + esc(u.name) + '</b><div class="muted" style="font-size:12px">' + esc(u.session.customer || '') + '</div></td><td><span style="font-size:18px">' + esc(o.emoji) + '</span> ' + o.qty + '× ' + esc(o.name) + (o.note ? '<div class="muted">' + esc(o.note) + '</div>' : '') + '</td><td><span class="chip ' + (o.status === 'diantar' ? 'playing' : 'paused') + '">' + esc(o.status) + '</span></td><td class="r num">' + rp(o.qty * o.price) + '</td><td class="r">' +
      (o.status === 'diproses' ? '<button class="btn sm green" data-s="' + u.id + '|' + o.id + '">' + ic('check', 14) + 'Antar</button> ' : '') + (can('cancelOrder') ? '<button class="btn sm red" data-r="' + u.id + '|' + o.id + '" title="Batalkan">' + ic('trash', 14) + '</button>' : '') + '</td></tr>').join('') + '</tbody></table>'
      : '<div class="empty"><div class="big">🍽️</div>Belum ada pesanan dari unit aktif.<br>Tambahkan lewat tombol <b>Pesan</b> di kartu unit atau menu Kasir F&amp;B.</div>') + '</div>';
    $$('[data-s]').forEach((b) => (b.onclick = () => { const [unitId, orderId] = b.dataset.s.split('|'); act('/api/session/orderStatus', { unitId, orderId, status: 'diantar' }); }));
    $$('[data-r]').forEach((b) => (b.onclick = async () => { const [unitId, orderId] = b.dataset.r.split('|'); if (await confirmBox('Batalkan pesanan?', 'Pesanan dihapus dari tagihan dan stok dikembalikan.', 'Batalkan', 'red')) act('/api/session/orderRemove', { unitId, orderId }, 'Pesanan dibatalkan'); }));
  }

  // ================= Laporan =================
  function setRange(r) {
    const d = new Date(); S.rep.range = r;
    if (r === 'today') S.rep.from = S.rep.to = ymd(d);
    if (r === 'yesterday') { d.setDate(d.getDate() - 1); S.rep.from = S.rep.to = ymd(d); }
    if (r === '7d') { S.rep.to = ymd(d); d.setDate(d.getDate() - 6); S.rep.from = ymd(d); }
    if (r === 'month') { S.rep.to = ymd(d); d.setDate(1); S.rep.from = ymd(d); }
  }
  async function loadReport() {
    try { S.report = await api('/api/report?from=' + S.rep.from + '&to=' + S.rep.to); if (S.view === 'report') renderReport(); } catch (e) {}
  }
  function renderReport() {
    const r = S.report;
    let h = '<div class="toolbar"><div class="seg" id="rr">' + [['today', 'Hari ini'], ['yesterday', 'Kemarin'], ['7d', '7 Hari'], ['month', 'Bulan ini']].map(([k, l]) => '<button class="' + (S.rep.range === k ? 'on' : '') + '" data-r="' + k + '">' + l + '</button>').join('') + '</div>' +
      '<input type="date" id="rf" value="' + S.rep.from + '" style="width:auto"><span class="muted">s/d</span><input type="date" id="rt" value="' + S.rep.to + '" style="width:auto"><span style="flex:1"></span>' +
      '<button class="btn" id="shiftPrint">' + ic('print', 15) + (can('report') ? 'Cetak Rekap' : 'Cetak Rekap Shift') + '</button>' +
      '<a class="btn" href="/api/export.csv?from=' + S.rep.from + '&to=' + S.rep.to + '&token=' + encodeURIComponent(S.token) + '">' + ic('download', 15) + 'Ekspor CSV / Excel</a></div>' +
      (r && r.limited ? '<div class="notice">Anda melihat <b>transaksi Anda sendiri</b>. Gunakan <b>Cetak Rekap Shift</b> saat serah terima / tutup kasir.</div>' : '');
    if (!r) { $('#content').innerHTML = h + '<div class="empty">Memuat…</div>'; bindRep(); return; }
    h += '<div class="stats">' + stat('Total Pendapatan', rp(r.total), r.count + ' transaksi', 'rgba(245,197,24,.12)', 'pay') + stat('Sewa PS', rp(r.rental), 'jam main ' + hm(r.playedMs), 'rgba(139,92,246,.14)', 'gamepad') + stat('Makanan & Minuman', rp(r.fnb), r.byItem.reduce((a, x) => a + x.qty, 0) + ' item terjual', 'rgba(34,197,94,.1)', 'food') + stat('Diskon', rp(r.discount), 'potongan diberikan', 'rgba(239,68,68,.1)', 'minus') + '</div>';
    const days = Object.keys(r.byDay).sort();
    const multi = S.rep.from !== S.rep.to;
    const series = multi ? days.map((d) => [d.slice(5).split('-').reverse().join('/'), r.byDay[d]]) : r.byHour.map((v, i) => [pad2(i), v]).slice(8).concat(r.byHour.map((v, i) => [pad2(i), v]).slice(0, 8));
    const mx = Math.max(1, ...series.map((x) => x[1]));
    h += '<div class="grid" style="grid-template-columns:2fr 1fr;margin-bottom:16px"><div class="card"><h3>' + (multi ? 'Pendapatan per hari' : 'Pendapatan per jam mulai') + '</h3><div class="chart">' + series.map(([l, v]) => '<div class="c" title="' + l + ': ' + rp(v) + '"><i style="height:' + (v / mx * 100) + '%"></i><span>' + l + '</span></div>').join('') + '</div></div>' +
      '<div class="card"><h3>Menu terlaris</h3>' + (r.byItem.length ? '<table class="t"><tbody>' + r.byItem.slice(0, 8).map((x) => '<tr><td>' + esc(x.name) + '</td><td class="r num">' + x.qty + '×</td><td class="r num">' + rp(x.total) + '</td></tr>').join('') + '</tbody></table>' : '<div class="dim">Belum ada penjualan</div>') + '</div></div>';
    h += '<div class="grid" style="grid-template-columns:' + (r.limited ? '1fr' : '1fr 1fr') + ';margin-bottom:16px">' +
      (r.limited ? '' : '<div class="card"><h3>Per kasir</h3>' + (r.byCashier.length ? '<table class="t"><tbody>' + r.byCashier.map((x) => '<tr><td><b>' + esc(x.name) + '</b></td><td class="r num">' + x.count + ' trx</td><td class="r num">' + rp(x.total) + '</td></tr>').join('') + '</tbody></table>' : '<div class="dim">Belum ada data</div>') + '</div>') +
      '<div class="card"><h3>Per metode bayar</h3>' + (Object.keys(r.byMethod || {}).length ? '<table class="t"><tbody>' + Object.keys(r.byMethod).map((k) => '<tr><td>' + esc(k) + '</td><td class="r num"><b>' + rp(r.byMethod[k]) + '</b></td></tr>').join('') + '</tbody></table>' : '<div class="dim">Belum ada data</div>') + '</div></div>';
    h += '<div class="card" style="margin-bottom:16px"><h3>Per unit</h3>' + (r.byUnit.length ? '<table class="t"><thead><tr><th>Unit</th><th class="r">Transaksi</th><th class="r">Jam main</th><th class="r">Pendapatan</th></tr></thead><tbody>' + r.byUnit.map((x) => '<tr><td><b>' + esc(x.name) + '</b></td><td class="r num">' + x.count + '</td><td class="r num">' + hm(x.playedMs) + '</td><td class="r num">' + rp(x.total) + '</td></tr>').join('') + '</tbody></table>' : '<div class="dim">Belum ada data</div>') + '</div>';
    h += '<div class="card"><h3>Riwayat transaksi</h3>' + (r.transactions.length ? '<table class="t"><thead><tr><th>ID</th><th>Selesai</th><th>Unit</th><th>Pelanggan</th><th class="r">Durasi</th><th class="r">Sewa</th><th class="r">F&amp;B</th><th class="r">Total</th><th>Metode</th><th>Kasir</th><th></th></tr></thead><tbody>' + r.transactions.map((x) => '<tr><td class="mono" style="font-size:12px">' + esc(x.id) + '</td><td>' + dt(x.endedAt) + '</td><td>' + esc(x.unitName) + '</td><td>' + esc(x.customer || '-') + '</td><td class="r num">' + (x.playedMs ? hm(x.playedMs) : '-') + '</td><td class="r num">' + rp(x.rentalCost) + '</td><td class="r num">' + rp(x.ordersTotal) + '</td><td class="r num"><b>' + rp(x.total) + '</b></td><td>' + esc(x.method) + '</td><td>' + esc(x.cashierName || '-') + '</td><td class="r" style="white-space:nowrap"><button class="btn sm" data-p="' + esc(x.id) + '" title="Cetak ulang">' + ic('print', 14) + '</button>' + (can('deleteTrx') ? ' <button class="btn sm red" data-d="' + esc(x.id) + '" title="Hapus">' + ic('trash', 14) + '</button>' : '') + '</td></tr>').join('') + '</tbody></table>' : '<div class="empty">Belum ada transaksi pada periode ini</div>') + '</div>';
    $('#content').innerHTML = h; bindRep();
    $('#shiftPrint').onclick = () => printShift(r);
    $$('[data-p]').forEach((b) => (b.onclick = () => showReceipt(r.transactions.find((x) => x.id === b.dataset.p))));
    $$('[data-d]').forEach((b) => (b.onclick = async () => { if (await confirmBox('Hapus transaksi?', 'Transaksi <b>' + esc(b.dataset.d) + '</b> akan dihapus permanen dari laporan.', 'Hapus', 'red')) { await act('/api/transaction/delete', { id: b.dataset.d }, 'Transaksi dihapus'); loadReport(); loadToday(true); } }));
  }
  function printShift(r) {
    const st = S.snap.settings;
    const range = new Date(r.from).toLocaleDateString('id-ID') + (S.rep.from !== S.rep.to ? ' – ' + new Date(r.to).toLocaleDateString('id-ID') : '');
    $('#printArea').innerHTML = '<div class="receipt"><h4>' + esc(st.name) + '</h4><div class="c">' + (r.limited ? 'REKAP SHIFT KASIR' : 'REKAP PENDAPATAN') + '</div><div class="ln"></div>' +
      '<div class="rw"><span>Periode</span><span>' + range + '</span></div>' + (r.limited ? '<div class="rw"><span>Kasir</span><span>' + esc(S.me.name) + '</span></div>' : '') +
      '<div class="rw"><span>Dicetak</span><span>' + new Date().toLocaleString('id-ID') + '</span></div><div class="ln"></div>' +
      '<div class="rw"><span>Transaksi</span><span>' + r.count + '</span></div><div class="rw"><span>Sewa PS</span><span>' + rp(r.rental) + '</span></div><div class="rw"><span>F&amp;B</span><span>' + rp(r.fnb) + '</span></div><div class="rw"><span>Diskon</span><span>-' + rp(r.discount) + '</span></div>' +
      '<div class="ln"></div>' + Object.keys(r.byMethod || {}).map((k) => '<div class="rw"><span>' + esc(k) + '</span><span>' + rp(r.byMethod[k]) + '</span></div>').join('') +
      '<div class="ln"></div><div class="rw big"><span>TOTAL</span><span>' + rp(r.total) + '</span></div>' +
      (!r.limited && r.byCashier.length ? '<div class="ln"></div>' + r.byCashier.map((x) => '<div class="rw"><span>' + esc(x.name) + '</span><span>' + rp(x.total) + '</span></div>').join('') : '') +
      '<div class="ln"></div><div class="c">Tanda tangan<br><br><br>( ' + esc(S.me.name) + ' )</div></div>';
    window.print();
  }
  function bindRep() {
    $$('#rr button').forEach((b) => (b.onclick = () => { setRange(b.dataset.r); S.report = null; renderReport(); loadReport(); }));
    $('#rf').onchange = (e) => { S.rep.from = e.target.value; S.rep.range = ''; loadReport(); };
    $('#rt').onchange = (e) => { S.rep.to = e.target.value; S.rep.range = ''; loadReport(); };
  }

  // ================= Pengaturan =================
  const clone = (x) => JSON.parse(JSON.stringify(x));
  function renderSettings() {
    const tabs = (can('settings') ? [['general', 'Umum'], ['types', 'Tipe & Tarif'], ['packages', 'Paket'], ['units', 'Unit TV'], ['menu', 'Menu F&B']] : []).concat([['system', 'Koneksi & Data']]);
    if (!tabs.find((t) => t[0] === S.setTab)) S.setTab = tabs[0][0];
    $('#content').innerHTML = '<div class="tabs" id="stb">' + tabs.map(([k, l]) => '<button data-t="' + k + '" class="' + (S.setTab === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div><div id="sb"></div>';
    $$('#stb button').forEach((b) => (b.onclick = () => { S.setTab = b.dataset.t; renderSettings(); }));
    ({ general: setGeneral, types: () => setTable('types'), packages: setPackages, units: () => setTable('units'), menu: () => setTable('menu'), system: setSystem })[S.setTab]();
  }
  function sw(id, on, label, hint) { return '<div class="spread field" style="padding:12px 14px;border-radius:12px;background:var(--surface2);border:1px solid var(--line)"><div><b>' + label + '</b><div class="muted" style="font-size:12px;margin-top:2px">' + hint + '</div></div><label class="switch"><input type="checkbox" id="' + id + '" ' + (on ? 'checked' : '') + '><span></span></label></div>'; }
  function setGeneral() {
    const s = S.snap.settings;
    $('#sb').innerHTML = '<div class="grid" style="grid-template-columns:1fr 1fr"><div class="card"><h3>Identitas Rental</h3>' +
      [['name', 'Nama rental'], ['tagline', 'Slogan (tampil di TV)'], ['address', 'Alamat (struk)'], ['phone', 'No. telepon / WA'], ['receiptFooter', 'Catatan kaki struk']].map(([k, l]) => '<div class="field"><label class="f">' + l + '</label><input id="g_' + k + '" value="' + esc(s[k] || '') + '"></div>').join('') +
      '</div><div class="card"><h3>Perilaku Billing</h3>' +
      '<div class="row"><div class="field" style="flex:1"><label class="f">Notifikasi sisa waktu (detik)</label><input type="number" id="g_warningSeconds" value="' + s.warningSeconds + '"></div><div class="field" style="flex:1"><label class="f">Pembulatan harga (Rp)</label><input type="number" id="g_rounding" value="' + s.rounding + '"></div></div>' +
      '<div class="field"><label class="f">Blok tagih Main Bebas (menit)</label><input type="number" id="g_openBillingBlock" value="' + (s.openBillingBlock || 1) + '"><div class="dim" style="font-size:12px;margin-top:4px">mis. 15 → durasi dibulatkan ke atas per 15 menit</div></div>' +
      sw('g_lockOnPause', s.lockOnPause, 'Kunci layar saat dijeda', 'TV menampilkan layar “Dijeda”') +
      sw('g_autoHdmi', s.autoHdmi, 'Otomatis pindah ke HDMI', 'Saat sewa dimulai TV langsung ke input PS') +
      sw('g_showTimerPill', s.showTimerPill, 'Tampilkan timer kecil di TV', 'Sisa waktu di pojok layar selama bermain') +
      sw('g_autoOffAfterCheckout', s.autoOffAfterCheckout, 'Matikan TV otomatis setelah bayar', 'TV mati ±6 detik setelah transaksi selesai') +
      '<div class="field"><label class="f">Matikan TV kosong otomatis setelah (menit, 0 = tidak)</label><input type="number" id="g_idleOffMinutes" value="' + (s.idleOffMinutes || 0) + '"></div>' +

      '</div><div class="card" style="grid-column:1/-1"><h3>Timer di Layar TV saat Bermain</h3><div class="grid" style="grid-template-columns:1.1fr 1fr;gap:20px"><div>' +
      '<div class="tvprev" id="tvprev"><div class="gm">TAMPILAN GAME</div><div class="pp" id="pp"><i></i><span>TV 01</span><b>00:42:15</b></div></div>' +
      '<div class="dim" style="font-size:12px;margin-top:8px">Pratinjau. Timer tidak bisa disentuh/dipilih sehingga tidak mengganggu stik PS.</div></div><div>' +
      '<div class="row" style="margin-top:12px"><div class="field" style="flex:1"><label class="f">Mode tampil</label><select id="g_pillMode">' + [['always', 'Selalu tampil'], ['peek', 'Muncul sebentar tiap N menit'], ['last5', 'Hanya 5 menit terakhir']].map(([k, l]) => '<option value="' + k + '" ' + ((s.pillMode || 'always') === k ? 'selected' : '') + '>' + l + '</option>').join('') + '</select></div>' +
      '<div class="field" style="flex:1"><label class="f">Muncul tiap (menit)</label><input type="number" id="g_pillPeekEvery" min="1" max="60" value="' + (s.pillPeekEvery || 10) + '"></div></div>' +
      '<div class="field"><label class="f">Transparansi timer · <span id="opv">' + Math.round((s.pillOpacity || 0.55) * 100) + '%</span> terlihat</label><input type="range" id="g_pillOpacity" min="20" max="100" value="' + Math.round((s.pillOpacity || 0.55) * 100) + '" style="width:100%"></div>' +
      '<div class="row"><div class="field" style="flex:1"><label class="f">Posisi timer</label><select id="g_pillPosition">' + [['tr', 'Kanan atas'], ['tl', 'Kiri atas'], ['br', 'Kanan bawah'], ['bl', 'Kiri bawah']].map(([k, l]) => '<option value="' + k + '" ' + (s.pillPosition === k ? 'selected' : '') + '>' + l + '</option>').join('') + '</select></div>' +
      '<div class="field" style="flex:1"><label class="f">Ukuran timer</label><select id="g_pillSize">' + [['s', 'Kecil'], ['m', 'Sedang'], ['l', 'Besar']].map(([k, l]) => '<option value="' + k + '" ' + ((s.pillSize || 'm') === k ? 'selected' : '') + '>' + l + '</option>').join('') + '</select></div></div>' +
      '<div class="dim" style="font-size:12px;margin:-6px 0 12px">Warna timer: <b style="color:#86efac">hijau</b> normal · <b style="color:#fcd34d">kuning</b> sisa ≤ 5 menit · <b style="color:#fca5a5">merah berkedip</b> sisa ≤ waktu notifikasi (default 1 menit)</div>' +
      sw('g_bigCountdown', !!s.bigCountdown, 'Hitung mundur besar di tengah layar', 'Muncul saat sisa waktu ≤ waktu notifikasi; matikan jika cukup timer pojok saja') +
      '</div></div>' +
      '</div></div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn gold lg" id="sv">' + ic('check', 16) + 'Simpan Pengaturan</button></div>';
    // Pratinjau timer
    const prev = () => {
      const pp = $('#pp'); if (!pp) return;
      const pos = $('#g_pillPosition').value, size = $('#g_pillSize').value, op = Number($('#g_pillOpacity').value) / 100;
      $('#opv').textContent = Math.round(op * 100) + '%';
      pp.style.top = pos[0] === 't' ? '8px' : 'auto'; pp.style.bottom = pos[0] === 'b' ? '8px' : 'auto';
      pp.style.right = pos[1] === 'r' ? '8px' : 'auto'; pp.style.left = pos[1] === 'l' ? '8px' : 'auto';
      pp.style.opacity = op; pp.style.transform = 'scale(' + ({ s: 0.85, m: 1, l: 1.3 }[size]) + ')';
      pp.style.transformOrigin = (pos[0] === 't' ? 'top ' : 'bottom ') + (pos[1] === 'r' ? 'right' : 'left');
      $('#g_pillPeekEvery').disabled = $('#g_pillMode').value !== 'peek';
    };
    ['g_pillPosition', 'g_pillSize', 'g_pillOpacity', 'g_pillMode'].forEach((id) => { $('#' + id).oninput = $('#' + id).onchange = prev; });
    prev();
    $('#sv').onclick = async () => {
      const v = {};
      ['name', 'tagline', 'address', 'phone', 'receiptFooter', 'warningSeconds', 'rounding', 'openBillingBlock', 'idleOffMinutes'].forEach((k) => (v[k] = $('#g_' + k).value));
      v.pillPosition = $('#g_pillPosition').value; v.pillSize = $('#g_pillSize').value;
      v.pillMode = $('#g_pillMode').value; v.pillPeekEvery = $('#g_pillPeekEvery').value; v.pillOpacity = Number($('#g_pillOpacity').value) / 100;
      ['lockOnPause', 'autoHdmi', 'showTimerPill', 'autoOffAfterCheckout', 'bigCountdown'].forEach((k) => (v[k] = $('#g_' + k).checked));
      try { await act('/api/config/settings', { value: v }, 'Pengaturan disimpan'); } catch (e) {}
    };
  }
  const COLS = {
    types: [['id', 'ID', 'text', 90], ['name', 'Nama tipe', 'text'], ['ratePerHalfHour', 'Tarif / 30 menit (Rp)', 'number', 170], ['ratePerHour', 'Tarif / 1 jam (Rp)', 'number', 160], ['color', 'Warna', 'color', 70]],
    units: [['id', 'ID unit', 'text', 90], ['name', 'Nama', 'text'], ['type', 'Tipe PS', 'type', 160], ['mac', 'MAC TV (Wake-on-LAN)', 'text', 190], ['note', 'Catatan / ruang', 'text']],
    menu: [['emoji', 'Ikon', 'text', 64], ['name', 'Nama menu', 'text'], ['category', 'Kategori', 'cat', 140], ['price', 'Harga (Rp)', 'number', 130], ['stock', 'Stok (kosong = ∞)', 'number', 130], ['active', 'Aktif', 'bool', 60]],
  };
  const HINT = {
    types: 'Isi tarif per 30 menit dan per 1 jam. Contoh 1½ jam = tarif 1 jam + tarif 30 menit. Sisa di bawah 30 menit dihitung proporsional dari tarif 30 menit. Isi 0 pada tarif 30 menit agar otomatis setengah tarif jam. Tarif ini dipakai untuk paket tanpa harga khusus, menit bebas, tambah waktu dan Main Bebas.',
    units: 'ID unit harus sama dengan yang diisi di aplikasi TV (mis. tv1). MAC TV dipakai tombol Hidupkan (Wake-on-LAN) — lihat di Pengaturan TV › Tentang › Status, atau terisi otomatis bila TV melaporkannya.',
    menu: 'Atur makanan, minuman & layanan lain (sewa stik, charger, dll). Kosongkan stok jika tidak ingin dihitung.',
  };
  function setTable(key) {
    if (!S.edit[key]) S.edit[key] = clone(S.snap[key]);
    const rows = S.edit[key], cols = COLS[key];
    const cats = Array.from(new Set(['Minuman', 'Makanan', 'Snack', 'Lainnya'].concat(rows.map((r) => r.category).filter(Boolean))));
    const cell = (r, i, [k, , t]) => {
      const v = r[k];
      if (t === 'bool') return '<label class="switch"><input type="checkbox" data-i="' + i + '" data-k="' + k + '" ' + (v !== false ? 'checked' : '') + '><span></span></label>';
      if (t === 'type') return '<select data-i="' + i + '" data-k="' + k + '">' + S.snap.types.map((ty) => '<option value="' + esc(ty.id) + '" ' + (ty.id === v ? 'selected' : '') + '>' + esc(ty.name) + '</option>').join('') + '</select>';
      if (t === 'cat') return '<input list="catl" data-i="' + i + '" data-k="' + k + '" value="' + esc(v || '') + '">';
      if (t === 'color') return '<input type="color" data-i="' + i + '" data-k="' + k + '" value="' + esc(v || '#64748b') + '" style="padding:2px;height:36px">';
      return '<input type="' + (t === 'number' ? 'number' : 'text') + '" data-i="' + i + '" data-k="' + k + '" value="' + esc(v == null ? '' : v) + '"' + (k === 'id' && S.snap[key].find((x) => x.id === r.id) ? ' readonly style="opacity:.6"' : '') + '>';
    };
    $('#sb').innerHTML = '<div class="card"><p class="muted" style="margin-top:0">' + HINT[key] + '</p><datalist id="catl">' + cats.map((c) => '<option value="' + esc(c) + '">').join('') + '</datalist>' +
      '<div style="overflow:auto"><table class="t"><thead><tr>' + cols.map((c) => '<th' + (c[3] ? ' style="width:' + c[3] + 'px"' : '') + '>' + c[1] + '</th>').join('') + (key === 'units' ? '<th>Layar web</th>' : '') + '<th style="width:50px"></th></tr></thead><tbody>' +
      rows.map((r, i) => '<tr>' + cols.map((c) => '<td>' + cell(r, i, c) + '</td>').join('') + (key === 'units' ? '<td><a href="/tv?unit=' + encodeURIComponent(r.id) + '" target="_blank" class="btn sm">' + ic('tv', 14) + 'Buka</a></td>' : '') + '<td><button class="btn sm red" data-del="' + i + '">' + ic('trash', 14) + '</button></td></tr>').join('') +
      '</tbody></table></div><div class="row" style="margin-top:14px"><button class="btn" id="add">' + ic('plus', 15) + 'Tambah baris</button><span style="flex:1"></span><button class="btn ghost" id="rst">Batalkan perubahan</button><button class="btn gold" id="sv">' + ic('check', 15) + 'Simpan</button></div></div>';
    $$('#sb [data-k]').forEach((el) => (el.oninput = el.onchange = () => {
      const r = rows[el.dataset.i]; const t = cols.find((c) => c[0] === el.dataset.k)[2];
      r[el.dataset.k] = t === 'bool' ? el.checked : t === 'number' ? (el.value === '' ? (el.dataset.k === 'stock' ? null : 0) : Number(el.value)) : el.value;
    }));
    $$('#sb [data-del]').forEach((b) => (b.onclick = () => { rows.splice(Number(b.dataset.del), 1); setTable(key); }));
    $('#add').onclick = () => {
      const n = rows.length + 1;
      if (key === 'types') rows.push({ id: 'tipe' + n, name: 'Tipe Baru', ratePerHalfHour: 3000, ratePerHour: 5000, color: '#06b6d4' });
      if (key === 'units') { let k = n; while (rows.find((r) => r.id === 'tv' + k)) k++; rows.push({ id: 'tv' + k, name: 'TV ' + pad2(k), type: (S.snap.types[0] || {}).id, mac: '', note: '' }); }
      if (key === 'menu') rows.push({ id: '', emoji: '🍽️', name: 'Menu Baru', category: 'Minuman', price: 5000, stock: null, active: true });
      setTable(key);
    };
    $('#rst').onclick = () => { delete S.edit[key]; setTable(key); };
    $('#sv').onclick = async () => { try { await act('/api/config/' + key, { value: rows }, 'Tersimpan'); delete S.edit[key]; setTimeout(() => setTable(key), 300); } catch (e) {} };
  }
  function setPackages() {
    const key = 'packages';
    if (!S.edit[key]) S.edit[key] = clone(S.snap[key]);
    const rows = S.edit[key]; const types = S.snap.types;
    $('#sb').innerHTML = '<div class="card"><p class="muted" style="margin-top:0">Paket muncul sebagai pilihan cepat saat mulai/tambah waktu. Kosongkan harga khusus agar dihitung dari tarif per jam.</p><div style="overflow:auto"><table class="t"><thead><tr><th>Nama paket</th><th style="width:110px">Menit</th>' + types.map((t) => '<th style="width:150px">Harga ' + esc(t.name) + '</th>').join('') + '<th style="width:50px"></th></tr></thead><tbody>' +
      rows.map((r, i) => '<tr><td><input data-i="' + i + '" data-k="name" value="' + esc(r.name) + '"></td><td><input type="number" data-i="' + i + '" data-k="minutes" value="' + r.minutes + '"></td>' + types.map((t) => '<td><input type="number" data-i="' + i + '" data-p="' + esc(t.id) + '" value="' + esc(r.prices && r.prices[t.id] != null ? r.prices[t.id] : '') + '" placeholder="otomatis ' + rp(roundStep(priceMinutes(t.ratePerHour, t.ratePerHalfHour, r.minutes))) + '"></td>').join('') + '<td><button class="btn sm red" data-del="' + i + '">' + ic('trash', 14) + '</button></td></tr>').join('') +
      '</tbody></table></div><div class="row" style="margin-top:14px"><button class="btn" id="add">' + ic('plus', 15) + 'Tambah paket</button><span style="flex:1"></span><button class="btn gold" id="sv">' + ic('check', 15) + 'Simpan</button></div></div>';
    $$('#sb [data-k]').forEach((el) => (el.oninput = () => { rows[el.dataset.i][el.dataset.k] = el.dataset.k === 'minutes' ? Number(el.value) : el.value; }));
    $$('#sb [data-p]').forEach((el) => (el.oninput = () => { const r = rows[el.dataset.i]; r.prices = r.prices || {}; if (el.value === '') delete r.prices[el.dataset.p]; else r.prices[el.dataset.p] = Number(el.value); }));
    $$('#sb [data-del]').forEach((b) => (b.onclick = () => { rows.splice(Number(b.dataset.del), 1); setPackages(); }));
    $('#add').onclick = () => { rows.push({ id: '', name: 'Paket Baru', minutes: 60, prices: {} }); setPackages(); };
    $('#sv').onclick = async () => { try { await act('/api/config/packages', { value: rows }, 'Paket tersimpan'); delete S.edit[key]; setTimeout(setPackages, 300); } catch (e) {} };
  }
  function setSystem() {
    const s = S.snap;
    const base = s.ips[0] ? 'http://' + s.ips[0] + ':' + s.port : location.origin;
    $('#sb').innerHTML = '<div class="grid" style="grid-template-columns:1fr 1fr"><div class="card"><h3>Alamat Server</h3><p class="muted" style="margin-top:0">Buka dari PC/HP/laptop lain yang terhubung ke WiFi yang sama:</p>' +
      (s.ips.length ? s.ips.map((ip) => '<div class="mono gold-t" style="font-size:18px;margin:6px 0">http://' + ip + ':' + s.port + '</div>').join('') : '<div class="mono">' + location.origin + '</div>') +
      '<div class="sep"></div><h3>Menyambungkan Smart TV</h3><ol class="muted" style="line-height:1.8;padding-left:18px;margin:0"><li>Pasang <b>ElClassico-TV.apk</b> di Smart TV (Android TV / Google TV).</li><li>Buka aplikasi → server terdeteksi otomatis, atau isi IP <span class="mono">' + esc(s.ips[0] || '…') + '</span> port <span class="mono">' + s.port + '</span>.</li><li>Pilih <b>ID unit</b> (mis. <span class="mono">tv1</span>) dan input HDMI tempat PS tersambung.</li><li>Izinkan “Tampil di atas aplikasi lain”.</li></ol>' +
      '<p class="muted">TV tanpa APK? Buka browser TV ke <span class="mono">' + esc(base) + '/tv?unit=tv1</span> (tampilan timer saja).</p></div>' +
      '<div class="card"><h3>Cadangan Data</h3><p class="muted" style="margin-top:0">Server otomatis membuat cadangan harian (30 hari terakhir) di folder <span class="mono">data/backup</span>.</p><div class="row wrap"><a class="btn" href="#" id="bk">' + ic('download', 15) + 'Unduh cadangan (.json)</a><label class="btn">' + ic('upload', 15) + 'Pulihkan dari file<input type="file" id="rs" accept=".json" hidden></label></div>' +
      '<div class="sep"></div><h3>Tentang</h3><div class="kv"><div>Aplikasi</div><div>El Classico Rental PS Billing</div><div>Versi server</div><div>' + esc(s.version) + '</div><div>Unit</div><div>' + s.units.length + ' TV · ' + s.units.filter((u) => u.online).length + ' online</div></div></div></div>';
    $('#bk').onclick = async (e) => {
      e.preventDefault();
      const r = await fetch('/api/backup', { headers: { 'X-Token': S.token } }); const b = await r.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'elclassico-backup-' + ymd(new Date()) + '.json'; a.click();
    };
    $('#rs').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (!(await confirmBox('Pulihkan data?', 'Semua data saat ini akan <b>diganti</b> dengan isi file cadangan.', 'Pulihkan', 'red'))) return;
      try { const data = JSON.parse(await f.text()); await act('/api/restore', { data }, 'Data dipulihkan'); } catch (err) { toast('File tidak valid', 'danger'); }
    };
  }

  // ================= Pengguna =================
  async function loadUsers() {
    try { S.usersData = await api('/api/users'); if (S.view === 'users') renderUsers(); } catch (e) { toast(e.message, 'danger'); }
  }
  function renderUsers() {
    const d = S.usersData;
    if (!d) { $('#content').innerHTML = '<div class="empty">Memuat…</div>'; return; }
    const isOwner = S.me.role === 'owner';
    const order = { owner: 0, admin: 1, kasir: 2 };
    const list = d.users.slice().sort((a, b) => (order[a.role] - order[b.role]) || a.name.localeCompare(b.name));
    const counts = { owner: 0, admin: 0, kasir: 0 }; list.forEach((x) => counts[x.role]++);
    $('#content').innerHTML =
      '<div class="stats" style="grid-template-columns:repeat(3,1fr)">' +
      stat('Admin Utama', counts.owner, 'akses penuh ke semua fitur', 'rgba(245,197,24,.12)', 'key') +
      stat('Admin', counts.admin, 'bisa kelola kasir & pengaturan', 'rgba(59,130,246,.14)', 'users') +
      stat('Kasir / Karyawan', counts.kasir, 'operasional harian', 'rgba(34,197,94,.1)', 'user') + '</div>' +
      '<div class="toolbar">' + (isOwner ? '<button class="btn" data-new="admin">' + ic('plus', 15) + 'Tambah Admin</button>' : '') +
      '<button class="btn gold" data-new="kasir">' + ic('plus', 15) + 'Tambah Kasir / Karyawan</button>' +
      (isOwner ? '<button class="btn ghost" data-new="owner">' + ic('plus', 15) + 'Tambah Admin Utama</button>' : '') + '</div>' +
      (!isOwner ? '<div class="notice">Sebagai Admin, Anda hanya dapat menambah dan mengubah akun <b>Kasir / Karyawan</b>.</div>' : '') +
      '<div class="card"><table class="t"><thead><tr><th>Pengguna</th><th>Peran</th><th>Hak akses</th><th>Login terakhir</th><th>Status</th><th></th></tr></thead><tbody>' +
      list.map((x) => {
        const manage = isOwner || x.role === 'kasir';
        const n = Object.keys(x.perms).filter((k) => x.perms[k]).length;
        return '<tr><td><div class="row"><span class="avatar ' + x.role + '">' + esc(initials(x.name)) + '</span><div><b>' + esc(x.name) + (x.id === S.me.id ? ' <span class="muted">(Anda)</span>' : '') + '</b><div class="muted" style="font-size:12px">@' + esc(x.username) + (x.createdBy ? ' · dibuat oleh ' + esc(x.createdBy) : '') + '</div></div></div></td>' +
          '<td><span class="role ' + x.role + '">' + esc(x.roleLabel) + '</span></td>' +
          '<td><span class="muted">' + (x.role === 'owner' ? 'Semua' : n + ' / ' + Object.keys(x.perms).length) + '</span></td>' +
          '<td class="muted">' + (x.lastLogin ? dt(x.lastLogin) : 'belum pernah') + '</td>' +
          '<td>' + (x.active ? '<span class="chip playing">aktif</span>' : '<span class="chip expired">nonaktif</span>') + '</td>' +
          '<td class="r" style="white-space:nowrap">' + (manage ? '<button class="btn sm" data-e="' + esc(x.id) + '">' + ic('edit', 14) + 'Ubah</button>' + (x.id !== S.me.id ? ' <button class="btn sm red" data-del="' + esc(x.id) + '" title="Hapus">' + ic('trash', 14) + '</button>' : '') : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    $$('[data-new]').forEach((b) => (b.onclick = () => openUserEdit(null, b.dataset.new)));
    $$('[data-e]').forEach((b) => (b.onclick = () => openUserEdit(d.users.find((x) => x.id === b.dataset.e))));
    $$('[data-del]').forEach((b) => (b.onclick = async () => {
      const x = d.users.find((y) => y.id === b.dataset.del);
      if (!(await confirmBox('Hapus pengguna?', 'Akun <b>' + esc(x.name) + '</b> akan dihapus permanen. Riwayat transaksinya tetap tersimpan. Alternatif: nonaktifkan akun saja.', 'Hapus', 'red'))) return;
      try { await act('/api/users/delete', { id: x.id }, 'Pengguna dihapus'); loadUsers(); } catch (e) {}
    }));
  }
  function openUserEdit(user, newRole) {
    const d = S.usersData; const isOwner = S.me.role === 'owner';
    const isNew = !user;
    let role = user ? user.role : newRole || 'kasir';
    let perms = user ? Object.assign({}, user.perms) : Object.assign({}, d.roleDefaults[role]);
    const roles = isOwner ? ['kasir', 'admin', 'owner'] : ['kasir'];
    const m = modal((isNew ? 'Tambah ' : 'Ubah ') + esc(d.roleLabels[role] || 'Pengguna'),
      '<div class="row"><div class="field" style="flex:1"><label class="f">Nama lengkap</label><input id="un" value="' + esc(user ? user.name : '') + '" placeholder="mis. Yohanes Kasir"></div>' +
      '<div class="field" style="flex:1"><label class="f">Username</label><input id="uu" value="' + esc(user ? user.username : '') + '" placeholder="mis. yohanes"></div></div>' +
      '<div class="row"><div class="field" style="flex:1"><label class="f">Peran</label><select id="ur">' + roles.map((r) => '<option value="' + r + '" ' + (r === role ? 'selected' : '') + '>' + esc(d.roleLabels[r]) + '</option>').join('') + '</select></div>' +
      '<div class="field" style="flex:1"><label class="f">' + (isNew ? 'PIN login (4–8 angka)' : 'Reset PIN (kosongkan jika tetap)') + '</label><input type="password" id="up" inputmode="numeric" maxlength="8"></div></div>' +
      (!isNew && user.id !== S.me.id ? '<label class="row" style="gap:10px;margin-bottom:14px"><span class="switch"><input type="checkbox" id="ua" ' + (user.active ? 'checked' : '') + '><span></span></span>Akun aktif (bisa login)</label>' : '') +
      '<div class="spread"><h3 style="margin:6px 0 10px">Hak akses</h3><button class="btn sm ghost" id="udef">Kembalikan default peran</button></div><div class="perm-grid" id="upg"></div>',
      '<button class="btn" data-x>Batal</button><button class="btn gold" id="us">' + ic('check', 15) + 'Simpan</button>', 'wide');
    $('[data-x]', m).onclick = closeModal;
    function drawPerms() {
      $('#upg', m).innerHTML = Object.keys(d.permLabels).map((k) => {
        const locked = role === 'owner' || (!isOwner && !S.me.perms[k]) || (role === 'kasir' && k === 'users');
        const on = role === 'owner' ? true : !!perms[k] && !(role === 'kasir' && k === 'users');
        return '<label class="perm ' + (locked ? 'dis' : '') + '"><span class="switch"><input type="checkbox" data-k="' + k + '" ' + (on ? 'checked' : '') + ' ' + (locked ? 'disabled' : '') + '><span></span></span>' + esc(d.permLabels[k]) + '</label>';
      }).join('');
      $$('#upg [data-k]', m).forEach((c) => (c.onchange = () => { perms[c.dataset.k] = c.checked; }));
    }
    drawPerms();
    $('#ur', m).onchange = (e) => { role = e.target.value; perms = Object.assign({}, d.roleDefaults[role]); drawPerms(); };
    $('#udef', m).onclick = () => { perms = Object.assign({}, d.roleDefaults[role]); drawPerms(); };
    $('#us', m).onclick = async () => {
      const body = { id: user ? user.id : undefined, name: $('#un', m).value, username: $('#uu', m).value, role, perms, pin: $('#up', m).value || undefined };
      if ($('#ua', m)) body.active = $('#ua', m).checked; else if (user) body.active = user.active;
      try { await act('/api/users/save', body, isNew ? 'Pengguna ditambahkan' : 'Perubahan disimpan'); closeModal(); loadUsers(); } catch (e) {}
    };
  }

  // ================= Aktivitas =================
  S.aud = { from: ymd(new Date()), to: ymd(new Date()), user: '', q: '' };
  async function loadAudit() {
    try {
      S.audit = await api('/api/audit?from=' + S.aud.from + '&to=' + S.aud.to + (S.aud.user ? '&user=' + encodeURIComponent(S.aud.user) : ''));
      if (!S.usersData && can('users')) { try { S.usersData = await api('/api/users'); } catch (e) {} }
      if (S.view === 'audit') renderAudit();
    } catch (e) { toast(e.message, 'danger'); }
  }
  function renderAudit() {
    const items = S.audit ? S.audit.items.filter((a) => !S.aud.q || (a.action + ' ' + a.detail + ' ' + a.user).toLowerCase().indexOf(S.aud.q.toLowerCase()) >= 0) : null;
    const users = S.usersData ? S.usersData.users : [];
    $('#content').innerHTML = '<div class="toolbar"><input type="date" id="af" value="' + S.aud.from + '" style="width:auto"><span class="muted">s/d</span><input type="date" id="at" value="' + S.aud.to + '" style="width:auto">' +
      (users.length ? '<select id="au" style="width:auto"><option value="">Semua pengguna</option>' + users.map((x) => '<option value="' + esc(x.id) + '" ' + (S.aud.user === x.id ? 'selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select>' : '') +
      '<input id="aq" placeholder="Cari aktivitas…" value="' + esc(S.aud.q) + '" style="max-width:260px"></div>' +
      '<div class="card">' + (!items ? '<div class="empty">Memuat…</div>' : items.length ? '<table class="t"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aktivitas</th><th>Detail</th></tr></thead><tbody>' +
        items.map((a) => '<tr><td class="mono muted" style="white-space:nowrap">' + dt(a.at) + '</td><td><span class="role ' + esc(a.role || 'kasir') + '">' + esc(a.user) + '</span></td><td><b>' + esc(a.action) + '</b></td><td class="muted">' + esc(a.detail) + '</td></tr>').join('') + '</tbody></table>'
        : '<div class="empty"><div class="big">📋</div>Belum ada aktivitas pada periode ini</div>') + '</div>';
    $('#af').onchange = (e) => { S.aud.from = e.target.value; loadAudit(); };
    $('#at').onchange = (e) => { S.aud.to = e.target.value; loadAudit(); };
    if ($('#au')) $('#au').onchange = (e) => { S.aud.user = e.target.value; loadAudit(); };
    let qt; $('#aq').oninput = (e) => { clearTimeout(qt); qt = setTimeout(() => { S.aud.q = e.target.value; renderAudit(); $('#aq').focus(); $('#aq').setSelectionRange(99, 99); }, 250); };
  }

  // ================= Mulai =================
  renderPin();
  if (S.token) boot().then(() => { if (!S.me) logout(true); });
  else logout(true);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
