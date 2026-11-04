# 01 — INCIDENT INVESTIGATION REPORT
**Project:** Website Absen (ASE Duty Attendance System)  
**Repository:** `https://github.com/JuanReno07/website-absen`  
**Status Repository:** `PUBLIC` (`visibility: public`, `private: false`)  
**Tanggal Investigasi:** 4 November 2026  
**Klasifikasi Insiden:** **CONFIRMED PUBLIC DATA & CREDENTIAL EXPOSURE (HIGH / CRITICAL)**

---

## 1. Ringkasan Eksekutif

Investigasi forensik terhadap repository lokal dan riwayat Git publik (`https://github.com/JuanReno07/website-absen`, total `86` commit pada branch `main`, `0` tag) mengonfirmasi bahwa sebagian file sensitif yang ditemukan di dalam arsip ZIP **benar-benar pernah dilacak dan dipublikasikan** ke GitHub publik, sementara sebagian lainnya hanya berada di disk lokal (tidak pernah masuk Git).

### Temuan Utama yang Terkonfirmasi Masuk ke GitHub Publik:
1. **Database SQLite (`prisma/dev.db`)**:
   - Masih terlacak aktif di `HEAD` (`git ls-files`) pada commit `77419b2` dengan ukuran blob Git **`2.396.160` byte (~2,4 MB)** (`SHA-1: 98e7974963aa3923a038055cd270b398ea96d693`).
   - Tercatat dalam **`13` commit** sejak initial commit `a4f6fd2` (23 Juli 2026) hingga `77419b2` (7 Agustus 2026).
   - Berisi tabel `User` (`3` akun dengan bcrypt password hash), `Attendance` (`2` rekaman absensi dengan bukti gambar Base64), `UserReport` (`3` laporan), dan `AuditLog` (`17` log aktivitas beserta metadata perangkat/IP).
   - *Catatan Penting:* Salinan `prisma/dev.db` di disk lokal saat ini berukuran **`79.093.760` byte (~79 MB)** (berisi `23` User, `430` Attendance, `32` LeaveRequest, `164` UserSession, `215` AuditLog). Versi 79 MB ini berstatus *modified untracked/unstaged* sejak Agustus 2026 dan **belum pernah** di-push ke GitHub, namun versi 2,4 MB sudah terekspos di GitHub publik.
2. **Foto Absensi & Aset Upload (`public/uploads/*.png`)**:
   - Sebanyak **`10` file gambar PNG** masih terlacak aktif di `HEAD` (`git ls-files`) dan tersimpan dalam **`4` commit** (`a4f6fd2`, `9d47090`, `c84a0bf`, `d35f721`).
   - Terdiri dari `6` file bukti absensi (`attendance-...-duty-in.png` / `duty-out.png`) yang memuat ID unik pengguna pada nama file dan `4` file `brand-logo-...png`.
   - Empat (`4`) file tambahan di disk lokal (`brand-logo-cmu3pvmpf...` tertanggal 23 Oktober 2026) **tidak pernah** masuk ke Git.
3. **Kredensial Produksi Turso (`prisma/turso-setup.ts`)**:
   - File `prisma/turso-setup.ts` (masuk sejak commit `4c58dc4` pada 24 Juli 2026 dan masih ada di `HEAD`) menyimpan **hardcoded `TURSO_DATABASE_URL`** dan **`TURSO_AUTH_TOKEN` (JWT akses read-write `"a": "rw"`)**.
   - Verifikasi silang membuktikan bahwa token yang hardcoded di `prisma/turso-setup.ts` **100% identik** dengan `TURSO_AUTH_TOKEN` aktif di file `.env` lokal saat ini. Artinya, **siapa pun yang mengakses repository GitHub publik memiliki akses baca-tulis penuh ke database cloud produksi Turso**.
4. **File `.env` pada Commit Awal (`a4f6fd2`)**:
   - File `.env` (`152` byte) pernah di-commit pada initial commit `a4f6fd2` (23 Juli 2026) dan dihapus pada commit `4c58dc4` (24 Juli 2026).
   - Di dalam riwayat commit `a4f6fd2`, file `.env` tersebut memuat nilai `JWT_SECRET` (48 karakter), `DATABASE_URL="file:./dev.db"`, dan `NEXT_PUBLIC_APP_URL`. Nilai `JWT_SECRET` tersebut **masih digunakan aktif** di `.env` lokal hingga saat investigasi.
5. **Password Default Admin & Seed (`REDACTED_ADMIN_PASSWORD` & `REDACTED_SEED_PASSWORD`)**:
   - Terekspos dalam teks jelas (*plaintext*) pada `prisma/turso-setup.ts`, `prisma/seed.ts`, `prisma/update-admin-pass.ts`, `scripts/reset-admin-password.ts`, dan `scripts/restore-and-secure-cloud.ts` di riwayat commit Git.

### File di Arsip ZIP yang Terbukti TIDAK Pernah Masuk ke GitHub:
- **Folder `backups/**` (`39` file database/JSON backup, total ~56 MB)**: Tidak pernah dilacak di `HEAD` maupun di seluruh `86` commit Git history (`0` commit).
- **File `.env.local` (`195` byte)**: Tidak pernah dilacak di `HEAD` maupun di Git history (`0` commit).

---

## 2. Mengapa `.gitignore` Sebelumnya Gagal Mencegah Kebocoran?

Pada saat initial commit `a4f6fd2` (23 Juli 2026), file `.gitignore` hanya berisi aturan bawaan Next.js (`.env*.local`, `/node_modules`, `/.next/`) tanpa mengabaikan `.env`, `*.db`, maupun `/public/uploads/*`.  
Meskipun aturan `*.db` dan `/public/uploads/*` kemudian ditambahkan ke `.gitignore` pada commit `f63fb98`, di dalam Git **aturan `.gitignore` tidak berlaku untuk file yang sudah terlanjur masuk ke dalam index Git (`git ls-files`)** sebelum `git rm --cached` dijalankan. Akibatnya, `prisma/dev.db` dan `10` file di `public/uploads/` tetap terus terlacak di repository publik.

---

## 3. Inventarisasi File Sensitif (Tanpa Menampilkan Data Pribadi / Secret)

| No | Lokasi File / Pola | Ukuran (Disk Lokal) | Ukuran di Git `HEAD` | Status di `git ls-files` (Sebelum Cleanup) | Jumlah Commit di Git History | Rentang Commit (Pertama → Terakhir) | Kategori Risiko |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `prisma/dev.db` | `79.093.760` B (~79 MB) | `2.396.160` B (~2,4 MB) | **TERLACAK (`HEAD`)** | `13` commit | `a4f6fd2` → `77419b2` | **CRITICAL** (Database Asli, Hash Password, Bukti Absensi, Log IP) |
| 2 | `prisma/turso-setup.ts` | `10.827` B | `10.827` B | **TERLACAK (`HEAD`)** | `2` commit | `4c58dc4` → `f63fb98` | **CRITICAL** (Hardcoded `TURSO_AUTH_TOKEN` Read-Write Produksi & Password Admin) |
| 3 | `.env` | `1.252` B | Tidak ada di `HEAD` | Tidak terlacak di `HEAD` | `2` commit (tambah & hapus) | `a4f6fd2` → `4c58dc4` | **CRITICAL** (`JWT_SECRET` Aktif Terekspos di Commit `a4f6fd2`) |
| 4 | `public/uploads/attendance-brand-20260723050529-duty-in.png` | `630.780` B | `630.780` B | **TERLACAK (`HEAD`)** | `1` commit | `a4f6fd2` | **HIGH** (Foto Bukti Absensi) |
| 5 | `public/uploads/attendance-[REDACTED_ID_1]-20260723051430-duty-in.png` | `11.151` B | `11.151` B | **TERLACAK (`HEAD`)** | `1` commit | `a4f6fd2` | **HIGH** (Foto Bukti Absensi Pengguna + User CUID) |
| 6 | `public/uploads/attendance-[REDACTED_ID_2]-20260723043108-duty-out.png` | `36.732` B | `36.732` B | **TERLACAK (`HEAD`)** | `1` commit | `a4f6fd2` | **HIGH** (Foto Bukti Absensi Pengguna + User CUID) |
| 7 | `public/uploads/attendance-[REDACTED_ID_2]-20260723043328-duty-out.png` | `11.844` B | `11.844` B | **TERLACAK (`HEAD`)** | `1` commit | `a4f6fd2` | **HIGH** (Foto Bukti Absensi Pengguna + User CUID) |
| 8 | `public/uploads/attendance-[REDACTED_ID_2]-20260723054349-duty-in.png` | `38.551` B | `38.551` B | **TERLACAK (`HEAD`)** | `1` commit | `a4f6fd2` | **HIGH** (Foto Bukti Absensi Pengguna + User CUID) |
| 9 | `public/uploads/attendance-[REDACTED_ID_2]-20260723054424-duty-out.png` | `38.551` B | `38.551` B | **TERLACAK (`HEAD`)** | `1` commit | `a4f6fd2` | **HIGH** (Foto Bukti Absensi Pengguna + User CUID) |
| 10 | `public/uploads/brand-logo-[REDACTED_ID_1]-1784788213915.png` | `1.065.404` B | `1.065.404` B | **TERLACAK (`HEAD`)** | `1` commit | `9d47090` | **MEDIUM** (File Upload + User CUID) |
| 11 | `public/uploads/brand-logo-[REDACTED_ID_1]-1784788225014.png` | `1.065.404` B | `1.065.404` B | **TERLACAK (`HEAD`)** | `1` commit | `9d47090` | **MEDIUM** (File Upload + User CUID) |
| 12 | `public/uploads/brand-logo-[REDACTED_ID_3]-1784791823003.png` | `1.065.404` B | `1.065.404` B | **TERLACAK (`HEAD`)** | `1` commit | `c84a0bf` | **MEDIUM** (File Upload + User CUID) |
| 13 | `public/uploads/brand-logo-[REDACTED_ID_3]-1784792331221.png` | `1.065.404` B | `1.065.404` B | **TERLACAK (`HEAD`)** | `1` commit | `d35f721` | **MEDIUM** (File Upload + User CUID) |
| 14 | `prisma/seed.ts`, `prisma/update-admin-pass.ts`, `scripts/reset-admin-password.ts`, `scripts/restore-and-secure-cloud.ts` | Bervariasi | Dihapus / Diubah di `HEAD` | Sebagian dihapus di `da453d9` | `6` commit | `3a31b2d` → `da453d9` | **HIGH** (Riwayat Hardcoded Password Admin di Git History) |
| 15 | `public/uploads/brand-logo-[REDACTED_ID_4]-*.png` (`4` file baru) | `4 × 1.065.404` B | `0` B | Tidak pernah terlacak | `0` commit | — | **LOW** (Hanya di Disk Lokal) |
| 16 | `backups/**` (`39` file `.db` & `.json`) | `~56.200.000` B | `0` B | Tidak pernah terlacak | `0` commit | — | **LOW** (Hanya di Disk Lokal, wajib dijaga di `.gitignore`) |
| 17 | `.env.local` | `195` B | `0` B | Tidak pernah terlacak | `0` commit | — | **LOW** (Hanya di Disk Lokal) |
| 18 | `*.sqlite`, `*.sqlite3`, `*.sql`, `*.dump`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.log` | Tidak ditemukan | `0` B | Tidak pernah terlacak | `0` commit | — | **SAFE** (Sudah ditambahkan ke `.gitignore`) |

---

## 4. Analisis Dampak & Data Pribadi (PII) yang Terdampak

Tanpa menampilkan isi data pribadi sesuai kebijakan privasi dan keamanan:
1. **Dampak Langsung dari `prisma/dev.db` (Versi 2,4 MB di Git History)**:
   - Mengekspos `3` catatan akun pada tabel `User` (mencakup kolom `username`, `password_hash` bcrypt cost 10, `discord_name`, `ooc_name`, `steam_hex`, `role`).
   - Mengekspos `2` catatan absensi pada tabel `Attendance` (termasuk bukti screenshot yang disematkan dan catatan duty).
   - Mengekspos `17` catatan `AuditLog` (mencakup alamat IP dan metadata `user_agent`).
2. **Dampak Kritis dari Kebocoran `TURSO_AUTH_TOKEN` di `prisma/turso-setup.ts`**:
   - Karena `TURSO_AUTH_TOKEN` berstatus *read-write* (`"a": "rw"`) untuk `libsql://website-absen-juanreno07.aws-ap-northeast-1.turso.io` terekspos secara publik di `prisma/turso-setup.ts`, **seluruh data produksi di database cloud Turso** harus dianggap berpotensi diakses oleh pihak ketiga tanpa otorisasi sampai token tersebut dirotasi/dicabut.
3. **Dampak Kritis dari Kebocoran `JWT_SECRET` di Commit `a4f6fd2`**:
   - Penyerang yang membaca commit `a4f6fd2` dapat menandatangani token JWT palsu (`HS256`) untuk akun `ADMIN` mana pun selama `JWT_SECRET` belum diganti di environment produksi.

