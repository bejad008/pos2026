/**
 * useCart — Cart state management hook
 *
 * FIX: updateQty sekarang menggunakan live `products` data (dari Firestore real-time)
 * untuk validasi maxStock, BUKAN `item.stock` yang stale dari saat item ditambahkan.
 *
 * Skenario bug lama: Stok A = 5 → kasir tambah 5 ke cart → kasir lain jual 3
 * → stok Firestore jadi 2 → kasir pertama tetap bisa tambah ke 5 → checkout
 * → stock = 2 - 5 = -3 (NEGATIF di database).
 *
 * FIX edit mode: maxStock = currentStock (live) + original_qty
 * bukan item.stock (stale dari transaksi lama) + original_qty.
 *
 * FIX: String coercion pada semua ID comparison untuk menghindari
 * mismatch antara number vs string ID.
 */
import { useState, useMemo, useCallback } from 'react';

export function useCart() {
  const [cart,                 setCart]                = useState([]);
  const [discount,             setDiscount]            = useState(0);
  const [taxEnabled,           setTaxEnabled]          = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [originalEditTrx,      setOriginalEditTrx]     = useState(null);

  // ✅ Semua kalkulasi di-memo, hanya recalculate saat deps berubah
  const totals = useMemo(() => {
    const subtotal   = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
    const totalCost  = cart.reduce((s, i) => s + (i.cost  || 0) * (i.qty || 0), 0);
    const taxAmount  = taxEnabled ? Math.round((subtotal - discount) * 0.10) : 0;
    const grandTotal = subtotal - discount + taxAmount;
    const netProfit  = (subtotal - discount) - totalCost;
    return { subtotal, totalCost, taxAmount, grandTotal, netProfit };
  }, [cart, discount, taxEnabled]);

  const addToCart = useCallback((product, alertFn) => {
    if ((product.stock || 0) <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => String(i.id) === String(product.id));
      if (existing) {
        if (existing.qty >= (product.stock || 0)) {
          alertFn?.('Stok barang sudah maksimal!');
          return prev;
        }
        return prev.map(i =>
          String(i.id) === String(product.id) ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  /**
   * updateQty — FIX UTAMA
   *
   * @param {string} id       — id item yang diubah qty-nya
   * @param {number} delta    — +1 atau -1
   * @param {Array}  products — live products array dari Firestore (WAJIB dipakai)
   * @param {Function} alertFn
   */
  const updateQty = useCallback((id, delta, products, alertFn) => {
    setCart(prev => prev.map(item => {
      if (String(item.id) !== String(id)) return item;

      const newQty = (item.qty || 0) + delta;

      // ✅ FIX: Gunakan live stock dari products array (bukan item.stock yang stale)
      const liveProduct = (products || []).find(p => String(p.id) === String(id));
      const currentStock = liveProduct?.stock ?? item.stock ?? 0;

      let maxStock;
      if (editingTransactionId) {
        // Edit mode: max = stok sekarang (live) + qty yang sudah dijual di transaksi ini
        // (karena item-item tsb akan di-"kembalikan" ke stok saat diedit)
        const originalQty = (originalEditTrx?.items || [])
          .find(i => String(i.id) === String(id))?.qty || 0;
        maxStock = currentStock + originalQty;
      } else {
        maxStock = currentStock;
      }

      if (delta > 0 && newQty > maxStock) {
        alertFn?.('Stok barang tidak mencukupi!');
        return item;
      }

      // Hapus item dari cart jika qty menjadi 0 atau kurang
      if (newQty <= 0) return null;

      return { ...item, qty: newQty };
    }).filter(Boolean));
  }, [editingTransactionId, originalEditTrx]);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
  }, []);

  const loadEditTransaction = useCallback((trx) => {
    setEditingTransactionId(trx.id);
    setOriginalEditTrx(trx);
    setCart(trx.items || []);
    setDiscount(trx.discount || 0);
    setTaxEnabled((trx.tax || 0) > 0);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingTransactionId(null);
    setOriginalEditTrx(null);
    setCart([]);
    setDiscount(0);
    setTaxEnabled(false);
  }, []);

  return {
    cart, setCart,
    discount, setDiscount,
    taxEnabled, setTaxEnabled,
    editingTransactionId, setEditingTransactionId,
    originalEditTrx, setOriginalEditTrx,
    totals,
    addToCart,
    updateQty,
    clearCart,
    loadEditTransaction,
    cancelEdit,
  };
}
