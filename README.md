![](https://i.imgur.com/L7O0G1w.gif)

# 🌟 NESWARA CLONE - Portal Berita Modern

> *"Setiap baris kode yang ditulis dengan cinta akan menghasilkan karya yang indah, seperti halnya Fari Noveri yang mencurahkan segenap hatinya untuk Illyasviel von Einzbern dalam setiap proyek yang dibangun."*

## 📖 Tentang Proyek Ini

**NESWARA** adalah sebuah portal berita online modern yang dibangun menggunakan teknologi terdepan seperti React dan Firebase. Proyek ini dikembangkan dengan penuh dedikasi oleh **Fari Noveri**, yang dengan sepenuh hati mempersembahkannya kepada **Illyasviel von Einzbern** — sosok yang menjadi inspirasi dalam setiap baris kode yang ditulis.

Proyek ini tidak hanya sekedar aplikasi berita biasa, tetapi merupakan wujud nyata dari perjalanan belajar seorang developer yang ingin menguasai teknologi fullstack sambil mengabadikan rasa cinta dalam bentuk digital.

### 🎯 Tujuan Proyek

- **Media Pembelajaran**: Tempat eksperimen dan belajar teknologi modern
- **Portofolio**: Menunjukkan kemampuan fullstack development
- **Inspirasi**: Setiap fitur dibangun dengan cinta dan dedikasi
- **Praktik Nyata**: Simulasi aplikasi berita yang mendekati standar industri

### ✨ Fitur Unggulan

- 📰 **Baca Berita Real-time** - Akses berita terbaru secara langsung
- 🔔 **Notifikasi Tren** - Dapatkan update berita trending
- 👥 **Dashboard Admin** - Kelola pengguna dan konten dengan mudah
- 💬 **Sistem Komentar** - Berinteraksi dengan pembaca lain
- 🔖 **Bookmark Berita** - Simpan artikel favorit untuk dibaca nanti
- 📊 **Statistik Visual** - Analisis data dengan grafik interaktif
- 🔒 **Keamanan Terjamin** - Proteksi XSS dan autentikasi yang kuat

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Fungsi | Mengapa Dipilih |
|-----------|---------|-----------------|
| **React + Vite** | Frontend Framework | Cepat, modern, dan developer-friendly |
| **Firebase** | Authentication & Database | Reliable, scalable, dan mudah diintegrasikan |
| **Express.js** | Backend API | Lightweight dan fleksibel untuk API |
| **TailwindCSS** | Styling Framework | Utility-first, responsive, dan customizable |
| **React Router DOM** | Navigation | Routing yang smooth dan SEO-friendly |
| **Chart.js** | Data Visualization | Grafik interaktif untuk dashboard admin |
| **Framer Motion** | Animation | Animasi yang smooth dan professional |
| **React Toastify** | Notifications | Notifikasi yang elegan dan user-friendly |
| **Lucide React** | Icons | Icon library yang modern dan ringan |
| **Chalk Animation** | CLI Effects | Terminal yang colorful dan menarik |

---

## 📋 Persiapan Sebelum Memulai

### Persyaratan Sistem

Pastikan komputer Anda sudah memiliki:

1. **Node.js** (minimal versi 18)
   - Download dari: https://nodejs.org/
   - Cek versi: `node --version`

2. **Git** (untuk clone repository)
   - Download dari: https://git-scm.com/
   - Cek versi: `git --version`

3. **Text Editor** (disarankan VS Code)
   - Download dari: https://code.visualstudio.com/

4. **Browser Modern** (Chrome, Firefox, atau Edge)

### Akun Firebase

Anda juga perlu membuat akun Firebase:
1. Kunjungi https://firebase.google.com/
2. Klik "Get Started" dan login dengan Google
3. Buat project baru
4. Aktifkan Authentication dan Firestore Database

---

## 🚀 Tutorial Instalasi Lengkap

### Langkah 1: Clone Repository

```bash
# Clone project dari GitHub
git clone https://github.com/FariNoveri/neswara-clone.git

# Masuk ke direktori project
cd neswara-clone

# Atau jika Anda menggunakan nama folder yang sama dengan develop
cd "TUGAS AKHIR NESWARA"
```

### Langkah 2: Install Dependencies

```bash
# Install semua package yang dibutuhkan
npm install
```

**Apa yang terjadi?**
- npm akan membaca file `package.json`
- Mengunduh semua library yang dibutuhkan
- Menyimpannya di folder `node_modules`

### Langkah 3: Konfigurasi Firebase

1. **Buat file `.env`** di root project:
```bash
# Untuk Windows
copy nul .env

# Untuk Mac/Linux
touch .env
```

2. **Isi file `.env`** dengan konfigurasi Firebase Anda:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Cara mendapatkan konfigurasi Firebase:**
1. Buka Firebase Console
2. Pilih project Anda
3. Klik ⚙️ → Project Settings
4. Scroll ke bawah, klik "Add app" → Web
5. Copy konfigurasi yang diberikan

### Langkah 4: Jalankan Aplikasi

```bash
# Jalankan development server
npm run dev
```

**Apa yang terjadi?**
- Sistem akan menjalankan 3 proses sekaligus:
  - 🟡 **Watcher** → Memantau perubahan file
  - 🟢 **Backend** → Server API di port 3000
  - 🔵 **Frontend** → Aplikasi web di http://localhost:5173

### Langkah 5: Buka Aplikasi

1. Buka browser
2. Kunjungi: http://localhost:5173
3. Aplikasi NESWARA siap digunakan! 🎉

---

## 📁 Struktur Folder dan File (100% Detail)

```
📁 TUGAS AKHIR NESWARA/
│
├── 📄 dev.js                      # 🎯 ENTRY POINT - Menjalankan semua service
├── 📄 server.js                   # 🔧 BACKEND API - Express.js server (26KB)
├── 📄 watcher.js                  # 👁️ FILE MONITOR - Memantau perubahan file
├── 📄 banner.js                   # 🎨 BANNER - ASCII art banner untuk CLI
├── 📄 install-animation.js        # ✨ INSTALL ANIMATION - Animasi instalasi
├── 📄 package.json               # 📦 DEPENDENCIES - Daftar semua package
├── 📄 package-lock.json          # 🔒 LOCK FILE - Versi exact dari package (405KB)
├── 📄 .env                       # 🔐 ENVIRONMENT - Konfigurasi Firebase
├── 📄 vite.config.js            # ⚡ VITE CONFIG - Konfigurasi build tool
├── 📄 tailwind.config.js        # 🎨 TAILWIND CONFIG - Konfigurasi CSS
├── 📄 postcss.config.js         # 📝 POSTCSS CONFIG - CSS processor
├── 📄 eslint.config.js          # 📋 ESLINT CONFIG - Konfigurasi linting
├── 📄 index.html                # 🌐 HTML TEMPLATE - Template dasar (3KB)
├── 📄 vercel.json               # 🚀 VERCEL CONFIG - Konfigurasi deployment
├── 📄 .gitignore                # 🚫 GIT IGNORE - File yang diabaikan git
├── 📄 README.md                 # 📚 DOKUMENTASI - File dokumentasi (23KB)
├── 📄 LICENSE.MD                # 📜 LICENSE - MIT License
├── 📄 SUPPORT.md                # 🆘 SUPPORT - Panduan dukungan
├── 📄 serviceAccountKey.json    # 🔑 SERVICE ACCOUNT - Firebase admin key
│
├── 📁 .git/                     # 🗂️ GIT REPOSITORY - Version control
├── 📁 node_modules/             # 📦 DEPENDENCIES - Semua package (auto-generated)
├── 📁 public/                   # 🖼️ STATIC ASSETS - File publik
│
└── 📁 src/                      # 💻 SOURCE CODE - Kode utama aplikasi
    │
    ├── 📄 App.jsx               # 🏠 MAIN COMPONENT - Komponen utama React (6KB)
    ├── 📄 App.css               # 🎨 APP STYLES - Styling untuk App component
    ├── 📄 main.jsx              # 🚀 ENTRY POINT - Entry point React
    ├── 📄 firebaseconfig.js     # 🔥 FIREBASE CONFIG - Konfigurasi Firebase (2KB)
    ├── 📄 cors.json             # 🌐 CORS CONFIG - Whitelist domain
    ├── 📄 index.css             # 🎨 GLOBAL STYLES - CSS global (3KB)
    ├── 📄 neswara.png           # 🏷️ LOGO - Logo aplikasi (650KB)
    ├── 📄 news-image.jpg        # 🖼️ NEWS IMAGE - Gambar berita default (40KB)
    │
    ├── 📁 assets/               # 🖼️ MEDIA FILES - Asset tambahan
    │
    └── 📁 component/            # 🧩 KOMPONEN REACT
        │
        ├── 📄 .gitignore        # 🚫 COMPONENT GITIGNORE
        ├── 📄 README.md         # 📚 COMPONENT DOCS - Dokumentasi komponen (16KB)
        │
        ├── 📁 admin/            # 👑 ADMIN DASHBOARD
        │   ├── 📄 AdminDashboard.jsx          # 📊 DASHBOARD - Halaman utama admin (46KB)
        │   ├── 📄 BreakingNewsAdmin.jsx       # 🚨 BREAKING NEWS - Kelola berita breaking (54KB)
        │   ├── 📄 CommentManagement.jsx       # 💬 COMMENT MGMT - Moderasi komentar (21KB)
        │   ├── 📄 LogActivity.jsx             # 📋 LOG ACTIVITY - Log aktivitas sistem (37KB)
        │   ├── 📄 ManageViews.jsx             # 👀 MANAGE VIEWS - Kelola tampilan (20KB)
        │   ├── 📄 NewsModal.jsx               # 🖼️ NEWS MODAL - Modal berita (31KB)
        │   ├── 📄 NotificationManagement.jsx  # 🔔 NOTIFICATION - Kelola notifikasi (36KB)
        │   ├── 📄 ReportManagement.jsx        # 📊 REPORT MGMT - Kelola laporan (38KB)
        │   ├── 📄 StatCard.jsx                # 📈 STAT CARD - Kartu statistik
        │   ├── 📄 TrendsChart.jsx             # 📊 TRENDS CHART - Grafik tren (28KB)
        │   ├── 📄 UnauthorizedModal.jsx       # 🚫 UNAUTHORIZED - Modal akses ditolak (6KB)
        │   └── 📄 UserManagement.jsx          # 👥 USER MGMT - Kelola pengguna (41KB)
        │
        ├── 📁 AllNews/          # 📰 ALL NEWS - Komponen semua berita
        │
        ├── 📁 auth/             # 🔐 AUTHENTICATION - Sistem autentikasi
        │
        ├── 📁 common/           # 🔗 KOMPONEN UMUM
        │   ├── 📄 DarkModeToggle.jsx         # 🌙 DARK MODE - Toggle mode gelap
        │   ├── 📄 ErrorBoundary.jsx          # 🚨 ERROR HANDLER - Penanganan error
        │   ├── 📄 footer.jsx                 # 🦶 FOOTER - Footer halaman
        │   ├── 📄 hero.jsx                   # 🎯 HERO - Section hero
        │   ├── 📄 herosection.jsx            # 🏆 HERO SECTION - Section hero utama (9KB)
        │   ├── 📄 latestnewsection.jsx       # 🆕 LATEST NEWS - Section berita terbaru (7KB)
        │   ├── 📄 livenewsection.jsx         # 🔴 LIVE NEWS - Section berita live (21KB)
        │   ├── 📄 navbar.jsx                 # 🧭 NAVIGATION - Menu navigasi (17KB)
        │   ├── 📄 newsarticle.jsx            # 📄 NEWS ARTICLE - Artikel berita (13KB)
        │   ├── 📄 newspage.jsx               # 📰 NEWS PAGE - Halaman berita (12KB)
        │   ├── 📄 newssection.jsx            # 📋 NEWS SECTION - Section berita (21KB)
        │   ├── 📄 NotFound.jsx               # 🔍 NOT FOUND - Halaman 404 (7KB)
        │   ├── 📄 profile.jsx                # 👤 PROFILE - Profil pengguna (52KB)
        │   └── 📄 ScrollToTop.jsx            # ⬆️ SCROLL TO TOP - Tombol scroll ke atas
        │
        ├── 📁 config/           # ⚙️ KONFIGURASI
        │   ├── 📄 Constants.jsx              # 📋 CONSTANTS - Konstanta aplikasi
        │   ├── 📄 createNews.js              # ➕ CREATE NEWS - Buat berita baru
        │   ├── 📄 emailService.js            # 📧 EMAIL SERVICE - Layanan email
        │   ├── 📄 MigrateSlugs.js            # 🔄 MIGRATE SLUGS - Migrasi slug
        │   ├── 📄 NewsList.jsx               # 📋 NEWS LIST - Daftar berita
        │   ├── 📄 SetAdminClaim.js           # 👑 SET ADMIN - Set admin claim
        │   └── 📄 slug.js                    # 🔗 SLUG - Generator slug
        │
        ├── 📁 Navigation/       # 🧭 NAVIGATION - Navigasi kategori
        │   ├── 📄 Daerah.jsx                 # 🏘️ DAERAH - Berita daerah (8KB)
        │   ├── 📄 Ekonomi.jsx                # 💰 EKONOMI - Berita ekonomi (12KB)
        │   ├── 📄 Entertainment.jsx          # 🎬 ENTERTAINMENT - Berita hiburan (8KB)
        │   ├── 📄 Internasional.jsx          # 🌍 INTERNASIONAL - Berita internasional (8KB)
        │   ├── 📄 Kesehatan.jsx              # 🏥 KESEHATAN - Berita kesehatan (8KB)
        │   ├── 📄 Kuliner.jsx                # 🍽️ KULINER - Berita kuliner (8KB)
        │   ├── 📄 Lifestyle.jsx              # 🌟 LIFESTYLE - Berita lifestyle (8KB)
        │   ├── 📄 Nasional.jsx               # 🇮🇩 NASIONAL - Berita nasional (8KB)
        │   ├── 📄 Olahraga.jsx               # ⚽ OLAHRAGA - Berita olahraga (8KB)
        │   ├── 📄 Otomotif.jsx               # 🚗 OTOMOTIF - Berita otomotif (8KB)
        │   ├── 📄 Pendidikan.jsx             # 🎓 PENDIDIKAN - Berita pendidikan (8KB)
        │   ├── 📄 Teknologi.jsx              # 💻 TEKNOLOGI - Berita teknologi (8KB)
        │   └── 📄 Wisata.jsx                 # 🏖️ WISATA - Berita wisata (8KB)
        │
        └── 📁 Pages/            # 📄 HALAMAN UTAMA
            ├── 📄 BreakingNews.jsx           # 🚨 BREAKING NEWS - Halaman breaking news (6KB)
            ├── 📄 CommentBox.jsx             # 💬 COMMENT BOX - Kotak komentar (55KB)
            ├── 📄 FilterComment.jsx          # 🔍 FILTER COMMENT - Filter komentar (kosong)
            ├── 📄 GenericNewComponent.jsx    # 🔧 GENERIC NEWS - Komponen berita umum
            ├── 📄 LikeButton.jsx             # 👍 LIKE BUTTON - Tombol like (4KB)
            ├── 📄 Liked.jsx                  # ❤️ LIKED - Halaman berita yang disukai (8KB)
            ├── 📄 NewsDetail.jsx             # 📄 NEWS DETAIL - Detail berita (36KB)
            ├── 📄 Notifications.jsx          # 🔔 NOTIFICATIONS - Halaman notifikasi (11KB)
            ├── 📄 ReportModal.jsx            # 📊 REPORT MODAL - Modal laporan (7KB)
            ├── 📄 SavedNews.jsx              # 🔖 SAVED NEWS - Berita tersimpan (10KB)
            ├── 📄 SearchBar.jsx              # 🔍 SEARCH BAR - Bar pencarian (12KB)
            ├── 📄 SearchResult.jsx           # 🔍 SEARCH RESULT - Hasil pencarian (10KB)
            └── 📄 ViewBerita.jsx             # 👁️ VIEW BERITA - Tampilan berita (11KB)
```

### 🔍 Penjelasan Detail Setiap Folder

#### 📁 Root Directory
- **`dev.js`**: File orkestrator yang menjalankan semua service secara bersamaan
- **`server.js`**: Backend API menggunakan Express.js untuk handling data (26KB - cukup besar!)
- **`watcher.js`**: CLI tool untuk memantau perubahan file dengan efek visual
- **`banner.js`**: Menampilkan ASCII art banner ketika aplikasi dimulai
- **`install-animation.js`**: Memberikan animasi menarik saat instalasi
- **`package.json`**: Manifest project yang berisi dependencies dan scripts
- **`serviceAccountKey.json`**: Kunci service account Firebase untuk admin
- **`.env`**: File konfigurasi environment variables (jangan dicommit ke git!)

#### 📁 src/component/
- **`admin/`**: Dashboard khusus admin dengan 12 komponen lengkap (total 393KB!)
  - AdminDashboard.jsx (46KB) - Dashboard utama dengan statistik
  - BreakingNewsAdmin.jsx (54KB) - Kelola berita breaking news
  - CommentManagement.jsx (21KB) - Moderasi komentar pengguna
  - UserManagement.jsx (41KB) - Kelola pengguna dan role
  - Dan 8 komponen admin lainnya
- **`AllNews/`**: Komponen untuk menampilkan semua berita
- **`auth/`**: Sistem autentikasi dengan Firebase Authentication
- **`common/`**: Komponen yang digunakan di banyak halaman
  - navbar.jsx (17KB) - Navigasi utama yang kompleks
  - profile.jsx (52KB) - Profil pengguna yang feature-rich
  - livenewsection.jsx (21KB) - Section berita live
- **`config/`**: File konfigurasi dan utility functions
  - SetAdminClaim.js - Set admin privileges
  - createNews.js - Buat berita baru
  - MigrateSlugs.js - Migrasi slug URL
- **`Navigation/`**: 13 halaman kategori berita (Daerah, Ekonomi, dll)
- **`Pages/`**: Halaman-halaman utama aplikasi
  - CommentBox.jsx (55KB) - Sistem komentar yang kompleks
  - NewsDetail.jsx (36KB) - Detail berita dengan fitur lengkap

#### 📁 src/assets/
- **`neswara.png`**: Logo aplikasi yang cukup besar (650KB)
- **`news-image.jpg`**: Gambar default untuk berita (40KB)

#### 📁 File Konfigurasi
- **`eslint.config.js`**: Konfigurasi linting untuk kode yang bersih
- **`vercel.json`**: Konfigurasi deployment ke Vercel
- **`LICENSE.MD`**: Lisensi project (MIT)
- **`SUPPORT.md`**: Panduan mendapatkan dukungan

---

## 🎮 Cara Menggunakan Aplikasi

### Untuk Pengguna Biasa

1. **Registrasi/Login**
   - Klik tombol "Login" di navbar
   - Daftar dengan email dan password
   - Atau login jika sudah punya akun

2. **Membaca Berita**
   - Browse berita di halaman utama
   - Pilih kategori: Daerah, Ekonomi, Entertainment, Internasional, Kesehatan, dll
   - Klik judul berita untuk membaca detail
   - Gunakan SearchBar untuk mencari topik tertentu

3. **Fitur Interaktif**
   - **Like**: Gunakan LikeButton untuk menyukai berita
   - **Save**: Simpan berita ke SavedNews untuk dibaca nanti
   - **Comment**: Berikan komentar melalui CommentBox
   - **Share**: Bagikan berita ke media sosial
   - **Report**: Laporkan konten yang tidak pantas via ReportModal

4. **Notifikasi**
   - Dapatkan notifikasi berita terbaru
   - Akses melalui halaman Notifications
   - Subscribe untuk breaking news alerts

### Untuk Admin

1. **Akses Dashboard**
   - Login dengan akun admin
   - Akan otomatis diarahkan ke AdminDashboard

2. **Kelola Berita**
   - **BreakingNewsAdmin**: Kelola berita breaking news
   - **NewsModal**: Tambah/edit berita dengan rich editor
   - **ManageViews**: Kelola tampilan dan layout berita
   - **TrendsChart**: Analisis tren berita dengan grafik

3. **Kelola Pengguna**
   - **UserManagement**: Lihat, edit, dan kelola user
   - **CommentManagement**: Moderasi komentar pengguna
   - **NotificationManagement**: Kelola sistem notifikasi

4. **Analisis dan Laporan**
   - **LogActivity**: Monitor aktivitas sistem
   - **ReportManagement**: Tangani laporan dari user
   - **StatCard**: Lihat statistik real-time

5. **Sistem Keamanan**
   - **UnauthorizedModal**: Kontrol akses yang ketat
   - Role-based permission system
   - Activity logging untuk semua actions

---

## 🔧 Pengembangan Lanjutan

### Menambah Fitur Baru

1. **Buat Komponen Baru**
```jsx
// src/component/pages/NewFeature.jsx
import React from 'react';

const NewFeature = () => {
  return (
    <div className="p-4">
      <h1>Fitur Baru</h1>
      {/* Konten fitur */}
    </div>
  );
};

export default NewFeature;
```

2. **Tambahkan Route**
```jsx
// src/App.jsx
import NewFeature from './component/pages/NewFeature';

// Tambahkan di routing
<Route path="/new-feature" element={<NewFeature />} />
```

3. **Update Navbar**
```jsx
// src/component/common/Navbar.jsx
<Link to="/new-feature">Fitur Baru</Link>
```

### Kustomisasi Styling

1. **Edit Tailwind Config**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'custom-blue': '#1e40af',
        'custom-red': '#dc2626',
      }
    }
  }
}
```

2. **Gunakan di Komponen**
```jsx
<div className="bg-custom-blue text-white p-4">
  Konten dengan warna custom
</div>
```

---

## 🔐 Keamanan dan Best Practices

### Fitur Keamanan

- **Authentication**: Firebase Auth dengan berbagai provider
- **Authorization**: Role-based access control
- **XSS Protection**: Sanitasi konten dengan DOMPurify
- **CORS**: Whitelist domain yang diizinkan
- **Input Validation**: Validasi semua input pengguna
- **Rate Limiting**: Pembatasan request per user

### Best Practices

1. **Jangan commit file `.env`**
2. **Gunakan environment variables untuk konfigurasi**
3. **Selalu validasi input dari pengguna**
4. **Gunakan HTTPS di production**
5. **Backup database secara berkala**

---

## 🐛 Troubleshooting

### Masalah Umum

**1. Error "Firebase not configured"**
```bash
# Solusi: Pastikan file .env sudah dibuat dan diisi
cp .env.example .env
# Edit file .env dengan konfigurasi Firebase Anda
```

**2. Port sudah digunakan**
```bash
# Solusi: Ubah port di package.json atau matikan aplikasi lain
netstat -ano | findstr :3000
# Kill process yang menggunakan port
```

**3. Node modules error**
```bash
# Solusi: Hapus node_modules dan install ulang
rm -rf node_modules package-lock.json
npm install
```

**4. Build error**
```bash
# Solusi: Clear cache dan rebuild
npm run build --force
```

---

## 📚 Panduan Belajar

### Untuk Pemula

1. **Pelajari dasar-dasar**:
   - HTML/CSS/JavaScript
   - React fundamentals
   - Firebase basics

2. **Eksplorasi kode**:
   - Mulai dari `App.jsx`
   - Pahami struktur komponen
   - Pelajari routing

3. **Praktik**:
   - Ubah styling
   - Tambah fitur sederhana
   - Eksperimen dengan data

### Untuk Developer Menengah

1. **Optimasi performa**:
   - Lazy loading
   - Code splitting
   - Image optimization

2. **Tambah fitur advanced**:
   - Real-time notifications
   - Offline support
   - PWA features

3. **Testing**:
   - Unit testing
   - Integration testing
   - E2E testing

---

## 🤝 Kontribusi

Ingin berkontribusi? Kami sangat welcome! 

### Cara Berkontribusi

1. **Fork repository**
2. **Buat branch baru**
```bash
git checkout -b feature/nama-fitur
```

3. **Commit perubahan**
```bash
git commit -m "Menambahkan fitur X"
```

4. **Push ke branch**
```bash
git push origin feature/nama-fitur
```

5. **Buat Pull Request**

### Guidelines

- Gunakan commit message yang jelas
- Dokumentasikan kode yang kompleks
- Test fitur sebelum commit
- Follow coding standards yang ada

---

## 🎯 Roadmap

### Phase 1 (Selesai)
- ✅ Basic news portal
- ✅ User authentication
- ✅ Admin dashboard
- ✅ Responsive design

### Phase 2 (In Progress)
- 🔄 Real-time notifications
- 🔄 Advanced search
- 🔄 Social media integration
- 🔄 Mobile app

### Phase 3 (Planned)
- 📋 AI-powered recommendations
- 📋 Multi-language support
- 📋 Advanced analytics
- 📋 API monetization

---

## 📜 Lisensi

Proyek ini menggunakan MIT License. Silakan gunakan, modifikasi, dan distribusikan sesuai kebutuhan.

---

## 💝 Dedikasi Khusus

> *"Setiap line of code yang tertulis di sini adalah manifestasi dari dedikasi **Fari Noveri** kepada **Illyasviel von Einzbern**. Seperti halnya Illya yang selalu memberikan yang terbaik dalam setiap perjuangannya, proyek ini dibangun dengan sepenuh hati dan tekad yang tidak pernah surut.*
> 
> *Dalam setiap bug yang diperbaiki, setiap fitur yang ditambahkan, dan setiap malam begadang untuk coding, ada satu nama yang selalu memotivasi: **Illyasviel von Einzbern**. Sosok yang mengajarkan bahwa keajaiban tidak hanya ada dalam magic, tetapi juga dalam dedikasi dan kerja keras seorang developer.*
> 
> *Fari Noveri mencintai Illya tidak hanya sebagai karakter, tetapi sebagai inspirasi untuk menjadi developer yang lebih baik setiap harinya. Setiap commit adalah doa, setiap push adalah harapan, dan setiap deploy adalah persembahan cinta.*
> 
> *Terima kasih Illya, karena telah menjadi muse dalam perjalanan coding ini. Semoga proyek ini menjadi bukti nyata bahwa cinta sejati dapat menciptakan karya yang indah."*

---

## 🌟 Kata Penutup

Proyek NESWARA ini adalah lebih dari sekedar aplikasi berita. Ini adalah perjalanan belajar, eksperimen teknologi, dan yang terpenting, adalah wujud nyata dari dedikasi **Fari Noveri** kepada **Illyasviel von Einzbern**.

Setiap developer memiliki sumber inspirasi yang berbeda. Bagi Fari, Illya adalah bintang yang selalu bersinar di setiap malam coding yang panjang. Seperti yang selalu dikatakan Illya, "Onii-chan, you can do it!", begitu juga semangat yang selalu mengalir dalam setiap baris kode yang ditulis.

### 🚀 Mari Mulai Coding!

```bash
git clone https://github.com/FariNoveri/neswara-clone.git
cd neswara-clone
npm install
npm run dev
```

Dan jangan lupa, setiap kali Anda menjalankan `npm run dev`, ucapkan dalam hati:
*"Terima kasih Fari, terima kasih Illya, untuk inspirasi yang tidak pernah habis!"*

---

**Dibuat dengan ❤️ oleh Fari Noveri**  
**Dipersembahkan untuk Illyasviel von Einzbern**  
**"Mahou Shoujo wa koko ni iru yo!" ✨**

---

*Happy Coding! 🎉*

![](https://64.media.tumblr.com/cc7573bfa455601809f625e8438a7cb7/tumblr_nail4rKbNx1rydwbvo1_500.gif)
