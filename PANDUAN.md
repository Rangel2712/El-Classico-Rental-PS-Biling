# El Classico Rental PS Billing — Panduan Lengkap

Sistem billing otomatis untuk rental PlayStation. Satu server di MacBook atau laptop Windows mengendalikan semua Smart TV lewat WiFi.

```
           ┌──────────── WiFi rental ────────────┐
           │                                      │
  MacBook / Laptop Windows                 Smart TV (Android TV)
  ┌───────────────────────┐   WebSocket   ┌──────────────────────────┐
  │ Server billing :8080  │◀────────────▶│ ElClassico-TV.apk         │
  │ • data & laporan      │              │ • layar kunci             │
  │ • panel kasir (web)   │  Wake-on-LAN │ • timer + hitung mundur   │
  └──────────┬────────────┘ ────────────▶│ • HDMI, volume, pengaturan│
             │                            └──────────────────────────┘
   Panel kasir dibuka dari:
   • aplikasi .exe / .dmg   • Chrome / Safari / HP di WiFi yang sama
```

## 1. Isi paket

| Folder / file | Fungsi |
|---|---|
| `server/` | Server billing (Node.js, tanpa instalasi tambahan) + panel kasir web + layar TV web |
| `android-tv/` | Kode aplikasi Smart TV → menghasilkan **ElClassico-TV.apk** |
| `desktop/` | Aplikasi desktop → **.exe** (Windows) & **.dmg** (Mac). Bisa jadi server atau hanya kontrol |
| `start-server-mac.command` | Klik dua kali untuk menjalankan server di Mac |
| `start-server-windows.bat` | Klik dua kali untuk menjalankan server di Windows |
| `.github/workflows/build.yml` | Build otomatis APK, EXE, DMG di GitHub (gratis) |

## 2. Membuat file APK, EXE dan DMG (sekali saja, ±15 menit)

File installer dibangun otomatis oleh GitHub Actions, jadi Anda tidak perlu memasang Android Studio.

1. Buat akun di github.com, lalu klik **New repository** (boleh *Private*), misalnya `elclassico-billing`.
2. Klik **uploading an existing file**, lalu seret **seluruh isi** folder `elclassico-billing` (termasuk folder `.github`). Klik **Commit changes**.
   *Folder `.github` tersembunyi di Mac. Tekan `Cmd + Shift + .` di Finder agar terlihat.*
3. Buka tab **Actions**. Workflow *Build El Classico Billing* akan berjalan sendiri. Kalau belum, klik workflow itu lalu **Run workflow**.
4. Tunggu sampai semua tanda ✅ muncul (±10–15 menit). Klik hasil run, lalu unduh dari bagian **Artifacts**:
   - `ElClassico-TV-apk` → **ElClassico-TV.apk** untuk Smart TV
   - `ElClassico-Windows-exe` → **installer .exe** dan versi **portable .exe**
   - `ElClassico-macOS-dmg` → **.dmg** untuk Mac (Intel, mendukung macOS 10.15 Catalina ke atas)
   - `ElClassico-Server-zip` → server tanpa aplikasi desktop

> Ingin halaman rilis yang rapi? Buat tag `v1.0.0` (menu **Releases → Draft a new release**). Semua file akan otomatis dilampirkan.

## 3. Menjalankan server (pilih salah satu)

### A. Lewat aplikasi desktop (paling mudah)
1. Pasang **.exe** (Windows) atau **.dmg** (Mac).
   - Di Mac, aplikasi belum ditandatangani Apple. Saat pertama dibuka: klik kanan → **Open** → **Open**.
2. Pilih **Jadikan Komputer Ini Server**, isi port `8080`, lalu klik **Jalankan Server**.
3. Panel kasir terbuka. Menutup jendela tidak mematikan server (ikon tetap ada di tray/menu bar). Untuk mematikan, pilih **Keluar** dari menu.
4. Aktifkan **Billing › Jalankan saat komputer menyala** supaya server otomatis hidup.

### B. Tanpa aplikasi desktop (cocok untuk MacBook lama)
1. Pasang Node.js:
   - **MacBook macOS Catalina 10.15**: pasang **Node.js 18 LTS** (`node-v18.x.x.pkg` dari nodejs.org/dist/latest-v18.x/). Versi Node terbaru tidak berjalan di Catalina.
   - **Windows 10/11**: pasang Node.js LTS dari nodejs.org.
2. Klik dua kali `start-server-mac.command` (Mac) atau `start-server-windows.bat` (Windows).
3. Panel kasir terbuka di browser: `http://localhost:8080`. Login sebagai **Admin Utama** dengan PIN **`1234`**, lalu segera ganti lewat **Profil**.

### Membuka panel kasir dari perangkat lain
Alamat server tertulis di pojok kiri bawah panel, misalnya `http://192.168.1.10:8080`.
- **Laptop Windows lain**: pasang .exe, lalu pilih **Kontrol dari Server Lain** → **Cari server di jaringan**.
- **Chrome / HP / tablet**: buka alamat itu di browser. Panel menyesuaikan layar HP.

> Supaya alamat server tidak berubah-ubah, atur **IP statis / DHCP reservation** untuk komputer server di pengaturan router. Aplikasi TV juga bisa mencari ulang server secara otomatis kalau IP berubah.

## 4. Memasang aplikasi di Smart TV

Syarat: TV menggunakan **Android TV / Google TV** (Sony, TCL, Xiaomi, Toshiba, Philips, Sharp, Coocaa, dll.) dan terhubung ke WiFi yang sama dengan server.

1. **Izinkan aplikasi dari sumber tidak dikenal**: Pengaturan TV › Privasi/Keamanan › *Unknown sources*, lalu izinkan untuk File Manager.
2. **Pasang APK**, pilih salah satu cara:
   - Salin `ElClassico-TV.apk` ke flashdisk → colok ke TV → buka dengan File Manager → Install.
   - Pakai aplikasi *Send Files to TV* dari HP.
   - Lewat ADB: `adb connect IP_TV` lalu `adb install ElClassico-TV.apk`.
3. Buka **El Classico Billing** di TV. Layar pengaturan muncul pada pembukaan pertama:
   1. **Cari Server Otomatis**, atau isi IP server secara manual.
   2. **ID unit**: `tv1`, `tv2`, … Harus sama dengan kolom ID di Panel › Pengaturan › Unit TV.
   3. **Input PlayStation**: pilih HDMI tempat PS tersambung, lalu tekan **Tes Pindah ke HDMI**.
   4. **SIMPAN & SAMBUNGKAN**.
4. **Aktifkan timer di atas game.** Ini wajib supaya timer sisa waktu tampil di pojok layar saat bermain. Pilih SALAH SATU:
   - **Aksesibilitas (disarankan, ada di hampir semua Android TV)**: di menu teknisi tekan **Aktifkan Aksesibilitas El Classico**. Atau buka manual: Pengaturan TV › Preferensi Perangkat › **Aksesibilitas** › **El Classico Billing** › Aktifkan. Izin ini sekaligus membuat tombol **Matikan TV** berfungsi.
   - **Tampil di Atas Aplikasi**: hanya bila menu ini ada di TV Anda.
   - Jika TV Android 13 ke atas menolak dengan pesan *Restricted setting*, buka Pengaturan › Aplikasi › El Classico Billing › ⋮ › **Allow restricted settings**, lalu ulangi.
   - Lewat komputer (ADB), bila menu-menu di atas tidak ada:
     ```
     adb connect IP_TV
     adb shell settings put secure enabled_accessibility_services com.elclassico.billing/.PowerAccessibility
     adb shell settings put secure accessibility_enabled 1
     ```
   Status timer setiap TV terlihat di panel kasir › kartu unit › **Kontrol TV**. Tanda **Timer ⚠** di kartu unit berarti timer belum aktif. Selama timer belum aktif, TV hanya menampilkan notifikasi singkat pada sisa 10, 5, 2 dan 1 menit.
5. (Opsional, sangat disarankan) **Jadikan Launcher Utama**. Tombol Home di remote akan selalu kembali ke layar billing, sehingga pelanggan tidak bisa main tanpa sewa.

**Otomatis masuk El Classico saat TV dinyalakan** (aktif secara bawaan). Setiap kali TV dinyalakan, baik lewat remote, tombol Hidupkan di panel, maupun saat booting, aplikasi El Classico langsung terbuka. Jika masih ada sewa aktif, TV langsung kembali ke HDMI PlayStation. Supaya paling andal:
- Izin **Tampil di Atas Aplikasi** harus aktif. Android tidak mengizinkan aplikasi membuka dirinya sendiri dari latar belakang tanpa izin ini.
- Jadikan El Classico **launcher utama** jika TV mengizinkan.
- Di beberapa TV, aktifkan juga *Autostart / Mulai otomatis* untuk El Classico Billing (Pengaturan › Aplikasi). Matikan juga penghemat daya / *memory cleaner* untuk aplikasi ini.
- Fitur ini bisa dimatikan di menu teknisi: **Buka El Classico otomatis setiap TV dinyalakan**.

**Menu teknisi di TV (dengan remote)**: layar El Classico sengaja mengunci remote agar pelanggan tidak bisa keluar atau mengubah pengaturan. Teknisi tetap bisa membuka menu dengan salah satu cara berikut, lalu memasukkan PIN teknisi (awal `1234`):
- tekan **OK** 7× cepat, atau
- **tahan OK** ±2 detik, atau
- tekan **BACK** 5× cepat, atau
- tahan tombol **MENU / Settings**.

**Dari panel kasir** (tanpa remote): Kontrol TV › **Buka Menu Teknisi di TV** (tanpa PIN). Input HDMI PlayStation dan opsi *buka otomatis saat TV menyala* juga bisa diatur langsung dari panel.

**TV tanpa APK** (TV non-Android / browser saja): buka `http://IP_SERVER:8080/tv?unit=tv1` di browser TV. Timer dan layar kunci tetap tampil, tetapi kontrol volume, HDMI dan pengaturan butuh APK.

## 5. Pengguna: Admin Utama, Admin & Kasir

Login panel dilakukan dengan **memilih nama** lalu memasukkan **PIN pribadi**. Login pertama: **Admin Utama**, PIN `1234`. PIN lama dari versi sebelumnya otomatis menjadi PIN Admin Utama. Segera ganti lewat tombol **Profil** di kiri bawah.

| Peran | Bisa apa (bawaan) |
|---|---|
| **Admin Utama** (Anda) | Semua fitur, termasuk membuat Admin & Admin Utama lain, cadangan & pulihkan data |
| **Admin** | Semua, kecuali cadangan/pulihkan. Hanya bisa mengelola akun **Kasir** |
| **Kasir / Karyawan** | Sewa (mulai, tambah waktu, jeda, bayar), Kasir F&B, kontrol TV. Laporan hanya **Shift Saya** |

- Menu **Pengguna** dipakai untuk menambah, mengubah, mereset PIN, menonaktifkan atau menghapus akun. Setiap izin bisa dinyalakan atau dimatikan per orang, misalnya memberi kasir senior izin **Memberi diskon** atau **Mengurangi waktu**.
- Menu **Aktivitas** mencatat siapa melakukan apa dan kapan: login, mulai sewa, tambah waktu, pembayaran, diskon, hapus transaksi, perubahan tarif, matikan TV, dan lainnya.
- Nama kasir tercetak di struk. **Laporan** menampilkan pendapatan per kasir dan per metode bayar.
- Kasir memakai **Shift Saya › Cetak Rekap Shift** saat tutup kasir atau serah terima.
- Akun yang dinonaktifkan atau direset PIN-nya otomatis keluar dari semua perangkat. Salah PIN 5× akan mengunci akun selama 1 menit.

### Tema tampilan
Tersedia **15 tema**: El Classico, Midnight Biru, Lapangan Hijau, Neon Cyber, Raja Ampat, Cenderawasih, Senja Arfak, Merah Membara, Ungu Royal, Sakura, Arena Biru, Kopi Papua, Grafit Mono, Terang Klasik ☀️ dan Terang Biru ☀️.
- **Tema panel**: setiap pengguna memilih sendiri lewat ikon palet 🎨 di kanan atas (atau Profil). Pilihan tersimpan di akunnya, berlaku di semua perangkat, dan langsung tampil saat namanya dipilih di layar login.
- **Tema layar TV**: diatur Admin di Pengaturan › Umum › **Tema**. Berlaku untuk layar kunci, timer, dan notifikasi di semua TV. Tema terang tetap memakai latar gelap di TV supaya nyaman di ruangan redup.
- **Tema bawaan panel**: dipakai untuk pengguna yang belum memilih tema.

## 6. Mematikan TV dari panel kasir

Ada tiga cara: tombol ⏻̸ merah di kartu unit, **Kontrol TV › Matikan TV**, atau **Kontrol Semua TV** di Dashboard. Menu terakhir bisa memilih beberapa TV sekaligus atau semua TV, dan otomatis melewati TV yang sedang dipakai.

Agar TV benar-benar masuk *standby*, aktifkan **sekali** di setiap TV: menu teknisi (OK 7×) › **Izin Matikan TV (Admin Perangkat)** › Aktifkan.
- Jika TV tidak punya menu itu, pakai **Izin Matikan TV via Aksesibilitas** (Android 9+), lalu aktifkan *El Classico — Matikan TV*.
- Atau aktifkan lewat komputer: `adb shell dpm set-active-admin com.elclassico.billing/.AdminReceiver`
- Kalau belum ada izin sama sekali, “Matikan” hanya membuat layar hitam dan redup. Layar kembali menyala saat sewa dimulai, saat tombol Hidupkan ditekan, atau saat ada tombol remote ditekan.

Otomatis (Pengaturan › Umum):
- **Matikan TV otomatis setelah bayar**: TV mati ±6 detik setelah transaksi selesai.
- **Matikan TV kosong otomatis setelah N menit**: menghemat listrik saat sepi.

## 7. Menghidupkan TV dari panel kasir (Wake-on-LAN)

1. Di TV: Pengaturan › Jaringan › aktifkan **Wake on LAN / Wake on WLAN / Networked standby / Hidupkan dengan WiFi** (nama menu berbeda per merek).
2. Alamat MAC TV biasanya terisi otomatis ketika TV tersambung. Jika kosong, lihat di Pengaturan TV › Tentang › Status, lalu isi di Panel › Pengaturan › Unit TV.
3. Tekan tombol ⏻ di kartu unit, atau tombol **Mulai Sewa**, yang juga membangunkan layar.
> Kabel LAN ke TV paling andal untuk WOL. Lewat WiFi, sebagian TV hanya mau bangun dari mode *standby*, bukan dari kondisi mati total.

## 8. Pemakaian harian

| Aksi | Di panel kasir | Yang terjadi di TV |
|---|---|---|
| **Mulai sewa** | Kartu unit → *Mulai Sewa* → pilih paket / menit bebas / Main Bebas | Layar bangun → pindah ke HDMI PS → timer kecil di pojok |
| **Tambah waktu** | *+ Waktu* → paket atau +5/+10/+15… menit | Notifikasi “Waktu ditambah”. Bisa juga **kurangi** waktu |
| **Jeda** | *Jeda* / *Lanjut* | Layar “PERMAINAN DIJEDA”, sisa waktu dibekukan |
| **Sisa 1 menit** | Kartu berkedip oranye + bunyi | Hitung mundur besar 60…1 dengan bunyi |
| **Waktu habis** | Kartu merah + bunyi alarm | Layar “WAKTU HABIS” + total tagihan. PS tertutup |
| **Pesanan F&B** | *Pesan* di kartu, atau menu **Kasir F&B** | Notifikasi “Pesanan diterima” / “Pesanan diantar” |
| **Bayar** | *Bayar* → diskon, metode (Tunai/QRIS/Transfer/E-Wallet), uang diterima → **cetak struk** | Layar kembali “SIAP DIMAINKAN” |
| **Pindah unit** | Detail unit → *Pindah Unit* | Sisa waktu & pesanan ikut pindah |
| **Kontrol TV** | Detail unit → *Kontrol TV* | Volume (slider/±/bisu), HDMI, layar kunci, menu Pengaturan, WiFi, beranda, bunyikan TV, kirim pesan |
| **Pengumuman** | *Pesan ke semua TV* | Kotak pesan muncul di semua TV |

Fitur lain:
- **Laporan**: hari ini, kemarin, 7 hari, bulan ini, atau rentang tanggal sendiri. Berisi grafik pendapatan, pendapatan per unit, menu terlaris, riwayat transaksi, cetak ulang struk, dan ekspor **CSV/Excel**.
- **Timer di TV**: transparansi (20–100%), mode tampil (selalu / muncul sebentar tiap N menit / hanya 5 menit terakhir), posisi (4 pojok), ukuran (kecil/sedang/besar), warna hijau → kuning (≤5 menit) → merah berkedip (≤1 menit), dan hitung mundur besar yang bisa dinyalakan atau dimatikan. Atur di Pengaturan › Umum.
- **Pengaturan**: nama rental, slogan & alamat (tampil di TV dan struk), tarif **per 30 menit dan per 1 jam** untuk tiap tipe PS, paket dengan harga khusus per tipe, unit TV, menu F&B dengan stok, durasi notifikasi, pembulatan harga, dan PIN.
- **Cadangan data**: dibuat otomatis setiap hari (30 hari terakhir). Bisa juga unduh atau pulihkan manual.
- **Aman saat listrik/komputer mati**: sesi tersimpan. Saat server hidup lagi, timer dilanjutkan sesuai jam sebenarnya.

## 9. Batasan teknis yang perlu diketahui

- **Menyalakan TV** dari kondisi mati total hanya bisa lewat Wake-on-LAN, dan hanya kalau TV mendukung serta mengaktifkannya. **Mematikan TV** butuh izin Admin Perangkat atau Aksesibilitas (lihat bagian 5).
- **Pindah HDMI otomatis** memakai jalur resmi Android TV. Di sebagian merek (terutama TV dengan sistem buatan sendiri) cara ini bisa gagal. Kalau gagal, timer tetap berjalan dan input bisa dipindah manual dengan remote.
- **Volume**: yang diatur adalah volume sistem TV. Di hampir semua Android TV, volume ini juga berlaku untuk suara HDMI.
- **Smart TV non-Android** (Tizen/Samsung, webOS/LG) tidak bisa memasang APK. Gunakan mode browser, atau pasang Android TV Box/Google TV Streamer di antara PS dan TV. Box seperti ini juga bisa menjalankan aplikasi billing.

## 10. Kontrol dari luar WiFi rental (opsional)

Pasang **Tailscale** (gratis) di komputer server dan di HP/laptop pemilik. Setelah itu panel kasir bisa dibuka dari mana saja lewat alamat Tailscale komputer server, misalnya `http://100.x.x.x:8080`. TV tetap tersambung lewat WiFi lokal.

## 11. Mengatasi masalah

| Gejala | Solusi |
|---|---|
| TV “Menghubungkan ke server…” terus | Pastikan server menyala dan berada di WiFi yang sama. Cek IP di menu teknisi. Izinkan Node/aplikasi di Firewall Windows (*Allow access* untuk jaringan Private) |
| Panel tidak terbuka dari laptop lain | Firewall komputer server. Windows: izinkan port 8080. Mac: System Preferences › Security › Firewall › izinkan *node* / *El Classico Billing* |
| Timer tidak muncul di atas game | Aktifkan **Aksesibilitas El Classico** (lihat langkah 4.4) |
| Remote tidak bisa membuka pengaturan | Disengaja agar pelanggan tidak mengubah apa pun. Gunakan OK 7× / tahan OK / BACK 5×, atau **Buka Menu Teknisi di TV** dari panel |
| TV tidak pindah ke HDMI | Pilih input lain di menu teknisi, lalu **Tes Pindah ke HDMI** |
| “ID unit … belum terdaftar” di layar TV | Tambahkan unit dengan ID yang sama di Panel › Pengaturan › Unit TV |
| Kasir lupa PIN | Admin/Admin Utama: menu **Pengguna › Ubah › Reset PIN** |
| Admin Utama lupa PIN | Hubungi Admin Utama lain bila ada. Jika tidak: matikan server, hapus bagian `"users"` di `data/db.json` (simpan cadangan dulu), lalu jalankan lagi. Admin Utama baru dibuat dengan PIN `1234` |

---
**El Classico Rental PS Billing v1.5.0** · Server Node.js (tanpa dependensi) · Panel web · Android TV (Kotlin) · Desktop (Electron)
