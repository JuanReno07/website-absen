# 05 — SECURITY REMEDIATION REPORT
**Project:** Website Absen (ASE Duty Attendance System)  
**Tanggal:** 4 November 2026  
**Status:** **SELESAI DI LOKAL (SOURCE CODE & LOCAL REPOSITORY HARDENED)**

---

## 1. Ringkasan Perbaikan Keamanan yang Telah Diterapkan

Seluruh perbaikan teknis pada source code dan repository lokal telah diselesaikan dan diverifikasi dengan `npx tsc --noEmit` (exit code 0) serta `npm run build` (exit code 0):

### A. Stage 2: Repository Hardening & Untracking
- **File:** [`.gitignore`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/.gitignore)
  - Aturan komprehensif untuk mencegah database lokal, file WAL/journal, backup SQL/JSON, uploads pengguna, file env, kredensial (`.pem`, `.key`), dan file log agar tidak masuk ke Git.
- **Git Index Cleanup:**
  - `git rm --cached "prisma/dev.db"`
  - `git rm --cached -r "public/uploads"`
  - Menambahkan `public/uploads/.gitkeep` dan `backups/.gitkeep`.
  - Database lokal (`79.093.760` byte) dan file gambar lokal tetap tersimpan utuh di disk lokal dan backup aman.
- **Environment Template:**
  - Membuat [`.env.example`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/.env.example) yang aman tanpa nilai kredensial sensitif.

### B. Stage 4: Penghapusan Hardcoded Credential dari Source Code
- **File:** [`prisma/turso-setup.ts`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/prisma/turso-setup.ts)
  - Menghapus fallback hardcoded `libsql://website-absen-juanreno07.aws-ap-northeast-1.turso.io`, token JWT read-write Turso, dan password default `REDACTED_ADMIN_PASSWORD`.
  - Skrip sekarang secara ketat membaca `process.env.TURSO_DATABASE_URL`, `process.env.TURSO_AUTH_TOKEN`, dan `process.env.ADMIN_DEFAULT_PASSWORD`.

### C. Stage 5: Perlindungan Upload Pengguna (Magic Bytes & Secure Storage)
- **File:** [`src/lib/storage.ts`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/src/lib/storage.ts)
  - **Magic-Byte Binary Inspection:** Memeriksa byte awal biner gambar (`PNG` `89 50 4E 47`, `JPEG` `FF D8 FF`, `WEBP` `RIFF....WEBP`, `GIF` `GIF87a`/`GIF89a`).
  - **MIME Match Verification:** Memastikan header MIME (`data:image/...`) identik dengan tipe biner hasil inspeksi biner asli.
  - **Header Dimension Extraction:** Membaca lebar dan tinggi gambar langsung dari header biner, membatasi dimensi maksimum `8192 × 8192` piksel untuk mencegah *decompression bomb / pixel flood DoS*.
  - **Anonymized Secure Naming:** Mengganti penamaan file yang menyematkan `userId` menjadi nama acak aman `att-${type}-${crypto.randomUUID()}.${ext}`.

### D. Stage 6: Tinjauan Keamanan Tambahan
- **CSRF & Origin Validation ([`src/middleware.ts`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/src/middleware.ts)):**
  - Mencegah mutasi data HTTP (`POST`, `PUT`, `DELETE`, `PATCH`) jika `Sec-Fetch-Site: cross-site`.
  - Memvalidasi kecocokan host antara `Origin` / `Referer` dengan host server yang sah (`Host`, `X-Forwarded-Host`, `NEXT_PUBLIC_APP_URL`). Permintaan tanpa `Origin` dan tanpa `Referer` pada endpoint `/api/*` diblokir dengan `403 Invalid request origin (CSRF blocked)`.
- **Content Security Policy ([`next.config.mjs`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/next.config.mjs)):**
  - Menghapus `http:` wildcard dari `img-src`.
  - Menambahkan `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`.
- **Trusted Reverse Proxy IP Resolution ([`src/lib/device-parser.ts`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/src/lib/device-parser.ts)):**
  - Mencegah spoofing alamat IP melalui header `x-forwarded-for` palsu. Header proxy hanya dipercaya jika dijalankan di platform terverifikasi (`VERCEL`, `CF-Ray`, atau saat `TRUST_PROXY === 'true'`).
- **Validasi UTF-8 72-Byte Bcrypt ([`register`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/src/app/api/auth/register/route.ts), [`login`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/src/app/api/auth/login/route.ts), [`profile`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/src/app/api/profile/route.ts), [`members`](file:///d:/001.%20Yosafat/Project%20Iseng/REA/Website%20Absen/src/app/api/admin/members/route.ts)):**
  - Mengganti validasi karakter biasa (`password.length > 72`) dengan validasi ukuran byte UTF-8 nyata `Buffer.byteLength(password, 'utf8') > 72` untuk mencegah *bcrypt truncation attack*.
  - Mengotomatisasi penambahan `session_version` saat password diubah sehingga seluruh sesi lama seketika tidak berlaku.

