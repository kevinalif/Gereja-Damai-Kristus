# Gereja Damai Kristus - Paroki Kampung Duri

Website informasi dan administrasi untuk Gereja Damai Kristus Paroki Kampung Duri. Aplikasi ini menyediakan halaman publik untuk informasi gereja, kalender kegiatan, sakramen, kontak, serta modul admin untuk mengelola data keuangan dan kegiatan gereja.

## Demo

- Website: https://uas-webprog-production.up.railway.app/
- Video demo: https://drive.google.com/file/d/1EvUkJAob8jDovBt3nraVayojszu6ye4i/view?usp=sharing

> Kredensial admin tidak dicantumkan di README publik. Akses admin diberikan oleh pengelola sistem.

## Tentang Proyek

Proyek ini dibuat untuk memenuhi kebutuhan digitalisasi informasi dan administrasi Gereja Damai Kristus. Website mencakup dua area utama:

1. **Area publik** — informasi gereja, jadwal misa, kalender kegiatan, sakramen, dan kontak.
2. **Area admin** — pengelolaan data keuangan, kegiatan/event, laporan, dan akun admin.

## Fitur Utama

### Halaman Publik

- **Home** — menampilkan informasi gereja, jadwal misa, kegiatan mendatang, dan ministry.
- **Kalender** — kalender kegiatan gereja yang dapat diklik untuk melihat acara pada tanggal tertentu.
- **About** — profil, misi, nilai, komunitas, dan pastor paroki.
- **Contact** — informasi alamat, nomor pastoral, email, jadwal misa, form kontak, dan peta lokasi.
- **Sakramen** — informasi 7 Sakramen Gereja Katolik.
- **Login** — akses masuk untuk admin.

### Modul Admin

#### 1. Finance

Menu untuk mengelola data kas gereja:

- Menampilkan chart laporan keuangan bulanan.
- Menampilkan ringkasan cashflow gereja.
- Filter data berdasarkan kategori **Pemasukan** dan **Pengeluaran**.
- Export dan import laporan ke format `.xlsx`.
- Data finance bersifat **read-only** di aplikasi karena termasuk data sensitif.

#### 2. Event

Menu untuk mengelola kegiatan gereja:

- Ringkasan event minggu ini, bulan ini, total kegiatan, dan event dua minggu ke depan.
- Kalender kegiatan yang tanggalnya dapat diklik.
- Daftar kegiatan mendatang.
- Filter semua kegiatan.
- Admin dapat menambahkan kegiatan baru, yang langsung tersimpan ke database dan tampil di halaman kalender publik.

#### 3. Report

- Menampilkan laporan yang sudah dibuat.
- Mendukung data laporan hasil import dari file Excel.
- Membantu pengurus membaca dan membackup laporan keuangan/kegiatan.

#### 4. Login Admin

- Form login menggunakan **Username, Password, dan Retype Password**.
- Sistem menggunakan satu akun admin utama.
- Penambahan akun admin dilakukan secara manual melalui database, sesuai kebutuhan operasional gereja.

## Catatan Produk

- Akun admin dibatasi satu karena keterbatasan tenaga administrasi gereja.
- Data finance tidak dapat diedit dari aplikasi untuk menjaga integritas data sensitif.
- Perubahan event oleh admin langsung memengaruhi tampilan kalender publik.
- Tampilan website dibuat responsif untuk desktop dan mobile.

## Teknologi

Sesuaikan bagian ini dengan `package.json` dan konfigurasi repositori:

- **Backend**: Node.js / Express
- **Database**: sesuaikan, misalnya MySQL/PostgreSQL
- **Upload file**: Multer
- **Export/import Excel**: XLSX
- **Deployment**: Railway
- **Frontend**: HTML/CSS/JavaScript atau template engine yang digunakan

## Struktur Proyek

```text
.
├── public/              # Asset publik
├── views/               # Halaman/template
├── routes/              # Routing aplikasi
├── controllers/         # Logic aplikasi
├── models/              # Model database
├── middleware/          # Middleware, termasuk auth/upload
├── docs/
│   └── screenshots/     # Screenshot untuk README
├── .env.example
├── package.json
└── README.md
