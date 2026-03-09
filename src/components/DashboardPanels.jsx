import React from 'react';
import { 
  History, Clock, BookOpen, Wallet, Package, 
  ClipboardList, Users, BarChart3, Printer, 
  Edit2, PlayCircle, Plus, Tags, RefreshCw, 
  Trash2, Download, Key 
} from 'lucide-react';
import { formatRupiah, downloadCSV } from '../utils';

export default function DashboardPanels({ activeTab, props, theme }) {
  const {
    currentUser, transactions, products, categories, customers, expenses, shifts, holdBills, stockLogs, users,
    historyFilter, setHistoryFilter, historyCustomDate, setHistoryCustomDate, handleReprintReceipt, loadTransactionToEditor, 
    resumeHoldBill, handleAddCustomer, newCustomerName, setNewCustomerName, newCustomerPhone, setNewCustomerPhone, 
    setDebtCustomer, setPayDebtModalOpen, setExpenseModalOpen, setIsCategoryModalOpen, setIsAddModalOpen, openUpdateStockModal, 
    handleDeleteItem, newKasirName, setNewKasirName, handleAddKasir, openPasswordModal, handleDeleteUser,
    reportPeriod, setReportPeriod, handlePrintReport,
    printType, // [BUG FIX #3] sekarang diterima dari dashboardProps
  } = props;

  const PanelWrapper = ({ children }) => (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {children}
      </div>
    </div>
  );

  // ==========================================
  // TAB: RIWAYAT TRANSAKSI & RETUR
  // ==========================================
  if (activeTab === 'history') {
    const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const todayStart = getStartOfDay(new Date());
    const yesterdayStart = todayStart - 86400000;
    const yesterdayEnd = todayStart - 1;

    const filteredHistory = transactions.filter(t => {
      if (historyFilter === 'today') return t.timestamp >= todayStart;
      if (historyFilter === 'yesterday') return t.timestamp >= yesterdayStart && t.timestamp <= yesterdayEnd;
      if (historyFilter === 'custom' && historyCustomDate) {
        const customStart = getStartOfDay(new Date(historyCustomDate));
        const customEnd = customStart + 86400000 - 1;
        return t.timestamp >= customStart && t.timestamp <= customEnd;
      }
      return false;
    });

    // [IMPROVEMENT] CSV export untuk riwayat transaksi
    const handleExportHistory = () => {
      downloadCSV(
        filteredHistory.map(t => ({
          "Waktu": new Date(t.timestamp).toLocaleString('id-ID'),
          "Invoice ID": t.id,
          "Kasir": t.kasirName,
          "Metode Bayar": t.paymentMethod,
          "Total": t.total,
          "Diskon": t.discount || 0,
          "Pajak": t.tax || 0,
          "Laba Bersih": t.netProfit || 0,
          "Customer": t.customerId || '-',
        })),
        `Riwayat_Transaksi_${historyFilter}`
      );
    };

    return (
      <PanelWrapper>
        <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <History className={theme.accent} size={28} />
            <h2 className={`text-2xl font-bold ${theme.textMain}`}>Riwayat & Retur Transaksi</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`bg-black/20 p-1 border ${theme.border} rounded-xl flex items-center`}>
              {['today', 'yesterday', 'custom'].map(f => (
                <button key={f} onClick={() => setHistoryFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${historyFilter === f ? `${theme.buttonBg} ${theme.buttonText} shadow-lg` : `${theme.textMuted}`}`}>
                  {f === 'today' ? 'Hari Ini' : f === 'yesterday' ? 'Kemarin' : 'Pilih Tgl'}
                </button>
              ))}
            </div>
            {historyFilter === 'custom' && (
              <input type="date" value={historyCustomDate} onChange={e => setHistoryCustomDate(e.target.value)}
                className={`bg-black/20 border ${theme.border} ${theme.textMain} rounded-xl px-3 py-1.5 focus:outline-none`}/>
            )}
            {/* [IMPROVEMENT] Tombol export CSV */}
            <button onClick={handleExportHistory}
              className={`flex items-center gap-2 bg-black/20 border ${theme.border} hover:bg-black/40 ${theme.textMain} px-4 py-2 rounded-xl text-sm font-bold transition`}>
              <Download size={16}/> Ekspor CSV
            </button>
          </div>
        </div>

        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden shadow-2xl`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-left border-collapse text-sm ${theme.textMain}`}>
              <thead>
                <tr className={`bg-black/20 border-b ${theme.border} ${theme.textMuted}`}>
                  <th className="p-4">Waktu</th>
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Kasir</th>
                  <th className="p-4">Tipe Bayar</th>
                  <th className="p-4 text-right">Nilai Transaksi</th>
                  <th className="p-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border}`}>
                {filteredHistory.map(trx => (
                  <tr key={trx.id} className="hover:bg-black/10 transition-colors">
                    <td className="p-4 text-xs">{new Date(trx.timestamp).toLocaleString('id-ID')}</td>
                    <td className="p-4 font-mono font-bold text-xs">
                      {trx.id}
                      {trx.lastEditedBy && <span className={`block text-[10px] ${theme.textMuted}`}>Diubah: {trx.lastEditedBy}</span>}
                    </td>
                    <td className={`p-4 text-xs ${theme.textMuted}`}>{trx.kasirName}</td>
                    <td className="p-4">
                      <span className={`bg-black/20 border ${theme.border} ${theme.accent} px-2 py-1 rounded text-xs uppercase`}>{trx.paymentMethod}</span>
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-400">{formatRupiah(trx.total)}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleReprintReceipt(trx)}
                          className="px-3 py-1.5 bg-blue-900/60 border border-blue-500/50 hover:bg-blue-800 text-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1">
                          <Printer size={14}/> Cetak Ulang
                        </button>
                        <button onClick={() => loadTransactionToEditor(trx)}
                          className="px-3 py-1.5 bg-amber-900/60 border border-amber-500/50 hover:bg-amber-800 text-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1">
                          <Edit2 size={14}/> Edit/Retur
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr><td colSpan="6" className={`p-8 text-center ${theme.textMuted}`}>Tidak ada transaksi ditemukan pada filter ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PanelWrapper>
    );
  }

  // ==========================================
  // TAB: PESANAN TERTAHAN (HOLD BILLS)
  // ==========================================
  if (activeTab === 'holdbills') {
    return (
      <PanelWrapper>
        <h2 className={`text-2xl font-bold ${theme.textMain} mb-6 flex items-center gap-3`}><Clock className={theme.accent}/> Manajemen Pesanan Meja</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holdBills.length === 0
            ? <p className={theme.textMuted}>Tidak ada antrean pesanan meja.</p>
            : holdBills.map(bill => (
              <div key={bill.id} className={`${theme.bgPanel} border ${theme.border} rounded-2xl p-5 shadow-lg`}>
                <h3 className={`text-lg font-bold ${theme.textMain} mb-1`}>{bill.name || 'Tanpa Nama'}</h3>
                <p className={`text-xs ${theme.textMuted} mb-3`}>{new Date(bill.timestamp || Date.now()).toLocaleTimeString('id-ID')} — Kasir: {bill.kasirName}</p>
                <div className={`space-y-1 mb-4 text-sm ${theme.textMain}`}>
                  {(bill.items || []).map(i => (
                    <div key={i.id} className={`flex justify-between border-b ${theme.border} pb-1`}>
                      <span className={theme.textMuted}>{i.qty}x</span>
                      <span className="text-right">{i.name}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => resumeHoldBill(bill)}
                  className="w-full py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm flex justify-center items-center gap-2 border border-emerald-500/50">
                  <PlayCircle size={16}/> Proses ke Kasir
                </button>
              </div>
            ))}
        </div>
      </PanelWrapper>
    );
  }

  // ==========================================
  // TAB: BUKU PIUTANG (CUSTOMERS)
  // ==========================================
  if (activeTab === 'customers') {
    return (
      <PanelWrapper>
        <div className="flex items-center gap-3 mb-6"><BookOpen className={theme.accent} size={28} /><h2 className={`text-2xl font-bold ${theme.textMain}`}>Buku Besar Piutang</h2></div>
        {['admin', 'kasir'].includes(currentUser?.role) && (
          <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl p-6 shadow-2xl mb-6`}>
            <h3 className={`text-lg font-bold ${theme.textMain} mb-4 flex items-center gap-2`}><Plus size={20}/> Registrasi Mitra/Pelanggan</h3>
            <form onSubmit={handleAddCustomer} className="flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="Nama Entitas Pelanggan" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className={`flex-1 bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} focus:outline-none`}/>
              <input type="text" placeholder="Nomor Telepon" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className={`flex-1 bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} focus:outline-none`}/>
              <button type="submit" className={`px-6 py-3 ${theme.buttonBg} ${theme.buttonText} rounded-xl font-bold whitespace-nowrap`}>Simpan Data</button>
            </form>
          </div>
        )}
        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden shadow-2xl`}>
          <table className={`w-full text-left border-collapse ${theme.textMain}`}>
            <thead>
              <tr className={`bg-black/20 border-b ${theme.border} ${theme.textMuted} text-sm`}>
                <th className="p-4">Nama Pelanggan</th><th className="p-4">Kontak</th>
                <th className="p-4 text-right">Saldo Piutang Aktif</th>
                {['admin', 'kasir'].includes(currentUser?.role) && <th className="p-4 text-center">Tindakan</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-black/10 transition-colors">
                  <td className="p-4 font-bold">{c.name}</td>
                  <td className="p-4 text-sm">{c.phone || '-'}</td>
                  <td className="p-4 text-right font-bold text-red-400 text-lg">{formatRupiah(c.debt)}</td>
                  {['admin', 'kasir'].includes(currentUser?.role) && (
                    <td className="p-4 text-center">
                      <button onClick={() => { setDebtCustomer(c); setPayDebtModalOpen(true); }} disabled={(c.debt || 0) <= 0}
                        className="px-4 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-30 border border-emerald-500/50">
                        Lunasi Piutang
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan="4" className={`p-8 text-center ${theme.textMuted}`}>Belum ada pelanggan terdaftar.</td></tr>}
            </tbody>
          </table>
        </div>
      </PanelWrapper>
    );
  }

  // ==========================================
  // TAB: PENGELUARAN (EXPENSES)
  // ==========================================
  if (activeTab === 'expenses') {
    return (
      <PanelWrapper>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3"><Wallet className={theme.accent} size={28} /><h2 className={`text-2xl font-bold ${theme.textMain}`}>Jurnal Pengeluaran Operasional</h2></div>
          {['admin', 'kasir'].includes(currentUser?.role) && (
            <button onClick={() => setExpenseModalOpen(true)} className={`flex items-center justify-center gap-2 px-4 py-2 ${theme.buttonBg} ${theme.buttonText} rounded-lg font-semibold shadow-lg`}>
              <Plus size={18} /> Entri Kas Keluar
            </button>
          )}
        </div>
        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden shadow-2xl`}>
          <table className={`w-full text-left border-collapse ${theme.textMain}`}>
            <thead>
              <tr className={`bg-black/20 border-b ${theme.border} ${theme.textMuted} text-sm`}>
                <th className="p-4">Timestamp</th><th className="p-4">Keterangan Jurnal</th>
                <th className="p-4">Kategori Akun</th><th className="p-4 text-right">Nominal (Kredit)</th><th className="p-4">PIC</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-black/10 transition-colors">
                  <td className="p-4 text-xs">{new Date(e.timestamp).toLocaleString('id-ID')}</td>
                  <td className="p-4 font-bold">{e.description}</td>
                  <td className="p-4 text-sm">{e.category}</td>
                  <td className="p-4 text-right font-bold text-red-400">{formatRupiah(e.amount)}</td>
                  <td className={`p-4 text-xs ${theme.textMuted}`}>{e.kasirName}</td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan="5" className={`p-8 text-center ${theme.textMuted}`}>Belum ada pengeluaran tercatat.</td></tr>}
            </tbody>
          </table>
        </div>
      </PanelWrapper>
    );
  }

  // ==========================================
  // TAB: INVENTARIS
  // ==========================================
  if (activeTab === 'inventory' && ['admin', 'owner'].includes(currentUser?.role)) {
    return (
      <PanelWrapper>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3"><Package className={theme.accent} size={28} /><h2 className={`text-2xl font-bold ${theme.textMain}`}>Master Data Inventaris</h2></div>
          {currentUser?.role === 'admin' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setIsCategoryModalOpen(true)} className={`flex items-center gap-2 px-4 py-2 bg-black/20 border ${theme.border} hover:bg-black/30 ${theme.textMain} rounded-lg font-semibold`}><Tags size={18} /> Master Kategori</button>
              <button onClick={() => setIsAddModalOpen(true)} className={`flex items-center gap-2 px-4 py-2 ${theme.buttonBg} ${theme.buttonText} rounded-lg font-semibold`}><Plus size={18} /> Tambah SKU Baru</button>
            </div>
          )}
        </div>
        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden shadow-2xl`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-left border-collapse ${theme.textMain}`}>
              <thead>
                <tr className={`bg-black/20 border-b ${theme.border} ${theme.textMuted} text-sm`}>
                  <th className="p-4">SKU / Nama Barang</th><th className="p-4">Kategori</th>
                  <th className="p-4">Modal / Harga Jual</th><th className="p-4 text-center">Stok</th>
                  {currentUser?.role === 'admin' && <th className="p-4 text-center">Tindakan</th>}
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border}`}>
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-black/10 transition-colors">
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4 text-sm">{p.category}</td>
                    <td className="p-4 text-sm">
                      <div className={theme.textMuted}>HPP Avg: <span className={theme.textMain}>{formatRupiah(p.cost)}</span></div>
                      <div>Jual: <span className={`font-bold ${theme.accent}`}>{formatRupiah(p.price)}</span></div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-lg font-black ${p.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>{p.stock || 0}</span>
                    </td>
                    {currentUser?.role === 'admin' && (
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openUpdateStockModal(p)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-800/80 border border-emerald-500/50 hover:bg-emerald-700 text-emerald-50 rounded-lg text-xs font-bold">
                            <RefreshCw size={14} /> Mutasi
                          </button>
                          <button onClick={() => handleDeleteItem(p.id)} className="p-1.5 text-red-500 hover:bg-red-900/20 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {products.length === 0 && <tr><td colSpan="5" className={`p-8 text-center ${theme.textMuted}`}>Belum ada produk terdaftar.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </PanelWrapper>
    );
  }

  // ==========================================
  // TAB: LAPORAN (REPORTS)
  // ==========================================
  if (activeTab === 'reports' && ['admin', 'owner'].includes(currentUser?.role)) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const filteredTrx = transactions.filter(t => {
      if (reportPeriod === 'hari_ini') return t.timestamp >= startOfDay;
      if (reportPeriod === 'bulan_ini') return t.timestamp >= startOfMonth;
      if (reportPeriod === 'tahun_ini') return t.timestamp >= startOfYear;
      return true;
    });
    const filteredExp = expenses.filter(e => {
      if (reportPeriod === 'hari_ini') return e.timestamp >= startOfDay;
      if (reportPeriod === 'bulan_ini') return e.timestamp >= startOfMonth;
      if (reportPeriod === 'tahun_ini') return e.timestamp >= startOfYear;
      return true;
    });

    const totalExpense = filteredExp.reduce((s, e) => s + (e.amount || 0), 0);
    const totalSales = filteredTrx.filter(t => t.type !== 'PayDebt').reduce((s, t) => s + (t.total || 0), 0);
    const totalCostGoods = filteredTrx.filter(t => t.type !== 'PayDebt').reduce((s, t) => s + (t.totalCost || 0), 0);
    const grossProfit = totalSales - totalCostGoods;
    const realNetProfit = grossProfit - totalExpense;

    // [BUG FIX #3] Gunakan printType dari props (sekarang diteruskan dengan benar)
    if (printType === 'report') {
      const printElement = document.getElementById('printable-report');
      if (printElement) {
        printElement.innerHTML = `
          <div style="font-family: sans-serif; color: #000; padding: 20px;">
            <h1 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">LAPORAN LABA RUGI ENTERPRISE</h1>
            <p style="text-align: center; margin-bottom: 30px;">Periode: ${reportPeriod.replace(/_/g, ' ').toUpperCase()} | Dicetak: ${new Date().toLocaleString('id-ID')}</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <tr><td style="padding:10px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold;">Pendapatan Kotor</td><td style="padding:10px;border:1px solid #ddd;text-align:right;font-weight:bold;">${formatRupiah(totalSales)}</td></tr>
              <tr><td style="padding:10px;border:1px solid #ddd;">HPP (Harga Pokok Penjualan)</td><td style="padding:10px;border:1px solid #ddd;text-align:right;color:red;">-${formatRupiah(totalCostGoods)}</td></tr>
              <tr><td style="padding:10px;border:1px solid #ddd;">Laba Kotor (Gross Profit)</td><td style="padding:10px;border:1px solid #ddd;text-align:right;">${formatRupiah(grossProfit)}</td></tr>
              <tr><td style="padding:10px;border:1px solid #ddd;color:red;">Biaya Operasional (OpEx)</td><td style="padding:10px;border:1px solid #ddd;text-align:right;color:red;">-${formatRupiah(totalExpense)}</td></tr>
              <tr><td style="padding:10px;border:2px solid #000;font-weight:bold;font-size:16px;">LABA BERSIH (EBITDA)</td><td style="padding:10px;border:2px solid #000;text-align:right;font-weight:bold;font-size:16px;">${formatRupiah(realNetProfit)}</td></tr>
            </table>
          </div>
        `;
      }
    }

    return (
      <PanelWrapper>
        <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-3"><BarChart3 className={theme.accent} size={28} /><h2 className={`text-2xl font-bold ${theme.textMain}`}>Laporan Laba Rugi</h2></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`bg-black/20 p-1 border ${theme.border} rounded-xl flex items-center`}>
              {[{ id: 'hari_ini', label: 'Hari Ini' }, { id: 'bulan_ini', label: 'Bulan Ini' }, { id: 'tahun_ini', label: 'Tahun Ini' }, { id: 'semua', label: 'Semua' }].map(p => (
                <button key={p.id} onClick={() => setReportPeriod(p.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${reportPeriod === p.id ? `${theme.buttonBg} ${theme.buttonText} shadow-lg` : `${theme.textMuted}`}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={handlePrintReport}
              className={`flex items-center justify-center gap-2 px-4 py-2 bg-black/20 border ${theme.border} hover:bg-black/40 ${theme.textMain} rounded-xl font-bold text-sm transition`}>
              <Printer size={16}/> Cetak Laporan (A4)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`${theme.bgPanel} border ${theme.border} p-5 rounded-2xl`}>
            <p className={`text-xs ${theme.textMuted} uppercase mb-1`}>Pendapatan Kotor</p>
            <p className={`text-2xl font-bold ${theme.textMain}`}>{formatRupiah(totalSales)}</p>
          </div>
          <div className={`${theme.bgPanel} border ${theme.border} p-5 rounded-2xl`}>
            <p className={`text-xs ${theme.textMuted} uppercase mb-1`}>Laba Kotor</p>
            <p className="text-2xl font-bold text-blue-400">{formatRupiah(grossProfit)}</p>
          </div>
          <div className={`${theme.bgPanel} border border-red-900/50 p-5 rounded-2xl`}>
            <p className="text-xs text-red-400/80 uppercase mb-1">Biaya Operasional</p>
            <p className="text-2xl font-bold text-red-400">-{formatRupiah(totalExpense)}</p>
          </div>
          <div className={`${theme.bgPanel} border border-emerald-700/50 p-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)]`}>
            <p className="text-xs text-emerald-400/80 uppercase mb-1">Laba Bersih (EBITDA)</p>
            <p className="text-3xl font-black text-emerald-400">{formatRupiah(realNetProfit)}</p>
          </div>
        </div>

        {/* Ringkasan detail */}
        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl p-6 shadow-2xl`}>
          <h3 className={`text-lg font-bold ${theme.textMain} mb-4`}>Ringkasan Detail</h3>
          <div className={`space-y-3 text-sm`}>
            {[
              { label: 'Total Transaksi', value: `${filteredTrx.filter(t => t.type !== 'PayDebt').length} transaksi`, accent: false },
              { label: 'Total Penjualan Kotor', value: formatRupiah(totalSales), accent: false },
              { label: 'HPP / Harga Pokok Penjualan', value: `-${formatRupiah(totalCostGoods)}`, accent: false },
              { label: 'Laba Kotor', value: formatRupiah(grossProfit), accent: true },
              { label: 'Total Pengeluaran Operasional', value: `-${formatRupiah(totalExpense)}`, accent: false },
              { label: 'Laba Bersih (EBITDA)', value: formatRupiah(realNetProfit), accent: true },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between items-center py-2 border-b ${theme.border}`}>
                <span className={theme.textMuted}>{row.label}</span>
                <span className={`font-bold ${row.accent ? theme.accent : theme.textMain}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </PanelWrapper>
    );
  }

  // ==========================================
  // TAB: STOCK LOGS
  // ==========================================
  if (activeTab === 'stocklogs' && ['admin', 'owner'].includes(currentUser?.role)) {
    return (
      <PanelWrapper>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3"><ClipboardList className={theme.accent} size={28} /><h2 className={`text-2xl font-bold ${theme.textMain}`}>Buku Mutasi Stok (Audit Trail)</h2></div>
          <button onClick={() => downloadCSV(
            stockLogs.map(l => ({
              "Waktu": new Date(l.timestamp).toLocaleString('id-ID'),
              "Produk": l.productName, "Tipe": l.type, "Alasan": l.reason,
              "Perubahan Qty": l.qtyChange, "Stok Akhir": l.finalStock,
              "HPP": l.hpp, "User": l.user
            })), "Buku_Mutasi_Stok"
          )} className={`flex items-center gap-2 bg-black/20 border ${theme.border} hover:bg-black/30 ${theme.textMain} px-4 py-2 rounded-xl text-sm font-bold transition`}>
            <Download size={16}/> Ekspor Excel
          </button>
        </div>
        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden shadow-2xl`}>
          <table className={`w-full text-left border-collapse text-sm ${theme.textMain}`}>
            <thead>
              <tr className={`bg-black/20 border-b ${theme.border} ${theme.textMuted}`}>
                <th className="p-4">Waktu</th><th className="p-4">SKU</th><th className="p-4">Tipe</th>
                <th className="p-4">Keterangan</th><th className="p-4 text-center">QTY</th>
                <th className="p-4 text-center">Sisa Stok</th><th className="p-4">HPP</th><th className="p-4">User</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {stockLogs.slice(0, 100).map(log => (
                <tr key={log.id} className="hover:bg-black/10 transition-colors">
                  <td className="p-4 text-xs">{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                  <td className="p-4 font-bold">{log.productName}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.type === 'IN' ? 'bg-emerald-900/80 text-emerald-300' : 'bg-red-900/80 text-red-300'}`}>{log.type}</span>
                  </td>
                  <td className="p-4 text-xs">{log.reason}</td>
                  <td className={`p-4 text-center font-black ${log.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {log.qtyChange > 0 ? `+${log.qtyChange}` : log.qtyChange}
                  </td>
                  <td className="p-4 text-center font-bold">{log.finalStock}</td>
                  <td className={`p-4 ${theme.accent}`}>{formatRupiah(log.hpp)}</td>
                  <td className={`p-4 text-xs ${theme.textMuted}`}>{log.user}</td>
                </tr>
              ))}
              {stockLogs.length === 0 && <tr><td colSpan="8" className={`p-8 text-center ${theme.textMuted}`}>Belum ada log mutasi stok.</td></tr>}
            </tbody>
          </table>
        </div>
      </PanelWrapper>
    );
  }

  // ==========================================
  // TAB: MANAJEMEN PENGGUNA
  // ==========================================
  if (activeTab === 'users' && currentUser?.role === 'admin') {
    return (
      <PanelWrapper>
        <div className="flex items-center gap-3 mb-6"><Users className={theme.accent} size={28} /><h2 className={`text-2xl font-bold ${theme.textMain}`}>Sistem Manajemen Pengguna</h2></div>
        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl p-6 mb-6`}>
          <h3 className={`text-base font-bold ${theme.textMuted} mb-3`}>Daftarkan Kasir Baru (Password default: 008)</h3>
          <form onSubmit={handleAddKasir} className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Nama Kasir Baru..." value={newKasirName} onChange={e => setNewKasirName(e.target.value)} className={`flex-1 bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} focus:outline-none`}/>
            <button type="submit" className={`px-6 py-3 ${theme.buttonBg} ${theme.buttonText} rounded-xl font-bold`}>Daftarkan</button>
          </form>
        </div>
        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden`}>
          <table className={`w-full text-left ${theme.textMain}`}>
            <thead>
              <tr className={`bg-black/20 ${theme.textMuted}`}>
                <th className="p-4">Identitas User</th><th className="p-4">Role Akses</th><th className="p-4 text-center">Keamanan</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-black/10">
                  <td className="p-4 font-bold">{u.name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 bg-black/30 ${theme.textMain} border ${theme.border} rounded-lg text-xs font-bold uppercase`}>{u.role}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openPasswordModal(u)} title="Ubah Password" className={`p-2 bg-black/20 ${theme.textMuted} hover:${theme.accent} rounded-lg`}><Key size={18}/></button>
                      {u.role === 'kasir' && (
                        <button onClick={() => handleDeleteUser(u.id, u.name)} title="Hapus Akun" className="p-2 bg-black/20 text-red-400/60 hover:text-red-500 rounded-lg"><Trash2 size={18}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelWrapper>
    );
  }

  return <div className={`p-8 text-center ${theme.textMuted}`}>Memuat modul...</div>;
}
