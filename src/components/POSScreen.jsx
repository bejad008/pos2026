import React from 'react';
import {
  Search, ShoppingCart, Trash2, Minus, Plus,
  Banknote, Edit2, PauseCircle, X
} from 'lucide-react';
import { formatRupiah, getCatEmoji } from '../utils';

export default function POSScreen({ props, theme }) {
  const {
    searchQuery, setSearchQuery,
    activeCategory, setActiveCategory, displayCategories,
    filteredProducts, addToCart, cart, updateQty, clearCart,
    isCartOpen, setIsCartOpen, discount, setDiscount,
    taxEnabled, setTaxEnabled, subtotal, taxAmount, grandTotal,
    setCheckoutModalOpen, editingTransactionId, handleHoldBill, cancelEdit,
  } = props;

  return (
    <div className="flex-1 flex h-full min-h-0 relative">

      {/* ── EDIT MODE BANNER ── */}
      {editingTransactionId && (
        <div className="absolute top-0 left-0 right-0 bg-amber-600 text-white text-center py-2 font-bold z-20 flex justify-center items-center gap-4 shadow-lg text-sm">
          <span>⚠️ MODE EDIT/RETUR TRANSAKSI: {editingTransactionId}</span>
          <button onClick={cancelEdit} className="bg-black/30 hover:bg-black/50 px-3 py-1 rounded-lg text-xs transition-all">
            Batalkan Edit
          </button>
        </div>
      )}

      {/* ── LEFT: PRODUCT CATALOG ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${editingTransactionId ? 'pt-10' : ''}`}>

        {/* Search + Categories */}
        <div className={`p-4 md:p-6 pb-2 space-y-3 shrink-0 ${theme.bgPanel} backdrop-blur-sm`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={20} />
            <input
              type="text"
              placeholder="Cari SKU / nama barang..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full bg-black/20 border ${theme.border} ${theme.textMain} rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-current transition-all backdrop-blur-md`}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {displayCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border backdrop-blur-md ${
                  activeCategory === cat
                    ? `${theme.buttonBg} ${theme.buttonText} shadow-lg border-transparent`
                    : `bg-black/10 ${theme.border} ${theme.textMuted} hover:bg-black/20`
                }`}
              >
                <span className="text-base">{getCatEmoji(cat)}</span> {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-20 md:pb-4">
            {filteredProducts.map(product => {
              const isOutOfStock = (product.stock || 0) <= 0;
              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`${theme.bgPanel} backdrop-blur-md border ${theme.border} rounded-2xl flex flex-col relative p-3 md:p-4 shadow-lg transition-all duration-200 ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed grayscale'
                      : 'cursor-pointer hover:border-current hover:shadow-xl group'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.accent}`}>
                      {product.category || 'Lain-lain'}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isOutOfStock ? 'bg-red-900/80 text-red-300' : 'bg-black/30 text-current'
                    }`}>
                      {product.stock ?? 0}
                    </span>
                  </div>

                  <h3 className={`font-semibold text-sm leading-tight my-2 flex-1 ${theme.textMain}`}>
                    {product.name}
                  </h3>

                  <div className={`flex items-end justify-between mt-auto border-t ${theme.border} pt-2`}>
                    <span className={`font-bold text-base ${theme.accent}`}>
                      {formatRupiah(product.price)}
                    </span>
                    {!isOutOfStock && (
                      <div className={`w-7 h-7 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-current transition-colors ${theme.textMuted}`}>
                        <Plus size={14} />
                      </div>
                    )}
                  </div>

                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/75 font-black text-red-400 uppercase tracking-widest text-base border-2 border-red-500/70 rounded-2xl backdrop-blur-sm">
                      HABIS
                    </div>
                  )}
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className={`col-span-full py-16 text-center ${theme.textMuted} text-sm`}>
                Tidak ada produk ditemukan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: CART PANEL ── */}
      <div className={`fixed lg:static inset-y-0 right-0 z-50 w-full max-w-[380px] ${theme.bgPanel} backdrop-blur-xl border-l ${theme.border} flex flex-col shadow-2xl transition-transform duration-300 shrink-0 ${
        isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      } ${editingTransactionId ? 'pt-10 lg:pt-10' : ''}`}>

        {/* Cart Header */}
        <div className={`p-4 border-b ${theme.border} flex justify-between items-center bg-black/20 shrink-0`}>
          <div className="flex items-center gap-2">
            <ShoppingCart className={theme.accent} size={20} />
            <h2 className={`font-bold tracking-wide ${theme.textMain}`}>Struk Pembelian</h2>
          </div>
          <div className="flex gap-1">
            {!editingTransactionId && (
              <button onClick={handleHoldBill} disabled={!cart.length}
                className={`p-2 ${theme.textMuted} hover:text-emerald-400 disabled:opacity-30 transition-colors`} title="Tahan Pesanan">
                <PauseCircle size={18} />
              </button>
            )}
            <button onClick={clearCart} disabled={!cart.length}
              className={`p-2 ${theme.textMuted} hover:text-red-400 disabled:opacity-30 transition-colors`}>
              <Trash2 size={18} />
            </button>
            <button onClick={() => setIsCartOpen(false)} className={`lg:hidden p-2 ${theme.textMuted} hover:text-white`}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center opacity-30 ${theme.textMuted}`}>
              <ShoppingCart size={40} />
              <p className="mt-2 text-sm">Keranjang kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className={`flex gap-3 bg-black/10 p-3 rounded-xl border ${theme.border} items-center`}>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold ${theme.textMain} text-sm truncate`}>{item.name}</h4>
                  <div className={`${theme.accent} text-xs mt-0.5 font-mono`}>{formatRupiah(item.price)}</div>
                </div>
                <div className={`flex items-center bg-black/20 rounded-xl border ${theme.border} shrink-0`}>
                  <button onClick={() => updateQty(item.id, -1)} className={`w-8 h-8 flex items-center justify-center ${theme.textMain} hover:text-red-400 transition-colors`}>
                    <Minus size={14} />
                  </button>
                  <span className={`w-7 text-center text-sm font-bold ${theme.textMain}`}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className={`w-8 h-8 flex items-center justify-center ${theme.textMain} hover:text-emerald-400 transition-colors`}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className={`bg-black/30 border-t ${theme.border} p-4 shrink-0 space-y-3`}>
          {/* Discount + Tax */}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Diskon (Rp)"
              value={discount || ''}
              onChange={e => setDiscount(Number(e.target.value))}
              className={`flex-1 bg-black/20 border ${theme.border} rounded-xl p-2.5 ${theme.textMain} text-sm focus:outline-none`}
            />
            <button
              onClick={() => setTaxEnabled(!taxEnabled)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                taxEnabled
                  ? `${theme.buttonBg} ${theme.buttonText} border-transparent`
                  : `bg-black/20 ${theme.textMuted} ${theme.border}`
              }`}
            >
              PPN 10%
            </button>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className={`flex justify-between ${theme.textMuted}`}>
              <span>Subtotal</span><span>{formatRupiah(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400 text-xs">
                <span>Diskon</span><span>-{formatRupiah(discount)}</span>
              </div>
            )}
            {taxEnabled && (
              <div className="flex justify-between text-red-400 text-xs">
                <span>PPN 10%</span><span>+{formatRupiah(taxAmount)}</span>
              </div>
            )}
            <div className={`pt-2 border-t ${theme.border} flex justify-between items-center`}>
              <span className="font-bold">Total</span>
              <span className={`text-2xl font-black ${theme.accent}`}>{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          {/* Checkout / Update Button */}
          <button
            onClick={() => setCheckoutModalOpen(true)}
            disabled={!cart.length}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-base transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
              editingTransactionId
                ? 'bg-amber-700 hover:bg-amber-600 text-white border border-amber-500'
                : `${theme.buttonBg} ${theme.buttonText} border-transparent`
            }`}
          >
            {editingTransactionId
              ? <><Edit2 size={18}/> Update Transaksi</>
              : <><Banknote size={18}/> Checkout</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
