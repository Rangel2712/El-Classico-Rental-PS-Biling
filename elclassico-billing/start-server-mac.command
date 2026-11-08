#!/bin/bash
# El Classico Rental PS Billing — jalankan server di Mac (klik dua kali file ini)
cd "$(dirname "$0")/server" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js belum terpasang."
  echo "Untuk macOS Catalina (10.15) unduh Node.js 18 LTS: https://nodejs.org/dist/latest-v18.x/"
  echo "Pilih file node-v18.x.x.pkg, pasang, lalu klik dua kali file ini lagi."
  read -n 1 -s -r -p "Tekan tombol apa saja untuk menutup…"; exit 1
fi
# Cegah Mac tidur selama server berjalan
( sleep 2; open "http://localhost:8080" ) &
echo "Server berjalan. Jangan tutup jendela ini selama rental buka."
caffeinate -i node server.js
