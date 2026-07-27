# 🚑 ASE Roleplay - Duty Attendance System

[![Next.js](https://img.shields.io/badge/Next.js-14.2.8-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Turso Cloud](https://img.shields.io/badge/Turso_Cloud-libSQL-44D62C?style=for-the-badge&logo=sqlite)](https://turso.tech/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

Sistem Manajemen Absensi Jam Duty, Pengajuan Izin, dan Rekapitulasi Laporan Anggota berbasis web modern untuk komunitas **ASE Roleplay**. Dirancang khusus dengan tampilan futuristik *Obsidian Crimson*, performa instan **0ms hydration**, serta integrasi **Turso Cloud Database**.

---

## 🌟 Fitur Utama

- ⏱️ **Absensi Duty Real-Time**: Fitur *Duty IN* dan *Duty OUT* dilengkapi unggah screenshot bukti Discord/Game, pengisian posisi/tugas, dan perhitungan durasi otomatis.
- 🎯 **Evaluasi Target Harian 3 Jam**: Perhitungan otomatis status **`Terpenuhi (≥ 3 Jam)`** vs **`Belum Terpenuhi (< 3 Jam)`** per tanggal untuk setiap anggota.
- 🗓️ **Rekapitulasi Jam Duty & Filter Periode**:
  - Filter **Hari Ini**, **Minggu Ini**, **Bulan Ini**, **Semua Waktu**, dan **Pilih Tanggal** (*Custom Date Range*).
  - Tampilan Tab **Rekap Per Tanggal** (*Daily Breakdown*) & **Ringkasan Akumulasi Anggota**.
- 📥 **Ekspor Laporan Excel Lanjutan (.xlsx) & CSV**:
  - Berkas Excel 2 Lembar Kerja (*Sheet 1: Rekap Harian Per Tanggal*, *Sheet 2: Detail Sesi Duty*).
  - Dilengkapi Banner Ringkasan Eksekutif, Pewarnaan Status Target (Hijau/Merah), dan *Zebra Striping*.
- 📋 **Pengajuan & Persetujuan Izin (Leave Request)**: Fitur pengajuan cuti/sakit/halangan OOC dengan bukti foto dan persetujuan Admin.
- 🛡️ **Audit Log Trail**: Pencatatan otomatis setiap aksi penting admin (koreksi absensi, hapus data, ubah jabatan) untuk transparansi sistem.
- 🎨 **Branding & Theme Engine**: Pengaturan nama komunitas, logo 3D interaktif, tagline, dan warna tema langsung melalui Database.
- 💾 **Backup Database Otomatis**: Skrip backup otomatis dari Turso Cloud ke PC lokal dalam format JSON & SQL Dump.

---

## 🛠️ Arsitektur & Teknologi

| Komponen | Teknologi yang Digunakan |
| :--- | :--- |
| **Framework Utama** | Next.js 14 (App Router) |
| **Bahasa Pemrograman** | TypeScript (`.ts`, `.tsx`) |
| **Styling & UI** | Tailwind CSS + Custom CSS Variables & 3D CSS Effects |
| **Ikon & Komponen** | Lucide React Icons (`lucide-react`) |
| **Database Engine** | **Turso Cloud Database** (libSQL / SQLite terdistribusi AWS Tokyo) |
| **ORM Client** | **Prisma ORM (v5.22.0)** dengan `@prisma/adapter-libsql` (HTTPS Fetch Adapter) |
| **Autentikasi** | JWT (`ase_duty_session`) + `localStorage` 0ms Hydration |
| **Mesin Laporan** | ExcelJS (`exceljs`) untuk generator berkas Excel multi-worksheet |
| **Web Hosting** | Vercel Cloud Platform (Serverless Edge Deployment) |

---

## 📁 Struktur Direktori Proyek

```text
website-absen/
├── backups/               # Folder simpanan backup database (JSON & SQL Dump)
├── prisma/
│   └── schema.prisma      # Skema Prisma ORM & Model Database
├── public/                # Asset statis, logo 3D, dan PWA manifest
├── scripts/
│   └── backup-db.ts       # Skrip otomatis backup Turso Cloud DB ke Local PC
├── src/
│   ├── app/               # Routes App Router Next.js (Pages & API Handlers)
│   │   ├── admin/         # Halaman Dashboard Panel Admin & Rekap Laporan
│   │   ├── api/           # API Endpoints (Auth, Duty, Admin, Export, Public)
│   │   ├── dashboard/     # Halaman Utama Dashboard Anggota
│   │   ├── duty-in/       # Halaman Absen Masuk Duty
│   │   ├── duty-out/      # Halaman Absen Keluar Duty
│   │   └── login/         # Halaman Login Pengguna
│   ├── components/        # Komponen UI Reusable (Navbar, AdminSidebar, ThemeScript)
│   └── lib/               # Utility Helper (db.ts, auth.ts, excel.ts, utils.ts)
├── package.json           # Dependensi & NPM Scripts
├── tailwind.config.ts     # Konfigurasi Tailwind CSS
└── tsconfig.json          # Konfigurasi TypeScript
```

---

## 🚀 Panduan Instalasi & Jalankan di Lokal PC

### 1. Prasyarat
Pastikan komputer Anda sudah terinstal:
- **Node.js**: v18.0.0 atau lebih baru
- **Git**: Versi terbaru

### 2. Clone Repositori & Install Dependensi
```bash
git clone https://github.com/JuanReno07/website-absen.git
cd website-absen
npm install
```

### 3. Konfigurasi Environment Variables (`.env`)
Buat berkas `.env` di root direktori proyek dan isi dengan konfigurasi Turso Cloud DB & JWT Secret:

```env
DATABASE_URL="libsql://website-absen-juanreno07.aws-ap-northeast-1.turso.io"
TURSO_AUTH_TOKEN="YOUR_TURSO_AUTH_TOKEN"
JWT_SECRET="ase_roleplay_duty_secret_key_2026_super_secure"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Sinkronkan Skema Database
```bash
npm run db:push
```

### 5. Jalankan Server Development
```bash
npm run dev
```
Buka browser dan kunjungi: **`http://localhost:3000`**

---

## 📜 Perintah Script NPM (`package.json`)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server Next.js lokal pada mode Development. |
| `npm run build` | Melakukan kompilasi & pembuatan *production build* Next.js. |
| `npm run start` | Menjalankan server Next.js pada mode Production. |
| `npm run db:push` | Menyinkronkan skema `schema.prisma` ke Database Turso Cloud. |
| `npm run db:backup` | **Mengunduh backup lengkap Turso Cloud DB ke PC lokal (JSON & SQL format)**. |

---

## 💾 Cara Backup Database Ke PC Lokal

Untuk melakukan backup instan dari **Turso Cloud Database** ke PC lokal Anda kapan saja, jalankan perintah:

```bash
npm run db:backup
```
Hasil backup akan disimpan otomatis di folder `backups/` dalam 2 format:
- `turso_db_backup_[TIMESTAMP].json` (Data JSON terstruktur)
- `turso_db_backup_[TIMESTAMP].sql` (SQL Insert Statement Dump yang siap di-import ke SQLite / DB Browser)

---

## 📄 Lisensi & Hak Cipta

Hak Cipta © 2026 **ASE Roleplay Community**. Seluruh Hak Cipta Dilindungi.
