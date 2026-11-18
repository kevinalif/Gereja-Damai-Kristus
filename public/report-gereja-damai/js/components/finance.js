import { financeAPI } from '../utils/api.js';
import { showToast } from '../utils/toast.js';
import { Modal } from '../utils/modal.js';

export class Finance {
    constructor() {
        this.transactions = [];
        this.monthlyData = [];
        this.summary = { income: 0, expense: 0, balance: 0 };
        this.categories = [];
        this.selectedType = 'all';
        this.charts = {};
    }

    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold">Finance Management</h1>
                        <p class="text-gray-600 mt-1">Kelola keuangan dan laporan persembahan gereja</p>
                    </div>
                    <div class="flex gap-2">
                        <input type="file" id="input-import-excel" accept=".xlsx, .xls" style="display: none;">

                        <button id="btn-import" class="btn btn-outline">
                            <i data-lucide="upload" class="h-4 w-4"></i>
                            Import Excel
                        </button>

                        <button id="btn-export" class="btn btn-outline">
                            <i data-lucide="download" class="h-4 w-4"></i>
                            Export Excel
                        </button>

                        <button id="btn-add-transaction" class="btn btn-primary">
                            <i data-lucide="plus" class="h-4 w-4"></i>
                            Record Transaction
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4" id="stats-cards">
                    </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="card">
                        <h3 class="text-lg font-semibold mb-4">Laporan Keuangan Bulanan</h3>
                        <div style="position: relative; height: 300px;">
                            <canvas id="chart-monthly"></canvas>
                        </div>
                    </div>
                    <div class="card">
                        <h3 class="text-lg font-semibold mb-4">Trend Keuangan</h3>
                        <div style="position: relative; height: 300px;">
                            <canvas id="chart-trend"></canvas>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="text-lg font-semibold mb-4">Ringkasan Bulanan</h3>
                    <div class="overflow-x-auto">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Bulan</th>
                                    <th class="text-right">Pemasukan</th>
                                    <th class="text-right">Pengeluaran</th>
                                    <th class="text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody id="monthly-tbody">
                                </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Riwayat Transaksi</h3>
                        <select id="filter-type" class="input w-48">
                            <option value="all">Semua Transaksi</option>
                            <option value="income">Pemasukan</option>
                            <option value="expense">Pengeluaran</option>
                        </select>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Deskripsi</th>
                                    <th>Kategori</th>
                                    <th>Tipe</th>
                                    <th class="text-right">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody id="transaction-tbody">
                                </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <h3 class="text-lg font-semibold mb-4">Ringkasan Keuangan</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="summary-cards">
                        </div>
                </div>
            </div>
        `;

        // Initialize
        await this.loadData();
        this.attachEventListeners();
        lucide.createIcons();
    }

    async loadData() {
        try {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;

            const [transactionsRes, monthlyRes, summaryRes, categoriesRes] = await Promise.all([
                financeAPI.getTransactions(50),
                financeAPI.getMonthlyData(currentYear),
                financeAPI.getSummary(currentYear, currentMonth),
                financeAPI.getCategories(),
            ]);

            if (transactionsRes.success) this.transactions = transactionsRes.data;
            if (monthlyRes.success) this.monthlyData = monthlyRes.data;
            if (summaryRes.success) this.summary = summaryRes.data;
            if (categoriesRes.success) this.categories = categoriesRes.data;

            this.renderStats();
            this.renderCharts();
            this.renderMonthlyTable();
            this.renderTransactions();
            this.renderSummary();
        } catch (error) {
            console.error('Error loading finance data:', error);
            showToast('Gagal memuat data keuangan', 'error');
        }
    }

    renderStats() {
        const stats = [
            {
                label: 'Total Persembahan Bulanan',
                value: this.summary.income,
                icon: 'trending-up',
                color: 'text-green-600'
            },
            {
                label: 'Total Pengeluaran Bulanan',
                value: this.summary.expense,
                icon: 'trending-down',
                color: 'text-red-600'
            },
            {
                label: 'Total Pengeluaran Tahunan',
                value: this.monthlyData.reduce((sum, item) => sum + (item.expense || 0), 0),
                icon: 'trending-down',
                color: 'text-red-600'
            },
            {
                label: 'Operasional Gereja',
                value: this.transactions
                    .filter(t => t.type === 'expense' && t.category === 'Operasional')
                    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
                icon: 'dollar-sign',
                color: 'text-gray-600'
            }
        ];

        const container = document.getElementById('stats-cards');
        container.innerHTML = stats.map(stat => `
            <div class="card">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-medium text-gray-600">${stat.label}</p>
                    <i data-lucide="${stat.icon}" class="h-4 w-4 ${stat.color}"></i>
                </div>
                <p class="text-2xl font-bold">Rp ${stat.value.toLocaleString()}</p>
            </div>
        `).join('');

        lucide.createIcons();
    }

    renderCharts() {
        // Destroy existing charts first
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
            this.charts.monthly = null;
        }
        if (this.charts.trend) {
            this.charts.trend.destroy();
            this.charts.trend = null;
        }

        // Bar Chart - Monthly
        const ctxBar = document.getElementById('chart-monthly');
        if (!ctxBar) return;
        
        this.charts.monthly = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: this.monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: this.monthlyData.map(d => d.income),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    },
                    {
                        label: 'Pengeluaran',
                        data: this.monthlyData.map(d => d.expense),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => 'Rp ' + value.toLocaleString()
                        }
                    }
                }
            }
        });

        // Line Chart - Trend
        const ctxLine = document.getElementById('chart-trend');
        if (!ctxLine) return;
        
        this.charts.trend = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: this.monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: this.monthlyData.map(d => d.income),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Pengeluaran',
                        data: this.monthlyData.map(d => d.expense),
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => 'Rp ' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    }

    renderTransactions() {
        const filtered = this.selectedType === 'all' 
            ? this.transactions 
            : this.transactions.filter(t => t.type === this.selectedType);

        const tbody = document.getElementById('transaction-tbody');
        tbody.innerHTML = filtered.map(t => `
            <tr>
                <td>
                    <div class="flex items-center gap-1">
                        <i data-lucide="calendar" class="h-3 w-3"></i>
                        ${new Date(t.date).toLocaleDateString('id-ID')}
                    </div>
                </td>
                <td class="font-medium">${t.description}</td>
                <td>
                    <span class="px-2 py-1 bg-gray-100 rounded text-xs">${t.category}</span>
                </td>
                <td>
                    <span class="px-2 py-1 rounded text-xs ${
                        t.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }">
                        ${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                </td>
                <td class="text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                    ${t.type === 'income' ? '+' : '-'} Rp ${parseFloat(t.amount).toLocaleString()}
                </td>
            </tr>
        `).join('');

        lucide.createIcons();
    }

    renderSummary() {
        const container = document.getElementById('summary-cards');
        container.innerHTML = `
            <div>
                <p class="text-sm text-gray-600 mb-2">Total Pemasukan</p>
                <p class="text-2xl font-bold text-green-600">Rp ${this.summary.income.toLocaleString()}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600 mb-2">Total Pengeluaran</p>
                <p class="text-2xl font-bold text-red-600">Rp ${this.summary.expense.toLocaleString()}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600 mb-2">Saldo</p>
                <p class="text-2xl font-bold text-blue-600">Rp ${this.summary.balance.toLocaleString()}</p>
            </div>
        `;
    }

    renderMonthlyTable() {
        const tbody = document.getElementById('monthly-tbody');
        if (!tbody) return;

        tbody.innerHTML = this.monthlyData.map(item => {
            const saldo = (item.income || 0) - (item.expense || 0);
            return `
                <tr>
                    <td class="font-medium">${item.month}</td>
                    <td class="text-right text-green-600">Rp ${(item.income || 0).toLocaleString()}</td>
                    <td class="text-right text-red-600">Rp ${(item.expense || 0).toLocaleString()}</td>
                    <td class="text-right font-semibold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}">
                        Rp ${saldo.toLocaleString()}
                    </td>
                </tr>
            `;
        }).join('');
    }

    attachEventListeners() {
        // Filter type
        const filterType = document.getElementById('filter-type');
        if (filterType) {
            filterType.addEventListener('change', (e) => {
                this.selectedType = e.target.value;
                this.renderTransactions();
            });
        }

        // Export Excel
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                this.exportToExcel();
            });
        }

        // --- FITUR IMPORT EXCEL (BARU) ---
        const btnImport = document.getElementById('btn-import');
        const inputImport = document.getElementById('input-import-excel');

        if (btnImport && inputImport) {
            // Klik tombol -> Trigger input file
            btnImport.addEventListener('click', () => {
                inputImport.click();
            });

            // File dipilih -> Jalankan fungsi import
            inputImport.addEventListener('change', async (e) => {
                await this.handleImportExcel(e);
            });
        }

        // Add Transaction
        const btnAdd = document.getElementById('btn-add-transaction');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                this.showAddTransactionModal();
            });
        }
    }

    // --- FUNGSI HANDLE IMPORT EXCEL (BARU) ---
    async handleImportExcel(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        showToast('Sedang mengimport data...', 'info');

        try {
            const response = await fetch('/api/finance/import', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showToast(result.message, 'success');
                e.target.value = ''; // Reset input file agar bisa pilih file yang sama lagi
                
                // Refresh semua data setelah import berhasil
                await this.loadData();
            } else {
                showToast(result.message || 'Gagal import data', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            showToast('Terjadi kesalahan koneksi saat import', 'error');
        }
    }

    exportToExcel() {
        try {
            const data = this.transactions.map(t => ({
                'Tanggal': new Date(t.date).toLocaleDateString('id-ID'),
                'Deskripsi': t.description,
                'Tipe': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                'Kategori': t.category,
                'Jumlah': t.amount,
                'Catatan': t.notes || '-'
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');

            const fileName = `Laporan_Keuangan_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);

            showToast('File Excel berhasil diunduh!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Gagal export ke Excel', 'error');
        }
    }

    showAddTransactionModal() {
        const incomeCategories = this.categories.filter(c => c.type === 'income');
        const expenseCategories = this.categories.filter(c => c.type === 'expense');

        const content = `
            <form id="form-transaction" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Tipe *</label>
                    <select id="input-type" class="input" required>
                        <option value="income">Pemasukan</option>
                        <option value="expense">Pengeluaran</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Tanggal *</label>
                    <input type="date" id="input-date" class="input" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Deskripsi *</label>
                    <input type="text" id="input-description" class="input" placeholder="Deskripsi transaksi" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Kategori *</label>
                    <select id="input-category" class="input" required>
                        ${incomeCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Jumlah *</label>
                    <input type="number" id="input-amount" class="input" placeholder="0" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Catatan</label>
                    <textarea id="input-notes" class="input" rows="3" placeholder="Catatan tambahan..."></textarea>
                </div>
                <div class="flex justify-end gap-2 pt-4">
                    <button type="button" onclick="window.currentModal.close()" class="btn btn-outline">
                        Batal
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Simpan
                    </button>
                </div>
            </form>
        `;

        const modal = new Modal('Record New Transaction', content);
        modal.show();

        // Handle type change
        const typeSelect = document.getElementById('input-type');
        const categorySelect = document.getElementById('input-category');
        
        typeSelect.addEventListener('change', () => {
            const type = typeSelect.value;
            const cats = type === 'income' ? incomeCategories : expenseCategories;
            categorySelect.innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        });

        // Handle form submit
        document.getElementById('form-transaction').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddTransaction();
        });
    }

    async handleAddTransaction() {
        const formData = {
            type: document.getElementById('input-type').value,
            date: document.getElementById('input-date').value,
            description: document.getElementById('input-description').value,
            category: document.getElementById('input-category').value,
            amount: document.getElementById('input-amount').value,
            notes: document.getElementById('input-notes').value,
        };

        try {
            const result = await financeAPI.createTransaction(formData);
            
            if (result.success) {
                showToast('Transaksi berhasil disimpan!', 'success');
                window.currentModal.close();
                await this.loadData();
            } else {
                throw new Error(result.error || 'Failed to create transaction');
            }
        } catch (error) {
            console.error('Error creating transaction:', error);
            showToast('Gagal menyimpan transaksi', 'error');
        }
    }

    // Cleanup method
    destroy() {
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
            this.charts.monthly = null;
        }
        if (this.charts.trend) {
            this.charts.trend.destroy();
            this.charts.trend = null;
        }
    }
}