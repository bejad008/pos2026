import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingCart, Menu as MenuIcon, LayoutDashboard, Package,
  BarChart3, FileText, AlertTriangle, LogOut, UserSquare,
  ShieldAlert, Eye, Users, Key, Lock, ArrowLeft, Loader2,
  Wallet, Clock, BookOpen, ClipboardList, Palette, Settings2,
} from 'lucide-react';

// Firebase
import { auth, db, getColRef } from './firebase';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch, increment } from 'firebase/firestore';

// Hooks
import { useFirestoreData } from './hooks/useFirestoreData';
import { useCart }          from './hooks/useCart';

// Utils
import { formatRupiah, generateInvoiceID, downloadCSV, buildRawText } from './utils';
import { themes } from './themes';

// Printing
import { printer }         from './printing/PrintEngine';
import PrintSettingsModal  from './printing/PrintSettings';
import { ReceiptDocument, ReportDocument } from './printing/PrintableDocuments';

// Components
import POSScreen       from './components/POSScreen';
import DashboardPanels from './components/DashboardPanels';
import {
  AlertModal, ConfirmModal, PromptModal, SuccessModal,
  CheckoutModal, StockModal, AddProductModal, CategoryModal,
  ExpenseModal, PayDebtModal, ShiftModal,
} from './components/GlobalModals';

// ─── GitHub background config ─────────────────────────────────
const GITHUB_USERNAME = 'oktetod';
const GITHUB_REPO     = 'pos2026';
const GITHUB_FOLDER   = '';

// ─── Session helpers ──────────────────────────────────────────
const SESSION_KEY = 'gg_pos_session';

const saveSession = (userId, activeTab) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, activeTab }));
  } catch {}
};

const loadSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch { return null; }
};

const clearSession = () => {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
};

export default function App() {
  // ── DB & Auth ────────────────────────────────────────────────
  const { isDbReady, firebaseUser, data } = useFirestoreData();
  const {
    users, products, categories, transactions, customers,
    expenses, shifts, holdBills, stockLogs, currentThemeKey,
  } = data;

  // ── Auth State ───────────────────────────────────────────────
  const [currentUser,      setCurrentUser]      = useState(null);
  const [loginStep,        setLoginStep]        = useState('role');
  const [loginTargetUser,  setLoginTargetUser]  = useState(null);
  const [loginPassword,    setLoginPassword]    = useState('');
  const [loginError,       setLoginError]       = useState('');
  const [newKasirName,     setNewKasirName]     = useState('');
  // Track whether session restoration has been attempted (prevent flash)
  const [sessionChecked,   setSessionChecked]   = useState(false);

  // ── UI State ─────────────────────────────────────────────────
  const [activeTab,         setActiveTab]         = useState('pos');
  const [isSidebarOpen,     setIsSidebarOpen]     = useState(false);
  const [historyFilter,     setHistoryFilter]     = useState('today');
  const [historyCustomDate, setHistoryCustomDate] = useState('');
  const [reportPeriod,      setReportPeriod]      = useState('hari_ini');

  // ── Shift ────────────────────────────────────────────────────
  const [activeShift,    setActiveShift]    = useState(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftAction,    setShiftAction]    = useState('open');
  const [shiftCashInput, setShiftCashInput] = useState('');

  // ── Cart (custom hook) ───────────────────────────────────────
  const {
    cart, setCart,
    discount, setDiscount,
    taxEnabled, setTaxEnabled,
    editingTransactionId, originalEditTrx,
    totals, addToCart, updateQty, clearCart,
    loadEditTransaction, cancelEdit,
  } = useCart();
  const { subtotal, totalCost, taxAmount, grandTotal, netProfit } = totals;

  // ── POS UI ───────────────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isCartOpen,     setIsCartOpen]     = useState(false);

  // ── Checkout ─────────────────────────────────────────────────
  const [checkoutModalOpen,  setCheckoutModalOpen]  = useState(false);
  const [paymentMethod,      setPaymentMethod]      = useState('Tunai');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amountTendered,     setAmountTendered]     = useState('');

  // ── Print ────────────────────────────────────────────────────
  const [lastTransaction,    setLastTransaction]    = useState(null);
  const [reprintTransaction, setReprintTransaction] = useState(null);
  const [printStatus,        setPrintStatus]        = useState('');
  const [printMode,          setPrintMode]          = useState(null);
  const [printSettingsOpen,  setPrintSettingsOpen]  = useState(false);
  const [reportPrintData,    setReportPrintData]    = useState(null);

  // ── Inventory Modals ─────────────────────────────────────────
  const [isAddModalOpen,       setIsAddModalOpen]       = useState(false);
  const [newItem,              setNewItem]              = useState({ name: '', category: '', cost: 0, price: 0, stock: 0 });
  const [isCategoryModalOpen,  setIsCategoryModalOpen]  = useState(false);
  const [newCategoryName,      setNewCategoryName]      = useState('');
  const [isStockModalOpen,     setIsStockModalOpen]     = useState(false);
  const [stockUpdateItem,      setStockUpdateItem]      = useState(null);
  const [stockUpdateAmount,    setStockUpdateAmount]    = useState('');
  const [newCostPrice,         setNewCostPrice]         = useState('');
  const [stockUpdateReason,    setStockUpdateReason]    = useState('Restock Barang Masuk');

  // ── Customers / Expenses ─────────────────────────────────────
  const [newCustomerName,  setNewCustomerName]  = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [newExpense,       setNewExpense]       = useState({ description: '', amount: 0, category: 'Operasional' });
  const [payDebtModalOpen, setPayDebtModalOpen] = useState(false);
  const [debtCustomer,     setDebtCustomer]     = useState(null);
  const [payDebtAmount,    setPayDebtAmount]    = useState('');

  // ── Global Dialogs ───────────────────────────────────────────
  const [alertMsg,      setAlertMsg]      = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [promptDialog,  setPromptDialog]  = useState({ isOpen: false });

  // ── Background Images ────────────────────────────────────────
  const [backgroundImages, setBackgroundImages] = useState([
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=1920&auto=format&fit=crop',
  ]);
  const [currentBg, setCurrentBg] = useState(0);

  // ─── DERIVED ─────────────────────────────────────────────────
  const theme = themes[currentThemeKey] || themes['gelap'];

  const displayCategories = useMemo(
    () => ['Semua', ...categories],
    [categories]
  );

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeCategory === 'Semua' || p.category === activeCategory)
    ),
    [products, searchQuery, activeCategory]
  );

  // ─── SESSION PERSISTENCE ─────────────────────────────────────
  // Restore login session from localStorage once Firestore users are loaded.
  // This is the core fix: prevents returning to login screen after refresh,
  // WebView reload, or APK/EXE restart (when localStorage survives).
  useEffect(() => {
    if (!isDbReady || users.length === 0) return;
    // Only attempt once and only if not already logged in
    if (currentUser) { setSessionChecked(true); return; }

    const saved = loadSession();
    if (saved?.userId) {
      // Re-validate against live Firestore data (handles deleted/renamed users)
      const liveUser = users.find(u => u.id === saved.userId);
      if (liveUser) {
        setCurrentUser(liveUser);
        // Restore last active tab (role-guarded below)
        const allowedTabs = getAllowedTabs(liveUser.role);
        if (saved.activeTab && allowedTabs.includes(saved.activeTab)) {
          setActiveTab(saved.activeTab);
        } else {
          setActiveTab(liveUser.role === 'owner' ? 'reports' : 'pos');
        }
      } else {
        // User was deleted — clear stale session
        clearSession();
      }
    }
    setSessionChecked(true);
  }, [isDbReady, users]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync activeTab to session whenever it changes
  useEffect(() => {
    if (!currentUser) return;
    try {
      const saved = loadSession() || {};
      saveSession(currentUser.id, activeTab);
    } catch {}
  }, [activeTab, currentUser]);

  // ─── EFFECTS ─────────────────────────────────────────────────

  // Fetch GitHub background images
  useEffect(() => {
    if (!GITHUB_USERNAME) return;
    const url = GITHUB_FOLDER
      ? `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`
      : `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents`;
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(files => {
        if (!Array.isArray(files)) return;
        const imgs = files
          .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f.name))
          .map(f => f.download_url);
        if (imgs.length) setBackgroundImages(imgs);
      })
      .catch(() => {});
  }, []);

  // Rotate background
  useEffect(() => {
    if (backgroundImages.length <= 1) return;
    const t = setInterval(() => setCurrentBg(p => (p + 1) % backgroundImages.length), 6000);
    return () => clearInterval(t);
  }, [backgroundImages]);

  // Sync active shift for current user
  useEffect(() => {
    if (!currentUser) return;
    const s = shifts.find(s => s.userId === currentUser.id && s.status === 'open');
    setActiveShift(s || null);
  }, [currentUser, shifts]);

  // Auto-show shift modal for kasir without open shift (but NOT on session restore)
  // We delay slightly so the shift data has time to load from Firestore
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'kasir' || !sessionChecked || !isDbReady) return;
    // Only trigger on fresh login (not on session restore from localStorage)
    // We detect fresh login via the loginStep being reset to 'role' after login
    // This effect intentionally does NOT run on session restore
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── PRINT CSS INJECTION ─────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'gg-print-styles';
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        body.print-receipt #printable-receipt { display: block !important; }
        body.print-report  #printable-report  { display: block !important; }
        #printable-receipt {
          position: fixed; top: 0; left: 0;
          width: 72mm; padding: 0; margin: 0;
          font-family: "Courier New", monospace;
          font-size: 12px; color: #000; background: #fff;
        }
        #printable-report {
          position: fixed; top: 0; left: 0;
          width: 100%; padding: 0; margin: 0;
          font-family: Arial, sans-serif;
          font-size: 12px; color: #000; background: #fff;
        }
        @page { margin: 0; size: auto; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById('gg-print-styles')?.remove(); };
  }, []);

  // ─── HELPER: allowed tabs per role ───────────────────────────
  const getAllowedTabs = (role) => {
    const map = {
      admin:  ['pos', 'history', 'holdbills', 'customers', 'inventory', 'expenses', 'reports', 'stocklogs', 'users'],
      kasir:  ['pos', 'history', 'holdbills', 'customers', 'expenses'],
      owner:  ['customers', 'inventory', 'expenses', 'reports', 'stocklogs'],
    };
    return map[role] || ['pos'];
  };

  // ─── HELPER DIALOGS ──────────────────────────────────────────
  const showAlert   = useCallback((msg) => setAlertMsg(msg), []);
  const showConfirm = useCallback((title, message, onConfirm) =>
    setConfirmDialog({ isOpen: true, title, message, onConfirm }), []);
  const showPrompt  = useCallback((title, message, defaultValue, placeholder, onConfirm) =>
    setPromptDialog({ isOpen: true, title, message, value: defaultValue, placeholder, onConfirm }), []);

  // ─── PRINT HANDLERS ──────────────────────────────────────────
  const handleFinishTransaction = useCallback(() => {
    setLastTransaction(null);
    setReprintTransaction(null);
    setPrintStatus('');
    setPrintMode(null);
    setActiveTab('pos');
    setIsCartOpen(false);
    setSearchQuery('');
    setActiveCategory('Semua');
  }, []);

  const handlePrintReceipt = useCallback(async (trx = lastTransaction, isReprint = false) => {
    setPrintStatus('');
    const target = trx || lastTransaction;
    if (!target) return;

    if (printer.settings.method === 'browser') {
      document.body.classList.add('print-receipt');
      setPrintMode(isReprint ? 'reprint' : 'receipt');

      const result = await printer.printReceipt(target, {
        isReprint,
        onStatus: setPrintStatus,
        onAfterBrowserPrint: () => {
          document.body.classList.remove('print-receipt');
          setPrintMode(null);
          if (!isReprint) handleFinishTransaction();
        },
      });
      console.log('[Print]', result);
    } else {
      try {
        setPrintStatus('⏳ Memproses...');
        const result = await printer.printReceipt(target, {
          isReprint,
          onStatus: setPrintStatus,
        });
        setPrintStatus(`✅ Berhasil via ${result.method}`);
        if (!isReprint) {
          setTimeout(() => {
            setPrintStatus('');
            handleFinishTransaction();
          }, 2000);
        }
      } catch (err) {
        setPrintStatus('');
        showAlert(`❌ Gagal cetak: ${err.message}`);
      }
    }
  }, [lastTransaction, handleFinishTransaction, showAlert]);

  const handlePrintReport = useCallback((reportData) => {
    setReportPrintData(reportData);
    setPrintMode('report');
    document.body.classList.add('print-report');
    printer.printReport(() => {
      document.body.classList.remove('print-report');
      setPrintMode(null);
      setReportPrintData(null);
    });
  }, []);

  // ─── AUTH HANDLERS ───────────────────────────────────────────
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword !== loginTargetUser?.password) {
      setLoginError('Kredensial salah!');
      return;
    }
    const user = loginTargetUser;
    const defaultTab = user.role === 'owner' ? 'reports' : 'pos';
    setCurrentUser(user);
    setActiveTab(defaultTab);
    // ✅ FIX: Persist session to localStorage so refresh doesn't logout
    saveSession(user.id, defaultTab);
    setLoginPassword('');
    setLoginStep('role');
    setLoginError('');

    if (user.role === 'kasir') {
      const hasShift = shifts.find(s => s.userId === user.id && s.status === 'open');
      if (!hasShift) { setShiftAction('open'); setShiftCashInput(''); setShiftModalOpen(true); }
    }
  };

  const handleLogout = useCallback(() => {
    // ✅ FIX: Clear persisted session on logout
    clearSession();
    setCurrentUser(null);
    clearCart();
    setIsCartOpen(false);
    setActiveShift(null);
    setLoginStep('role');
    setLoginTargetUser(null);
    setLoginPassword('');
    setLoginError('');
  }, [clearCart]);

  // ─── TRANSACTION HANDLERS ────────────────────────────────────
  const processCheckoutOrUpdate = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || !firebaseUser || !currentUser) return;
    if (paymentMethod === 'Tempo' && !selectedCustomerId) {
      showAlert('Pilih pelanggan untuk sistem Kasbon!'); return;
    }
    if (paymentMethod === 'Tunai' && Number(amountTendered) < grandTotal && !editingTransactionId) {
      showAlert('Uang diterima kurang dari total!'); return;
    }

    try {
      const batch  = writeBatch(db);
      const makeLogId = () => `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (!editingTransactionId) {
        // ── NEW TRANSACTION ──
        const trxId = generateInvoiceID();
        const trx = {
          id: trxId, type: 'Sale', timestamp: Date.now(), date: new Date().toISOString(),
          items: cart, subtotal, discount, tax: taxAmount, total: grandTotal, totalCost, netProfit,
          paymentMethod, customerId: selectedCustomerId || null,
          kasirName: currentUser.name, shiftId: activeShift?.id || 'NO-SHIFT',
        };
        batch.set(doc(getColRef('transactions'), trxId), trx);

        cart.forEach(item => {
          const estimatedFinalStock = Math.max(0, (item.stock || 0) - (item.qty || 0));
          batch.update(doc(getColRef('products'), String(item.id)), {
            stock: increment(-(item.qty || 0)),
          });
          const logId = makeLogId();
          batch.set(doc(getColRef('stockLogs'), logId), {
            id: logId, productId: item.id, productName: item.name,
            type: 'OUT', reason: `Penjualan ${trxId}`,
            qtyChange: -(item.qty || 0), finalStock: estimatedFinalStock,
            hpp: item.cost, timestamp: Date.now(), user: currentUser.name,
          });
        });

        if (paymentMethod === 'Tempo' && selectedCustomerId) {
          const cust = customers.find(c => c.id === selectedCustomerId);
          if (cust) batch.update(doc(getColRef('customers'), selectedCustomerId), {
            debt: (cust.debt || 0) + grandTotal,
          });
        }

        await batch.commit();
        setLastTransaction(trx);
        clearCart();
        setCheckoutModalOpen(false);
        setIsCartOpen(false);
        setAmountTendered('');
        setSelectedCustomerId('');

      } else {
        // ── EDIT / RETUR TRANSACTION ──
        const oldTrx = originalEditTrx;
        const oldMap = Object.fromEntries((oldTrx.items || []).map(i => [i.id, i]));
        const newMap = Object.fromEntries(cart.map(i => [i.id, i]));
        const allIds = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);

        allIds.forEach(id => {
          const oldItem = oldMap[id] || { qty: 0, cost: 0 };
          const newItem = newMap[id] || { qty: 0, cost: oldItem.cost };
          const master  = products.find(p => String(p.id) === String(id));
          if (!master) return;
          const delta = newItem.qty - oldItem.qty;
          if (delta === 0) return;

          const estimatedFinal = master.stock - delta;
          const qtyReturned = Math.abs(delta);
          let updatedCost   = master.cost;
          const logType     = delta < 0 ? 'IN' : 'OUT';
          const logReason   = delta < 0
            ? `Retur Item (Edit INV: ${oldTrx.id})`
            : `Tambah Item (Edit INV: ${oldTrx.id})`;

          if (delta < 0 && estimatedFinal > 0) {
            updatedCost = ((master.stock * master.cost) + (qtyReturned * oldItem.cost)) / estimatedFinal;
          }

          batch.update(doc(getColRef('products'), String(id)), {
            stock: increment(-delta),
            cost: updatedCost,
          });
          const logId = makeLogId();
          batch.set(doc(getColRef('stockLogs'), logId), {
            id: logId, productId: id, productName: master.name,
            type: logType, reason: logReason,
            qtyChange: -delta, finalStock: estimatedFinal,
            hpp: updatedCost, timestamp: Date.now(), user: currentUser.name,
          });
        });

        const hadTempo = oldTrx.paymentMethod === 'Tempo';
        const hasTempo = paymentMethod === 'Tempo';
        if (hadTempo || hasTempo) {
          if (hadTempo && hasTempo && oldTrx.customerId === selectedCustomerId) {
            const diff = grandTotal - oldTrx.total;
            if (diff !== 0) {
              const c = customers.find(c => c.id === selectedCustomerId);
              if (c) batch.update(doc(getColRef('customers'), selectedCustomerId), { debt: (c.debt || 0) + diff });
            }
          } else {
            if (hadTempo && oldTrx.customerId) {
              const c = customers.find(c => c.id === oldTrx.customerId);
              if (c) batch.update(doc(getColRef('customers'), oldTrx.customerId), { debt: (c.debt || 0) - oldTrx.total });
            }
            if (hasTempo && selectedCustomerId) {
              const c = customers.find(c => c.id === selectedCustomerId);
              if (c) batch.update(doc(getColRef('customers'), selectedCustomerId), { debt: (c.debt || 0) + grandTotal });
            }
          }
        }

        const updated = {
          ...oldTrx, items: cart, subtotal, discount, tax: taxAmount,
          total: grandTotal, totalCost, netProfit, paymentMethod,
          customerId: selectedCustomerId || null,
          lastEditedBy: currentUser.name, lastEditedAt: Date.now(),
        };
        batch.update(doc(getColRef('transactions'), oldTrx.id), updated);
        await batch.commit();

        showAlert(`✅ Transaksi ${oldTrx.id} berhasil diperbarui!`);
        cancelEdit();
        setCheckoutModalOpen(false);
        setIsCartOpen(false);
        setActiveTab('history');
      }
    } catch (err) {
      console.error(err);
      showAlert('❌ Gagal memproses transaksi. Cek koneksi internet.');
    }
  };

  // ─── INVENTORY HANDLERS ──────────────────────────────────────
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await setDoc(doc(getColRef('settings'), 'categories'), { list: [...categories, newCategoryName.trim()] });
    setNewCategoryName('');
  };

  const handleRemoveCategory = (cat) => {
    showConfirm('Hapus Kategori', `Hapus kategori "${cat}"?`, async () => {
      await setDoc(doc(getColRef('settings'), 'categories'), { list: categories.filter(c => c !== cat) });
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.category) return;
    const id       = `PROD-${Date.now()}`;
    const batch    = writeBatch(db);
    const prodData = {
      id, ...newItem,
      price: Number(newItem.price),
      cost:  Number(newItem.cost),
      stock: Number(newItem.stock),
    };
    batch.set(doc(getColRef('products'), id), prodData);
    if (Number(newItem.stock) > 0) {
      const logId = `LOG-${Date.now()}-init`;
      batch.set(doc(getColRef('stockLogs'), logId), {
        id: logId, productId: id, productName: newItem.name,
        type: 'IN', reason: 'Stok Awal', qtyChange: Number(newItem.stock),
        finalStock: Number(newItem.stock), hpp: Number(newItem.cost),
        timestamp: Date.now(), user: currentUser?.name || 'Sistem',
      });
    }
    await batch.commit();
    setIsAddModalOpen(false);
    setNewItem({ name: '', category: categories[0] || '', cost: 0, price: 0, stock: 0 });
    showAlert('✅ Menu baru ditambahkan.');
  };

  const openUpdateStockModal = (product) => {
    setStockUpdateItem(product);
    setStockUpdateAmount('');
    setNewCostPrice(String(product.cost || ''));
    setStockUpdateReason('Restock Barang Masuk');
    setIsStockModalOpen(true);
  };

  const handleProcessUpdateStock = async (e) => {
    e.preventDefault();
    const addedQty = Number(stockUpdateAmount);
    if (!stockUpdateItem || isNaN(addedQty) || addedQty === 0) return;
    const oldQty   = stockUpdateItem.stock || 0;
    const oldCost  = stockUpdateItem.cost  || 0;
    const finalQty = oldQty + addedQty;
    if (finalQty < 0) { showAlert('Stok akhir tidak boleh minus!'); return; }

    let updatedCost = oldCost;
    if (addedQty > 0 && stockUpdateReason === 'Restock Barang Masuk') {
      const nc = Number(newCostPrice);
      if (isNaN(nc) || nc < 0) { showAlert('Harga beli tidak valid!'); return; }
      updatedCost = finalQty > 0
        ? ((oldQty * oldCost) + (addedQty * nc)) / finalQty
        : nc;
    }

    const batch  = writeBatch(db);
    batch.update(doc(getColRef('products'), String(stockUpdateItem.id)), {
      stock: increment(addedQty),
      cost: updatedCost,
    });
    const logId = `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    batch.set(doc(getColRef('stockLogs'), logId), {
      id: logId, productId: stockUpdateItem.id, productName: stockUpdateItem.name,
      type: addedQty > 0 ? 'IN' : 'OUT', reason: stockUpdateReason,
      qtyChange: addedQty, finalStock: finalQty,
      hpp: updatedCost, timestamp: Date.now(), user: currentUser?.name || 'Admin',
    });
    await batch.commit();
    setIsStockModalOpen(false);
    showAlert(`✅ Stok ${stockUpdateItem.name} diperbarui.`);
  };

  const handleDeleteItem = (id) => {
    showConfirm('Hapus Barang', 'Yakin hapus barang ini permanen?', async () => {
      await deleteDoc(doc(getColRef('products'), String(id)));
    });
  };

  // ─── SHIFT HANDLERS ──────────────────────────────────────────
  const handleProcessShift = async (e) => {
    e.preventDefault();
    const cash = Number(shiftCashInput) || 0;
    if (shiftAction === 'open') {
      const shiftId = `SHIFT-${Date.now()}`;
      await setDoc(doc(getColRef('shifts'), shiftId), {
        id: shiftId, userId: currentUser.id, kasirName: currentUser.name,
        startTime: Date.now(), startingCash: cash, status: 'open',
      });
      showAlert('✅ Shift dibuka!');
    } else {
      if (!activeShift) return;
      const shiftTrx = transactions.filter(t => t.shiftId === activeShift.id && t.paymentMethod === 'Tunai');
      const shiftExp = expenses.filter(ex => ex.shiftId === activeShift.id);
      const expectedCash = activeShift.startingCash
        + shiftTrx.reduce((s, t) => s + (t.total || 0), 0)
        - shiftExp.reduce((s, ex) => s + (ex.amount || 0), 0);
      const difference = cash - expectedCash;
      await updateDoc(doc(getColRef('shifts'), activeShift.id), {
        endTime: Date.now(), endingCash: cash, expectedCash, difference, status: 'closed',
      });
      showAlert(`✅ Shift ditutup.\nSelisih Kas: ${formatRupiah(difference)}`);
      if (currentUser.role === 'kasir') handleLogout();
    }
    setShiftModalOpen(false);
  };

  // ─── CUSTOMER HANDLERS ───────────────────────────────────────
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const id = `CUST-${Date.now()}`;
    await setDoc(doc(getColRef('customers'), id), {
      id, name: newCustomerName.trim(), phone: newCustomerPhone, debt: 0,
    });
    setNewCustomerName('');
    setNewCustomerPhone('');
  };

  const processPayDebt = async (e) => {
    e.preventDefault();
    const amount = Number(payDebtAmount);
    if (amount <= 0 || amount > (debtCustomer?.debt || 0)) { showAlert('Nominal tidak valid.'); return; }
    const batch  = writeBatch(db);
    batch.update(doc(getColRef('customers'), debtCustomer.id), { debt: (debtCustomer.debt || 0) - amount });
    const trxId = generateInvoiceID();
    batch.set(doc(getColRef('transactions'), trxId), {
      id: trxId, type: 'PayDebt', timestamp: Date.now(), total: amount,
      paymentMethod: 'Tunai', customerId: debtCustomer.id, customerName: debtCustomer.name,
      kasirName: currentUser.name, shiftId: activeShift?.id || 'NO-SHIFT',
      items: [{ name: 'Pelunasan Hutang' }],
    });
    await batch.commit();
    setPayDebtModalOpen(false);
    setPayDebtAmount('');
    showAlert('✅ Pembayaran piutang dicatat.');
  };

  // ─── EXPENSE HANDLERS ────────────────────────────────────────
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.description || newExpense.amount <= 0) return;
    const id = `EXP-${Date.now()}`;
    await setDoc(doc(getColRef('expenses'), id), {
      id, ...newExpense, amount: Number(newExpense.amount),
      timestamp: Date.now(), kasirName: currentUser.name, shiftId: activeShift?.id || 'NO-SHIFT',
    });
    setExpenseModalOpen(false);
    setNewExpense({ description: '', amount: 0, category: 'Operasional' });
  };

  // ─── USER HANDLERS ───────────────────────────────────────────
  const handleAddKasir = async (e) => {
    e.preventDefault();
    if (!newKasirName.trim()) return;
    const id = `kasir-${Date.now()}`;
    await setDoc(doc(getColRef('users'), id), {
      id, role: 'kasir', name: newKasirName.trim(), password: '008',
    });
    setNewKasirName('');
    showAlert('✅ Kasir ditambahkan. Password default: 008');
  };

  const openPasswordModal = (user) => {
    showPrompt('Ubah Kata Sandi', `Sandi baru untuk ${user.name}:`, '', 'Sandi baru...', async (pw) => {
      if (pw) {
        await updateDoc(doc(getColRef('users'), user.id), { password: pw });
        showAlert('✅ Sandi diperbarui.');
      }
    });
  };

  const handleDeleteUser = (id, name) => {
    showConfirm('Hapus Akses', `Yakin hapus akun ${name}?`, async () => {
      await deleteDoc(doc(getColRef('users'), id));
      // If deleted user is currently logged in via session, clear that session
      try {
        const saved = loadSession();
        if (saved?.userId === id) clearSession();
      } catch {}
    });
  };

  // ─── THEME HANDLER ───────────────────────────────────────────
  const handleChangeTheme = async (key) => {
    if (currentUser?.role !== 'admin') {
      showAlert('Hanya Administrator yang dapat mengubah tema.');
      return;
    }
    await setDoc(doc(getColRef('settings'), 'theme'), { activeTheme: key }, { merge: true });
  };

  // ─── HOLD BILL HANDLERS ──────────────────────────────────────
  const handleHoldBill = () => {
    if (!cart.length) return;
    showPrompt('Simpan Pesanan', 'Nama Meja / Pelanggan:', '', 'Contoh: Meja 5', async (name) => {
      if (!name) return;
      const holdId = `HOLD-${Date.now()}`;
      await setDoc(doc(getColRef('holdBills'), holdId), {
        id: holdId, name, items: cart, timestamp: Date.now(), kasirName: currentUser.name,
      });
      clearCart();
      setIsCartOpen(false);
      showAlert(`✅ Pesanan "${name}" ditahan.`);
    });
  };

  const resumeHoldBill = useCallback(async (bill) => {
    clearCart();
    setCart(bill.items || []);
    await deleteDoc(doc(getColRef('holdBills'), bill.id));
    setActiveTab('pos');
    setIsCartOpen(true);
  }, [clearCart, setCart]);

  // ─── LOADING SCREEN ──────────────────────────────────────────
  // Show spinner while DB initializes OR while session restore is pending
  if (!isDbReady || (isDbReady && users.length > 0 && !sessionChecked)) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-[#1a1412]">
        <Loader2 size={52} className="text-red-500 animate-spin" />
        <p className="mt-4 text-amber-500/80 font-mono tracking-widest text-sm">
          INISIALISASI SISTEM ENTERPRISE...
        </p>
      </div>
    );
  }

  // ─── LOGIN SCREEN ─────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[100dvh] w-full text-amber-50 font-sans relative overflow-hidden">
        {/* Background slideshow */}
        <div className="fixed inset-0 z-[-1] bg-[#1a1412]">
          {backgroundImages.map((img, idx) => (
            <img
              key={idx} src={img} alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentBg ? 'opacity-40' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </div>

        <div className="bg-[#221815]/80 backdrop-blur-xl border border-red-900/50 rounded-3xl p-8 max-w-sm w-full z-10 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-red-800 flex items-center justify-center border border-amber-500 shadow-[0_0_20px_rgba(220,38,38,0.5)] mx-auto mb-4">
            <span className="text-3xl font-serif text-amber-300">G</span>
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-amber-50 uppercase mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            GG <span className="text-red-500">POS</span>
          </h1>
          <p className="text-xs text-amber-500/70 font-mono tracking-widest mb-8">SISTEM KASIR ENTERPRISE</p>

          {loginStep === 'role' && (
            <div className="space-y-3">
              <button
                onClick={() => { setLoginTargetUser(users.find(u => u.id === 'admin')); setLoginStep('password'); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-800/90 hover:bg-red-700 text-amber-50 rounded-xl font-bold transition-all border border-red-600/50"
              >
                <ShieldAlert size={20} /> Masuk Administrator
              </button>
              <button
                onClick={() => setLoginStep('kasir-list')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#2a1f1b]/80 hover:bg-[#30231f] border border-amber-900/50 text-amber-400 rounded-xl font-bold transition-all"
              >
                <UserSquare size={20} /> Masuk Area Kasir
              </button>
              <button
                onClick={() => { setLoginTargetUser(users.find(u => u.id === 'owner')); setLoginStep('password'); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#2a1f1b]/80 hover:bg-[#30231f] border border-amber-900/50 text-amber-400 rounded-xl font-bold transition-all"
              >
                <Eye size={20} /> Masuk Area Pemilik
              </button>
            </div>
          )}

          {loginStep === 'kasir-list' && (
            <div className="space-y-3">
              <p className="text-sm text-amber-400 mb-4 font-semibold">Pilih ID Kasir:</p>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {users.filter(u => u.role === 'kasir').map(k => (
                  <button
                    key={k.id}
                    onClick={() => { setLoginTargetUser(k); setLoginStep('password'); }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#2a1f1b]/80 hover:bg-red-900/50 border border-amber-900/50 text-amber-50 rounded-xl font-bold transition-all"
                  >
                    <span>{k.name}</span>
                    <ArrowLeft size={16} className="rotate-180 text-amber-500" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setLoginStep('role')}
                className="w-full flex items-center justify-center gap-2 text-sm text-amber-500 hover:text-amber-300 py-2"
              >
                <ArrowLeft size={16} /> Kembali
              </button>
            </div>
          )}

          {loginStep === 'password' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-sm text-amber-500 font-semibold">
                Akses: <span className="text-amber-100">{loginTargetUser?.name}</span>
              </p>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" size={20} />
                <input
                  autoFocus type="password" placeholder="Masukkan PIN/Sandi"
                  value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-[#1a1412]/80 border border-amber-900/50 text-amber-100 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-red-500 text-center tracking-widest text-lg"
                />
              </div>
              {loginError && (
                <p className="text-xs text-red-400 font-bold animate-pulse">{loginError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setLoginStep('role'); setLoginError(''); }}
                  className="p-3 bg-[#2a1f1b]/80 hover:bg-[#30231f] border border-amber-900/50 text-amber-500 rounded-xl"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-800/90 hover:bg-red-700 text-amber-50 rounded-xl font-bold flex items-center justify-center gap-2 border border-red-600/50"
                >
                  Otorisasi <Key size={18} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ─── NAV ITEM ────────────────────────────────────────────────
  const NavItem = ({ id, icon: Icon, label, rolesAllowed }) => {
    if (!rolesAllowed.includes(currentUser?.role)) return null;
    return (
      <button
        onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          activeTab === id
            ? `${theme.buttonBg} ${theme.buttonText} shadow-inner`
            : `${theme.textMuted} hover:bg-black/10`
        }`}
      >
        <Icon size={20} />
        <span className="font-semibold tracking-wide">{label}</span>
      </button>
    );
  };

  // ─── PROPS BUNDLES ───────────────────────────────────────────
  const posProps = {
    searchQuery, setSearchQuery, activeCategory, setActiveCategory,
    displayCategories, filteredProducts,
    addToCart:  (p) => addToCart(p, showAlert),
    cart,
    updateQty:  (id, delta) => updateQty(id, delta, products, showAlert),
    clearCart, isCartOpen, setIsCartOpen, discount, setDiscount,
    taxEnabled, setTaxEnabled, subtotal, taxAmount, grandTotal,
    setCheckoutModalOpen, editingTransactionId, handleHoldBill, cancelEdit,
  };

  const dashboardProps = {
    currentUser, activeTab, transactions, products, categories, customers,
    expenses, shifts, holdBills, stockLogs, users,
    historyFilter, setHistoryFilter, historyCustomDate, setHistoryCustomDate,
    handleReprintReceipt: (trx) => {
      setReprintTransaction(trx);
      handlePrintReceipt(trx, true);
    },
    loadTransactionToEditor: (trx) => {
      loadEditTransaction(trx);
      setPaymentMethod(trx.paymentMethod || 'Tunai');
      setSelectedCustomerId(trx.customerId || '');
      setActiveTab('pos');
      setIsCartOpen(true);
    },
    resumeHoldBill,
    handleAddCustomer, newCustomerName, setNewCustomerName, newCustomerPhone, setNewCustomerPhone,
    setDebtCustomer, setPayDebtModalOpen,
    setExpenseModalOpen,
    setIsCategoryModalOpen, setIsAddModalOpen, openUpdateStockModal, handleDeleteItem,
    newKasirName, setNewKasirName, handleAddKasir, openPasswordModal, handleDeleteUser,
    reportPeriod, setReportPeriod, handlePrintReport,
    setPrintSettingsOpen,
  };

  // ─── MAIN RENDER ─────────────────────────────────────────────
  return (
    <div className={`flex h-[100dvh] w-full font-sans overflow-hidden ${theme.textMain}`}>

      {/* ── PRINTABLE RECEIPT (hidden, shown via CSS @media print) ── */}
      <div style={{ display: 'none' }}>
        <ReceiptDocument
          trx={printMode === 'reprint' ? reprintTransaction : lastTransaction}
          isReprint={printMode === 'reprint'}
          settings={printer.getSettings()}
        />
        <ReportDocument data={reportPrintData} period={reportPeriod} />
      </div>

      {/* ── BACKGROUND ── */}
      <div className={`fixed inset-0 z-[-2] ${theme.bgBase}`} />
      <div className="fixed inset-0 z-[-1]">
        {backgroundImages.map((img, idx) => (
          <img
            key={idx} src={img} alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentBg ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className={`absolute inset-0 ${
          currentThemeKey === 'terang'    ? 'bg-white/35'     :
          currentThemeKey === 'retro'     ? 'bg-[#F4ECD8]/40'  :
          currentThemeKey === 'cyberpunk' ? 'bg-yellow-400/30' :
          currentThemeKey === 'neon'      ? 'bg-black/35'      :
                                            'bg-black/30'
        } backdrop-blur-[1px] transition-colors duration-500`} />
      </div>

      {/* ── SIDEBAR OVERLAY (mobile) ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 ${theme.bgPanel} backdrop-blur-xl border-r ${theme.border} flex flex-col shadow-2xl transition-transform duration-300 shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className={`p-6 border-b ${theme.border} flex items-center gap-3 bg-black/10`}>
          <div className="w-10 h-10 rounded-full bg-red-800 flex items-center justify-center border border-amber-500 shadow-[0_0_10px_rgba(220,38,38,0.3)] shrink-0">
            <span className="text-xl font-serif text-amber-300">G</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
              GG <span className={theme.accent}>POS</span>
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase truncate max-w-[120px]">
                {currentUser?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem id="pos"       icon={LayoutDashboard} label="Kasir & Transaksi"  rolesAllowed={['admin', 'kasir']} />
          <NavItem id="history"   icon={FileText}        label="Riwayat & Retur"    rolesAllowed={['admin', 'kasir']} />
          <NavItem id="holdbills" icon={Clock}           label="Pesanan Tertahan"   rolesAllowed={['admin', 'kasir']} />
          <NavItem id="customers" icon={BookOpen}        label="Buku Piutang"       rolesAllowed={['admin', 'kasir', 'owner']} />
          <NavItem id="inventory" icon={Package}         label="Data Inventaris"    rolesAllowed={['admin', 'owner']} />
          <NavItem id="expenses"  icon={Wallet}          label="Jurnal Pengeluaran" rolesAllowed={['admin', 'kasir', 'owner']} />
          <NavItem id="reports"   icon={BarChart3}       label="Laporan Eksekutif"  rolesAllowed={['admin', 'owner']} />
          <NavItem id="stocklogs" icon={ClipboardList}   label="Buku Kartu Stok"   rolesAllowed={['admin', 'owner']} />
          <NavItem id="users"     icon={Users}           label="Sistem Pengguna"    rolesAllowed={['admin']} />
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${theme.border} space-y-2 bg-black/10`}>
          {/* Theme selector */}
          <div className="flex items-center gap-2 px-2 mb-1">
            <Palette size={15} className={theme.textMuted} />
            {currentUser?.role === 'admin' ? (
              <select
                value={currentThemeKey}
                onChange={e => handleChangeTheme(e.target.value)}
                className={`w-full bg-transparent ${theme.textMain} text-sm focus:outline-none cursor-pointer font-semibold`}
              >
                {Object.keys(themes).map(k => (
                  <option key={k} value={k} className="bg-[#1a1412] text-amber-50">
                    {themes[k].name}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`text-sm ${theme.textMain} font-semibold`}>
                Tema: {themes[currentThemeKey]?.name}
              </span>
            )}
          </div>

          {/* Print settings */}
          <button
            onClick={() => setPrintSettingsOpen(true)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-black/20 border ${theme.border} hover:bg-black/30 rounded-xl text-sm font-semibold transition-all ${theme.textMuted}`}
          >
            <Settings2 size={15} /> Pengaturan Printer
          </button>

          {/* Close shift (kasir only) */}
          {currentUser?.role === 'kasir' && (
            <button
              onClick={() => { setShiftAction('close'); setShiftCashInput(''); setShiftModalOpen(true); }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-black/20 border border-current hover:bg-black/40 rounded-xl font-semibold text-sm transition-all ${theme.textMuted}`}
            >
              <Lock size={16} /> Tutup Shift
            </button>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-black/20 border ${theme.border} hover:bg-red-900/50 hover:text-red-300 rounded-xl font-semibold text-sm transition-all`}
          >
            <LogOut size={16} /> Akhiri Sesi
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-full z-10 relative min-w-0">
        {/* Mobile Header */}
        <header className={`lg:hidden p-4 ${theme.bgPanel} backdrop-blur-md border-b ${theme.border} flex justify-between items-center shrink-0`}>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`p-2 hover:bg-black/20 rounded-lg ${theme.textMain}`}
          >
            <MenuIcon size={24} />
          </button>
          <span className={`font-bold tracking-wider uppercase ${theme.textMain}`}>{activeTab}</span>
          {activeTab === 'pos' && ['admin', 'kasir'].includes(currentUser?.role) ? (
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2 hover:bg-black/20 rounded-lg ${theme.textMain}`}
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((s, i) => s + (i.qty || 0), 0)}
                </span>
              )}
            </button>
          ) : (
            <div className="w-10" />
          )}
        </header>

        {activeTab === 'pos' && ['admin', 'kasir'].includes(currentUser?.role)
          ? <POSScreen props={posProps} theme={theme} />
          : <DashboardPanels activeTab={activeTab} props={dashboardProps} theme={theme} />
        }
      </main>

      {/* ── ALL GLOBAL MODALS ── */}

      <PrintSettingsModal
        isOpen={printSettingsOpen}
        onClose={() => setPrintSettingsOpen(false)}
        theme={theme}
      />

      <ShiftModal
        isOpen={shiftModalOpen} onClose={() => setShiftModalOpen(false)}
        onSubmit={handleProcessShift}
        action={shiftAction} cashInput={shiftCashInput} setCashInput={setShiftCashInput}
        currentUser={currentUser} theme={theme}
      />

      <CheckoutModal
        isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)}
        onSubmit={processCheckoutOrUpdate}
        grandTotal={grandTotal} customers={customers}
        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
        selectedCustomerId={selectedCustomerId} setSelectedCustomerId={setSelectedCustomerId}
        amountTendered={amountTendered} setAmountTendered={setAmountTendered}
        editingTransactionId={editingTransactionId} theme={theme}
      />

      <StockModal
        isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)}
        onSubmit={handleProcessUpdateStock}
        item={stockUpdateItem}
        amount={stockUpdateAmount} setAmount={setStockUpdateAmount}
        costPrice={newCostPrice} setCostPrice={setNewCostPrice}
        reason={stockUpdateReason} setReason={setStockUpdateReason}
        theme={theme}
      />

      <AddProductModal
        isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddProduct}
        item={newItem} setItem={setNewItem}
        categories={categories} theme={theme}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        newName={newCategoryName} setNewName={setNewCategoryName}
        onAdd={handleAddCategory} onRemove={handleRemoveCategory}
        theme={theme}
      />

      <ExpenseModal
        isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)}
        onSubmit={handleAddExpense}
        expense={newExpense} setExpense={setNewExpense}
        theme={theme}
      />

      <PayDebtModal
        isOpen={payDebtModalOpen} onClose={() => setPayDebtModalOpen(false)}
        onSubmit={processPayDebt}
        customer={debtCustomer}
        amount={payDebtAmount} setAmount={setPayDebtAmount}
        theme={theme}
      />

      <SuccessModal
        transaction={lastTransaction}
        onPrint={() => handlePrintReceipt(lastTransaction, false)}
        onFinish={handleFinishTransaction}
        printStatus={printStatus}
        theme={theme}
      />

      <ConfirmModal
        dialog={confirmDialog}
        onClose={() => setConfirmDialog({ isOpen: false })}
        theme={theme}
      />

      <PromptModal
        dialog={promptDialog}
        setDialog={setPromptDialog}
        onClose={() => setPromptDialog({ isOpen: false })}
        theme={theme}
      />

      <AlertModal message={alertMsg} onClose={() => setAlertMsg('')} theme={theme} />
    </div>
  );
}
