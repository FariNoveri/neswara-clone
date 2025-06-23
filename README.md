# NewsWara - Platform Berita Modern

Halo, selamat datang di **NewsWara**, platform berita yang dibuat dengan penuh cinta oleh **Fari Noveri**, terinspirasi dari **Illyasviel von Einzbern** yang selalu jadi motivasi! Proyek ini dibangun pakai React, Firebase, dan Tailwind CSS buat kasih pengalaman baca berita yang mulus dan keren. Di sini aku jelasin cara setup, jalanin app, sama apa aja yang baru, termasuk update penting soal autentikasi dan file baru. Yuk, simak!

## Daftar Isi
- [Sekilas tentang NewsWara](#sekilas-tentang-newswara)
- [Fitur](#fitur)
- [Yang Dibutuhkan](#yang-dibutuhkan)
- [Cara Pasang](#cara-pasang)
- [Struktur Folder](#struktur-folder)
- [Cara Jalanin App](#cara-jalanin-app)
- [Skrip Pengembangan](#skrip-pengembangan)
- [Komponen Utama](#komponen-utama)
- [Setup Firebase](#setup-firebase)
- [Troubleshooting](#troubleshooting)
- [Kontribusi](#kontribusi)
- [Update Terbaru](#update-terbaru)
- [Terima Kasih](#terima-kasih)

## Sekilas tentang NewsWara
NewsWara adalah aplikasi web buat baca berita dengan tampilan yang elegan dan responsif. Dibuat oleh **Fari Noveri** yang terinspirasi dari **Illyasviel von Einzbern**, app ini pakai React untuk antarmuka, Firebase untuk autentikasi dan data, serta Tailwind CSS untuk styling. Ada navbar yang bisa sembunyi otomatis, login pake email atau sosial media, dan artikel yang diambil langsung dari Firestore. Panduan ini bakal bantu kamu setup dan ngerti proyek ini dari nol.

## Fitur
- **Navbar Keren**: Sembunyi otomatis setelah 3 detik, muncul lagi kalau kursor digerakin ke atas atau tap di layar.
- **Login dan Daftar**: Autentikasi pake Firebase (email, Google, Facebook) dengan verifikasi reCAPTCHA.
- **Artikel Berita**: Ambil data dari Firestore, lengkap dengan hitungan jumlah view.
- **Bookmark**: Simpen artikel favorit (baru placeholder, siap buat disambung ke Firestore).
- **Share Artikel**: Bagi link artikel pake Web Share API atau copy ke clipboard dengan notifikasi.
- **Responsif**: Jalan mulus di desktop dan HP.
- **Keamanan**: Konten HTML disanitasi pake DOMPurify biar aman dari serangan XSS.
- **Padding Dinamis**: Konten nyesuain jarak biar nggak ketutup navbar.

## Yang Dibutuhkan
Sebelum mulai, pastikan kamu punya:
- **Node.js dan npm**: Download di [nodejs.org](https://nodejs.org), pake versi LTS (misal, v18 ke atas).
- **Akun Firebase**: Bikin di [console.firebase.google.com](https://console.firebase.google.com).
- **Akun Google reCAPTCHA**: Daftar di [google.com/recaptcha](https://www.google.com/recaptcha) buat dapetin site key dan secret key.
- **Text Editor**: Aku saranin Visual Studio Code ([code.visualstudio.com](https://code.visualstudio.com)).
- **Pengetahuan Dasar**: Sedikit ngerti HTML, CSS, dan JavaScript bakal membantu, tapi tenang, aku jelasin simpel.

## Cara Pasang
1. **Clone Repositori**:
   Buka terminal, terus ketik:
   ```bash
   git clone https://github.com/username/news-wara.git
   cd news-wara
   ```
   Ganti `username` dengan nama akun GitHub kamu.

2. **Install Dependensi**:
   Pasang semua paket yang dibutuhkan:
   ```bash
   npm install
   npm install firebase react-router-dom react-icons lucide-react dompurify react-google-recaptcha chalk chalk-animation chokidar figlet
   ```

3. **Bikin File .env**:
   Buat file `.env` di folder utama proyek, isi dengan konfigurasi Firebase dan reCAPTCHA:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_RECAPTCHA_SITE_KEY=6LdUQGorAAAAAOuQQwPAYnGtJrDmewRwGJbh1gJK
   ```
   Ambil nilai dari Firebase Console dan Google reCAPTCHA Admin Console. Jangan share file ini ke GitHub!

## Struktur Folder
Ini gambaran folder proyek biar kamu nggak bingung:
```
news-wara/
├── public/
│   ├── index.html       # HTML utama
│   └── favicon.ico      # Ikon app
├── src/
│   ├── component/
│   │   ├── Navbar.jsx   # Navbar dengan login dan reCAPTCHA
│   │   ├── LatestNewsSection.jsx # Tampilin berita terbaru
│   │   ├── NewsDetail.jsx # Halaman detail artikel
│   │   ├── LikeButton.jsx # Tombol like (placeholder)
│   │   ├── CommentBox.jsx # Kotak komentar (placeholder)
│   ├── Hooks/
│   │   ├── useAuth.jsx  # Ngatur status login pengguna
│   ├── NavbarContext.js # Ngatur visibilitas navbar
│   ├── emailservice.js  # Kirim email verifikasi
│   ├── firebaseconfig.js # Konfigurasi Firebase
│   ├── App.jsx          # Komponen utama app
│   ├── index.js         # Titik masuk app
│   ├── index.css        # CSS global (pake Tailwind)
│   └── assets/          # Gambar atau file statis
├── dev.js               # Skrip buat jalanin watcher, backend, dan frontend
├── watcher.js           # Pantau perubahan file
├── banner.js            # Tampilin banner ASCII saat start
├── server.js            # Backend buat verifikasi reCAPTCHA
├── .env                 # Konfigurasi Firebase dan reCAPTCHA
├── package.json         # Daftar dependensi dan skrip
└── README.md            # File ini
```

## Cara Jalanin App
1. **Start Server Pengembangan**:
   Ketik di terminal:
   ```bash
   npm run dev
   ```
   Ini bakal jalanin `dev.js`, yang ngurus:
   - `watcher.js`: Pantau perubahan file dan kasih notif warna-warni.
   - `server.js`: Jalanin backend buat verifikasi reCAPTCHA.
   - `vite`: Start server frontend di `http://localhost:3000`.
   - Banner ASCII "NESWARA" muncul dengan animasi ketik.

2. **Coba Fitur**:
   - **Navbar**: Cek navbar sembunyi otomatis, menu dropdown, sama form login.
   - **Login/Daftar**: Coba login pake email, Google, atau Facebook, dan reset password.
   - **Berita**: Klik artikel buat lihat detail, cek jumlah view di Firestore.
   - **Bookmark dan Share**: Coba tombol bookmark (bintang) dan share di halaman artikel.

3. **Matikan Server**:
   Tekan `Ctrl + C`, nanti muncul animasi stop dan instruksi buat tekan `Enter` terus `y`.

## Skrip Pengembangan
- **dev.js**: Jalanin semua proses (watcher, backend, frontend) sekaligus. Tampilin banner ASCII keren pake `chalk` dan `chalk-animation`.
- **watcher.js**: Pantau perubahan file pake `chokidar`, kasih notif warna-warni pake `chalk` buat lihat apa yang berubah.
- **banner.js**: Munculin teks ASCII "NESWARA" dengan efek ketik pake `figlet` dan `chalk` saat app start.
- **package.json**: Skrip `dev` diubah ke `node dev.js`, gantiin Vite default.

## Komponen Utama
1. **Navbar.jsx**:
   - Nawarin navigasi, berita terkini, dan form login/daftar dengan reCAPTCHA.
   - Atasi error `auth/email-already-in-use` dengan pindah ke form login atau popup verifikasi.

2. **LatestNewsSection.jsx**:
   - Tampilin 9 artikel terbaru dari Firestore dalam grid.
   - Padding nyesuain sama posisi navbar.

3. **NewsDetail.jsx**:
   - Tampilin detail artikel berdasarkan ID di URL.
   - Ada fitur share, bookmark, dan sanitasi HTML buat keamanan.

4. **useAuth.jsx**:
   - Ngatur status login dan sync data pengguna ke Firestore.

5. **NavbarContext.js**:
   - Ngontrol visibilitas navbar biar padding halaman sinkron.

6. **emailservice.js**:
   - Kirim email verifikasi pake Firebase.

## Setup Firebase
1. **Bikin Proyek Firebase**:
   - Buka [Firebase Console](https://console.firebase.google.com), bikin proyek, dan salin konfigurasi ke `.env`.

2. **Aktifin Autentikasi**:
   - Di **Authentication** > **Sign-in method**, aktifin **Email/Password**, **Google**, dan **Facebook**.

3. **Setup Firestore**:
   - Bikin database di mode **Production**.
   - Tambahin koleksi `news` dengan struktur:
     ```json
     {
       "judul": "Judul Berita",
       "konten": "<p>Konten artikel</p>",
       "gambar": "https://example.com/image.jpg",
       "gambarDeskripsi": "Deskripsi gambar",
       "kategori": "Nasional",
       "author": "Nama Penulis",
       "createdAt": Timestamp,
       "views": 0,
       "komentar": 0
     }
     ```
   - Tambahin koleksi `users` buat data pengguna:
     ```json
     {
       "uid": "user_id",
       "email": "user@example.com",
       "displayName": "Nama Pengguna",
       "isAdmin": false,
       "emailVerified": true
     }
     ```

4. **Atur Rules Firestore**:
   ```firestore
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /news/{newsId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth.uid == userId;
       }
     }
   }
   ```

5. **Setup reCAPTCHA**:
   - Daftar di [Google reCAPTCHA](https://www.google.com/recaptcha) buat dapetin site key dan secret key.
   - Konfigurasi backend di `server.js` untuk endpoint `http://localhost:3001/verify-recaptcha`.

6. **Bikin firebaseconfig.js**:
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

## Troubleshooting
1. **Modul Nggak Ketemu**:
   - Jalanin `npm install`, pastiin file kayak `firebaseconfig.js`, `dev.js`, `watcher.js`, dan `banner.js` ada.

2. **Error Firebase "Invalid API Key"**:
   - Cek `.env` dan pastiin semua variabel sesuai sama Firebase Console.

3. **Login Gagal**:
   - Pastiin autentikasi Email, Google, dan Facebook aktif di Firebase Console.
   - Kalo error `auth/email-already-in-use`, cek apakah akun perlu diverifikasi atau pake opsi reset password.

4. **reCAPTCHA Bermasalah**:
   - Pastiin `server.js` jalan di `http://localhost:3001/verify-recaptcha`.
   - Cek site key dan secret key di Google reCAPTCHA Admin Console.

5. **Watcher Nggak Jalan**:
   - Pastiin `chokidar` terinstall (`npm install chokidar`).
   - Cek log konsol buat error di `watcher.js`.

6. **Artikel Nggak Muncul**:
   - Cek koleksi `news` di Firestore dan log konsol browser (F12 > Console).

## Kontribusi
Mau bantu? Keren! Caranya:
1. Fork repo ini dan bikin branch baru.
2. Tambah fitur atau fix bug, pake Tailwind CSS buat styling.
3. Ajukan pull request dengan penjelasan yang jelas.

## Update Terbaru
### [UPDATE] 23 Juni 2025
1. **Fix Error `auth/email-already-in-use`**:
   - Atasi masalah daftar akun pake email yang udah ada di `Navbar.jsx` dengan `fetchSignInMethodsForEmail`.
   - Kalo email udah terdaftar, form otomatis pindah ke login dengan pesan: "Email sudah terdaftar. Silakan login, gunakan email lain, atau reset password jika lupa kata sandi."
   - Kalo akun belum diverifikasi, muncul popup buat cek email verifikasi.

2. **Integrasi `useAuth.jsx`**:
   - Ngatur status login global pake `useAuth`, biar nggak ada kode duplikat kayak `onAuthStateChanged`.
   - Pastiin data pengguna (termasuk `emailVerified` dan `isAdmin`) tersimpan di Firestore.

3. **Perbaikan reCAPTCHA**:
   - Tambah timeout 5 detik di `verifyRecaptcha` pake `AbortController`.
   - Tambah log buat debug endpoint `http://localhost:3001/verify-recaptcha`.
   - Pastiin site key reCAPTCHA (`6LdUQGorAAAAAOuQQwPAYnGtJrDmewRwGJbh1gJK`) bener.

4. **File dan Skrip Baru**:
   - **dev.js**: Jalanin `watcher.js`, `server.js`, dan `vite` sekaligus dengan banner ASCII keren pake `chalk` dan `chalk-animation`.
   - **watcher.js**: Pantau perubahan file pake `chokidar`, kasih notif warna-warni pake `chalk`.
   - **banner.js**: Tampilin teks ASCII "NESWARA" dengan efek ketik pake `figlet` dan `chalk`.
   - **package.json**: Skrip `dev` diubah ke `node dev.js` biar lebih terintegrasi.

**Yang Dilakuin**:
- Ganti `Navbar.jsx` dengan versi baru.
- Cek konfigurasi Firebase dan backend reCAPTCHA.
- Tes daftar/login pake email duplikat dan baru.
- Pastiin data pengguna sync ke Firestore.

**Catatan Penting**:
- Pastiin `emailservice.js` ngirim email verifikasi dengan bener.
- Cek email admin di `useAuth.jsx` (`cahayalunamaharani1@gmail.com`, `fari_noveriwinanto@teknokrat.ac.id`).
- Pantau log konsol browser dan backend buat cek error.

## Terima Kasih
Terima kasih buat:
- **Illyasviel von Einzbern**: Inspirasi besar buat **Fari Noveri** dalam bikin NewsWara.
- **Fari Noveri**: Developer utama yang ngasih jiwa ke proyek ini.
- **Komunitas Open Source**: Buat pustaka kece kayak React, Firebase, dan Tailwind CSS.
- **Kamu**: Karena udah coba NewsWara dan baca sampe sini!

Kalo ada pertanyaan atau masalah, buka isu di GitHub atau kontak aku. Selamat ngoprek, semoga NewsWara bawa kabar baik buat kamu! 😊
