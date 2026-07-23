# 🚓 ASE Roleplay - Duty IN & Duty OUT Attendance System

Modern, responsive, and automated **Duty IN & Duty OUT** attendance web application built for **ASE ROLEPLAY (ASE GROUP)**.

---

## 🔑 Kredensial Akun Pengujian (Demo Accounts)

### 1. Akun Admin / Pentadbir
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `ADMIN` (Akses penuh seluruh fitur admin & branding)

### 2. Akun Anggota Member
- **Username**: `officer1`
- **Password**: `password123`
- **Jabatan**: Sergeant
- **Discord Name**: `AlexRider#1234`
- **Steam Hex**: `11000014a5b6c7d`

- **Username**: `officer2`
- **Password**: `password123`
- **Jabatan**: Officer

- **Username**: `chief1`
- **Password**: `password123`
- **Jabatan**: Deputy Chief

---

## ⚡ Fitur Utama System

1. **Auto Identity Lock**:
   - Anggota login 1x. Setelah login, sistem otomatis mengenali Nama Discord, Jabatan, Nama OOC, dan Steam Hex ID.
   - Anggota **TIDAK PERLU** mengetik identitas ulang setiap kali melakukan absensi.

2. **Absensi Instan 3 Langkah (Duty IN / Duty OUT)**:
   - Waktu otomatis dari Server (`Asia/Jakarta`).
   - **Paste Screenshot (Ctrl + V)**: Tempel screenshot langsung dari clipboard tanpa perlu browse file manual.
   - **Drag & Drop**: Tarik berkas gambar langsung ke area upload.
   - **Upload Mobile**: File picker / Galeri / Kamera HP.
   - **PWA Web Share Target**: Share screenshot dari galeri HP langsung ke aplikasi web absensi.

3. **Real-time Live Ticker**:
   - Menghitung durasi duty secara presisi dalam jam, menit, dan detik.
   - Perhitungan durasi aman untuk duty yang melewati tengah malam (overnight shift).

4. **Pencegahan Duty Ganda**:
   - 1 Akun hanya bisa memiliki 1 duty aktif secara bersamaan.

5. **Panel Pentadbir / Admin**:
   - **Live Duty Monitor**: Pantau anggota yang sedang duty secara real-time.
   - **Manajemen Anggota & Jabatan**: Tambah, edit, nonaktifkan akun, serta reset password.
   - **Koreksi Absensi & Admin Note**: Edit waktu atau batalkan absensi salah dengan kewajiban memberikan catatan admin.
   - **Ekspor Laporan**: Unduh berkas laporan format Excel (`.xlsx`) & CSV.
   - **Audit Log Trail**: Rekam jejak seluruh aktivitas admin demi transparansi data.
   - **Kustomisasi Branding**: Atur nama perusahaan, logo, skema warna, tema (Branded, Dark, Light), dan aturan wajib screenshot.

---

## 🛠️ Panduan Instalasi & Menjalankan Lokal

```bash
# 1. Install seluruh dependensi
npm install

# 2. Sinkronkan schema database SQLite
npx prisma db push

# 3. Seed data dummy (Admin, 10 Member, Jabatan, & Riwayat Duty)
npx ts-node prisma/seed.ts

# 4. Jalankan dev server lokal
npm run dev
```

Buka browser di: `http://localhost:3000`

---

## 📁 Struktur Folder Proyek

```
Website Absen/
├── Logo/
│   └── TRANSPARENT_ASERP_BLACK_HORIZONTAL.png
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── uploads/
│   ├── manifest.json
│   └── sw.js
└── src/
    ├── app/
    │   ├── api/          # REST API Endpoints (Auth, Duty, Admin, Export)
    │   ├── login/        # Halaman Login
    │   ├── register/     # Halaman Registrasi / Aktivasi
    │   ├── dashboard/    # Dashboard Anggota
    │   ├── duty-in/      # Halaman Duty IN
    │   ├── duty-out/     # Halaman Duty OUT
    │   ├── history/      # Halaman Riwayat Duty Pribadi
    │   ├── profile/      # Halaman Profil Anggota
    │   └── admin/        # Panel Admin & Branding
    ├── components/       # Component Library (Navbar, DutyTimer, Upload, Modals)
    ├── lib/              # Core Libraries (Auth, DB, Storage, Excel, Utils)
    └── types/
```

---

&copy; 2026 **ASE ROLEPLAY &bull; ASE GROUP**. All rights reserved.
