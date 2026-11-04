# 04 — SECRET & CREDENTIAL ROTATION REPORT
**Project:** Website Absen (ASE Duty Attendance System)  
**Tanggal Penyusunan:** 4 November 2026  
**Status:** **PROSEDUR SIAP — MENUNGGU EKSEKUSI PEMILIK PADA LAYANAN CLOUD**

> **KEBIJAKAN KEAMANAN:** Laporan ini **tidak mencetak** nilai secret aktif, token JWT, maupun hash password pengguna. Seluruh kredensial prod tidak diubah secara otomatis tanpa persetujuan pemilik untuk menghindari *downtime* produksi.

---

## 1. Inventarisasi Secret yang Terdampak & Status Kompromi

| No | Nama Kredensial / Secret | Lokasi Ditemukan | Layanan Terkait | Status Keamanan | Tindakan Wajib |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `TURSO_AUTH_TOKEN` | Hardcoded di `prisma/turso-setup.ts` (commit `4c58dc4` s/d `HEAD`) & identik dengan `.env` lokal | Database Cloud Turso (`website-absen-juanreno07`) | **COMPROMISED (CRITICAL)** | **Cabut (Invalidate) & Buat Token Baru di Turso CLI / Dashboard** |
| 2 | `JWT_SECRET` | File `.env` pada initial commit `a4f6fd2` & identik dengan `.env` lokal | Autentikasi Sesi Aplikasi Next.js (Cookie `ase_duty_session`) | **COMPROMISED (CRITICAL)** | **Ganti dengan Secret Kriptografis Baru (Min. 64 Byte Hex)** |
| 3 | Password Default Admin (`REDACTED_ADMIN_PASSWORD`) | Hardcoded di `prisma/turso-setup.ts`, `prisma/seed.ts`, `prisma/update-admin-pass.ts`, `scripts/reset-admin-password.ts` | Akun Administrator Aplikasi (`role = ADMIN`) | **COMPROMISED (HIGH)** | **Ganti Password Seluruh Akun Admin & Invalidate Sesi Lama** |
| 4 | Password Seed Member (`REDACTED_SEED_PASSWORD`) | Hardcoded di `prisma/seed.ts` (commit `3a31b2d`) | Akun Member Hasil Seeding Awal | **COMPROMISED (MEDIUM)** | **Wajibkan Reset Password bagi Akun yang Masih Menggunakan Password Default** |
| 5 | Bcrypt Password Hashes (`3` akun di `prisma/dev.db` commit `77419b2`) | File biner `prisma/dev.db` di Git History | Akun Pengguna yang Tercatat pada Juli–Agustus 2026 | **POTENTIALLY EXPOSED (HIGH)** | **Rotasi Password & Naikkan `session_version` di Database** |
| 6 | Discord Webhook URL | Disimpan di tabel `Setting` database (tidak hardcoded di Git) | Integrasi Notifikasi Discord | **POTENTIALLY EXPOSED VIA TURSO TOKEN** | **Regenerasi Webhook URL di Pengaturan Channel Discord** |

---

## 2. Evaluasi Risiko Offline Password Cracking (Bcrypt Hash)

Di dalam `prisma/dev.db` (versi 2,4 MB yang masuk ke GitHub), kolom `password_hash` menggunakan algoritma **bcrypt dengan work factor (cost) = `10`** (`$2a$10$...` / `$2b$10$...`).
- **Ketahanan Kriptografis:** Bcrypt cost `10` memerlukan waktu komputasi sekitar ~60–100 ms per tebakan pada CPU tunggal, namun menggunakan GPU modern dapat diuji dengan kecepatan puluhan ribu hash per detik secara *offline*.
- **Risiko Aktual:** Apabila pengguna menggunakan password pendek, umum, atau sama dengan password yang pernah bocor di tempat lain (*dictionary / credential stuffing*), hash tersebut **rentan dipecahkan secara offline**. Terlebih lagi, password seed admin dan pengguna awal pernah tertulis dalam teks jelas di skrip `prisma/seed.ts` dan `prisma/turso-setup.ts`.
- **Rekomendasi Perlindungan Akun:**
  1. Segera ganti password untuk seluruh akun `ADMIN` dan akun pengguna yang sudah terdaftar sejak Juli/Agustus 2026.
  2. Ketika password diubah melalui endpoint aplikasi yang telah diperbaiki ([`src/app/api/profile/route.ts`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/src/app/api/profile/route.ts) dan [`src/app/api/admin/members/route.ts`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/src/app/api/admin/members/route.ts)), kolom `session_version` kini otomatis bertambah (`increment: 1`) sehingga token sesi lama langsung gugur.

---

## 3. Prosedur Rotasi Bertahap Tanpa Kehilangan Data Produksi

### Langkah 1: Rotasi `TURSO_AUTH_TOKEN` (Database Produksi Turso)
1. Login ke Turso CLI atau Dashboard Turso (`https://app.turso.tech/`):
   ```powershell
   turso auth login
   ```
2. Buat token baru dan sekaligus cabut (*invalidate*) seluruh token lama untuk database `website-absen-juanreno07`:
   ```powershell
   # Mencabut seluruh token lama agar token yang bocor di GitHub tidak bisa dipakai lagi
   turso db tokens invalidate website-absen-juanreno07

   # Membuat token baru untuk produksi
   turso db tokens create website-absen-juanreno07
   ```
3. Salin token baru tersebut (jangan pernah tempel ke dalam file kode `.ts` / `.js`).

### Langkah 2: Buat `JWT_SECRET` Baru yang Kuat
Jalankan perintah berikut di terminal lokal untuk menghasilkan string acak kriptografis 64-byte (128 karakter hex):
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Langkah 3: Perbarui Environment Variables di Vercel & Lokal
1. Buka **Vercel Dashboard → Project `website-absen` → Settings → Environment Variables**.
2. Perbarui nilai berikut untuk environment **Production**, **Preview**, dan **Development**:
   - `TURSO_AUTH_TOKEN` = *(Token baru dari Langkah 1)*
   - `JWT_SECRET` = *(Secret acak baru dari Langkah 2)*
   - `TURSO_DATABASE_URL` = `libsql://website-absen-juanreno07.aws-ap-northeast-1.turso.io`
3. Perbarui juga file `.env` lokal Anda dengan nilai baru tersebut.
4. Lakukan **Redeploy** pada Vercel agar fungsi serverless memuat environment variable terbaru.

### Langkah 4: Verifikasi & Rotasi Password Akun Admin
1. Setelah redeploy selesai, buka halaman `/login` aplikasi produksi.
2. Pastikan seluruh sesi lama otomatis ter-logout (karena `JWT_SECRET` telah berganti).
3. Login sebagai Admin, buka menu **Profil** dan **Manajemen Anggota**, lalu perbarui password akun Admin dengan password kuat yang unik (minimal 12 karakter kombinasi huruf, angka, dan simbol).

