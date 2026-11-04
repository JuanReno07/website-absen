# 06 — REGRESSION TEST & VALIDATION REPORT
**Project:** Website Absen (ASE Duty Attendance System)  
**Tanggal Pengujian:** 4 November 2026  
**Status Pengujian:** **ALL LOCAL TEST SUITES PASSED (100%)**

---

## 1. Ringkasan Eksekusi Pengujian

| Pengujian / Verifikasi | Perintah / Metode | Hasil | Status |
| :--- | :--- | :--- | :--- |
| **Pemeriksaan Tipe TypeScript** | `npx tsc --noEmit` | `TSC_EXIT_CODE=0`, tidak ada error tipe data | **PASSED** |
| **Produksi Build Next.js** | `npm run build` (`prisma generate && next build`) | `BUILD_EXIT_CODE=0`, 33 rute statis & dinamis ter-compile bersih | **PASSED** |
| **Audit Kerentanan Dependensi** | `npm audit` | Ditemukan advisori publik pada `next@14.2.35` dan dependensi nested (perlu evaluasi upgrade Next 15 secara terencana) | **DOCUMENTED** |
| **Magic-Byte Image Validation** | Uji injeksi biner teks/HTML bertopeng `data:image/png` | File palsu ditolak `null` (400 Bad Request), PNG sah diterima | **PASSED** |
| **Batas Dimensi Biner Gambar** | Ekstraksi header lebar & tinggi biner (`IHDR`, `SOF0`, `VP8X`) | Dimensi > 8192px atau 0px ditolak | **PASSED** |
| **Validasi Batas UTF-8 72-Byte Password** | Pengujian string multi-byte (`Buffer.byteLength > 72`) | Karakter Unicode yang melebihi batas 72 byte terdeteksi dan dibatasi dengan benar | **PASSED** |
| **Verifikasi Indeks Pelacakan Git** | `git ls-files "prisma/*.db"` & `git ls-files "public/uploads/*"` | File biner database dan upload pengguna 100% tidak lagi terlacak | **PASSED** |
| **Integritas Data Lokal Disk** | Ukuran file `prisma/dev.db` dan `public/uploads/*.png` di disk | File lokal tetap `79.093.760` byte dan 14 file gambar tetap utuh di disk | **PASSED** |
| **CSRF & Origin Enforcement** | Pemeriksaan header `Origin` & `Sec-Fetch-Site: cross-site` pada middleware | Permintaan mutasi tanpa `Origin`/`Referer` atau dari origin asing diblokir 403 | **PASSED** |
| **Pencegahan IP Spoofing** | Uji resolusi IP via `getClientIp()` tanpa trusted proxy | Header spoofing `x-forwarded-for` diabaikan, fallback ke `127.0.0.1` | **PASSED** |

---

## 2. Catatan Hasil Build Rute Aplikasi

Build Next.js menghasilkan 33 halaman statis dan dynamic API routes yang seluruhnya valid:
- Rute Admin: `/admin`, `/admin/attendances`, `/admin/audit-logs`, `/admin/members`, `/admin/positions`, `/admin/leaves`, `/admin/settings` (terproteksi `ADMIN`).
- Rute Autentikasi: `/login`, `/register`, `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`.
- Rute Presensi: `/duty-in`, `/duty-out`, `/dashboard`, `/history`, `/leave`, `/reports`, `/daily-report`.
- Rute API Keamanan: Validasi CSRF di `src/middleware.ts` aktif untuk seluruh mutasi `/api/*`.

