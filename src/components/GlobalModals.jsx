import React, { useState } from 'react';
import {
  X, AlertTriangle, CheckCircle, Printer, RefreshCw,
  Wallet, Tags, Plus, Trash2, ArrowLeft, Lock, Key, Loader2,
} from 'lucide-react';
import { formatRupiah } from '../utils';

// ─────────────────────────────────────────────
// ALERT MODAL
// ─────────────────────────────────────────────
export function AlertModal({ message, onClose, theme }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border border-amber-500/50 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center`}>
        <h3 className={`text-lg font-bold ${theme.textMain} mb-4 whitespace-pre-wrap`}>{message}</h3>
        <button onClick={onClose} className={`w-full p-3 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-bold`}>
          Tutup
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFIRM MODAL
// ─────────────────────────────────────────────
export function ConfirmModal({ dialog, onClose, theme }) {
  if (!dialog?.isOpen) return null;
  return (
    <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border border-red-500/50 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center`}>
        <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
        <h3 className={`text-lg font-bold ${theme.textMain} mb-2`}>{dialog.title}</h3>
        <p className={`text-sm ${theme.textMuted} mb-6`}>{dialog.message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className={`flex-1 p-3 rounded-xl border ${theme.border} ${theme.textMuted} font-semibold`}>
            Batal
          </button>
          <button
            onClick={() => { dialog.onConfirm?.(); onClose(); }}
            className={`flex-1 p-3 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-bold`}
          >
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROMPT MODAL
// ─────────────────────────────────────────────
export function PromptModal({ dialog, setDialog, onClose, theme }) {
  if (!dialog?.isOpen) return null;
  return (
    <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden`}>
        <div className={`p-4 bg-black/20 border-b ${theme.border}`}>
          <h3 className={`text-lg font-bold ${theme.textMain}`}>{dialog.title}</h3>
        </div>
        <div className="p-5">
          <p className={`text-sm ${theme.textMuted} mb-3`}>{dialog.message}</p>
          <input
            autoFocus
            type="text"
            value={dialog.value}
            onChange={e => setDialog(prev => ({ ...prev, value: e.target.value }))}
            placeholder={dialog.placeholder}
            onKeyDown={e => {
              if (e.key === 'Enter') { dialog.onConfirm?.(dialog.value); onClose(); }
              if (e.key === 'Escape') onClose();
            }}
            className={`w-full bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} focus:outline-none mb-4`}
          />
          <div className="flex gap-2">
            <button onClick={onClose} className={`flex-1 p-3 rounded-xl border ${theme.border} ${theme.textMuted} font-semibold`}>
              Batal
            </button>
            <button
              onClick={() => { dialog.onConfirm?.(dialog.value); onClose(); }}
              className={`flex-1 p-3 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-bold`}
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUCCESS / RECEIPT MODAL
// FIX: Tombol "Cetak Struk" kini disabled saat printing berlangsung
// untuk mencegah double-print (window.print() dipanggil berkali-kali).
// ─────────────────────────────────────────────
export function SuccessModal({ transaction, onPrint, onFinish, printStatus, theme }) {
  // ✅ FIX: Local state untuk track apakah sedang mencetak
  const [isPrinting, setIsPrinting] = useState(false);

  if (!transaction) return null;

  const handlePrintClick = async () => {
    if (isPrinting) return; // ✅ Guard: abaikan klik ganda
    setIsPrinting(true);
    try {
      await onPrint(); // onPrint = handlePrintReceipt (async)
    } finally {
      // Reset setelah selesai (atau setelah onAfterBrowserPrint callback)
      // Untuk browser method, afterprint bisa async jadi tunggu sebentar
      setTimeout(() => setIsPrinting(false), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border border-emerald-600/50 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center`}>
        <CheckCircle className="text-emerald-400 mx-auto mb-4" size={56} />
        <h3 className={`text-xl font-bold ${theme.textMain} mb-1`}>Transaksi Berhasil!</h3>
        <p className={`text-sm font-mono ${theme.textMuted} mb-4`}>{transaction.id}</p>

        <div className={`bg-black/20 border ${theme.border} rounded-xl p-4 mb-5`}>
          <p className={`text-xs uppercase ${theme.textMuted}`}>Debet Transaksi</p>
          <p className={`text-3xl font-black ${theme.accent} font-mono`}>{formatRupiah(transaction.total)}</p>
          {transaction.paymentMethod === 'Tempo' && (
            <p className="text-xs text-red-400 font-bold mt-2 bg-red-900/30 py-1 rounded">
              Dicatat Sebagai Piutang
            </p>
          )}
        </div>

        {printStatus && (
          <p className={`text-xs font-mono p-2 rounded mb-3 bg-black/20 ${theme.textMuted}`}>
            {printStatus}
          </p>
        )}

        <div className="space-y-2">
          {/* ✅ FIX: disabled saat printing, tampilkan spinner */}
          <button
            onClick={handlePrintClick}
            disabled={isPrinting}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-800/90 border border-emerald-500/50 text-emerald-50 hover:bg-emerald-700 font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPrinting
              ? <><Loader2 size={20} className="animate-spin" /> Mencetak...</>
              : <><Printer size={20} /> Cetak Struk</>
            }
          </button>
          <button
            onClick={onFinish}
            disabled={isPrinting}
            className={`w-full p-4 rounded-xl border ${theme.border} ${theme.textMuted} hover:bg-black/20 font-semibold disabled:opacity-50`}
          >
            Selesai Tanpa Cetak
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CHECKOUT MODAL
// FIX: Tambah isSubmitting state untuk mencegah double-submit.
// Di mobile/APK, double-tap bisa kirim 2 transaksi ke Firestore.
// ─────────────────────────────────────────────
export function CheckoutModal({
  isOpen, onClose, onSubmit, grandTotal, customers, paymentMethod, setPaymentMethod,
  selectedCustomerId, setSelectedCustomerId, amountTendered, setAmountTendered,
  editingTransactionId, theme,
}) {
  // ✅ FIX: Local isSubmitting state untuk prevent double-submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Guard
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border border-emerald-600/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden`}>
        <div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}>
          <h3 className={`text-lg font-bold ${theme.textMain}`}>Sistem Pembayaran</h3>
          <button onClick={onClose} disabled={isSubmitting} className={`${theme.textMuted} hover:text-white p-1 disabled:opacity-40`}>
            <X size={20}/>
          </button>
        </div>

        {/* ✅ FIX: onSubmit diganti handleSubmit dengan guard */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className={`text-center bg-black/20 border ${theme.border} p-4 rounded-xl`}>
            <p className={`text-sm ${theme.textMuted} uppercase tracking-wider`}>Tagihan Akhir</p>
            <p className={`text-4xl font-black ${theme.accent} font-mono`}>{formatRupiah(grandTotal)}</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className={`block text-xs font-bold ${theme.textMuted} mb-2 uppercase tracking-wider`}>
              Instrumen Pembayaran
            </label>
            <div className="flex gap-2">
              {['Tunai', 'QRIS', 'Tempo'].map(m => (
                <button
                  key={m} type="button"
                  onClick={() => setPaymentMethod(m)}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all disabled:opacity-60 ${
                    paymentMethod === m
                      ? `${theme.buttonBg} ${theme.buttonText} border-transparent`
                      : `bg-transparent ${theme.border} ${theme.textMuted} hover:bg-black/20`
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo — customer picker */}
          {paymentMethod === 'Tempo' && (
            <div className="bg-red-900/10 border border-red-700/30 p-4 rounded-xl">
              <label className="block text-xs font-bold text-red-400 mb-2 uppercase tracking-wider">
                Bebankan ke Pelanggan (Kasbon)
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                disabled={isSubmitting}
                className={`w-full bg-black/30 border border-red-700/50 rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none`}
              >
                <option value="">-- Pilih Relasi Pelanggan --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Hutang: {formatRupiah(c.debt)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cash input */}
          {paymentMethod === 'Tunai' && !editingTransactionId && (
            <div>
              <label className={`block text-xs font-bold ${theme.textMuted} mb-2 uppercase tracking-wider`}>
                Kas Diterima (Rp)
              </label>
              <input
                required
                autoFocus
                type="number"
                min={grandTotal}
                value={amountTendered}
                onChange={e => setAmountTendered(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-black/20 border border-emerald-700/50 rounded-xl p-4 text-emerald-400 text-2xl font-black text-center focus:outline-none disabled:opacity-60"
              />
              {Number(amountTendered) >= grandTotal && (
                <p className="text-center text-base font-bold text-emerald-400 mt-2">
                  Kembalian: {formatRupiah(Number(amountTendered) - grandTotal)}
                </p>
              )}
            </div>
          )}

          {/* ✅ FIX: Tombol submit disabled + spinner saat isSubmitting */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full p-4 rounded-xl font-black text-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              editingTransactionId
                ? 'bg-amber-700 hover:bg-amber-600 text-white'
                : 'bg-emerald-800/90 hover:bg-emerald-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <><Loader2 size={20} className="animate-spin" /> Memproses...</>
            ) : editingTransactionId ? (
              '✎ Selesaikan Update & Retur'
            ) : (
              '✓ Selesaikan Pembayaran'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STOCK UPDATE MODAL
// ─────────────────────────────────────────────
export function StockModal({ isOpen, onClose, onSubmit, item, amount, setAmount, costPrice, setCostPrice, reason, setReason, theme }) {
  if (!isOpen || !item) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border border-emerald-600/50 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden`}>
        <div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}>
          <h3 className={`text-lg font-bold ${theme.textMain} flex items-center gap-2`}>
            <RefreshCw size={20} className="text-emerald-400" /> Mutasi Inventaris
          </h3>
          <button onClick={onClose}><X size={20} className={theme.textMuted}/></button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="text-center">
            <p className={`text-xs ${theme.textMuted}`}>SKU</p>
            <p className={`text-lg font-bold ${theme.textMain}`}>{item.name}</p>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-900/20 py-1 px-3 rounded-full">
              Stok: {item.stock ?? 0} | HPP: {formatRupiah(item.cost)}
            </span>
          </div>

          <div>
            <label className={`block text-xs font-bold ${theme.textMuted} mb-1 text-center`}>Tipe Mutasi</label>
            <select
              value={reason} onChange={e => setReason(e.target.value)}
              className={`w-full bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none mb-3`}
            >
              <option value="Restock Barang Masuk">Restock (Barang Masuk)</option>
              <option value="Koreksi Barang Rusak/Expired">Koreksi Rusak/Expired (Pengurangan)</option>
              <option value="Audit Stok Opname">Audit Stok Opname</option>
            </select>

            <label className={`block text-xs font-bold ${theme.textMuted} mb-1 text-center`}>Volume / Jumlah</label>
            <input
              autoFocus required type="number"
              placeholder="Contoh: 10 atau -5"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full bg-black/20 border border-emerald-700/50 rounded-xl p-3 text-emerald-400 font-black text-center focus:outline-none text-xl"
            />
          </div>

          {Number(amount) > 0 && reason === 'Restock Barang Masuk' && (
            <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-4">
              <label className="block text-xs font-bold text-emerald-400 mb-2 text-center">
                Harga Beli Baru/Satuan (untuk HPP Average Cost)
              </label>
              <input
                required type="number" min="0"
                value={costPrice} onChange={e => setCostPrice(e.target.value)}
                className="w-full bg-black/20 border border-emerald-700/50 rounded-xl p-3 text-emerald-400 font-bold text-center focus:outline-none"
              />
            </div>
          )}

          <button type="submit" className="w-full p-3 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold transition-all">
            Simpan Pembukuan Stok
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADD PRODUCT MODAL
// ─────────────────────────────────────────────
export function AddProductModal({ isOpen, onClose, onSubmit, item, setItem, categories, theme }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl w-full max-w-md shadow-2xl overflow-hidden`}>
        <div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}>
          <h3 className={`text-lg font-bold ${theme.textMain}`}>Registrasi Master Item</h3>
          <button onClick={onClose}><X size={20} className={theme.textMuted}/></button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Nama SKU / Item</label>
            <input
              required type="text" placeholder="Nama produk..."
              value={item.name}
              onChange={e => setItem(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none`}
            />
          </div>

          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Kategori Induk</label>
            <select
              required value={item.category}
              onChange={e => setItem(prev => ({ ...prev, category: e.target.value }))}
              className={`w-full bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none`}
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'HPP Awal (Rp)',   key: 'cost' },
              { label: 'Harga Jual (Rp)', key: 'price' },
              { label: 'Stok Awal',       key: 'stock' },
            ].map(f => (
              <div key={f.key}>
                <label className={`block text-xs ${theme.textMuted} mb-1`}>{f.label}</label>
                <input
                  required type="number" min="0" value={item[f.key]}
                  onChange={e => setItem(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className={`w-full bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none`}
                />
              </div>
            ))}
          </div>

          <button type="submit" className={`w-full p-3 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-bold`}>
            Publish ke Server
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CATEGORY MODAL
// ─────────────────────────────────────────────
export function CategoryModal({ isOpen, onClose, categories, newName, setNewName, onAdd, onRemove, theme }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl w-full max-w-md shadow-2xl overflow-hidden`}>
        <div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}>
          <h3 className={`text-lg font-bold ${theme.textMain} flex items-center gap-2`}>
            <Tags size={20} /> Kelola Master Kategori
          </h3>
          <button onClick={onClose}><X size={20} className={theme.textMuted}/></button>
        </div>
        <div className="p-5 space-y-4">
          <form onSubmit={onAdd} className="flex gap-2">
            <input
              required autoFocus type="text" value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nama kategori baru..."
              className={`flex-1 bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none`}
            />
            <button type="submit" className={`px-4 py-2 ${theme.buttonBg} ${theme.buttonText} rounded-xl font-bold text-sm`}>
              <Plus size={16} />
            </button>
          </form>
          <div className={`bg-black/10 border ${theme.border} rounded-xl overflow-hidden max-h-60 overflow-y-auto`}>
            {categories.length === 0
              ? <p className={`p-4 text-center text-sm ${theme.textMuted}`}>Belum ada kategori.</p>
              : categories.map(cat => (
                <div key={cat} className={`p-3 flex justify-between items-center hover:bg-black/20 border-b ${theme.border}`}>
                  <span className={`${theme.textMain} font-medium text-sm`}>{cat}</span>
                  <button onClick={() => onRemove(cat)} className="p-1.5 text-red-500 hover:bg-red-900/20 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPENSE MODAL
// ─────────────────────────────────────────────
export function ExpenseModal({ isOpen, onClose, onSubmit, expense, setExpense, theme }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border border-red-600/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden`}>
        <div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}>
          <h3 className={`text-lg font-bold ${theme.textMain} flex items-center gap-2`}>
            <Wallet size={20} className="text-red-500" /> Catat Kas Keluar
          </h3>
          <button onClick={onClose}><X size={20} className={theme.textMuted}/></button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className={`block text-xs font-bold ${theme.textMuted} mb-1`}>Keterangan / Tujuan Kas</label>
            <input
              required type="text" placeholder="Misal: Beli Token Listrik"
              value={expense.description}
              onChange={e => setExpense(p => ({ ...p, description: e.target.value }))}
              className={`w-full bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold ${theme.textMuted} mb-1`}>Kategori Biaya</label>
              <select
                value={expense.category} onChange={e => setExpense(p => ({ ...p, category: e.target.value }))}
                className={`w-full bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none`}
              >
                <option>Operasional</option>
                <option>Gaji</option>
                <option>Lain-lain</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-bold ${theme.textMuted} mb-1`}>Nominal (Rp)</label>
              <input
                required type="number" min="1" placeholder="0"
                value={expense.amount}
                onChange={e => setExpense(p => ({ ...p, amount: e.target.value }))}
                className={`w-full bg-black/20 border border-red-700/50 rounded-xl p-3 ${theme.textMain} text-sm focus:outline-none`}
              />
            </div>
          </div>
          <button type="submit" className="w-full p-3 rounded-xl bg-red-800/90 hover:bg-red-700 text-white font-bold transition-all">
            Simpan Pengeluaran
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAY DEBT MODAL
// ─────────────────────────────────────────────
export function PayDebtModal({ isOpen, onClose, onSubmit, customer, amount, setAmount, theme }) {
  if (!isOpen || !customer) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border border-emerald-600/50 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden`}>
        <div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}>
          <h3 className={`text-lg font-bold ${theme.textMain}`}>Pelunasan Piutang</h3>
          <button onClick={onClose}><X size={20} className={theme.textMuted}/></button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4 text-center">
          <div>
            <p className={`text-xs ${theme.textMuted}`}>Pembayaran untuk</p>
            <p className={`text-lg font-bold ${theme.textMain}`}>{customer.name}</p>
            <p className="text-sm text-red-400 font-mono">Sisa Hutang: {formatRupiah(customer.debt)}</p>
          </div>
          <input
            autoFocus required type="number" min="1" max={customer.debt}
            placeholder="Nominal Uang (Rp)"
            value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full bg-black/20 border border-emerald-700/50 rounded-xl p-4 text-emerald-400 font-black text-center focus:outline-none text-xl"
          />
          <button type="submit" className="w-full p-3 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold transition-all border border-emerald-600/50">
            Konfirmasi Pembayaran Tunai
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SHIFT MODAL
// ─────────────────────────────────────────────
export function ShiftModal({ isOpen, onClose, onSubmit, action, cashInput, setCashInput, currentUser, theme }) {
  if (!isOpen) return null;
  const isOpenAction = action === 'open';
  return (
    <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border-2 ${theme.border} rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden`}>
        <div className={`p-4 bg-black/20 border-b ${theme.border} flex items-center gap-3`}>
          <button onClick={onClose} className={`p-2 rounded-xl border ${theme.border} ${theme.textMuted} hover:bg-black/30 shrink-0`}>
            <ArrowLeft size={18} />
          </button>
          <h3 className={`flex-1 text-center text-xl font-black ${theme.accent} uppercase tracking-widest pr-10`}>
            {isOpenAction ? 'BUKA LACI KASIR' : 'TUTUP LACI KASIR'}
          </h3>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <p className={`text-sm ${theme.textMuted} text-center`}>
            {isOpenAction
              ? `Halo ${currentUser?.name ?? 'Kasir'}! Masukkan modal awal laci untuk mulai shift.`
              : 'Masukkan total uang fisik yang ada di laci kasir saat ini.'}
          </p>
          <div>
            <label className={`block text-xs font-bold ${theme.textMuted} mb-2 text-center uppercase tracking-widest`}>
              {isOpenAction ? 'MODAL AWAL SHIFT (Rp)' : 'TOTAL UANG FISIK (Rp)'}
            </label>
            <input
              required autoFocus type="number" min="0" placeholder="Rp 0"
              value={cashInput} onChange={e => setCashInput(e.target.value)}
              className={`w-full bg-black/20 border-2 ${theme.border} rounded-xl p-4 ${theme.textMain} text-3xl font-black text-center focus:outline-none`}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className={`flex-1 p-4 rounded-xl border-2 ${theme.border} ${theme.textMuted} hover:bg-black/20 font-bold uppercase tracking-widest`}>
              Kembali
            </button>
            <button type="submit"
              className={`flex-1 p-4 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-black text-lg uppercase tracking-widest`}>
              {isOpenAction ? 'Mulai Shift' : 'Tutup Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
