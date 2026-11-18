const express = require('express');
const router = express.Router();
const db = require('../api_config/database');
const multer = require('multer'); // Import Multer untuk upload file
const xlsx = require('xlsx');     // Import XLSX untuk baca excel

// Konfigurasi Multer (Simpan file di memory sementara/RAM)
const upload = multer({ storage: multer.memoryStorage() });

// --- 1. GET SUMMARY (Ringkasan Bulanan) ---
router.get('/summary', async (req, res) => {
    try {
        const { year, month } = req.query;
        
        // PERBAIKAN: Menggunakan tabel 'finance'
        const [incomeRows] = await db.execute(
            'SELECT SUM(amount) as total FROM finance WHERE type = "income" AND YEAR(date) = ? AND MONTH(date) = ?',
            [year, month]
        );

        // PERBAIKAN: Menggunakan tabel 'finance'
        const [expenseRows] = await db.execute(
            'SELECT SUM(amount) as total FROM finance WHERE type = "expense" AND YEAR(date) = ? AND MONTH(date) = ?',
            [year, month]
        );

        const income = parseFloat(incomeRows[0].total || 0);
        const expense = parseFloat(expenseRows[0].total || 0);

        res.json({
            success: true,
            data: {
                income,
                expense,
                balance: income - expense
            }
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 2. GET TRANSACTIONS (Riwayat Transaksi) ---
router.get('/transactions', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        
        // PERBAIKAN: Menggunakan tabel 'finance'
        const [rows] = await db.execute(
            'SELECT * FROM finance ORDER BY date DESC, id DESC LIMIT ?',
            [limit]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 3. GET MONTHLY DATA (Grafik Tahunan) ---
router.get('/monthly', async (req, res) => {
    try {
        const { year } = req.query;

        // PERBAIKAN: Menggunakan tabel 'finance'
        const [rows] = await db.execute(`
            SELECT 
                MONTH(date) as month_num,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM finance 
            WHERE YEAR(date) = ?
            GROUP BY MONTH(date)
            ORDER BY month_num ASC
        `, [year]);

        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const monthNum = i + 1;
            const data = rows.find(r => r.month_num === monthNum) || { income: 0, expense: 0 };
            return {
                month: new Date(0, i).toLocaleString('id-ID', { month: 'long' }),
                income: parseFloat(data.income),
                expense: parseFloat(data.expense)
            };
        });

        res.json({ success: true, data: monthlyData });
    } catch (error) {
        console.error('Error fetching monthly data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 4. GET CATEGORIES ---
router.get('/categories', async (req, res) => {
    try {
        // PERBAIKAN: Mengambil kategori dari tabel 'finance_categories' (jika ada) atau hardcode
        // Kita gunakan query database agar dinamis sesuai file sql Anda
        const [rows] = await db.execute('SELECT * FROM finance_categories');
        
        if (rows.length > 0) {
            res.json({ success: true, data: rows });
        } else {
             // Fallback jika tabel kosong
            const categories = [
                { id: 1, name: 'Persembahan', type: 'income' },
                { id: 2, name: 'Perpuluhan', type: 'income' },
                { id: 3, name: 'Sumbangan Khusus', type: 'income' },
                { id: 4, name: 'Building Fund', type: 'income' },
                { id: 5, name: 'Operasional', type: 'expense' },
                { id: 6, name: 'Gaji', type: 'expense' },
                { id: 7, name: 'Utilitas', type: 'expense' },
                { id: 8, name: 'Pemeliharaan', type: 'expense' },
                { id: 9, name: 'Program Gereja', type: 'expense' },
                { id: 10, name: 'Sosial', type: 'expense' }
            ];
            res.json({ success: true, data: categories });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 5. CREATE TRANSACTION (Tambah Manual) ---
router.post('/transactions', async (req, res) => {
    try {
        const { type, date, description, category, amount, notes } = req.body;

        // PERBAIKAN: Menggunakan tabel 'finance'
        const [result] = await db.execute(
            'INSERT INTO finance (type, date, description, category, amount, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [type, date, description, category, amount, notes]
        );

        res.json({ 
            success: true, 
            data: { id: result.insertId, ...req.body } 
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 6. IMPORT EXCEL ---
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
        }

        console.log("Mulai memproses file Excel...");

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; 
        const worksheet = workbook.Sheets[sheetName];
        
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        console.log(`Ditemukan ${data.length} baris data.`);

        if (data.length === 0) {
            return res.json({ success: false, message: 'File Excel kosong.' });
        }

        const queries = [];
        const values = [];

        data.forEach(row => {
            let dateVal = new Date(); 
            if (row['Tanggal']) {
                dateVal = new Date(row['Tanggal']); 
            }

            let typeStr = 'income'; 
            const rawType = (row['Tipe'] || '').toLowerCase();
            if (rawType.includes('keluar') || rawType.includes('expense')) {
                typeStr = 'expense';
            }

            const description = row['Deskripsi'] || 'Imported Transaction';
            const category = row['Kategori'] || 'Lainnya';
            const amount = parseFloat(row['Jumlah'] || 0);
            const notes = row['Catatan'] || '';

            // PERBAIKAN: Menggunakan tabel 'finance'
            queries.push(`INSERT INTO finance (date, description, type, category, amount, notes) VALUES (?, ?, ?, ?, ?, ?)`);
            values.push([dateVal, description, typeStr, category, amount, notes]);
        });

        if (queries.length > 0) {
            for (let i = 0; i < queries.length; i++) {
                await db.execute(queries[i], values[i]);
            }
            
            console.log("Import berhasil.");
            res.json({ success: true, message: `Berhasil mengimport ${queries.length} transaksi!` });
        } else {
            res.json({ success: false, message: 'Tidak ada data valid yang bisa diimport.' });
        }

    } catch (error) {
        console.error('Import Error:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses file Excel: ' + error.message });
    }
});

module.exports = router;