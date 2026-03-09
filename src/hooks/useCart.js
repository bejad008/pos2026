/**
 * useCart — Cart state management hook
 * FIX: Semua kalkulasi dibungkus useMemo untuk efisiensi re-render
 */
import { useState, useMemo, useCallback } from 'react';

export function useCart() {
  const [cart,                setCart]                = useState([]);
  const [discount,            setDiscount]            = useState(0);
  const [taxEnabled,          setTaxEnabled]          = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [originalEditTrx,     setOriginalEditTrx]     = useState(null);

  // ✅ FIX: useMemo — hanya recalculate saat cart/discount/taxEnabled berubah
  const totals = useMemo(() => {
    const subtotal   = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
    const totalCost  = cart.reduce((s, i) => s + (i.cost  || 0) * (i.qty || 0), 0);
    const taxAmount  = taxEnabled ? Math.round((subtotal - discount) * 0.10) : 0;
    const grandTotal = subtotal - discount + taxAmount;
    const netProfit  = (subtotal - discount) - totalCost;
    return { subtotal, totalCost, taxAmount, grandTotal, netProfit };
  }, [cart, discount, taxEnabled]);

  // ✅ useCallback — fungsi stabil, tidak di-recreate setiap render
  const addToCart = useCallback((product, alertFn) => {
    if ((product.stock || 0) <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alertFn?.('Stok barang sudah maksimal!');
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id, delta, products, alertFn) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newQty = item.qty + delta;

      // When editing, allow restoring original qty (qty from original trx added back to stock)
      const maxStock = editingTransactionId
        ? (item.stock + (originalEditTrx?.items?.find(i => i.id === id)?.qty || 0))
        : item.stock;

      if (newQty > maxStock) {
        alertFn?.('Stok barang tidak mencukupi!');
        return item;
      }
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
