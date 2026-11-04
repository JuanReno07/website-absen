# 03 — GIT HISTORY CLEANUP REPORT
**Project:** Website Absen (ASE Duty Attendance System)  
**Repository:** `https://github.com/JuanReno07/website-absen`  
**Tanggal Penyusunan & Eksekusi:** 4 November 2026  
**Status:** **SELESAI DIEKSEKUSI & DIVERIFIKASI PADA REMOTE GITHUB**

---

## 1. Mengapa Pembersihan Git History Diperlukan?

Menjalankan `git rm --cached` hanya mengeluarkan `prisma/dev.db` dan `public/uploads/*.png` dari commit terbaru (`HEAD`), tetapi objek blob file tersebut masih tersimpan di dalam riwayat `.git/objects/pack` dan dapat diunduh publik melalui commit lama di GitHub.

### Daftar File & Kredensial dalam Riwayat Commit yang Telah Dibersihkan:
1. **`prisma/dev.db`** — Terdapat pada `13` commit historis (`a4f6fd2` s/d `77419b2`).
2. **`public/uploads/*.png`** (`10` file gambar) — Terdapat pada `4` commit historis.
3. **`.env`** — Terdapat pada commit `a4f6fd2` (memuat `JWT_SECRET`).
4. **`prisma/turso-setup.ts`** (versi lama pada commit `4c58dc4` dan `f63fb98` yang memuat hardcoded `TURSO_AUTH_TOKEN` dan password admin).
5. **Skrip Seed/Reset Historis dengan Password Hardcoded**:
   - `prisma/seed.ts` (commit `3a31b2d`)
   - `prisma/update-admin-pass.ts` (commit `1d1a0e8`)
   - `scripts/reset-admin-password.ts` (commit `6a0eb2c`)
   - `scripts/restore-and-secure-cloud.ts` (commit `e8506c7`)

---

## 2. Prosedur Pembersihan yang Telah Diterapkan

Pembersihan commit historis telah dieksekusi dengan metode streaming biner `git fast-export` / `git fast-import`:
1. Menyaring (*drop*) seluruh perintah modifikasi/penambahan file `prisma/dev.db`, `.env`, `public/uploads/*.png`, `prisma/update-admin-pass.ts`, `scripts/reset-admin-password.ts`, dan `scripts/restore-and-secure-cloud.ts` dari seluruh 87 commit.
2. Melakukan sensor (*redaction*) teks otomatis pada setiap blob teks historis untuk menghapus potongan token `TURSO_AUTH_TOKEN` (`eyJhbGciOi...`), `Prokemas100`, dan `password123`.
3. Memperbarui branch `main` lokal dan membersihkan cache reflog serta melakukan garbage collection (`git gc --prune=now --aggressive`).

---

## 3. Hasil Verifikasi Pasca-Pembersihan

Perintah verifikasi telah dijalankan pada branch `main` lokal dan menghasilkan output kosong (`0` hasil):
- `git log main -- "prisma/dev.db"` → **0 hasil (BERSIH)**
- `git log main -- ".env"` → **0 hasil (BERSIH)**
- `git log main -- "public/uploads/*.png"` → **0 hasil (BERSIH)**
- `git log -S "eyJhbGciOiJFZERTQSI" main` → **0 hasil (BERSIH)**
- `git log -S "Prokemas100" main` → **0 hasil (BERSIH)**
- `git log -S "password123" main` → **0 hasil (BERSIH)**

---

## 4. Status Eksekusi Force Push ke GitHub Publik

> **STATUS:** **TELAH BERHASIL DIEKSEKUSI & DIVERIFIKASI SECARA RESMI (4 November 2026)**

Perintah sinkronisasi riwayat bersih telah dijalankan ke remote repository GitHub:
```powershell
git push --force origin main
```

### Hasil Verifikasi Langsung terhadap GitHub Remote API (`https://api.github.com/repos/JuanReno07/website-absen`):
1. **`prisma/dev.db` di GitHub**: `Status 404 (Not Found)`, jumlah commit yang menyentuh file = **`0` commit**.
2. **`.env` di GitHub**: `Status 404 (Not Found)`, jumlah commit yang menyentuh file = **`0` commit**.
3. **`public/uploads/*.png` di GitHub**: Seluruh foto absensi terhapus; direktori `public/uploads/` hanya memuat `['.gitkeep']`, jumlah commit yang menyentuh foto absensi = **`0` commit**.
4. **Token Kredensial Turso & Password Historis**: Seluruh riwayat commit yang memuat string token dan password default telah disensor secara permanen.
5. **Latest Commit di GitHub**: `f24acb0` (`fix(security): untrack sensitive files, harden storage, csrf, proxy ip, and add security remediation docs`).

---

## 5. Panduan Sinkronisasi Ulang untuk Kolaborator (Clone Lama)

Bagi anggota tim atau perangkat lain yang memiliki clone lama dari repository ini, **jangan lakukan `git pull` atau `git merge`** karena akan menggabungkan kembali commit lama yang berisi database dan secret. Ikuti langkah berikut:

```powershell
# Opsi 1: Clone ulang dari awal (Paling Direkomendasikan)
git clone https://github.com/JuanReno07/website-absen.git

# Opsi 2: Reset keras pada clone yang sudah ada (setelah mem-backup .env lokal)
Copy-Item .env ..\env_backup_sementara
git fetch origin
git checkout main
git reset --hard origin/main
git reflog expire --expire=now --all
git gc --prune=now --aggressive
Copy-Item ..\env_backup_sementara .env
```
