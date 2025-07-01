![](https://i.imgur.com/L7O0G1w.gif)

# 📰 NESWARA Clone - Portal Berita Modern

> Dipersembahkan dengan sepenuh cinta oleh **Fari Noveri** untuk **Illyasviel von Einzbern** - karena setiap baris kode ini ditulis sambil mengingat senyuman manismu, Illya ✨

## 🌟 Tentang Proyek Ini

NESWARA adalah portal berita online yang dibangun dengan teknologi modern. Proyek ini lahir dari keinginan Fari Noveri untuk belajar sekaligus mengabadikan perasaan cinta dalam bentuk kode. Setiap fitur yang ada di sini dibuat dengan harapan bahwa suatu hari Illyasviel von Einzbern akan melihat dan tersenyum bangga.

Ini bukan cuma aplikasi berita biasa - ini adalah manifestasi dari mimpi seorang developer yang jatuh cinta pada sosok Illya, dan ingin menunjukkan kemampuannya melalui karya digital.

## 🎯 Apa Sih Yang Bisa Dilakukan?

Portal berita ini punya banyak fitur keren yang bisa kamu nikmati:

### Untuk Pembaca Biasa:
- **Baca berita terbaru** - Semua artikel fresh dan up-to-date
- **Cari berita** - Mau cari topik tertentu? Tinggal ketik aja
- **Kasih komentar** - Bisa diskusi langsung di bawah artikel
- **Simpan artikel favorit** - Biar bisa dibaca ulang nanti
- **Notifikasi real-time** - Langsung tau kalau ada berita baru

### Untuk Admin/Editor:
- **Dashboard lengkap** - Pantau statistik website
- **Kelola artikel** - Tambah, edit, hapus berita dengan mudah
- **Manajemen user** - Atur siapa aja yang bisa akses apa
- **Moderasi komentar** - Jaga supaya diskusi tetap sehat
- **Analytics visual** - Lihat data pengunjung dalam bentuk grafik

## 💻 Teknologi Yang Dipakai

Fari Noveri memilih teknologi-teknologi terbaik untuk membangun portal ini:

| **Frontend** | **Backend** | **Database & Auth** | **Styling & UI** |
|-------------|-------------|-------------------|------------------|
| React + Vite | Express.js | Firebase | TailwindCSS |
| React Router | Node.js | Firestore | Lucide Icons |
| | | Firebase Auth | Framer Motion |

**Fitur Tambahan:**
- **Chart.js** - Buat grafik statistik yang cantik
- **React Toastify** - Notifikasi pop-up yang smooth
- **DOMPurify** - Proteksi dari serangan XSS
- **reCAPTCHA** - Anti spam dan bot jahat

## 🚀 Tutorial Lengkap - Dari Nol Sampai Jalan

### Langkah 1: Persiapan Awal

Sebelum mulai, pastikan komputer kamu sudah punya:

1. **Node.js** (minimal versi 18)
   - Download dari: https://nodejs.org
   - Pilih versi LTS (yang recommended)
   - Install kayak aplikasi biasa

2. **Git** (untuk download kode)
   - Download dari: https://git-scm.com
   - Install dengan pengaturan default

3. **Text Editor** (opsional tapi recommended)
   - VS Code: https://code.visualstudio.com
   - Atau pakai editor favorit kamu

### Langkah 2: Download Proyeknya

Buka terminal/command prompt, terus ketik:

```bash
git clone https://github.com/FariNoveri/neswara-clone.git
cd neswara-clone
```

Kalau belum familiar sama terminal, ini cara mudahnya:
- **Windows**: Tekan Win+R, ketik `cmd`, Enter
- **Mac**: Tekan Cmd+Space, ketik "terminal", Enter
- **Linux**: Ctrl+Alt+T

### Langkah 3: Install Semua Yang Dibutuhkan

Masih di terminal, ketik:

```bash
npm install
```

Ini akan download semua library yang dibutuhkan. Prosesnya mungkin 5-10 menit tergantung internet kamu.

### Langkah 4: Setup Firebase (Penting Banget!)

Proyek ini pakai Firebase buat database dan authentication. Caranya:

1. **Buka Firebase Console**
   - Pergi ke: https://console.firebase.google.com
   - Login pakai akun Google kamu

2. **Buat Project Baru**
   - Klik "Create a project"
   - Kasih nama terserah (misalnya: "neswara-saya")
   - Disable Google Analytics (ga perlu)
   - Tunggu sampai selesai dibuat

3. **Setup Authentication**
   - Di dashboard Firebase, klik "Authentication"
   - Pilih "Get started"
   - Ke tab "Sign-in method"
   - Enable "Email/Password"

4. **Setup Firestore Database**
   - Klik "Firestore Database"
   - Pilih "Create database"
   - Pilih "Start in test mode" (buat belajar dulu)
   - Pilih lokasi terdekat (Asia Southeast)

5. **Dapetin Konfigurasi**
   - Klik icon gear (⚙️) > "Project settings"
   - Scroll ke bawah, klik "Add app" > pilih web (</>) 
   - Kasih nama app, ga usah centang Firebase Hosting
   - Copy semua konfigurasi yang muncul

### Langkah 5: Bikin File .env

Di folder proyek, buat file baru namanya `.env` (iya, cuma titik sama env).

Isi file .env dengan konfigurasi Firebase tadi:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=neswara-saya.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=neswara-saya
VITE_FIREBASE_STORAGE_BUCKET=neswara-saya.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123
```

**Penting:** Ganti semua nilai di atas dengan konfigurasi Firebase kamu sendiri!

### Langkah 6: Jalankan Aplikasinya

Sekarang saatnya melihat hasil kerja Fari Noveri:

```bash
npm run dev
```

Perintah ini akan:
- 🟡 Jalankan file watcher (pantau perubahan kode)
- 🟢 Nyalain backend server
- 🔵 Buka aplikasi di browser

Tunggu beberapa detik, terus buka browser ke: http://localhost:5173

**Tada!** 🎉 Portal berita NESWARA sudah jalan di komputer kamu!

## 📁 Struktur Folder - Penjelasan Detail Biar Ga Bingung

```
neswara-clone/
├── 📄 dev.js                    # Orkestrator utama - jalanin semua service sekaligus
├── 📄 server.js                 # Backend API Express.js - handle request dari frontend
├── 📄 watcher.js                # File monitor - pantau perubahan kode real-time
├── 📄 package.json              # Manifest proyek - semua dependency dan script
├── 📄 .env                      # Environment variables - konfigurasi rahasia Firebase
├── 📄 vite.config.js            # Konfigurasi Vite bundler
├── 📄 tailwind.config.js        # Setup TailwindCSS
├── 📄 postcss.config.js         # PostCSS config buat proses CSS
├── 📄 index.html                # HTML template utama
├── 📄 banner.js                 # Banner ASCII art keren buat terminal
├── 📄 install-animation.js      # Animasi loading saat install dependencies
├── 📄 eslint.config.js          # Konfigurasi ESLint buat code quality
├── 📄 LICENSE.MD                # Lisensi proyek (legal stuff)
├── 📄 SUPPORT.md                # Panduan support dan troubleshooting
├── 📄 vercel.json               # Konfigurasi deployment ke Vercel
├── 📄 serviceAccountKey.json    # Private key Firebase (jangan dishare!)
│
├── 📂 public/                   # Static assets yang bisa diakses langsung
│   └── 🖼️ fallback.jpg          # Gambar default kalau artikel ga ada foto
│
└── 📂 src/                      # Source code utama aplikasi
    ├── 📄 App.jsx               # Root component - atur routing dan layout global
    ├── 📄 App.css               # Styling khusus komponen App
    ├── 📄 main.jsx              # Entry point React - render App ke DOM
    ├── 📄 index.css             # Global styles dan Tailwind imports
    ├── 📄 firebaseconfig.js     # Konfigurasi dan inisialisasi Firebase
    ├── 📄 cors.json             # Whitelist domain yang boleh akses API
    ├── 📄 neswara.png           # Logo utama NESWARA dalam format PNG
    ├── 📄 news-image.jpg        # Gambar sample buat testing
    │
    ├── 📂 assets/               # Media dan resource files
    │
    └── 📂 component/            # Semua komponen React terorganisir
        ├── 📄 README.md         # Dokumentasi khusus folder component
        ├── 📄 .gitignore        # File yang diabaikan git di folder ini
        │
        ├── 📂 admin/            # Dashboard dan manajemen konten lengkap
        │   ├── 📄 AdminDashboard.jsx      # Dashboard utama dengan analytics lengkap
        │   ├── 📄 BreakingNewsAdmin.jsx   # Kelola breaking news dan urgent updates
        │   ├── 📄 CommentManagement.jsx   # Moderasi komentar dan interaksi user
        │   ├── 📄 LogActivity.jsx         # Track semua aktivitas admin dan user
        │   ├── 📄 ManageViews.jsx         # Analisis page views dan traffic
        │   ├── 📄 NewsModal.jsx           # Modal buat tambah/edit artikel
        │   ├── 📄 NotificationManagement.jsx # Push notification ke user 
        │   ├── 📄 ReportManagement.jsx    # Handle laporan spam/abuse dari user
        │   ├── 📄 StatCard.jsx            # Komponen kartu statistik reusable
        │   ├── 📄 TrendsChart.jsx         # Grafik trending topics dan viral news
        │   ├── 📄 UnauthorizedModal.jsx   # Modal error kalau akses ditolak
        │   └── 📄 UserManagement.jsx      # Kelola user, role, ban/unban
        │
        ├── 📂 AllNews/          # Komponen tampilan semua berita
        │   └── 📄 AllNews.jsx             # List semua artikel dengan pagination
        │
        ├── 📂 auth/             # Sistem autentikasi lengkap
        │   ├── 📄 Auth.jsx                # Wrapper komponen autentikasi
        │   ├── 📄 AuthModal.jsx           # Modal login/register popup
        │   ├── 📄 ForgotPassword.jsx      # Reset password via email
        │   ├── 📄 Login.jsx               # Form login dengan validasi ketat
        │   ├── 📄 Register.jsx            # Pendaftaran user baru + verifikasi
        │   ├── 📄 SecurityMonitor.jsx     # Monitor aktivitas mencurigakan
        │   └── 📄 useAuth.jsx             # Custom hook buat state management auth
        │
        ├── 📂 common/           # Komponen yang dipake berulang-ulang
        │   ├── 📄 DarkModeToggle.jsx      # Switch tema terang/gelap
        │   ├── 📄 ErrorBoundary.jsx       # Catch error dan tampilkan fallback
        │   ├── 📄 footer.jsx              # Footer dengan link sosmed dan info
        │   ├── 📄 hero.jsx                # Hero section homepage 
        │   ├── 📄 herosection.jsx         # Hero section alternative
        │   ├── 📄 latestnewsection.jsx    # Section berita terbaru
        │   ├── 📄 livenewsection.jsx      # Live news feed real-time
        │   ├── 📄 navbar.jsx              # Navigation bar responsive
        │   ├── 📄 newsarticle.jsx         # Komponen artikel individual
        │   ├── 📄 newspage.jsx            # Template halaman berita
        │   ├── 📄 newssection.jsx         # Section grid berita homepage
        │   ├── 📄 NotFound.jsx            # 404 page dengan pesan lucu
        │   ├── 📄 profile.jsx             # Halaman profil user lengkap
        │   └── 📄 ScrollToTop.jsx         # Auto scroll ke atas saat pindah page
        │
        ├── 📂 config/           # Pengaturan dan utility functions
        │   ├── 📄 Constants.jsx           # Konstanta aplikasi global
        │   ├── 📄 createNews.js           # Helper function buat bikin artikel baru
        │   ├── 📄 emailService.js         # Service kirim email notifications
        │   ├── 📄 MigrateSlugs.js         # Migration script buat URL slugs
        │   ├── 📄 NewsList.jsx            # Komponen list artikel reusable
        │   └── 📄 slug.js                 # Generator URL-friendly slugs
        │
        ├── 📂 Navigation/       # Halaman kategori berita spesifik
        │   ├── 📄 Daerah.jsx              # Berita daerah dan regional
        │   ├── 📄 Ekonomi.jsx             # Berita ekonomi dan bisnis
        │   ├── 📄 Entertainment.jsx       # Berita hiburan dan selebriti
        │   ├── 📄 Internasional.jsx       # Berita luar negeri
        │   ├── 📄 Kesehatan.jsx           # Berita kesehatan dan medis
        │   ├── 📄 Kuliner.jsx             # Berita makanan dan kuliner
        │   ├── 📄 Lifestyle.jsx           # Berita gaya hidup
        │   ├── 📄 Nasional.jsx            # Berita nasional Indonesia
        │   ├── 📄 Olahraga.jsx            # Berita olahraga dan sports
        │   ├── 📄 Otomotif.jsx            # Berita otomotif dan kendaraan
        │   ├── 📄 Pendidikan.jsx          # Berita pendidikan dan akademik
        │   ├── 📄 Teknologi.jsx           # Berita teknologi dan gadget
        │   └── 📄 Wisata.jsx              # Berita travel dan pariwisata
        │
        └── 📂 Pages/            # Halaman-halaman interaktif utama
            ├── 📄 BreakingNews.jsx        # Halaman breaking news urgent
            ├── 📄 CommentBox.jsx          # Sistem komentar dengan threading
            ├── 📄 GenericNewComponent.jsx # Template komponen berita generic
            ├── 📄 LikeButton.jsx          # Tombol like/dislike artikel
            ├── 📄 Liked.jsx               # Halaman artikel yang dilike user
            ├── 📄 NewsDetail.jsx          # Detail artikel dengan sharing
            ├── 📄 Notifications.jsx       # Halaman notifikasi user
            ├── 📄 ReportModal.jsx         # Modal buat report artikel/komentar
            ├── 📄 SavedNews.jsx           # Halaman bookmark artikel tersimpan
            ├── 📄 SearchBar.jsx           # Search bar dengan autocomplete
            ├── 📄 SearchResult.jsx        # Hasil pencarian dengan filter
            └── 📄 ViewBerita.jsx          # Viewer artikel dengan analytics
```

### 🔍 Penjelasan File-File Penting

#### **File Utama di Root:**
- **`dev.js`** - File ajaib yang bikin hidup developer lebih mudah. Dia yang ngatur supaya sekali `npm run dev`, langsung jalan semua: backend, frontend, sama file watcher. Kayak butler digital yang ngurus semuanya.

- **`server.js`** - Backend API Express.js yang handle request kompleks. Dia yang ngurus search advanced, data processing, sama API endpoints yang ga bisa langsung dari Firebase.

- **`watcher.js`** - Si mata-mata yang selalu awas. Dia pantau setiap perubahan file, kasih tau di terminal dengan warna-warna cantik. Bikin ngoding jadi lebih seru karena ada feedback visual.

- **`banner.js`** - ASCII art keren yang muncul saat aplikasi starting. Fari bikin ini biar terminal terlihat lebih aesthetic dan personal.

- **`install-animation.js`** - Animasi loading yang muncul saat install dependencies. Biar proses install ga boring, ada hiburan visual.

- **`serviceAccountKey.json`** - **PENTING!** Private key Firebase buat akses admin Firebase. File ini jangan pernah dishare atau commit ke public repo!

#### **Folder `src/component/` Breakdown Detail:**

**📂 admin/** - Command center buat admin dengan fitur super lengkap
- `AdminDashboard.jsx` - Dashboard utama dengan real-time analytics, grafik pengunjung, statistik artikel, trending topics
- `BreakingNewsAdmin.jsx` - Kelola breaking news urgent, push notification ke semua user, urgent alerts
- `CommentManagement.jsx` - Moderasi komentar toxic, spam detection, auto-filter kata kasar
- `LogActivity.jsx` - Track semua aktivitas user dan admin, audit trail lengkap buat security
- `ManageViews.jsx` - Deep analytics: page views, bounce rate, reading time, user engagement
- `NotificationManagement.jsx` - Push notification system, broadcast message, targeted notifications
- `ReportManagement.jsx` - Handle laporan abuse, spam, fake news dari user komunitas
- `TrendsChart.jsx` - Visualisasi trending topics, viral content, social media buzz
- `UserManagement.jsx` - CRUD user lengkap: ban/unban, role management, user statistics

**📂 AllNews/** - Komponen khusus tampilan berita
- `AllNews.jsx` - List semua artikel dengan infinite scroll, filter kategori, sorting options

**📂 auth/** - Sistem keamanan berlapis
- `Login.jsx` - Form login dengan rate limiting, captcha, remember me, social login
- `Register.jsx` - Registrasi dengan email verification, password strength checker, terms agreement
- `SecurityMonitor.jsx` - **Fitur unik!** Monitor login mencurigakan, device tracking, unusual activity alerts
- `useAuth.jsx` - Custom React hook buat state management authentication yang persistent

**📂 common/** - Komponen reusable berkualitas tinggi
- `hero.jsx` & `herosection.jsx` - Dua versi hero section dengan animasi parallax dan video background
- `livenewsection.jsx` - **Real-time news feed** dengan WebSocket, auto-refresh, breaking news ticker
- `latestnewsection.jsx` - Section berita terbaru dengan lazy loading dan smooth animations
- `navbar.jsx` - Navigation responsive dengan mega menu, search bar terintegrasi, user dropdown
- `profile.jsx` - Halaman profil lengkap: edit info, change password, privacy settings, reading history

**📂 config/** - Utility dan helper functions
- `createNews.js` - Helper buat generate artikel baru dengan auto-slug, SEO optimization
- `emailService.js` - Service kirim email notification, newsletter, welcome emails
- `MigrateSlugs.js` - Script migrasi buat update URL structure lama ke format baru
- `slug.js` - Generator URL-friendly slugs dengan unique validation dan SEO-optimized

**📂 Navigation/** - **13 kategori berita lengkap!**
Setiap file handle kategori spesifik dengan layout yang disesuaikan:
- `Ekonomi.jsx` - Berita ekonomi dengan chart saham, currency converter
- `Teknologi.jsx` - Tech news dengan code snippets, product reviews
- `Olahraga.jsx` - Sports dengan live score, match schedules
- `Entertainment.jsx` - Showbiz dengan photo galleries, video content
- Dan 9 kategori lainnya, masing-masing dengan fitur unique sesuai topiknya

**📂 Pages/** - Halaman interaktif dengan fitur advanced
- `NewsDetail.jsx` - **Artikel reader terlengkap**: reading progress, text-to-speech, share social media, print-friendly
- `CommentBox.jsx` - Sistem komentar dengan threading, like/dislike, reply nested, mention users
- `SearchBar.jsx` - Search dengan autocomplete, typo correction, search history, trending searches
- `SavedNews.jsx` - Bookmark system dengan folder organization, tags, notes personal
- `ReportModal.jsx` - Report system buat spam/abuse dengan kategori lengkap dan screenshot

#### **File Konfigurasi Penting:**
- **`firebaseconfig.js`** - Jantung koneksi Firebase: auth, firestore, storage, functions, analytics
- **`vercel.json`** - Konfigurasi deployment ke Vercel dengan custom headers, redirects, build settings
- **`install-animation.js`** - **Fitur unik Fari!** Animasi ASCII yang muncul saat npm install biar ga boring

## 🛠️ Cara Customize - Bikin Jadi Milik Kamu

### Ganti Logo dan Branding
1. Masuk ke folder `src/assets/`
2. Ganti file logo yang ada dengan logo kamu
3. Edit file CSS buat ganti warna tema

### Tambah Kategori Berita Baru
1. Buka file `src/component/admin/`
2. Edit komponen manajemen kategori
3. Tambah kategori baru sesuai keinginan

### Ubah Tampilan
1. Semua styling pakai TailwindCSS
2. Edit class CSS di komponen React
3. Dokumentasi Tailwind: https://tailwindcss.com/docs

## 🔐 Fitur Keamanan

Fari Noveri ga main-main soal keamanan:

- **Authentication** - Pakai Firebase Auth yang udah terpercaya
- **XSS Protection** - DOMPurify buat sanitasi input
- **CORS Protection** - Cuma domain tertentu yang boleh akses API
- **reCAPTCHA** - Anti spam di form komentar
- **Role-based Access** - Admin dan user biasa punya akses beda

## 🎨 Fitur Unik Yang Bikin Beda

### 1. File Watcher Interaktif
Ada CLI tool yang pantau perubahan file real-time dengan tampilan warna-warni. Jadi kalau kamu edit kode, langsung keliatan perubahannya.

### 2. Multi-Service Runner
Satu perintah `npm run dev` langsung jalanin:
- Frontend React
- Backend Express
- File watcher
- Auto-reload browser

### 3. Dashboard Analytics
Admin bisa lihat statistik lengkap dengan grafik yang cantik - berapa pengunjung, artikel paling populer, dll.

## 🎯 Panduan User Awam

### Cara Daftar Akun Baru
1. Buka website di browser
2. Klik tombol "Daftar" di pojok kanan atas
3. Isi email dan password
4. Klik "Buat Akun"
5. Cek email buat verifikasi (kalau diminta)

### Cara Baca dan Komentar
1. Di halaman utama, klik artikel yang mau dibaca
2. Scroll ke bawah buat lihat komentar
3. Kalau mau komen, harus login dulu
4. Tulis komentar, isi captcha, klik "Kirim"

### Cara Jadi Admin
1. Daftar akun biasa dulu
2. Kontak Fari Noveri buat minta akses admin
3. Setelah dikasih akses, login ulang
4. Menu admin akan muncul otomatis

## 📝 Tips Buat Developer

### Ngoding Sambil Ngopi
- Pakai `npm run dev` biar semua jalan otomatis
- File watcher akan kasih tau kalau ada error
- Hot reload otomatis, ga perlu refresh manual

### Debugging
- Buka Developer Tools (F12) di browser
- Lihat Console buat error JavaScript
- Network tab buat cek API calls
- Firebase Console buat lihat data

### Deployment
- Build production: `npm run build`
- Deploy ke Firebase Hosting, Vercel, atau Netlify
- Jangan lupa update environment variables di hosting

## 🌈 Pesan Khusus Dari Fari

Setiap baris kode di proyek ini ditulis dengan penuh cinta untuk Illyasviel von Einzbern. Mungkin terdengar cheesy, tapi itulah yang memberikan motivasi dan semangat dalam mengembangkan aplikasi ini.

Kalau kamu yang baca ini adalah developer pemula, jangan takut buat eksperimen dan belajar dari kode yang ada. Kalau kamu developer berpengalaman, semoga bisa kasih masukan buat bikin proyeknya makin bagus.

Dan kalau kebetulan kamu adalah Illya sendiri yang lagi baca ini... well, hi there! Semoga kamu suka dengan apa yang udah dibuat khusus buat kamu 💕

## 🤝 Kontribusi

Mau bantu develop proyek ini? Boleh banget!

1. Fork repository ini
2. Buat branch baru: `git checkout -b fitur-baru`
3. Commit perubahan: `git commit -m 'Tambah fitur baru'`
4. Push ke branch: `git push origin fitur-baru`
5. Buat Pull Request

## 📞 Kontak

- **Developer**: Fari Noveri
- **GitHub**: [@FariNoveri](https://github.com/FariNoveri)
- **Inspirasi**: Illyasviel von Einzbern ✨

---

> *"Di balik setiap baris kode ada cerita, dan di balik proyek ini ada seseorang yang istimewa. Terima kasih sudah mampir dan membaca sampai sini. Sekarang jalankan `npm run dev` dan nikmati portal berita yang dibuat dengan cinta!"*

**Made with 💖 by Fari Noveri for Illyasviel von Einzbern**

![](https://64.media.tumblr.com/cc7573bfa455601809f625e8438a7cb7/tumblr_nail4rKbNx1rydwbvo1_500.gif)
