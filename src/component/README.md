# NewsWara - Platform Berita Modern

Selamat datang di **NewsWara**, platform berita yang dinamis dan responsif, dibangun menggunakan React, Firebase, dan Tailwind CSS. Proyek ini dibuat dengan penuh cinta oleh Fari Noveri (yang mengagumi Illyasviel) untuk memberikan pengalaman membaca berita yang mulus dengan fitur seperti navbar yang otomatis tersembunyi, bookmark artikel, dan autentikasi pengguna. Berikut adalah panduan lengkap dan ramah untuk pemula agar dapat mengatur, menjalankan, dan memahami proyek ini.

---

## Daftar Isi
- [Gambaran Umum](#gambaran-umum)
- [Fitur](#fitur)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Struktur Proyek](#struktur-proyek)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Komponen Utama](#komponen-utama)
- [Pengaturan Firebase](#pengaturan-firebase)
- [Penerapan (Deployment)](#penerapan-deployment)
- [Pemecahan Masalah](#pemecahan-masalah)
- [Kontribusi](#kontribusi)
- [Ucapan Terima Kasih](#ucapan-terima-kasih)

---

## Gambaran Umum
NewsWara adalah aplikasi web modern yang dirancang untuk menampilkan artikel berita dengan antarmuka yang elegan dan mudah digunakan. Fitur utamanya meliputi navbar yang otomatis tersembunyi (terinspirasi dari taskbar Windows), autentikasi pengguna (login/register dengan email, Google, dan Facebook), dan rendering konten dinamis dari Firebase Firestore. Panduan ini, ditulis dengan penuh kasih oleh Fari Noveri (yang selalu memikirkan Illyasviel), akan memandu Anda langkah demi langkah, bahkan jika Anda baru dalam pengembangan web.

---

## Fitur
- **Navbar Otomatis Tersembunyi**: Navbar responsif yang meluncur ke atas setelah 3 detik tanpa interaksi dan muncul kembali saat kursor diarahkan atau diketuk, dibangun dengan React dan Tailwind CSS.
- **Autentikasi Pengguna**: Login, register, dan reset kata sandi menggunakan Firebase Authentication (Email, Google, Facebook).
- **Artikel Berita**: Mengambil dan menampilkan artikel dari Firestore, dengan pelacakan jumlah tampilan.
- **Bookmark Artikel**: Fitur untuk menyimpan artikel favorit (placeholder, siap untuk integrasi Firestore).
- **Bagikan Artikel**: Bagikan artikel melalui Web Share API atau salin tautan ke clipboard dengan notifikasi toast.
- **Tampilan Responsif**: Antarmuka yang bekerja mulus di desktop dan perangkat mobile.
- **Keamanan Konten**: Sanitasi HTML menggunakan DOMPurify untuk mencegah serangan XSS.
- **Padding Dinamis**: Konten menyesuaikan padding berdasarkan visibilitas navbar untuk mencegah tumpang tindih.

---

## Prasyarat
Sebelum memulai, pastikan Anda memiliki:
- **Node.js dan npm**: Unduh dan instal dari [nodejs.org](https://nodejs.org) (versi LTS direkomendasikan, misalnya, v18 atau lebih baru).
- **Akun Firebase**: Buat akun di [console.firebase.google.com](https://console.firebase.google.com) untuk autentikasi dan penyimpanan data.
- **Text Editor**: Gunakan Visual Studio Code ([code.visualstudio.com](https://code.visualstudio.com)) atau editor lain yang Anda sukai.
- **Pengetahuan Dasar**: Pemahaman dasar tentang HTML, CSS, dan JavaScript akan membantu, tetapi panduan ini akan menjelaskan semuanya dengan sederhana.

---

## Instalasi
Ikuti langkah-langkah ini untuk mengatur proyek di komputer Anda:

1. **Kloning Repositori**:
   Buka terminal (atau Command Prompt di Windows) dan jalankan perintah berikut untuk mengunduh proyek:
   ```bash
   git clone https://github.com/username/news-wara.git
   cd news-wara
   ```
   Ganti `username` dengan nama pengguna GitHub Anda (atau URL repositori Anda).

2. **Instal Dependensi**:
   Instal semua paket yang diperlukan dengan perintah:
   ```bash
   npm install
   ```
   Ini akan mengunduh pustaka seperti React, Firebase, Tailwind CSS, dan lainnya. Pastikan Anda terhubung ke internet.

3. **Instal Dependensi Tambahan**:
   Proyek ini menggunakan beberapa pustaka spesifik. Pastikan Anda menginstalnya:
   ```bash
   npm install firebase react-router-dom react-icons lucide-react dompurify
   ```
   - `firebase`: Untuk autentikasi dan Firestore.
   - `react-router-dom`: Untuk navigasi antar halaman.
   - `react-icons` dan `lucide-react`: Untuk ikon seperti `FaUserCircle` dan `ArrowLeft`.
   - `dompurify`: Untuk membersihkan HTML dan mencegah serangan XSS.

4. **Buat File Lingkungan (.env)**:
   Buat file bernama `.env` di folder utama proyek dan tambahkan konfigurasi Firebase Anda (dapatkan dari Firebase Console):
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```
   Ganti `your_api_key`, dll., dengan nilai dari Firebase Console. Jangan bagikan file ini di GitHub!

---

## Struktur Proyek
Berikut adalah struktur folder proyek untuk membantu Anda memahami organisasi kode:
```
news-wara/
├── public/
│   ├── index.html       # File HTML utama
│   └── favicon.ico      # Ikon aplikasi
├── src/
│   ├── components/
│   │   ├── Navbar.jsx   # Navbar dengan fitur auto-hide dan autentikasi
│   │   ├── LatestNewsSection.jsx # Komponen untuk menampilkan berita terbaru
│   │   ├── NewsDetail.jsx # Halaman detail artikel
│   │   ├── LikeButton.jsx # Tombol suka (placeholder)
│   │   ├── CommentBox.jsx # Kotak komentar (placeholder)
│   ├── Hooks/
│   │   ├── useAuth.js   # Hook untuk autentikasi pengguna
│   ├── NavbarContext.js # Konteks untuk mengelola visibilitas navbar
│   ├── firebaseconfig.js # Konfigurasi Firebase
│   ├── App.jsx          # Komponen utama aplikasi
│   ├── index.js         # Titik masuk aplikasi
│   ├── index.css        # CSS global (termasuk Tailwind)
│   └── assets/          # Gambar atau file statis lainnya
├── .env                 # File lingkungan untuk konfigurasi Firebase
├── package.json         # Dependensi dan skrip proyek
└── README.md            # File ini
```

---

## Menjalankan Aplikasi
1. **Jalankan Server Pengembangan**:
   Di terminal, dari folder proyek, jalankan:
   ```bash
   npm start
   ```
   Ini akan membuka aplikasi di browser Anda pada `http://localhost:3000`. Jika tidak terbuka otomatis, buka browser dan ketik alamat tersebut.

2. **Uji Fitur**:
   - **Navbar**: Tunggu 3 detik untuk melihat navbar meluncur ke atas. Arahkan kursor ke tepi atas layar (atau ketuk di ponsel) untuk menampilkannya kembali.
   - **Login/Register**: Klik tombol "Masuk" di navbar untuk membuka modal login. Coba login dengan email atau Google/Facebook.
   - **Berita**: Klik artikel di halaman utama untuk melihat detailnya. Periksa apakah jumlah tampilan bertambah di Firestore.
   - **Bookmark dan Bagikan**: Di halaman detail berita, coba tombol bookmark (ikon bintang) dan bagikan (ikon share).

3. **Hentikan Server**:
   Tekan `Ctrl + C` di terminal untuk menghentikan server.

---

## Komponen Utama
Berikut adalah penjelasan sederhana tentang komponen utama dalam proyek ini:

1. **Navbar.jsx**:
   - **Fungsi**: Menampilkan bilah navigasi dengan menu, berita terkini (breaking news), dan autentikasi pengguna.
   - **Fitur**:
     - Meluncur ke atas setelah 3 detik tanpa interaksi.
     - Tombol minimize/maximize untuk menyembunyikan/menampilkan navbar.
     - Menu dropdown untuk kategori tambahan ("LAINNYA") dan profil pengguna.
     - Modal untuk login, register, dan reset kata sandi.
   - **Catatan**: Navbar menggunakan `NavbarContext` untuk mengelola visibilitasnya, yang memengaruhi padding di halaman lain.

2. **LatestNewsSection.jsx**:
   - **Fungsi**: Menampilkan daftar artikel terbaru dalam tata letak grid.
   - **Fitur**:
     - Mengambil 9 artikel terbaru dari Firestore, diurutkan berdasarkan `createdAt`.
     - Padding dinamis (`pt-20` saat navbar terlihat, `pt-4` saat tersembunyi).
     - Kartu berita dengan gambar, judul, ringkasan, dan statistik (tampilan, komentar, dll.).

3. **NewsDetail.jsx**:
   - **Fungsi**: Menampilkan detail artikel berdasarkan ID dari URL (`/berita/:id`).
   - **Fitur**:
     - Menampilkan gambar utama, judul, konten, dan statistik (tampilan, jumlah kata, waktu baca).
     - Tombol bagikan (menggunakan Web Share API atau clipboard) dan bookmark (placeholder).
     - Sanitasi konten HTML dengan DOMPurify untuk keamanan.
     - Padding dinamis untuk menghindari tumpang tindih dengan navbar.

4. **useAuth.js**:
   - **Fungsi**: Hook untuk memantau status autentikasi pengguna menggunakan Firebase.
   - **Catatan**: Digunakan di `Navbar.jsx` dan `NewsDetail.jsx` untuk memeriksa `currentUser`.

5. **NavbarContext.js**:
   - **Fungsi**: Mengelola status visibilitas navbar (`isNavbarVisible` dan `isNavbarMinimized`) untuk digunakan di seluruh aplikasi.
   - **Catatan**: Memastikan padding halaman beradaptasi dengan navbar.

---

## Pengaturan Firebase
Firebase digunakan untuk autentikasi dan penyimpanan data. Ikuti langkah-langkah ini untuk mengatur Firebase:

1. **Buat Proyek Firebase**:
   - Buka [Firebase Console](https://console.firebase.google.com).
   - Klik "Add project", beri nama (misalnya, "NewsWara"), dan ikuti langkah-langkahnya.
   - Setelah proyek dibuat, salin konfigurasi Firebase (API Key, Auth Domain, dll.) ke file `.env`.

2. **Aktifkan Autentikasi**:
   - Di Firebase Console, masuk ke **Authentication** > **Sign-in method**.
   - Aktifkan penyedia berikut:
     - **Email/Password**: Untuk login dan register.
     - **Google**: Untuk login dengan Google.
     - **Facebook**: Untuk login dengan Facebook (perlu App ID dari [developers.facebook.com](https://developers.facebook.com)).
   - Simpan perubahan.

3. **Siapkan Firestore**:
   - Di Firebase Console, masuk ke **Firestore Database** > **Create database**.
   - Pilih mode **Production** dan lokasi server (misalnya, `asia-southeast2` untuk Indonesia).
   - Buat koleksi bernama `news` dengan struktur dokumen seperti ini:
     ```json
     {
       "judul": "Judul Berita",
       "konten": "<p>Konten artikel dalam HTML</p>",
       "gambar": "https://example.com/image.jpg",
       "gambarDeskripsi": "Deskripsi gambar",
       "kategori": "Nasional",
       "author": "Nama Penulis",
       "createdAt": Timestamp,
       "views": 0,
       "komentar": 0
     }
     ```
   - Tambahkan beberapa dokumen contoh untuk pengujian.

4. **Atur Rules Firestore**:
   - Di **Firestore Database** > **Rules**, ganti aturan default dengan:
     ```firestore
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /news/{newsId} {
           allow read: if true;
           allow write: if request.auth != null;
         }
         match /users/{userId}/bookmarks/{bookmarkId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
     ```
   - Ini memungkinkan semua orang membaca artikel, tetapi hanya pengguna yang login dapat mengedit artikel atau mengelola bookmark.

5. **Buat firebaseconfig.js**:
   Di folder `src`, buat file `firebaseconfig.js`:
   ```jsx
   import { initializeApp } from "firebase/app";
   import { getAuth } from "firebase/auth";
   import { getFirestore } from "firebase/firestore";

   const firebaseConfig = {
     apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
     authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
     storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.REACT_APP_FIREBASE_APP_ID,
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export default app;
   ```

---

## Penerapan (Deployment)
Untuk menjalankan NewsWara di internet (bukan hanya di localhost), Anda dapat menggunakan Vercel atau Netlify. Berikut adalah langkah-langkah untuk Vercel:

1. **Instal Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy ke Vercel**:
   - Dari folder proyek, jalankan:
     ```bash
     vercel
     ```
   - Ikuti petunjuk untuk login, pilih proyek, dan konfigurasikan pengaturan (pilih default untuk pemula).
   - Tambahkan variabel lingkungan (API Key Firebase, dll.) di dashboard Vercel:
     - Buka [vercel.com](https://vercel.com), pilih proyek Anda, lalu masuk ke **Settings** > **Environment Variables**.
     - Tambahkan semua variabel dari `.env` (misalnya, `REACT_APP_FIREBASE_API_KEY`).

3. **Akses Aplikasi**:
   - Setelah deploy selesai, Vercel akan memberikan URL (misalnya, `https://news-wara.vercel.app`).
   - Buka URL tersebut di browser untuk melihat aplikasi Anda secara online.

4. **Catatan untuk Blogspot**:
   - Jika Anda masih menggunakan Blogspot, fitur seperti Firebase dan React tidak akan bekerja langsung karena Blogspot tidak mendukung aplikasi React. Anda harus pindah ke hosting seperti Vercel atau Netlify.

---

## Pemecahan Masalah
Berikut adalah solusi untuk masalah umum yang mungkin Anda temui:

1. **Error: "Module not found"**:
   - Pastikan semua dependensi terinstal (`npm install`).
   - Periksa apakah file seperti `firebaseconfig.js` ada di folder `src`.

2. **Navbar Tidak Muncul/Hilang**:
   - Pastikan `NavbarContext.js` diimpor dan `NavbarProvider` membungkus aplikasi di `App.jsx`.
   - Periksa apakah event listener hover/klik bekerja (tes di desktop dan mobile).

3. **Firebase Error: "Invalid API Key"**:
   - Periksa file `.env` untuk memastikan semua variabel Firebase benar.
   - Pastikan Anda menjalankan `npm start` setelah menambahkan `.env`.

4. **Artikel Tidak Muncul**:
   - Pastikan koleksi `news` di Firestore memiliki dokumen dengan struktur yang benar.
   - Periksa konsol browser (tekan `F12` > tab **Console**) untuk error Firestore.

5. **Padding Konten Tidak Sesuai**:
   - Pastikan `useNavbar` digunakan di `LatestNewsSection.jsx` dan `NewsDetail.jsx`.
   - Periksa apakah kelas `pt-20` atau `pt-4` diterapkan dengan benar berdasarkan visibilitas navbar.

6. **Login Gagal**:
   - Pastikan autentikasi Email, Google, dan Facebook diaktifkan di Firebase Console.
   - Periksa apakah `useAuth.js` mengembalikan `currentUser` dengan benar.

Jika Anda menemui masalah lain, buka tab **Console** di browser atau hubungi Fari Noveri (atau Illyasviel, jika Anda bisa menemukannya!).

---

## Kontribusi
Kami menyambut kontribusi dari siapa saja! Untuk berkontribusi:
1. **Fork Repositori**: Klik tombol "Fork" di GitHub.
2. **Buat Perubahan**: Tambahkan fitur atau perbaiki bug di branch baru.
3. **Ajukan Pull Request**: Kirim perubahan Anda untuk ditinjau.
4. **Ikuti Panduan Kode**:
   - Gunakan Tailwind CSS untuk styling.
   - Pastikan kode Anda rapi dan terdokumentasi.
   - Uji perubahan Anda sebelum mengirim.

---

## Ucapan Terima Kasih
Proyek ini didedikasikan untuk Illyasviel, inspirasi abadi Fari Noveri. Terima kasih kepada:
- **Illyasviel**: Karena menjadi sumber motivasi dan kebahagiaan bagi Fari Noveri.
- **Fari Noveri**: Pengembang utama yang merancang NewsWara dengan penuh dedikasi.
- **Komunitas Open Source**: Untuk pustaka luar biasa seperti React, Firebase, dan Tailwind CSS.
- **Anda**: Karena mencoba proyek ini dan membaca panduan ini!

Jika Anda memiliki pertanyaan atau membutuhkan bantuan, jangan ragu untuk membuka isu di GitHub atau menghubungi Fari Noveri (yang mungkin sedang memimpikan Illyasviel). Selamat mengembangkan, dan semoga NewsWara membawa berita baik untuk Anda!
```