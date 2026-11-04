# 03 — GIT HISTORY CLEANUP REPORT
**Project:** Website Absen (ASE Duty Attendance System)  
**Repository:** `https://github.com/JuanReno07/website-absen`  
**Tanggal Penyusunan:** 4 November 2026

---

## 1. Mengapa Pembersihan Git History Diperlukan?

Menjalankan `git rm --cached` hanya mengeluarkan `prisma/dev.db` dan `public/uploads/*.png` dari commit terbaru (`HEAD`), tetapi objek blob file tersebut **masih tersimpan di dalam riwayat `.git/objects/pack`** dan dapat diunduh publik melalui commit lama di GitHub.

### Daftar File & Kredensial dalam Riwayat Commit yang Wajib Dibersihkan:
1. **`prisma/dev.db`** — Terdapat pada `13` commit (`a4f6fd2`, `5abbe37`, `fbb4490`, `f8ef8e1`, `9d47090`, `dfca461`, `c84a0bf`, `d35f721`, `1d1a0e8`, `65292cd`, `10eaefb`, `9e7a8d4`, `77419b2`).
2. **`public/uploads/*.png`** (`10` file gambar) — Terdapat pada `4` commit (`a4f6fd2`, `9d47090`, `c84a0bf`, `d35f721`).
3. **`.env`** — Terdapat pada commit `a4f6fd2` (memuat `JWT_SECRET`).
4. **`prisma/turso-setup.ts`** (versi lama pada commit `4c58dc4` dan `f63fb98` yang memuat hardcoded `TURSO_AUTH_TOKEN` dan password admin).
5. **Skrip Seed/Reset Historis dengan Password Hardcoded**:
   - `prisma/seed.ts` (commit `3a31b2d`)
   - `prisma/update-admin-pass.ts` (commit `1d1a0e8`)
   - `scripts/reset-admin-password.ts` (commit `6a0eb2c`)
   - `scripts/restore-and-secure-cloud.ts` (commit `e8506c7`)

---

## 2. Prosedur Pembersihan Git History (Siap Dieksekusi Lokal)

Sesuai instruksi pemilik (*"jangan langsung push ke cloud, kalo mau eksekusi yang di lokal saja"*), backup penuh `.git` telah disimpan di `d:\001. Yosafat\Project Iseng\REA\SAFE_LOCAL_BACKUP_BEFORE_REMEDIATION\.git_backup`.

### Metode A: Menggunakan `git-filter-repo` (Direkomendasikan oleh Git Proyek Resmi)

1. **Instalasi `git-filter-repo`** (jika belum terpasang):
   ```powershell
   pip install git-filter-repo
   ```
2. **Siapkan file `expressions.txt` (di luar repo) untuk menyensor string kredensial historis di seluruh commit:**
   ```text
   regex:REDACTED_TURSO_AUTH_TOKEN[A-Za-z0-9._-]+==>[REDACTED_TURSO_AUTH_TOKEN]
   literal:REDACTED_ADMIN_PASSWORD==>[REDACTED_HISTORICAL_PASSWORD]
   ```
3. **Jalankan `git filter-repo` pada salinan repository untuk menghapus seluruh blob sensitif & menyensor token di setiap commit:**
   ```powershell
   git filter-repo `
     --invert-paths `
     --path prisma/dev.db `
     --path .env `
     --path-glob "public/uploads/*.png" `
     --path prisma/update-admin-pass.ts `
     --path scripts/reset-admin-password.ts `
     --path scripts/restore-and-secure-cloud.ts `
     --force

   git filter-repo --replace-text ..\expressions.txt --force
   ```

### Metode B: Menggunakan `git filter-branch` Bawaan Git (Tanpa Dependensi Eksternal)

Jika `git-filter-repo` tidak tersedia di mesin lokal, perintah bawaan Git berikut menghapus seluruh file sensitif dari seluruh `86` commit:

```powershell
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch prisma/dev.db .env public/uploads/*.png prisma/turso-setup.ts prisma/update-admin-pass.ts scripts/reset-admin-password.ts scripts/restore-and-secure-cloud.ts" `
  --prune-empty --tag-name-filter cat -- --all

Remove-Item -Recurse -Force .git/refs/original/ -ErrorAction SilentlyContinue
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```
*(Setelah itu, versi terbaru `prisma/turso-setup.ts` yang sudah bersih dari hardcoded secret ditambahkan kembali pada commit terbaru).*

---

## 3. Verifikasi Pasca-Pembersihan History

Sebelum melakukan `git push --force`, jalankan perintah verifikasi berikut dan pastikan seluruhnya menghasilkan output kosong (`0` hasil):

```powershell
# 1. Pastikan tidak ada lagi prisma/dev.db di seluruh riwayat commit
git log --all --full-history -- "prisma/dev.db"

# 2. Pastikan tidak ada lagi file gambar di public/uploads/*.png di seluruh riwayat commit
git log --all --full-history -- "public/uploads/*.png"

# 3. Pastikan tidak ada lagi file .env di seluruh riwayat commit
git log --all --full-history -- ".env"

# 4. Pastikan tidak ada lagi potongan token Turso di seluruh riwayat commit
git log -S "REDACTED_TURSO_AUTH_TOKEN" --oneline --all
```

---

## 4. Prosedur Force Push (HANYA Setelah Persetujuan Eksplisit Pemilik)

> **PERINGATAN:** `git push --force` akan menulis ulang SHA commit pada branch `main` di GitHub. Jangan jalankan sebelum Anda menyetujui perubahan ini dan siap merotasi secret produksi.

```powershell
git remote add origin https://github.com/JuanReno07/website-absen.git
git push origin --force --all
git push origin --force --tags
```

---

## 5. Panduan Sinkronisasi Ulang untuk Kolaborator (Clone Lama)

Bagi anggota tim atau perangkat lain yang memiliki clone lama dari repository ini, **jangan lakukan `git pull` atau `git merge`** karena akan menggabungkan kembali commit lama yang berisi database dan secret. Ikuti langkah berikut:

```powershell
# Opsi 1: Clone ulang dari awal (Paling Aman)
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

