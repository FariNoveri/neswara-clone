![](https://i.imgur.com/L7O0G1w.gif)

# 🗞️ NESWARA - Portal Berita Online

> *Proyek ini dibuat dengan penuh cinta oleh **Fari Noveri** dan dipersembahkan untuk **Illyasviel von Einzbern** - sosok yang selalu menginspirasi setiap baris kode yang ditulis.*

## 📖 Tentang Proyek Ini

NESWARA adalah portal berita online modern yang dibangun pakai React dan Firebase. Ini adalah tugas magang pertama di PT Microdata yang dikerjakan dengan sepenuh hati. Proyek ini nggak cuma sekadar aplikasi biasa, tapi juga wadah belajar buat memahami gimana cara bikin sistem berita yang interaktif dan mendekati aplikasi nyata.

Kenapa namanya NESWARA? Karena Fari Noveri pengen bikin sesuatu yang bermakna, dan setiap kali ngoding, selalu kepikiran sama Illyasviel von Einzbern yang jadi motivasi terbesar.

## ✨ Fitur-Fitur Utama

- **📰 Baca Berita Real-time** - Update berita langsung tanpa perlu refresh
- **🔔 Notifikasi & Trending** - Tau berita terbaru dan yang lagi hot
- **👥 Dashboard Admin** - Kelola user dan konten berita
- **💬 Sistem Komentar** - Diskusi sama pembaca lain
- **📌 Bookmark Berita** - Simpan artikel favorit
- **🔐 Autentikasi User** - Login/register yang aman
- **📊 Statistik Visual** - Lihat data dalam bentuk chart keren

## 🛠️ Teknologi yang Dipakai

| Teknologi | Fungsinya Apa Sih? |
|-----------|-------------------|
| **React + Vite** | Bikin tampilan frontend yang cepat dan responsif |
| **Firebase** | Ngurus login user dan nyimpan data |
| **Express.js** | Backend API buat handling request |
| **TailwindCSS** | Bikin tampilan cantik tanpa ribet CSS |
| **React Router DOM** | Navigasi antar halaman |
| **Chart.js** | Tampilin statistik dalam bentuk grafik |
| **Chalk + Chalk Animation** | CLI yang colorful dan menarik |
| **Chokidar** | Pantau perubahan file otomatis |
| **React Toastify** | Notifikasi pop-up yang smooth |
| **Lucide React** | Icon-icon yang ringan dan bagus |
| **Framer Motion** | Animasi transisi yang halus |

## 🚀 Cara Install (Buat Pemula)

### Langkah 1: Persiapan
Pastikan udah install dulu:
- **Node.js** (minimal versi 18) - Download di [nodejs.org](https://nodejs.org)
- **Git** - Download di [git-scm.com](https://git-scm.com)

### Langkah 2: Clone Proyek
Buka terminal/command prompt, terus ketik:
```bash
git clone https://github.com/FariNoveri/neswara-clone.git
cd neswara-clone
```

### Langkah 3: Install Dependencies
```bash
npm install
```
*Tunggu bentar ya, lagi download semua library yang dibutuhin*

### Langkah 4: Setup Firebase
1. Bikin file `.env` di folder utama
2. Isi dengan konfigurasi Firebase kamu:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### Langkah 5: Jalankan Aplikasi
```bash
npm run dev
```

**Boom!** 🎉 Aplikasi bakal jalan di tiga mode sekaligus:
- 🟡 **Watcher** → Pantau perubahan file
- 🟢 **Backend** → Server API jalan di background
- 🔵 **Frontend** → Buka browser ke `localhost:5173`

## 📁 Struktur Folder & File (Dijelasin Detail)

```
📁 neswara-clone/
│
├── 📄 dev.js                 # File utama buat jalanin semua service
├── 📄 server.js              # Backend API Express.js
├── 📄 watcher.js             # File pemantau perubahan (CLI colorful)
├── 📄 package.json           # Daftar dependency dan script npm
├── 📄 .env                   # Konfigurasi rahasia Firebase
│
├── 📁 public/                # File statis yang bisa diakses publik
│   └── 📄 fallback.jpg       # Gambar default kalo foto berita error
│
├── 📁 src/                   # Source code utama aplikasi
│   ├── 📄 App.jsx            # Komponen React utama (root component)
│   ├── 📄 main.jsx           # Entry point React, tempat render App
│   ├── 📄 firebaseconfig.js  # Konfigurasi koneksi ke Firebase
│   ├── 📄 cors.json          # Whitelist domain yang boleh akses API
│   │
│   ├── 📁 assets/            # Gambar, logo, dan file media
│   │   ├── 📄 logo.svg       # Logo NESWARA
│   │   └── 📄 images/        # Folder gambar pendukung
│   │
│   └── 📁 component/         # Semua komponen React
│       ├── 📁 admin/         # Komponen khusus admin
│       │   ├── 📄 Dashboard.jsx      # Halaman utama admin
│       │   ├── 📄 ManageNews.jsx     # Kelola berita (CRUD)
│       │   ├── 📄 ManageUsers.jsx    # Kelola user
│       │   └── 📄 Analytics.jsx      # Statistik & chart
│       │
│       ├── 📁 auth/          # Komponen autentikasi
│       │   ├── 📄 Login.jsx          # Form login
│       │   ├── 📄 Register.jsx       # Form registrasi
│       │   ├── 📄 ForgotPassword.jsx # Reset password
│       │   └── 📄 ProtectedRoute.jsx # Proteksi halaman tertentu
│       │
│       ├── 📁 common/        # Komponen yang dipake di mana-mana
│       │   ├── 📄 Navbar.jsx         # Header/navigation bar
│       │   ├── 📄 Footer.jsx         # Footer website
│       │   ├── 📄 Profile.jsx        # Halaman profil user
│       │   ├── 📄 Loading.jsx        # Komponen loading spinner
│       │   └── 📄 ErrorBoundary.jsx  # Handle error React
│       │
│       ├── 📁 config/        # File konfigurasi tambahan
│       │   ├── 📄 constants.js       # Konstanta global
│       │   └── 📄 utils.js           # Fungsi helper
│       │
│       └── 📁 pages/         # Halaman-halaman utama
│           ├── 📄 Home.jsx           # Halaman beranda
│           ├── 📄 NewsDetail.jsx     # Detail berita
│           ├── 📄 SearchResults.jsx  # Hasil pencarian
│           ├── 📄 Category.jsx       # Berita per kategori
│           ├── 📄 Trending.jsx       # Berita trending
│           └── 📄 Bookmarks.jsx      # Berita yang di-bookmark
```

## 🎯 Penjelasan File Penting

### 📄 `dev.js` - Orkestrator Utama
File ini yang ngatur semua service biar jalan bareng. Pas kamu jalanin `npm run dev`, file ini yang:
- Nyalain watcher buat pantau perubahan file
- Jalanin server backend
- Buka aplikasi React di browser
- Kasih log berwarna biar tau apa yang lagi terjadi

### 📄 `watcher.js` - File Pemantau Pintar
File keren yang bikin development jadi lebih menyenangkan:
- Deteksi kalo ada file baru, dihapus, atau diubah
- Tampilin baris mana aja yang berubah
- Kasih tau kalo ada file yang di-copy atau ganti nama
- CLI interface yang colorful biar semangat ngoding

### 📄 `server.js` - Backend API
Server Express.js sederhana yang handle:
- API endpoints buat frontend
- CORS configuration
- Middleware buat security
- Route handling

### 📁 `src/component/` - Jantung Aplikasi
Semua komponen React tersimpan rapi di sini:
- **admin/**: Semua yang berhubungan sama dashboard admin
- **auth/**: Login, register, dan autentikasi
- **common/**: Komponen yang dipake berkali-kali
- **pages/**: Halaman-halaman utama website

## 🔐 Fitur Keamanan

Karena Fari Noveri peduli sama keamanan (dan Illyasviel von Einzbern pasti bangga):
- **Firebase Authentication** - Login yang aman dan terpercaya
- **reCAPTCHA Protection** - Lindungi dari spam dan bot
- **XSS Prevention** - Sanitasi konten pakai DOMPurify
- **Role-based Access** - Admin dan user punya akses yang berbeda
- **CORS Whitelist** - Cuma domain tertentu yang boleh akses API

## 🎨 Cara Pakai (Buat User Awam)

### Sebagai Pembaca Berita:
1. **Buka aplikasi** di `localhost:5173`
2. **Daftar akun** atau login kalo udah punya
3. **Baca berita** di halaman utama
4. **Cari berita** pakai fitur search
5. **Bookmark** berita yang menarik
6. **Kasih komentar** di artikel yang kamu suka

### Sebagai Admin:
1. **Login** dengan akun admin
2. **Akses dashboard** admin
3. **Tambah/edit/hapus** berita
4. **Kelola user** yang terdaftar
5. **Lihat statistik** pengunjung dan engagement

## 🤝 Kontribusi & Development

Mau ikut kontribusi? Keren banget! Ini caranya:

1. **Fork** repository ini
2. **Buat branch** baru: `git checkout -b fitur-baru`
3. **Commit** perubahan: `git commit -m 'Tambah fitur keren'`
4. **Push** ke branch: `git push origin fitur-baru`
5. **Buat Pull Request**

## 🐛 Troubleshooting

**Q: Aplikasi nggak mau jalan setelah `npm run dev`?**
A: Pastikan file `.env` udah diisi dengan benar dan Node.js versi 18+

**Q: Error "Firebase configuration"?**
A: Cek lagi konfigurasi Firebase di file `.env`, pastikan semua key udah bener

**Q: Port 5173 udah kepake?**
A: Vite otomatis cari port kosong berikutnya, atau bisa set manual di `vite.config.js`

## 💝 Pesan dari Hati

Proyek ini nggak cuma sekadar kode. Di balik setiap function, setiap component, setiap line of code, ada cerita tentang seseorang yang belajar dengan penuh semangat. **Fari Noveri** mengerjakan ini dengan cinta, dan **Illyasviel von Einzbern** selalu jadi inspirasi di setiap malam begadang ngoding.

Setiap kali error muncul, setiap kali stuck di bug yang susah, ingatan tentang Illya selalu bikin semangat lagi. Karena cinta sejati itu nggak cuma tentang perasaan, tapi juga tentang dedikasi dalam berkarya.

---

**👨‍💻 Dibuat dengan ❤️ oleh:** Fari Noveri  
**🌟 Dipersembahkan untuk:** Illyasviel von Einzbern  
**🎯 Tujuan:** Belajar, berkembang, dan mengabadikan cinta lewat kode  

*"Setiap baris kode adalah doa, setiap commit adalah harapan, dan setiap push adalah bukti cinta yang nggak pernah padam."*

---

Selamat ngoding! 🚀✨

*P.S: Jangan lupa kasih ⭐ kalo proyek ini membantu ya!*

![](https://64.media.tumblr.com/cc7573bfa455601809f625e8438a7cb7/tumblr_nail4rKbNx1rydwbvo1_500.gif)
