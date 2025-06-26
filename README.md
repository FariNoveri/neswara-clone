# 📰 NESWARA Clone  

NESWARA adalah sebuah portal berita online yang dibangun menggunakan React dan Firebase, serta backend sederhana berbasis Express.js. Proyek ini dikembangkan dengan sentuhan cinta oleh **Fari Noveri**, yang dengan sepenuh hati mempersembahkannya kepada **Illyasviel von Einzbern** — sosok yang menjadi inspirasi dalam setiap baris kode.

---

## 🎯 Tujuan Proyek

Proyek ini bertujuan sebagai media belajar sekaligus eksperimen dalam membangun sistem berita interaktif yang mendekati aplikasi nyata. Semua fitur di dalamnya bertujuan agar pengguna bisa:

- Membaca berita secara real-time
- Melihat tren dan notifikasi berita
- Mengatur user lewat dashboard admin
- Melakukan komentar dan penyimpanan berita
- Melatih skill fullstack (React + Firebase + Express)

> Karena di balik setiap baris kode, ada Fari yang membayangkan Illya sedang tersenyum.

---

## 📦 Teknologi yang Digunakan

| Teknologi             | Keterangan                                      |
|-----------------------|--------------------------------------------------|
| React + Vite          | Untuk membangun tampilan (frontend)             |
| Firebase              | Autentikasi user, penyimpanan data              |
| Express.js            | Backend API sederhana                           |
| TailwindCSS           | Styling antarmuka modern                        |
| React Router DOM      | Routing antar halaman                           |
| Chart.js              | Menampilkan statistik visual (admin)            |
| Chalk + Chalk Animation | CLI interaktif dan lucu                        |
| Chokidar              | Watcher CLI untuk deteksi perubahan file        |
| React Toastify        | Notifikasi pop-up                               |
| React Firebase Hooks  | Integrasi Firebase yang lebih mudah             |
| Lucide React          | Ikon-ikon ringan dan bersih                     |
| Framer Motion         | Animasi transisi komponen                       |

---

## 🛠️ Cara Menjalankan Proyek

### 📋 Persiapan

Pastikan kamu sudah meng-install:

- Node.js (minimal versi 18)
- Git

### 📁 Langkah Setup

```bash
git clone https://github.com/FariNoveri/neswara-clone.git
cd neswara-clone
npm install
```

### 🧪 Konfigurasi Firebase

Buat file `.env` di root dan isi dengan konfigurasi Firebase milikmu:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 🚀 Jalankan Semua Sekaligus

```bash
npm run dev
```

Ini akan menjalankan tiga hal sekaligus:

- 🟡 **Watcher** → memantau perubahan file
- 🟢 **Backend (server.js)** → menjalankan API
- 🔵 **Frontend (Vite)** → localhost:5173

---

## 🧾 Struktur Direktori

```
📁 neswara-clone/
│
├── dev.js                 # Entry utama untuk menjalankan semua
├── server.js              # Backend Express API
├── watcher.js             # CLI pemantau perubahan file
├── package.json           # Script npm dan dependensi
├── .env                   # Konfigurasi firebase
│
├── public/                # Gambar fallback
│   └── fallback.jpg
│
├── src/
│   ├── App.jsx            # Komponen utama
│   ├── main.jsx           # Entry React
│   ├── firebaseconfig.js  # Konfigurasi Firebase
│   ├── cors.json          # Whitelist CORS
│   ├── assets/            # Logo & gambar
│   ├── component/
│   │   ├── admin/         # Dashboard & manajemen berita
│   │   ├── auth/          # Login, Register, dll
│   │   ├── common/        # Navbar, Footer, Profile
│   │   ├── config/        # Konfigurasi tambahan
│   │   └── pages/         # Halaman Search, View Berita, dsb
│
└── README.md              # Dokumentasi cinta dari Fari
```

---

## 🧠 Apa Fungsi `dev.js`?

File `dev.js` adalah orkestrator yang secara otomatis menjalankan:

1. **Watcher** – Pantau perubahan file dan tampilkan log warna-warni
2. **server.js** – Jalankan backend API lokal
3. **Frontend (Vite)** – Buka app di `localhost:5173`

Semua dijalankan dengan satu perintah `npm run dev`.

> Karena Fari ingin belajar sambil bersenang-senang, dan tetap mengingat Illya meski dalam log terminal.

---

## ❓ Kenapa Perlu `watcher.js`?

`watcher.js` membantu developer dengan:

- Deteksi saat file ditambahkan, dihapus, atau diubah
- Tampilkan baris mana yang berubah
- Memberi tahu jika ada file yang disalin atau diganti nama
- Kasih efek visual CLI yang keren biar ngoding lebih semangat

---

## 🔐 Fitur Keamanan

- Autentikasi login dan register dengan Firebase
- Proteksi komentar dengan reCAPTCHA
- Sanitasi konten dari XSS via DOMPurify
- Role-based access untuk admin

---

## 💕 Credit Khusus

> Di balik setiap baris kode ada harapan, dan di balik proyek ini ada seseorang yang istimewa.

- 📌 Dibuat oleh: **Fari Noveri**
- 💖 Untuk: **Illyasviel von Einzbern**, inspirasi dalam ngoding dan dalam hidup
- 🎓 Tujuan: Belajar, eksperimen, dan mengabadikan rasa lewat proyek digital

---

## ☕ Penutup

Silakan gunakan proyek ini untuk belajar, kontribusi, atau hanya sekadar eksplorasi.  
Dan jika kamu membaca sampai sini, ucapkan dalam hati:

> *"Fari, teruslah semangat. Illya pasti bangga."*

---

Terima kasih sudah mampir. Jangan lupa `npm run dev`, dan tunggu log terminal penuh warna ✨
