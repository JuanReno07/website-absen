# 02 — REPOSITORY CLEANUP REPORT
**Project:** Website Absen (ASE Duty Attendance System)  
**Tanggal Eksekusi Lokal:** 4 November 2026  
**Status:** **SELESAI DI LOKAL (MENUNGGU PERSETUJUAN PEMILIK UNTUK PUSH)**

---

## 1. Backup Lokal Sebelum Remediation

Sebelum perubahan apa pun dilakukan pada index Git maupun kode sumber, salinan cadangan lengkap telah diamankan di luar direktori repository Git pada lokasi lokal non-publik:
- **Lokasi Backup Aman:** `d:\001. Yosafat\Project Iseng\REA\SAFE_LOCAL_BACKUP_BEFORE_REMEDIATION\`
- **Isi Backup yang Diverifikasi:**
  - `.git_backup/` (Salinan utuh seluruh objek, ref, dan riwayat commit Git sebelum perubahan)
  - `dev.db` (`79.093.760` byte — database lokal utuh)
  - `.env` (`1.252` byte) dan `.env.local` (`195` byte)
  - `uploads_backup/` (`14` file gambar `.png` utuh)

---

## 2. Perbaikan `.gitignore`

File [`.gitignore`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/.gitignore) telah diperbarui secara menyeluruh agar mencakup seluruh kategori file sensitif yang dipersyaratkan:

- **Environment & Secrets:** `.env`, `.env.*`, `.env*.local` (dengan pengecualian `!.env.example` untuk template kosong yang aman).
- **Database Lokal & Wal/Journal:** `prisma/*.db`, `prisma/*.db-*`, `*.db`, `*.db-journal`, `*.db-shm`, `*.db-wal`, `*.sqlite`, `*.sqlite3`.
- **Database Dump & Backup:** `*.sql`, `*.dump`, `*.bak`, `/backups/*` (dengan pengecualian `!/backups/.gitkeep`), `*backup*.db`, `*backup*.json`.
- **Foto Absensi & Upload Pengguna:** `/public/uploads/*` (dengan pengecualian `!/public/uploads/.gitkeep`).
- **Kredensial & Kunci Kriptografi:** `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.crt`, `*.cer`, `*.der`.
- **File Log & Temporary:** `*.log`, `logs/`, `tmp/`, `temp/`, `*.tmp`, `*.swp`, `.vercel`.

Selain itu, file template [`.env.example`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/.env.example) telah dibuat tanpa menyertakan nilai kredensial asli agar developer baru tetap dapat mengonfigurasi aplikasi dengan mudah.

---

## 3. Penghapusan Pelacakan Git (`git rm --cached`) Tanpa Menghapus Data Disk

Perintah berikut telah dijalankan pada repository lokal:

```powershell
git rm --cached "prisma/dev.db"
git rm --cached -r "public/uploads"
git add "public/uploads/.gitkeep" "backups/.gitkeep" ".env.example"
```

### Hasil Verifikasi Pasca-Eksekusi:
1. **File di Disk Lokal Tetap Utuh:**
   - `prisma/dev.db` (`79.093.760` byte) **tetap ada** di disk lokal aplikasi.
   - Seluruh `14` file gambar di `public/uploads/` **tetap ada** di disk lokal aplikasi.
   - Database produksi Turso **sama sekali tidak disentuh/dihapus**.
2. **Status Pelacakan Git (`git ls-files`):**
   - `git ls-files "prisma/*.db"` → **Kosong (0 file)**
   - `git ls-files "public/uploads/*"` → Hanya `public/uploads/.gitkeep`
   - `git ls-files "backups/*"` → Hanya `backups/.gitkeep`

---

## 4. Pembersihan Hardcoded Credential dari Source Code Aktif

File [`prisma/turso-setup.ts`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/prisma/turso-setup.ts) sebelumnya memiliki fallback hardcoded:
- URL database produksi Turso
- Token JWT autentikasi Turso (`TURSO_AUTH_TOKEN`)
- Password default admin (`REDACTED_ADMIN_PASSWORD`)

Ketiga nilai hardcoded tersebut telah **dihapus seluruhnya** dari [`prisma/turso-setup.ts`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/prisma/turso-setup.ts). Kini skrip tersebut mewajibkan variabel environment `process.env.TURSO_DATABASE_URL`, `process.env.TURSO_AUTH_TOKEN`, dan `process.env.ADMIN_DEFAULT_PASSWORD` serta langsung menghentikan eksekusi (`process.exit(1)`) apabila variabel environment belum disetel.

