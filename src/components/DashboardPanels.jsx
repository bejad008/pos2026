import React, { useMemo } from 'react';
import {
  History, Clock, BookOpen, Wallet, Package,
  ClipboardList, Users, BarChart3, Printer,
  Edit2, PlayCircle, Plus, Tags, RefreshCw,
  Trash2, Download, Key, Settings2
} from 'lucide-react';
import { formatRupiah, downloadCSV } from '../utils';

export default function DashboardPanels({ activeTab, props, theme }) {
  const {
    currentUser, transactions, products, categories, customers,
    expenses, shifts, holdBills, stockLogs, users,
    historyFilter, setHistoryFilter, historyCustomDate, setHistoryCustomDate,
    handleReprintReceipt, loadTransactionToEditor,
    resumeHoldBill, handleAddCustomer,
    newCustomerName, setNewCustomerName, newCustomerPhone, setNewCustomerPhone,
    setDebtCustomer, setPayDebtModalOpen, setExpenseModalOpen,
    setIsCategoryModalOpen, setIsAddModalOpen, openUpdateStockModal, handleDeleteItem,
    newKasirName, setNewKasirName, handleAddKasir, openPasswordModal, handleDeleteUser,
    reportPeriod, setReportPeriod, handlePrintReport, setPrintSettingsOpen,
  } = props;

  const PanelWrapper = ({ children }) => (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">{children}</div>
    </div>
  );

  // ─────────────────────────────────────────────
  // RIWAYAT TRANSAKSI
  // ─────────────────────────────────────────────
  if (activeTab === 'history') {
    const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const todayStart     = getStartOfDay(new Date());
    const yesterdayStart = todayStart - 86400000;

    const filteredHistory = transactions.filter(t => {
      if (historyFilter === 'today')     return t.timestamp >= todayStart;
      if (historyFilter === 'yesterday') return t.timestamp >= yesterdayStart && t.timestamp < todayStart;
      if (historyFilter === 'custom' && historyCustomDate) {
        const cs = getStartOfDay(new Date(historyCustomDate));
        return t.timestamp >= cs && t.timestamp < cs + 86400000;
      }
      return false;
    });

    const handleExportHistory = () => downloadCSV(
      filteredHistory.map(t => ({
        'Waktu':        new Date(t.timestamp).toLocaleString('id-ID'),
        'Invoice ID':   t.id,
        'Tipe':         t.type || 'Sale',
        'Kasir':        t.kasirName,
        'Metode Bayar': t.paymentMethod,
        'Total':        t.total,
        'Diskon':       t.discount  || 0,
        'Pajak':        t.tax       || 0,
        'Laba Bersih':  t.netProfit || 0,
        'Customer':     t.customerId || '-',
        'Diubah Oleh':  t.lastEditedBy || '-',
      })),
      `Riwayat_Transaksi_${historyFilter}`
    );

    return (
      <PanelWrapper>
        <div className="flex flex-col xl:flex-row justify-between gap-4">
          <div className="flex items-center gap-3">
            <History className={theme.accent} size={28} />
            <h2 className={`text-2xl font-bold ${theme.textMain}`}>Riwayat & Retur Transaksi</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`bg-black/20 p-1 border ${theme.border} rounded-xl flex`}>
              {['today', 'yesterday', 'custom'].map(f => (
                <button key={f} onClick={() => setHistoryFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    historyFilter === f ? `${theme.buttonBg} ${theme.buttonText}` : theme.textMuted
                  }`}>
                  {f === 'today' ? 'Hari Ini' : f === 'yesterday' ? 'Kemarin' : 'Pilih Tgl'}
                </button>
              ))}
            </div>
            {historyFilter === 'custom' && (
              <input type="date" value={historyCustomDate} onChange={e => setHistoryCustomDate(e.target.value)}
                className={`bg-black/20 border ${theme.border} ${theme.textMain} rounded-xl px-3 py-1.5 focus:outline-none`} />
            )}
            <button onClick={handleExportHistory}
              className={`flex items-center gap-2 bg-black/20 border ${theme.border} hover:bg-black/40 ${theme.textMain} px-4 py-2 rounded-xl text-sm font-bold transition-all`}>
              <Download size={16} /> Ekspor CSV
            </button>
          </div>
        </div>

        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden shadow-2xl`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-left border-collapse text-sm ${theme.textMain}`}>
              <thead>
                <tr className={`bg-black/20 border-b ${theme.border} ${theme.textMuted}`}>
                  <th className="p-4">Waktu</th>
                  <th className="p-4">Invoice</th>
                  <th className="p-4">Kasir</th>
                  <th className="p-4">Metode</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border}`}>
                {filteredHistory.map(trx => (
                  <tr key={trx.id} className="hover:bg-black/10 transition-colors">
                    <td className="p-4 text-xs">{new Date(trx.timestamp).toLocaleString('id-ID')}</td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-xs">{trx.id}</span>
                      {trx.type === 'PayDebt' && (
                        <span className={`block text-[10px] text-emerald-400`}>Pelunasan Piutang</span>
                      )}
                      {trx.lastEditedBy && (
                        <span className={`block text-[10px] ${theme.textMuted}`}>✎ {trx.lastEditedBy}</span>
                      )}
                    </td>
                    <td className={`p-4 text-xs ${theme.textMuted}`}>{trx.kasirName}</td>
                    <td className="p-4">
                      <span className={`bg-black/20 border ${theme.border} ${theme.accent} px-2 py-1 rounded text-xs uppercase font-bold`}>
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-400">{formatRupiah(trx.total)}</td>
                    <td className="p-4">
                      {/* Sembunyikan Edit & Reprint untuk PayDebt */}
                      {trx.type !== 'PayDebt' ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleReprintReceipt(trx)}
                            className="px-3 py-1.5 bg-blue-900/60 border border-blue-500/50 hover:bg-blue-800 text-blue-200 rounded-lg text-xs font-bold flex items-center gap-1">
                            <Printer size={13} /> Ulang
                          </button>
                          <button onClick={() => loadTransactionToEditor(trx)}
                            className="px-3 py-1.5 bg-amber-900/60 border border-amber-500/50 hover:bg-amber-800 text-amber-200 rounded-lg text-xs font-bold flex items-center gap-1">
                            <Edit2 size={13} /> Edit
                          </button>
                        </div>
                      ) : (
                        <span className={`block text-center text-xs ${theme.textMuted}`}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr><td colSpan={6} className={`p-8 text-center ${theme.textMuted}`}>Tidak ada transaksi pada filter ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PanelWrapper>
    );
  }

  // ─────────────────────────────────────────────
  // HOLD BILLS
  // ─────────────────────────────────────────────
  if (activeTab === 'holdbills') {
    return (
      <PanelWrapper>
        <h2 className={`text-2xl font-bold ${theme.textMain} flex items-center gap-3`}>
          <Clock className={theme.accent} /> Manajemen Pesanan Meja
        </h2>
        {holdBills.length === 0
          ? <p className={`${theme.textMuted} py-8 text-center`}>Tidak ada pesanan meja tertahan.</p>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holdBills.map(bill => (
                <div key={bill.id} className={`${theme.bgPanel} border ${theme.border} rounded-2xl p-5 shadow-lg`}>
                  <h3 className={`text-lg font-bold ${theme.textMain}`}>{bill.name}</h3>
                  <p className={`text-xs ${theme.textMuted} mb-3`}>
                    {new Date(bill.timestamp).toLocaleTimeString('id-ID')} — {bill.kasirName}
                  </p>
                  <div className="space-y-1 mb-4">
                    {(bill.items || []).map((item, idx) => (
                      <div key={`${bill.id}-item-${idx}`} className={`flex justify-between text-sm border-b ${theme.border} pb-1`}>
                        <span className={theme.textMuted}>{item.qty}×</span>
                        <span className={theme.textMain}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => resumeHoldBill(bill)}
                    className="w-full py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 border border-emerald-500/50">
                    <PlayCircle size={16} /> Proses ke Kasir
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </PanelWrapper>
    );
  }

  // ─────────────────────────────────────────────
  // BUKU PIUTANG
  // ─────────────────────────────────────────────
  if (activeTab === 'customers') {
    return (
      <PanelWrapper>
        <div className="flex items-center gap-3">
          <BookOpen className={theme.accent} size={28} />
          <h2 className={`text-2xl font-bold ${theme.textMain}`}>Buku Besar Piutang</h2>
        </div>

        {['admin', 'kasir'].includes(currentUser?.role) && (
          <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl p-6 shadow-2xl`}>
            <h3 className={`text-base font-bold ${theme.textMain} mb-4 flex items-center gap-2`}>
              <Plus size={18}/> Registrasi Pelanggan
            </h3>
            <form onSubmit={handleAddCustomer} className="flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="Nama Pelanggan" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)}
                className={`flex-1 bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none`} />
              <input type="text" placeholder="Nomor Telepon" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)}
                className={`flex-1 bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none`} />
              <button type="submit" className={`px-6 py-3 ${theme.buttonBg} ${theme.buttonText} rounded-xl font-bold whitespace-nowrap`}>
                Simpan
              </button>
            </form>
          </div>
        )}

        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden shadow-2xl`}>
          <table className={`w-full text-left ${theme.textMain}`}>
            <thead>
              <tr className={`bg-black/20 border-b ${theme.border} text-sm ${theme.textMuted}`}>
                <th className="p-4">Nama</th>
                <th className="p-4">Kontak</th>
                <th className="p-4 text-right">Saldo Piutang</th>
                {['admin', 'kasir'].includes(currentUser?.role) && <th className="p-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-black/10">
                  <td className="p-4 font-bold">{c.name}</td>
                  <td className="p-4 text-sm">{c.phone || '-'}</td>
                  <td className={`p-4 text-right font-bold text-lg ${(c.debt || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatRupiah(c.debt || 0)}
                  </td>
                  {['admin', 'kasir'].includes(currentUser?.role) && (
                    <td className="p-4 text-center">
                      <button onClick={() => { setDebtCustomer(c); setPayDebtModalOpen(true); }}
                        disabled={!(c.debt > 0)}
                        className="px-4 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-30 border border-emerald-500/50">
                        Lunasi
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={4} className={`p-8 text-center ${theme.textMuted}`}>Belum ada pelanggan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </PanelWrapper>
    );
  }

  // ─────────────────────────────────────────────
  // PENGELUARAN
  // ─────────────────────────────────────────────
  if (activeTab === 'expenses') {
    return (
      <PanelWrapper>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className={theme.accent} size={28} />
            <h2 className={`text-2xl font-bold ${theme.textMain}`}>Jurnal Pengeluaran</h2>
          </div>
          {['admin', 'kasir'].includes(currentUser?.role) && (
            <button onClick={() => setExpenseModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 ${theme.buttonBg} ${theme.buttonText} rounded-xl font-bold text-sm`}>
              <Plus size={18}/> Entri Kas Keluar
            </button>
          )}
        </div>
        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden shadow-2xl`}>
          <table className={`w-full text-left ${theme.textMain}`}>
            <thead>
              <tr className={`bg-black/20 border-b ${theme.border} text-sm ${theme.textMuted}`}>
                <th className="p-4">Waktu</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4">PIC</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-black/10">
                  <td className="p-4 text-xs">{new Date(e.timestamp).toLocaleString('id-ID')}</td>
                  <td className="p-4 font-bold">{e.description}</td>
                  <td className="p-4 text-sm">{e.category}</td>
                  <td className="p-4 text-right font-bold text-red-400">{formatRupiah(e.amount)}</td>
                  <td className={`p-4 text-xs ${theme.textMuted}`}>{e.kasirName}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={5} className={`p-8 text-center ${theme.textMuted}`}>Belum ada pengeluaran.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </PanelWrapper>
    );
  }

  // ─────────────────────────────────────────────
  // INVENTARIS
  // ─────────────────────────────────────────────
  if (activeTab === 'inventory' && ['admin', 'owner'].includes(currentUser?.role)) {
    return (
      <PanelWrapper>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Package className={theme.accent} size={28} />
            <h2 className={`text-2xl font-bold ${theme.textMain}`}>Master Data Inventaris</h2>
          </div>
          {currentUser?.role === 'admin' && (
            <div className="flex gap-2">
              <button onClick={() => setIsCategoryModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 bg-black/20 border ${theme.border} hover:bg-black/30 ${theme.textMain} rounded-xl font-semibold text-sm`}>
                <Tags size={16}/> Kategori
              </button>
              <button onClick={() => setIsAddModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 ${theme.buttonBg} ${theme.buttonText} rounded-xl font-semibold text-sm`}>
                <Plus size={16}/> Tambah SKU
              </button>
            </div>
          )}
        </div>

        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden shadow-2xl`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-left ${theme.textMain}`}>
              <thead>
                <tr className={`bg-black/20 border-b ${theme.border} text-sm ${theme.textMuted}`}>
                  <th className="p-4">Nama SKU</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">HPP / Harga Jual</th>
                  <th className="p-4 text-center">Stok</th>
                  {currentUser?.role === 'admin' && <th className="p-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border}`}>
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-black/10">
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4 text-sm">{p.category}</td>
                    <td className="p-4 text-sm">
                      <div className={theme.textMuted}>HPP: {formatRupiah(p.cost)}</div>
                      <div className={`font-bold ${theme.accent}`}>{formatRupiah(p.price)}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-lg font-black ${(p.stock || 0) <= 5 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                        {p.stock ?? 0}
                      </span>
                    </td>
                    {currentUser?.role === 'admin' && (
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openUpdateStockModal(p)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-800/80 border border-emerald-500/50 hover:bg-emerald-700 text-emerald-50 rounded-lg text-xs font-bold">
                            <RefreshCw size={13}/> Mutasi
                          </button>
                          <button onClick={() => handleDeleteItem(p.id)} className="p-1.5 text-red-500 hover:bg-red-900/20 rounded-lg">
                            <Trash2 size={17}/>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={5} className={`p-8 text-center ${theme.textMuted}`}>Belum ada produk.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PanelWrapper>
    );
  }

  // ─────────────────────────────────────────────
  // LAPORAN EKSEKUTIF
  // ─────────────────────────────────────────────
  if (activeTab === 'reports' && ['admin', 'owner'].includes(currentUser?.role)) {
    const now          = new Date();
    const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear  = new Date(now.getFullYear(), 0, 1).getTime();

    const filteredTrx = transactions.filter(t => {
      if (reportPeriod === 'hari_ini')  return t.timestamp >= startOfDay;
      if (reportPeriod === 'bulan_ini') return t.timestamp >= startOfMonth;
      if (reportPeriod === 'tahun_ini') return t.timestamp >= startOfYear;
      return true;
    });
    const filteredExp = expenses.filter(e => {
      if (reportPeriod === 'hari_ini')  return e.timestamp >= startOfDay;
      if (reportPeriod === 'bulan_ini') return e.timestamp >= startOfMonth;
      if (reportPeriod === 'tahun_ini') return e.timestamp >= startOfYear;
      return true;
    });

    const saleTrx        = filteredTrx.filter(t => t.type !== 'PayDebt');
    const totalSales     = saleTrx.reduce((s, t) => s + (t.total     || 0), 0);
    const totalCostGoods = saleTrx.reduce((s, t) => s + (t.totalCost || 0), 0);
    const grossProfit    = totalSales - totalCostGoods;
    const totalExpense   = filteredExp.reduce((s, e) => s + (e.amount || 0), 0);
    const realNetProfit  = grossProfit - totalExpense;

    const onPrintReport = () => handlePrintReport({
      totalSales, totalCostGoods, grossProfit, totalExpense, realNetProfit,
      filteredTrx: saleTrx, filteredExp, products,
    });

    const periodButtons = [
      { id: 'hari_ini',  label: 'Hari Ini' },
      { id: 'bulan_ini', label: 'Bulan Ini' },
      { id: 'tahun_ini', label: 'Tahun Ini' },
      { id: 'semua',     label: 'Semua' },
    ];

    const summaryRows = [
      { label: 'Total Transaksi',             value: `${saleTrx.length} transaksi`,      highlight: false },
      { label: 'Pendapatan Kotor',            value: formatRupiah(totalSales),           highlight: false },
      { label: 'HPP (Harga Pokok Penjualan)', value: `-${formatRupiah(totalCostGoods)}`, highlight: false },
      { label: 'Laba Kotor (Gross Profit)',   value: formatRupiah(grossProfit),          highlight: true  },
      { label: 'Total Pengeluaran Operasional', value: `-${formatRupiah(totalExpense)}`, highlight: false },
      { label: '🏆 LABA BERSIH (EBITDA)',     value: formatRupiah(realNetProfit),        highlight: true  },
    ];

    return (
      <PanelWrapper>
        <div className="flex flex-col xl:flex-row justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className={theme.accent} size={28}/>
            <h2 className={`text-2xl font-bold ${theme.textMain}`}>Laporan Laba Rugi</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`bg-black/20 p-1 border ${theme.border} rounded-xl flex`}>
              {periodButtons.map(p => (
                <button key={p.id} onClick={() => setReportPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    reportPeriod === p.id ? `${theme.buttonBg} ${theme.buttonText}` : theme.textMuted
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={() => setPrintSettingsOpen(true)}
              className={`flex items-center gap-2 px-3 py-2 bg-black/20 border ${theme.border} hover:bg-black/30 ${theme.textMuted} rounded-xl text-sm font-bold`}>
              <Settings2 size={15}/> Printer
            </button>
            <button onClick={onPrintReport}
              className={`flex items-center gap-2 px-4 py-2 bg-black/20 border ${theme.border} hover:bg-black/40 ${theme.textMain} rounded-xl text-sm font-bold`}>
              <Printer size={16}/> Cetak A4
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${theme.bgPanel} border ${theme.border} p-5 rounded-2xl`}>
            <p className={`text-xs ${theme.textMuted} uppercase mb-1`}>Pendapatan Kotor</p>
            <p className={`text-xl font-bold ${theme.textMain}`}>{formatRupiah(totalSales)}</p>
          </div>
          <div className={`${theme.bgPanel} border ${theme.border} p-5 rounded-2xl`}>
            <p className={`text-xs ${theme.textMuted} uppercase mb-1`}>Laba Kotor</p>
            <p className="text-xl font-bold text-blue-400">{formatRupiah(grossProfit)}</p>
          </div>
          <div className={`${theme.bgPanel} border border-red-900/50 p-5 rounded-2xl`}>
            <p className="text-xs text-red-400/80 uppercase mb-1">Biaya Operasional</p>
            <p className="text-xl font-bold text-red-400">-{formatRupiah(totalExpense)}</p>
          </div>
          <div className={`${theme.bgPanel} border border-emerald-700/50 p-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)]`}>
            <p className="text-xs text-emerald-400/80 uppercase mb-1">Laba Bersih (EBITDA)</p>
            <p className={`text-2xl font-black ${realNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatRupiah(realNetProfit)}
            </p>
          </div>
        </div>

        {/* Detail Table */}
        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl p-6 shadow-2xl`}>
          <h3 className={`text-lg font-bold ${theme.textMain} mb-4`}>Ringkasan Detail</h3>
          <div className="space-y-2">
            {summaryRows.map((row, i) => (
              <div key={i} className={`flex justify-between items-center py-3 border-b ${theme.border}`}>
                <span className={row.highlight ? `font-bold ${theme.textMain}` : theme.textMuted}>{row.label}</span>
                <span className={`font-bold ${row.highlight ? theme.accent : theme.textMain}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export CSV */}
        <div className="flex justify-end">
          <button onClick={() => downloadCSV(
            saleTrx.map(t => ({
              'Invoice': t.id, 'Tgl': new Date(t.timestamp).toLocaleString('id-ID'),
              'Kasir': t.kasirName, 'Metode': t.paymentMethod,
              'Total': t.total, 'HPP': t.totalCost || 0, 'Laba': t.netProfit || 0,
            })),
            `Laporan_${reportPeriod}`
          )} className={`flex items-center gap-2 px-4 py-2 bg-black/20 border ${theme.border} hover:bg-black/30 ${theme.textMain} rounded-xl text-sm font-bold`}>
            <Download size={16}/> Ekspor CSV
          </button>
        </div>
      </PanelWrapper>
    );
  }

  // ─────────────────────────────────────────────
  // BUKU MUTASI STOK
  // FIX: key={log.id} → key={log.id || index} untuk fallback
  // jika log.id undefined karena race condition
  // ─────────────────────────────────────────────
  if (activeTab === 'stocklogs' && ['admin', 'owner'].includes(currentUser?.role)) {
    return (
      <PanelWrapper>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClipboardList className={theme.accent} size={28}/>
            <h2 className={`text-2xl font-bold ${theme.textMain}`}>Buku Mutasi Stok (Audit Trail)</h2>
          </div>
          <button onClick={() => downloadCSV(
            stockLogs.map(l => ({
              'Waktu':       new Date(l.timestamp).toLocaleString('id-ID'),
              'Produk':      l.productName, 'Tipe': l.type, 'Alasan': l.reason,
              'ΔQty':        l.qtyChange, 'Stok Akhir': l.finalStock,
              'HPP':         l.hpp, 'User': l.user,
            })), 'Buku_Mutasi_Stok'
          )} className={`flex items-center gap-2 bg-black/20 border ${theme.border} hover:bg-black/30 ${theme.textMain} px-4 py-2 rounded-xl text-sm font-bold`}>
            <Download size={16}/> Ekspor
          </button>
        </div>

        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden shadow-2xl`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${theme.textMain}`}>
              <thead>
                <tr className={`bg-black/20 border-b ${theme.border} ${theme.textMuted}`}>
                  <th className="p-4">Waktu</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Tipe</th>
                  <th className="p-4">Keterangan</th>
                  <th className="p-4 text-center">ΔQty</th>
                  <th className="p-4 text-center">Stok Akhir</th>
                  <th className="p-4">HPP</th>
                  <th className="p-4">User</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border}`}>
                {/* ✅ FIX: key fallback dengan index untuk mencegah React key collision */}
                {stockLogs.slice(0, 200).map((log, idx) => (
                  <tr key={log.id || `log-${idx}`} className="hover:bg-black/10">
                    <td className="p-4 text-xs">{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                    <td className="p-4 font-bold">{log.productName}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.type === 'IN'
                          ? 'bg-emerald-900/80 text-emerald-300'
                          : 'bg-red-900/80 text-red-300'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="p-4 text-xs">{log.reason}</td>
                    <td className={`p-4 text-center font-black ${log.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(log.qtyChange > 0) ? `+${log.qtyChange}` : log.qtyChange}
                    </td>
                    <td className="p-4 text-center font-bold">{log.finalStock}</td>
                    <td className={`p-4 text-xs ${theme.accent}`}>{formatRupiah(log.hpp)}</td>
                    <td className={`p-4 text-xs ${theme.textMuted}`}>{log.user}</td>
                  </tr>
                ))}
                {stockLogs.length === 0 && (
                  <tr><td colSpan={8} className={`p-8 text-center ${theme.textMuted}`}>Belum ada log mutasi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PanelWrapper>
    );
  }

  // ─────────────────────────────────────────────
  // MANAJEMEN PENGGUNA
  // ─────────────────────────────────────────────
  if (activeTab === 'users' && currentUser?.role === 'admin') {
    return (
      <PanelWrapper>
        <div className="flex items-center gap-3">
          <Users className={theme.accent} size={28}/>
          <h2 className={`text-2xl font-bold ${theme.textMain}`}>Manajemen Pengguna</h2>
        </div>

        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl p-6`}>
          <h3 className={`text-sm font-bold ${theme.textMuted} mb-3 uppercase tracking-wider`}>
            Daftarkan Kasir Baru (Password default: 008)
          </h3>
          <form onSubmit={handleAddKasir} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text" placeholder="Nama Kasir Baru..." value={newKasirName}
              onChange={e => setNewKasirName(e.target.value)}
              className={`flex-1 bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} focus:outline-none`}
            />
            <button type="submit" className={`px-6 py-3 ${theme.buttonBg} ${theme.buttonText} rounded-xl font-bold`}>
              Daftarkan
            </button>
          </form>
        </div>

        <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl overflow-hidden`}>
          <table className={`w-full text-left ${theme.textMain}`}>
            <thead>
              <tr className={`bg-black/20 ${theme.textMuted} text-sm`}>
                <th className="p-4">Identitas</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-center">Keamanan</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-black/10">
                  <td className="p-4 font-bold">{u.name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 bg-black/30 ${theme.textMain} border ${theme.border} rounded-lg text-xs font-bold uppercase`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openPasswordModal(u)} className={`p-2 bg-black/20 ${theme.textMuted} hover:text-yellow-400 rounded-lg`}>
                        <Key size={17}/>
                      </button>
                      {u.role === 'kasir' && (
                        <button onClick={() => handleDeleteUser(u.id, u.name)} className="p-2 bg-black/20 text-red-400/60 hover:text-red-500 rounded-lg">
                          <Trash2 size={17}/>
                        </button>
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
