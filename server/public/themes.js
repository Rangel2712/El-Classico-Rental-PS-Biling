/* El Classico — koleksi tema (dipakai panel kasir & layar TV) */
(function () {
  'use strict';
  const D = { text: '#e8edf7', muted: '#8a97b0', dim: '#5d6a85' };
  const T = [
    { id: 'elclassico', name: 'El Classico', desc: 'Garnet, biru & emas', bg: '#060a13', s1: '#0f1728', s2: '#141e33', s3: '#1a2640', accent: '#f5c518', accent2: '#ffdd55', on: '#1b1400', b1: '#a50044', b2: '#004d98' },
    { id: 'midnight', name: 'Midnight Biru', desc: 'Biru malam yang tenang', bg: '#050816', s1: '#0d1330', s2: '#131b40', s3: '#1b2552', accent: '#60a5fa', accent2: '#93c5fd', on: '#06142e', b1: '#1e3a8a', b2: '#312e81' },
    { id: 'pitch', name: 'Lapangan Hijau', desc: 'Nuansa rumput stadion', bg: '#04110a', s1: '#0b1f14', s2: '#10291b', s3: '#163524', accent: '#22c55e', accent2: '#4ade80', on: '#04210f', b1: '#14532d', b2: '#065f46' },
    { id: 'neon', name: 'Neon Cyber', desc: 'Ungu & cyan ala gaming', bg: '#07040f', s1: '#130c24', s2: '#1b1133', s3: '#251845', accent: '#22d3ee', accent2: '#67e8f9', on: '#03252c', b1: '#a21caf', b2: '#4c1d95' },
    { id: 'rajaampat', name: 'Raja Ampat', desc: 'Toska laut Papua', bg: '#031214', s1: '#082226', s2: '#0c2d32', s3: '#113a40', accent: '#2dd4bf', accent2: '#5eead4', on: '#032622', b1: '#0e7490', b2: '#155e75' },
    { id: 'cenderawasih', name: 'Cenderawasih', desc: 'Emas, jingga & hijau hutan', bg: '#0d0a04', s1: '#1c1608', s2: '#261d0b', s3: '#33270f', accent: '#f59e0b', accent2: '#fbbf24', on: '#261400', b1: '#b45309', b2: '#166534' },
    { id: 'sunset', name: 'Senja Arfak', desc: 'Jingga hangat', bg: '#120806', s1: '#22110c', s2: '#2d1610', s3: '#3a1d15', accent: '#fb923c', accent2: '#fdba74', on: '#2a1104', b1: '#9a3412', b2: '#be123c' },
    { id: 'crimson', name: 'Merah Membara', desc: 'Merah tegas & berani', bg: '#0f0507', s1: '#1f0b10', s2: '#2a0f16', s3: '#36141d', accent: '#f87171', accent2: '#fca5a5', on: '#3b0707', b1: '#991b1b', b2: '#4c0519' },
    { id: 'royal', name: 'Ungu Royal', desc: 'Elegan & mewah', bg: '#0b0614', s1: '#170e2a', s2: '#1f1337', s3: '#2a1a48', accent: '#c084fc', accent2: '#d8b4fe', on: '#22093d', b1: '#6b21a8', b2: '#3730a3' },
    { id: 'sakura', name: 'Sakura', desc: 'Merah muda lembut', bg: '#12060c', s1: '#220d18', s2: '#2d1120', s3: '#3a162a', accent: '#f472b6', accent2: '#f9a8d4', on: '#3a0a22', b1: '#9d174d', b2: '#6d28d9' },
    { id: 'arena', name: 'Arena Biru', desc: 'Biru stadion & putih', bg: '#020617', s1: '#0b1630', s2: '#10203f', s3: '#162950', accent: '#38bdf8', accent2: '#7dd3fc', on: '#03263b', b1: '#1d4ed8', b2: '#0369a1' },
    { id: 'kopi', name: 'Kopi Papua', desc: 'Cokelat kopi Wamena', bg: '#0e0906', s1: '#1d140e', s2: '#271b13', s3: '#332419', accent: '#d6a46c', accent2: '#e7c08f', on: '#2a1806', b1: '#78350f', b2: '#44403c' },
    { id: 'graphite', name: 'Grafit Mono', desc: 'Hitam-putih minimalis', bg: '#0a0a0b', s1: '#161618', s2: '#1e1e21', s3: '#28282c', accent: '#e5e7eb', accent2: '#ffffff', on: '#111111', b1: '#3f3f46', b2: '#27272a' },
    { id: 'light', name: 'Terang Klasik', desc: 'Mode terang, aksen emas', mode: 'light', bg: '#f3f5f9', s1: '#ffffff', s2: '#f1f4f9', s3: '#e5eaf2', text: '#0f172a', muted: '#566074', dim: '#8a93a5', accent: '#e0a800', accent2: '#f5c518', on: '#1b1400', b1: '#a50044', b2: '#004d98', tvBg: '#060a13' },
    { id: 'lightblue', name: 'Terang Biru', desc: 'Mode terang, aksen biru', mode: 'light', bg: '#f4f7fb', s1: '#ffffff', s2: '#eef3fa', s3: '#e1e9f4', text: '#0b1324', muted: '#55617a', dim: '#8792a8', accent: '#2563eb', accent2: '#3b82f6', on: '#ffffff', b1: '#2563eb', b2: '#0ea5e9', tvBg: '#050816' },
  ];
  const rgb = (h) => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
  const get = (id) => T.find((x) => x.id === id) || T[0];
  function apply(id, opts) {
    const t = get(id), tv = !!(opts && opts.tv), el = (opts && opts.el) || document.documentElement;
    const light = t.mode === 'light' && !tv;
    const bg = tv ? (t.tvBg || t.bg) : t.bg;
    const s1 = tv && t.mode === 'light' ? mix(bg, '#ffffff', 0.06) : t.s1;
    const set = (k, v) => el.style.setProperty(k, v);
    set('--bg', bg); set('--bg-rgb', rgb(bg).join(','));
    set('--surface', s1); set('--surface2', tv && t.mode === 'light' ? mix(bg, '#ffffff', 0.1) : t.s2); set('--surface3', tv && t.mode === 'light' ? mix(bg, '#ffffff', 0.15) : t.s3);
    set('--text', light ? t.text : D.text); set('--muted', light ? t.muted : (t.muted && !light && t.mode !== 'light' ? t.muted : D.muted)); set('--dim', light ? t.dim : D.dim);
    set('--gold', t.accent); set('--gold2', t.accent2); set('--on-accent', t.on); set('--accent-rgb', rgb(t.accent).join(','));
    set('--garnet', t.b1); set('--navy', t.b2); set('--b1-rgb', rgb(t.b1).join(',')); set('--b2-rgb', rgb(t.b2).join(','));
    set('--tint-rgb', light ? '15,23,42' : '255,255,255');
    set('--line', light ? 'rgba(15,23,42,.09)' : 'rgba(255,255,255,.07)'); set('--line2', light ? 'rgba(15,23,42,.16)' : 'rgba(255,255,255,.12)');
    set('--card-b', light ? t.s1 : mix(t.s1, bg, 0.45)); set('--side-a', light ? '#ffffff' : mix(t.s1, bg, 0.3)); set('--side-b', light ? t.s2 : mix(t.s1, bg, 0.7));
    set('--input', light ? '#ffffff' : mix(t.s1, bg, 0.6)); set('--overlay', light ? 'rgba(15,23,42,.45)' : 'rgba(3,6,12,.72)');
    if (el === document.documentElement) {
      el.dataset.mode = light ? 'light' : 'dark'; el.dataset.theme = t.id;
      const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', bg);
    }
    return t;
  }
  // Pratinjau kecil untuk kartu pilihan tema
  function swatch(t) {
    const bg = t.bg, s = t.s1, a = t.accent;
    return '<div class="tsw" style="background:linear-gradient(135deg,' + t.b1 + '55,transparent 55%),linear-gradient(315deg,' + t.b2 + '66,transparent 55%),' + bg + '">' +
      '<i style="background:' + s + ';border-color:' + (t.mode === 'light' ? '#0001' : '#fff1') + '"><b style="background:' + a + '"></b><u style="background:' + (t.mode === 'light' ? '#0f172a22' : '#ffffff22') + '"></u><u style="background:' + (t.mode === 'light' ? '#0f172a14' : '#ffffff14') + ';width:60%"></u></i>' +
      '<em style="background:' + a + '"></em></div>';
  }
  window.ECTheme = { list: T, get, apply, swatch };
  // Terapkan tema terakhir secepatnya agar tidak berkedip
  try { if (!/tv/.test(location.pathname) && !/tv\.html/.test(location.pathname)) apply(localStorage.getItem('ec_theme') || 'elclassico'); } catch (e) {}
})();
