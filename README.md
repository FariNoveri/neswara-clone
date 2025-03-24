# Neswara Clone

**Neswara Clone** adalah replika sederhana dari platform berita **Neswara** yang dibangun menggunakan **React.js** dan **Firebase**.

## ✨ Fitur

- 🔐 **Login & Register**
  - Login dengan **Email & Password**
  - Login dengan **Google** & **Facebook**
- 📰 **Kategori Berita**
  - Lifestyle, Education, Region, Sport, Tour & Travel, National, Business
- 🎨 **Desain Responsif**
  - Menggunakan **Tailwind CSS**

## 🚀 Cara Menjalankan Proyek

### 1️⃣ Clone Repository
```sh
git clone https://github.com/FariNoveri/neswara-clone.git
```

2️⃣ Masuk ke Direktori Proyek
```sh
cd neswara-clone
```

3️⃣ Install Dependencies
```sh
npm install
```

4️⃣ Jalankan Proyek
```sh
npm start
```
5️⃣ akses proyek 
buka chrome lalu ketikkan 
```sh
http://localhost:5173/
```

🛠 Teknologi yang Digunakan
1. Frontend: React.js + Tailwind CSS
2. Backend/Auth: Firebase Authentication
3. Hosting: Firebase Hosting
4. Hosting Website : Vercel

🏗️ Cara Kontribusi
1. Fork repo ini

2. Clone repo hasil fork
```sh
git clone https://github.com/username-kamu/neswara-clone.git
```

3. Buat branch baru
```sh
git checkout -b fitur-baru
```

4.Lakukan Perubahan dan commit
```sh
git add .
git commit -m "Menambahkan fitur baru"
```

5. Push ke github
```sh
git push origin fitur-baru
```

6. Buat Pull Request



## 🛠️ Setup Project
Ikuti langkah-langkah berikut untuk menjalankan proyek ini di lokal dan mencegah error saat deploy ke Vercel.

### 1️⃣ Clone Repository
```sh
git clone https://github.com/FariNoveri/neswara-clone.git
cd neswara-clone
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Buat File `.env`
Buat file `.env` di root project dengan isi sebagai berikut:
```env
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_PROJECT_ID=your_firebase_project_id
VITE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_APP_ID=your_firebase_app_id
VITE_MEASUREMENT_ID=your_firebase_measurement_id
```
> **Jangan lupa:** Masukkan informasi yang sesuai dari Firebase Console kamu.

### 4️⃣ Pastikan **Authorized Domains** di Firebase Sudah Didaftarkan
1. Buka **Firebase Console** → **Authentication** → **Sign-in Method**
2. Scroll ke bawah, cari **Authorized domains**
3. Tambahkan domain berikut:
   - `localhost`
   - `your-vercel-deployment-url.vercel.app`

### 5️⃣ Jalankan Aplikasi Secara Lokal
```sh
npm run dev
```
Buka browser dan akses `http://localhost:5173`

## 🚀 Deploy ke Vercel

### 1️⃣ Tambahkan Environment Variables di Vercel
1. Buka **Vercel Dashboard** → **Project Settings** → **Environment Variables**
2. Tambahkan semua variable dari file `.env` secara manual di Vercel.

### 2️⃣ Deploy dengan Vercel CLI
```sh
vercel
```
Atau gunakan perintah ini untuk build production:
```sh
vercel --prod
```

### 3️⃣ Periksa Domain di Firebase
Pastikan domain **vercel.app** sudah masuk di **Authorized Domains** Firebase agar login tidak error.

## 🛠 Troubleshooting
### 🔴 **Firebase: Error (auth/unauthorized-domain)**
**Solusi:**
- Pastikan domain Vercel sudah ditambahkan di **Firebase Authorized Domains**
- Jangan lupa tambahkan **localhost** jika testing di lokal

### 🔴 **Gagal Login dengan Google/Facebook**
**Solusi:**
- Pastikan **Google dan Facebook Sign-in** sudah diaktifkan di **Firebase Authentication**
- Pastikan OAuth redirect URI sudah benar di Google & Facebook Developer Console

### 🔴 **.env Tidak Berfungsi di Vercel**
**Solusi:**
- Pastikan sudah menambahkan Environment Variables di Vercel secara manual
- Jangan push file `.env` ke GitHub, tapi tambahkan di Vercel!

---

🎉 **Sekarang proyekmu siap dijalankan dan di-deploy tanpa error!** 🚀🔥




--------------------------------------------------------------------------------

📌 Changelog


✅ [v1.2] - 2025-03-24

✅ Menambahkan file komponen atomic design (Atoms, molecul dan organism)


✅ [v1.1] - 2025-03-20

✅ Bug Fix: Tidak bisa upload ke Vercel

✅ Bug Fix: Login Google & Facebook sekarang otomatis menutup modal.

🆕 [v1.0] - 2025-03-19

🎉 Versi pertama dirilis!

🔗 Buka Langsung di VS Code atau GitHub Codespaces

Buka di VS Code Online

Buka di GitHub Codespaces

Made by ❤️ by Fari Noveri

--------------------------------------------------------------------------------

