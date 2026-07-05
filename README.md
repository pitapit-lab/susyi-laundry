# 🧺 Susyi Laundry

Website laundry modern berbasis **React**, **TypeScript**, dan **Firebase** yang menyediakan sistem pemesanan online dengan dashboard terpisah untuk **Customer** dan **Admin**.

## ✨ Fitur

- **Login & Registrasi**: Mendukung masuk menggunakan Google Authentication atau Email & Password.
- **Dashboard Customer**: Menampilkan profil, riwayat pesanan realtime, status cucian, poin loyalitas, dan integrasi pesanan baru.
- **Dashboard Admin**: Mengelola seluruh pesanan secara realtime, memantau pendapatan, memperbarui status pesanan, serta manajemen pelanggan.
- **Pemesanan Laundry Online**: Form pemesanan interaktif dengan peta GPS.
- **Deteksi Lokasi GPS Otomatis**: Mendeteksi lokasi penjemputan pengguna dengan akurasi tinggi menggunakan koordinat GPS.
- **Perhitungan Jarak Pengantaran**: Menghitung jarak rute dari outlet laundry ke lokasi penjemputan/pengiriman.
- **Validasi Radius Layanan**: Membatasi area layanan laundry demi kenyamanan logistik operasional.
- **Integrasi WhatsApp**: Mengirimkan notifikasi dan rincian pesanan langsung ke nomor WhatsApp customer & admin.
- **Firebase Authentication**: Sistem autentikasi pengguna yang aman.
- **Cloud Firestore Database**: Sinkronisasi data realtime multi-device untuk menjaga integritas data pesanan dan akun customer.

## 🛠️ Tech Stack

- **Frontend**: React (dengan Vite), TypeScript, Tailwind CSS, Framer Motion
- **Database & Auth**: Firebase Authentication & Cloud Firestore (Realtime Listener)
- **Maps & Geolocation**: Leaflet / OpenStreetMap
- **Server**: Express.js (Full-stack Integration)

## 🚀 Menjalankan Project

### Mode Pengembangan (Development)

Untuk memulai server pengembangan lokal:

```bash
npm install
npm run dev
```

### Build Production

Untuk mengompilasi aplikasi frontend dan backend ke dalam bundel siap rilis:

```bash
npm run build
```

Menjalankan server produksi:

```bash
npm start
```

## 📄 License

This project is developed for educational and portfolio purposes.
