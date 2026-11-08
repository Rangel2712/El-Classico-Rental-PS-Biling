@echo off
title El Classico Rental PS Billing - Server
cd /d "%~dp0server"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum terpasang. Unduh versi LTS di https://nodejs.org lalu jalankan file ini lagi.
  pause
  exit /b 1
)
start "" http://localhost:8080
echo Server berjalan. Jangan tutup jendela ini selama rental buka.
node server.js
pause
