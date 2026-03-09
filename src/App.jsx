import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, 
  Search, Menu as MenuIcon, X, LayoutDashboard, Package, 
  BarChart3, FileText, AlertTriangle, Tags, Edit2, Save, 
  TrendingUp, Printer, CheckCircle, LogOut, UserSquare, 
  ShieldAlert, Eye, Users, Key, Lock, ArrowLeft, RefreshCw,
  Loader2, Wallet, Clock, PauseCircle, PlayCircle, BookOpen,
  ClipboardList, Download, Calendar, History, Palette
} from 'lucide-react';

import { auth, db, getColRef } from './firebase';
import { formatRupiah, generateInvoiceID, getCatEmoji, generateRawTextReceipt, downloadCSV } from './utils';
import { themes } from './themes';

import POSScreen from './components/POSScreen';
import DashboardPanels from './components/DashboardPanels';

import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";

const GITHUB_USERNAME = "oktetod"; 
const GITHUB_REPO = "pos2026";           
const GITHUB_FOLDER = ""; 

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); 
  const [users, setUsers] = useState([]);
  
  const [loginStep, setLoginStep] = useState('role'); 
  const [loginTargetUser, setLoginTargetUser] = useState(null);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [newKasirName, setNewKasirName] = useState("");

  const [activeTab, setActiveTab] = useState('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [holdBills, setHoldBills] = useState([]);
  const [stockLogs, setStockLogs] = useState([]); 
  
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(false);
  
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [originalEditTrx, setOriginalEditTrx] = useState(null);

  const [currentThemeKey, setCurrentThemeKey] = useState('gelap');
  const theme = themes[currentThemeKey] || themes['gelap'];

  const [historyFilter, setHistoryFilter] = useState('today');
  const [historyCustomDate, setHistoryCustomDate] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [promptDialog, setPromptDialog] = useState({ isOpen: false, title: '', message: '', value: '', placeholder: '', onConfirm: null });
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', cost: 0, price: 0, stock: 0 });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState(""); 
  const [isStockModalOpen, setIsStockModalOpen] = useState(false); 
  const [stockUpdateItem, setStockUpdateItem] = useState(null); 
  const [stockUpdateAmount, setStockUpdateAmount] = useState(""); 
  const [newCostPrice, setNewCostPrice] = useState(""); 
  const [stockUpdateReason, setStockUpdateReason] = useState("Restock Barang Masuk"); 
  
  const [activeShift, setActiveShift] = useState(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftAction, setShiftAction] = useState('open'); 
  const [shiftCashInput, setShiftCashInput] = useState("");
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai'); 
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [amountTendered, setAmountTendered] = useState("");
  const [lastTransaction, setLastTransaction] = useState(null);
  const [reprintTransaction, setReprintTransaction] = useState(null);
  const [printType, setPrintType] = useState(null); 

  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: 'Operasional' });
  const [payDebtModalOpen, setPayDebtModalOpen] = useState(false);
  const [debtCustomer, setDebtCustomer] = useState(null);
  const [payDebtAmount, setPayDebtAmount] = useState("");

  const [reportPeriod, setReportPeriod] = useState("hari_ini");
  const [backgroundImages, setBackgroundImages] = useState(["https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=1920&auto=format&fit=crop"]);
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth Error:", err));
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        const unsubs = [
          onSnapshot(getColRef('users'), (snap) => {
            if (snap.empty) {
              setDoc(doc(getColRef('users'), 'admin'), { id: 'admin', role: 'admin', name: 'Administrator', password: '008' });
              setDoc(doc(getColRef('users'), 'owner'), { id: 'owner', role: 'owner', name: 'Bos Besar', password: '008' });
            } else setUsers(snap.docs.map(d => d.data()));
          }),
          onSnapshot(doc(getColRef('settings'), 'theme'), (docSnap) => {
            if (!docSnap.exists()) {
              setDoc(doc(getColRef('settings'), 'theme'), { activeTheme: 'gelap' });
            } else {
              setCurrentThemeKey(docSnap.data().activeTheme || 'gelap');
            }
          }),
          onSnapshot(getColRef('products'), (snap) => setProducts(snap.docs.map(d => d.data()).sort((a,b) => (a.name || "").localeCompare(b.name || "")))),
          onSnapshot(doc(getColRef('settings'), 'categories'), (docSnap) => {
            if (!docSnap.exists()) setDoc(doc(getColRef('settings'), 'categories'), { list: ["Makanan", "Minuman", "Cemilan"] });
            else setCategories(docSnap.data().list || []);
          }),
          onSnapshot(getColRef('transactions'), (snap) => setTransactions(snap.docs.map(d => d.data()).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)))),
          onSnapshot(getColRef('customers'), (snap) => setCustomers(snap.docs.map(d => d.data()).sort((a,b) => (a.name || "").localeCompare(b.name || "")))),
          onSnapshot(getColRef('expenses'), (snap) => setExpenses(snap.docs.map(d => d.data()).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)))),
          onSnapshot(getColRef('shifts'), (snap) => setShifts(snap.docs.map(d => d.data()).sort((a,b) => (b.startTime || 0) - (a.startTime || 0)))),
          onSnapshot(getColRef('holdBills'), (snap) => setHoldBills(snap.docs.map(d => d.data()).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)))),
          onSnapshot(getColRef('stockLogs'), (snap) => setStockLogs(snap.docs.map(d => d.data()).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0))))
        ];
        setIsDbReady(true);
        return () => unsubs.forEach(unsub => unsub());
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const fetchGitHubImages = async () => {
      try {
        const url = GITHUB_FOLDER
          ? `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`
          : `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const imageUrls = data.filter(file => file.name.match(/\.(jpe?g|png|webp|gif)$/i)).map(f => f.download_url);
            if (imageUrls.length > 0) setBackgroundImages(imageUrls);
          }
        }
      } catch (error) {}
    };
    if (GITHUB_USERNAME) fetchGitHubImages();
  }, []);

  useEffect(() => {
    if (backgroundImages.length <= 1) return;
    const interval = setInterval(() => setCurrentBg(p => (p + 1) % backgroundImages.length), 6000);
    return () => clearInterval(interval);
  }, [backgroundImages]);

  useEffect(() => {
    if (currentUser) {
      const currentActiveShift = shifts.find(s => s.userId === currentUser.id && s.status === 'open');
      setActiveShift(currentActiveShift || null);
    }
  }, [currentUser, shifts]);

  const handleChangeTheme = async (newTheme) => {
    if (currentUser?.role !== 'admin') {
      setAlertMsg("Akses Ditolak: Hanya Administrator yang berhak mengubah tema antarmuka POS.");
      return;
    }
    try {
      await setDoc(doc(getColRef('settings'), 'theme'), { activeTheme: newTheme }, { merge: true });
    } catch (error) {
      setAlertMsg("Gagal menyimpan tema ke database.");
    }
  };

  const showConfirm = (title, message, onConfirmCallback) => setConfirmDialog({ isOpen: true, title, message, onConfirm: onConfirmCallback });
  const showPrompt = (title, message, defaultValue, placeholder, onConfirmCallback) => setPromptDialog({ isOpen: true, title, message, value: defaultValue, placeholder, onConfirm: onConfirmCallback });

  const displayCategories = ["Semua", ...categories];

  const handleFinishTransaction = () => {
    setLastTransaction(null); setActiveTab('pos'); setIsCartOpen(false); setSearchQuery(""); setActiveCategory("Semua");
  };

  const handlePrintReceipt = () => {
    if (!lastTransaction) return;
    setPrintType('receipt');
    window.onafterprint = () => { setPrintType(null); handleFinishTransaction(); window.onafterprint = null; };
    setTimeout(() => { window.print(); }, 800);
    console.log("=== RAW BLUETOOTH RECEIPT ===\n", generateRawTextReceipt(lastTransaction));
  };

  const handleReprintReceipt = (trx) => {
    setReprintTransaction(trx); setPrintType('reprint');
    window.onafterprint = () => { setPrintType(null); setReprintTransaction(null); window.onafterprint = null; };
    setTimeout(() => { window.print(); }, 800);
    console.log("=== RAW BLUETOOTH REPRINT ===\n", generateRawTextReceipt(trx));
  };

  const handlePrintReport = () => {
    setPrintType('report');
    window.onafterprint = () => { setPrintType(null); window.onafterprint = null; };
    setTimeout(() => { window.print(); }, 800);
  };

  const addToCart = (product) => {
    if ((product.stock || 0) <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev; 
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        const allowedStock = editingTransactionId ? (item.stock + (originalEditTrx.items.find(i=>i.id === id)?.qty || 0)) : item.stock;
        if (newQty > allowedStock) { setAlertMsg("Stok barang tidak mencukupi!"); return item; }
        if (newQty <= 0) return null; 
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);
  const totalCost = cart.reduce((sum, item) => sum + ((item.cost || 0) * (item.qty || 0)), 0);
  const taxAmount = taxEnabled ? (subtotal - discount) * 0.10 : 0;
  const grandTotal = subtotal - discount + taxAmount;
  const netProfit = (subtotal - discount) - totalCost;

  const processCheckoutOrUpdate = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || !firebaseUser || !currentUser) return;
    if (paymentMethod === 'Tempo' && !selectedCustomerId) { setAlertMsg("Pilih pelanggan untuk sistem Kasbon!"); return; }
    if (paymentMethod === 'Tunai' && Number(amountTendered) < grandTotal && !editingTransactionId) { setAlertMsg("Uang diterima kurang dari total!"); return; }

    try {
      const batch = writeBatch(db);
      
      if (!editingTransactionId) {
        const trxId = generateInvoiceID();
        const newTransaction = {
          id: trxId, type: 'Sale', timestamp: Date.now(), date: new Date().toISOString(),
          items: cart, subtotal, discount, tax: taxAmount, total: grandTotal, totalCost, netProfit, 
          paymentMethod, customerId: selectedCustomerId || null,
          kasirName: currentUser.name || 'Kasir', shiftId: activeShift?.id || 'NO-SHIFT'
        };
        batch.set(doc(getColRef('transactions'), trxId), newTransaction);
        
        cart.forEach(item => {
          const prodRef = doc(getColRef('products'), item.id.toString());
          const newStock = (item.stock || 0) - (item.qty || 0);
          batch.update(prodRef, { stock: newStock });
          const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          batch.set(doc(getColRef('stockLogs'), logId), { id: logId, productId: item.id, productName: item.name, type: 'OUT', reason: `Penjualan ${trxId}`, qtyChange: -(item.qty || 0), finalStock: newStock, hpp: item.cost, timestamp: Date.now(), user: currentUser.name });
        });

        if (paymentMethod === 'Tempo' && selectedCustomerId) {
          const customer = customers.find(c => c.id === selectedCustomerId);
          if (customer) batch.update(doc(getColRef('customers'), selectedCustomerId), { debt: (customer.debt || 0) + grandTotal });
        }

        await batch.commit();
        setLastTransaction(newTransaction);
        setCart([]); setDiscount(0); setCheckoutModalOpen(false); setIsCartOpen(false); setAmountTendered("");

      } else {
        const oldTrx = originalEditTrx;
        const oldCartMap = {}; oldTrx.items.forEach(i => oldCartMap[i.id] = i);
        const newCartMap = {}; cart.forEach(i => newCartMap[i.id] = i);
        const allIds = new Set([...Object.keys(oldCartMap), ...Object.keys(newCartMap)]);

        allIds.forEach(id => {
            const oldItem = oldCartMap[id] || { qty: 0, cost: 0, name: '' };
            const newItem = newCartMap[id] || { qty: 0, cost: 0, name: oldItem.name };
            const productMaster = products.find(p => p.id === id); 
            if (!productMaster) return; 
            const deltaQty = newItem.qty - oldItem.qty; 
            if (deltaQty !== 0) {
                let updatedStock = productMaster.stock - deltaQty; 
                let updatedCost = productMaster.cost;
                let logType = ''; let logReason = '';
                if (deltaQty < 0) {
                    const qtyReturned = Math.abs(deltaQty);
                    logType = 'IN'; logReason = `Retur Item (Edit INV: ${oldTrx.id})`;
                    if (updatedStock > 0) updatedCost = ((productMaster.stock * productMaster.cost) + (qtyReturned * oldItem.cost)) / updatedStock;
                } else {
                    logType = 'OUT'; logReason = `Penambahan Item (Edit INV: ${oldTrx.id})`;
                }
                batch.update(doc(getColRef('products'), id.toString()), { stock: updatedStock, cost: updatedCost });
                const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                batch.set(doc(getColRef('stockLogs'), logId), { id: logId, productId: id, productName: productMaster.name, type: logType, reason: logReason, qtyChange: -deltaQty, finalStock: updatedStock, hpp: updatedCost, timestamp: Date.now(), user: currentUser.name });
            }
        });

        if (oldTrx.paymentMethod === 'Tempo' || paymentMethod === 'Tempo') {
            if (oldTrx.paymentMethod === 'Tempo' && paymentMethod === 'Tempo' && oldTrx.customerId === selectedCustomerId) {
                const debtDelta = grandTotal - oldTrx.total;
                const customer = customers.find(c => c.id === selectedCustomerId);
                if (customer && debtDelta !== 0) batch.update(doc(getColRef('customers'), selectedCustomerId), { debt: (customer.debt || 0) + debtDelta });
            } else {
                if (oldTrx.paymentMethod === 'Tempo' && oldTrx.customerId) {
                    const oldCust = customers.find(c => c.id === oldTrx.customerId);
                    if (oldCust) batch.update(doc(getColRef('customers'), oldTrx.customerId), { debt: (oldCust.debt || 0) - oldTrx.total });
                }
                if (paymentMethod === 'Tempo' && selectedCustomerId) {
                    const newCust = customers.find(c => c.id === selectedCustomerId);
                    if (newCust) batch.update(doc(getColRef('customers'), selectedCustomerId), { debt: (newCust.debt || 0) + grandTotal });
                }
            }
        }

        const updatedTrx = { ...oldTrx, items: cart, subtotal, discount, tax: taxAmount, total: grandTotal, totalCost, netProfit, paymentMethod, customerId: selectedCustomerId || null, lastEditedBy: currentUser.name, lastEditedAt: Date.now() };
        batch.update(doc(getColRef('transactions'), oldTrx.id), updatedTrx);

        await batch.commit();
        setAlertMsg(`Transaksi ${oldTrx.id} Berhasil Diperbarui!`);
        setEditingTransactionId(null); setOriginalEditTrx(null);
        setCart([]); setDiscount(0); setCheckoutModalOpen(false); setIsCartOpen(false);
        setActiveTab('history');
      }
    } catch (error) { setAlertMsg("Gagal memproses transaksi. Cek koneksi internet."); }
  };

  const loadTransactionToEditor = (trx) => {
    setEditingTransactionId(trx.id); setOriginalEditTrx(trx); setCart(trx.items || []);
    setDiscount(trx.discount || 0); setTaxEnabled(trx.tax > 0); setPaymentMethod(trx.paymentMethod || 'Tunai');
    setSelectedCustomerId(trx.customerId || ""); setActiveTab('pos'); setIsCartOpen(true);
  };

  const cancelEditMode = () => {
    setEditingTransactionId(null); setOriginalEditTrx(null); clearCart(); setDiscount(0); 
    setIsCartOpen(false); setActiveTab('history');
  };

  const handleHoldBill = () => {
    if (cart.length === 0 || !firebaseUser || !currentUser) return;
    showPrompt("Simpan Pesanan", "Nama Meja / Pelanggan:", "", "Contoh: Meja 5", async (holdName) => {
      if (!holdName) return;
      const holdId = `HOLD-${Date.now()}`;
      await setDoc(doc(getColRef('holdBills'), holdId), { id: holdId, name: holdName, items: cart, timestamp: Date.now(), kasirName: currentUser.name || 'Kasir' });
      setCart([]); setIsCartOpen(false); setAlertMsg(`Pesanan "${holdName}" ditahan.`);
    });
  };

  const resumeHoldBill = async (bill) => { setCart(bill.items || []); await deleteDoc(doc(getColRef('holdBills'), bill.id)); setActiveTab('pos'); };

  const handleAddCategory = async (e) => { e.preventDefault(); if (!newCategoryName.trim()) return; await setDoc(doc(getColRef('settings'), 'categories'), { list: [...categories, newCategoryName.trim()] }); setNewCategoryName(""); setAlertMsg(`Kategori ditambahkan.`); };
  const handleRemoveCategory = (catToRemove) => { showConfirm("Hapus Kategori", `Yakin ingin menghapus kategori "${catToRemove}"?`, async () => { await setDoc(doc(getColRef('settings'), 'categories'), { list: categories.filter(c => c !== catToRemove) }); setAlertMsg(`Kategori dihapus.`); }); };
  const handleAddProduct = async (e) => {
    e.preventDefault(); if (!newItem.name || !newItem.category) return;
    const newId = `PROD-${Date.now()}`; const batch = writeBatch(db);
    batch.set(doc(getColRef('products'), newId), { id: newId, ...newItem, price: Number(newItem.price), cost: Number(newItem.cost), stock: Number(newItem.stock) });
    if (Number(newItem.stock) > 0) { batch.set(doc(getColRef('stockLogs'), `LOG-${Date.now()}`), { id: `LOG-${Date.now()}`, productId: newId, productName: newItem.name, type: 'IN', reason: `Stok Awal`, qtyChange: Number(newItem.stock), finalStock: Number(newItem.stock), hpp: Number(newItem.cost), timestamp: Date.now(), user: currentUser?.name || 'Sistem' }); }
    await batch.commit(); setIsAddModalOpen(false); setNewItem({ name: '', category: categories[0] || '', cost: 0, price: 0, stock: 0 }); setAlertMsg("Menu baru ditambahkan.");
  };
  const openUpdateStockModal = (product) => { setStockUpdateItem(product); setStockUpdateAmount(""); setNewCostPrice(product.cost || ""); setStockUpdateReason("Restock Barang Masuk"); setIsStockModalOpen(true); };
  const handleProcessUpdateStock = async (e) => {
    e.preventDefault(); const addedQty = Number(stockUpdateAmount); if (!stockUpdateItem || isNaN(addedQty) || addedQty === 0) return;
    const oldQty = stockUpdateItem.stock || 0; const oldCost = stockUpdateItem.cost || 0; const finalQty = oldQty + addedQty;
    if (finalQty < 0) { setAlertMsg("Stok akhir minus!"); return; }
    let updatedCost = oldCost;
    if (addedQty > 0 && stockUpdateReason === 'Restock Barang Masuk') { const newCost = Number(newCostPrice); if (isNaN(newCost) || newCost < 0) { setAlertMsg("Harga beli tidak valid!"); return; } updatedCost = ((oldQty * oldCost) + (addedQty * newCost)) / finalQty; } 
    const batch = writeBatch(db); batch.update(doc(getColRef('products'), stockUpdateItem.id.toString()), { stock: finalQty, cost: updatedCost });
    batch.set(doc(getColRef('stockLogs'), `LOG-${Date.now()}`), { id: `LOG-${Date.now()}`, productId: stockUpdateItem.id, productName: stockUpdateItem.name, type: addedQty > 0 ? 'IN' : 'OUT', reason: stockUpdateReason, qtyChange: addedQty, finalStock: finalQty, hpp: updatedCost, timestamp: Date.now(), user: currentUser?.name || 'Admin' });
    await batch.commit(); setIsStockModalOpen(false); setAlertMsg(`Stok ${stockUpdateItem.name} diperbarui.`);
  };
  const handleDeleteItem = (id) => { showConfirm("Hapus Barang", "Yakin hapus barang ini permanen?", async () => { await deleteDoc(doc(getColRef('products'), id.toString())); setAlertMsg("Item dihapus."); }); };
  const handleProcessShift = async (e) => {
    e.preventDefault(); if (!firebaseUser || !currentUser) return; const cashAmount = Number(shiftCashInput) || 0;
    if (shiftAction === 'open') { await setDoc(doc(getColRef('shifts'), `SHIFT-${Date.now()}`), { id: `SHIFT-${Date.now()}`, userId: currentUser.id, kasirName: currentUser.name, startTime: Date.now(), startingCash: cashAmount, status: 'open' }); setAlertMsg("Shift dibuka."); } 
    else {
      if (!activeShift) return;
      const shiftTrx = transactions.filter(t => t.shiftId === activeShift.id && t.paymentMethod === 'Tunai'); const shiftExp = expenses.filter(e => e.shiftId === activeShift.id);
      const expectedCash = activeShift.startingCash + shiftTrx.reduce((s,t)=>s+(t.total||0),0) - shiftExp.reduce((s,e)=>s+(e.amount||0),0); const difference = cashAmount - expectedCash;
      await updateDoc(doc(getColRef('shifts'), activeShift.id), { endTime: Date.now(), endingCash: cashAmount, expectedCash, difference, status: 'closed' });
      setAlertMsg(`Shift ditutup. Selisih: ${formatRupiah(difference)}`); if (currentUser.role === 'kasir') handleLogout();
    }
    setShiftModalOpen(false);
  };
  const handleAddCustomer = async (e) => { e.preventDefault(); if (!newCustomerName.trim()) return; const newId = `CUST-${Date.now()}`; await setDoc(doc(getColRef('customers'), newId), { id: newId, name: newCustomerName.trim(), phone: newCustomerPhone, debt: 0 }); setNewCustomerName(""); setNewCustomerPhone(""); };
  const processPayDebt = async (e) => { e.preventDefault(); const amount = Number(payDebtAmount); if (amount <= 0 || amount > (debtCustomer.debt || 0)) { setAlertMsg("Nominal tidak valid."); return; } const batch = writeBatch(db); batch.update(doc(getColRef('customers'), debtCustomer.id), { debt: (debtCustomer.debt || 0) - amount }); const trxId = generateInvoiceID(); batch.set(doc(getColRef('transactions'), trxId), { id: trxId, type: 'PayDebt', timestamp: Date.now(), total: amount, paymentMethod: 'Tunai', customerId: debtCustomer.id, customerName: debtCustomer.name, kasirName: currentUser.name, shiftId: activeShift?.id || 'NO-SHIFT', items: [{name: `Pelunasan Hutang`}] }); await batch.commit(); setPayDebtModalOpen(false); setPayDebtAmount(""); setAlertMsg("Pembayaran piutang dicatat."); };
  const handleAddExpense = async (e) => { e.preventDefault(); if (!newExpense.description || newExpense.amount <= 0) return; const newId = `EXP-${Date.now()}`; await setDoc(doc(getColRef('expenses'), newId), { id: newId, ...newExpense, amount: Number(newExpense.amount), timestamp: Date.now(), kasirName: currentUser.name, shiftId: activeShift?.id || 'NO-SHIFT' }); setExpenseModalOpen(false); setNewExpense({ description: '', amount: 0, category: 'Operasional' }); };
  const handleAddKasir = async (e) => { e.preventDefault(); if (!newKasirName.trim()) return; const newId = `kasir-${Date.now()}`; await setDoc(doc(getColRef('users'), newId), { id: newId, role: 'kasir', name: newKasirName.trim(), password: '008' }); setNewKasirName(""); setAlertMsg("Kasir ditambahkan (Pwd: 008)"); };
  const openPasswordModal = (user) => { showPrompt("Ubah Kata Sandi", `Sandi baru untuk ${user.name}:`, "", "Sandi baru...", async (newPass) => { if (newPass) { await updateDoc(doc(getColRef('users'), user.id), { password: newPass }); setAlertMsg("Sandi diperbarui."); } }); };
  const handleDeleteUser = (id, name) => { showConfirm("Hapus Akses", `Yakin hapus akun ${name}?`, async () => { await deleteDoc(doc(getColRef('users'), id)); setAlertMsg("Akun dihapus."); }); };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword === loginTargetUser?.password) {
      setCurrentUser(loginTargetUser); setLoginPassword(""); setLoginStep('role'); setActiveTab(loginTargetUser.role === 'owner' ? 'reports' : 'pos');
      if (loginTargetUser.role === 'kasir') { const hasOpenShift = shifts.find(s => s.userId === loginTargetUser.id && s.status === 'open'); if (!hasOpenShift) { setShiftAction('open'); setShiftCashInput(""); setShiftModalOpen(true); } else { setShiftModalOpen(false); } }
    } else { setLoginError("Kredensial salah!"); }
  };
  const handleLogout = () => { setCurrentUser(null); setCart([]); setIsCartOpen(false); setActiveShift(null); };

  const posProps = {
    searchQuery, setSearchQuery, activeCategory, setActiveCategory, displayCategories,
    filteredProductsSafe: products.filter(p => (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) && (activeCategory === "Semua" || p.category === activeCategory)),
    addToCart, cart, updateQty, clearCart, isCartOpen, setIsCartOpen, discount, setDiscount, 
    taxEnabled, setTaxEnabled, subtotal, taxAmount, grandTotal, setCheckoutModalOpen, 
    editingTransactionId, handleHoldBill, cancelEditMode
  };

  const dashboardProps = {
    currentUser, activeTab, transactions, products, categories, customers, expenses, shifts, holdBills, stockLogs, users,
    historyFilter, setHistoryFilter, historyCustomDate, setHistoryCustomDate, handleReprintReceipt, loadTransactionToEditor, 
    resumeHoldBill, handleAddCustomer, newCustomerName, setNewCustomerName, newCustomerPhone, setNewCustomerPhone, 
    setDebtCustomer, setPayDebtModalOpen, setExpenseModalOpen, setIsCategoryModalOpen, setIsAddModalOpen, openUpdateStockModal, 
    handleDeleteItem, newKasirName, setNewKasirName, handleAddKasir, openPasswordModal, handleDeleteUser, reportPeriod, setReportPeriod, handlePrintReport
  };

  const NavItem = ({ id, icon: Icon, label, rolesAllowed }) => {
    if (!rolesAllowed.includes(currentUser?.role)) return null;
    return (<button onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? theme.buttonBg + ' ' + theme.buttonText + ' shadow-inner' : `${theme.textMuted} hover:bg-black/10 hover:${theme.textMain}`}`}><Icon size={20} /><span className="font-semibold tracking-wide">{label}</span></button>);
  };

  if (!isDbReady) { return (<div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-[#1a1412] text-amber-50"><Loader2 size={48} className="text-red-500 animate-spin z-10" /><p className="mt-4 text-amber-500/80 font-mono tracking-widest z-10">INISIALISASI SISTEM ENTERPRISE...</p></div>); }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[100dvh] w-full text-amber-50 font-sans relative overflow-hidden">
        <div className="fixed inset-0 z-[-1] bg-[#1a1412]">{backgroundImages.map((img, idx) => (<img key={idx} src={img} alt={`bg-${idx}`} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentBg ? 'opacity-40' : 'opacity-0'}`} />))}<div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div></div>
        <div className="bg-[#221815]/80 backdrop-blur-xl border border-red-900/50 rounded-3xl p-8 max-w-sm w-full z-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-center">
          <div className="w-16 h-16 rounded-full bg-red-800 flex items-center justify-center border border-amber-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] mx-auto mb-4"><span className="text-3xl font-serif text-amber-300">G</span></div>
          <h1 className="text-2xl font-bold tracking-widest text-amber-50 uppercase mb-1" style={{ fontFamily: 'Georgia, serif' }}>GG <span className="text-red-500">POS</span></h1>
          <p className="text-xs text-amber-500/70 font-mono tracking-widest mb-8">SISTEM KASIR ENTERPRISE</p>
          {loginStep === 'role' && (<div className="space-y-3"><button onClick={() => { setLoginTargetUser(users.find(u => u.id === 'admin')); setLoginStep('password'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-red-800/90 hover:bg-red-700 text-amber-50 rounded-xl font-bold transition-all border border-red-600/50"><ShieldAlert size={20} /> Masuk Administrator</button><button onClick={() => setLoginStep('kasir-list')} className="w-full flex items-center gap-3 px-4 py-3 bg-[#2a1f1b]/80 hover:bg-[#30231f] border border-amber-900/50 text-amber-400 rounded-xl font-bold transition-all"><UserSquare size={20} /> Masuk Area Kasir</button><button onClick={() => { setLoginTargetUser(users.find(u => u.id === 'owner')); setLoginStep('password'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-[#2a1f1b]/80 hover:bg-[#30231f] border border-amber-900/50 text-amber-400 rounded-xl font-bold transition-all"><Eye size={20} /> Masuk Area Pemilik</button></div>)}
          {loginStep === 'kasir-list' && (<div className="space-y-3"><p className="text-sm text-amber-400 mb-4 font-semibold">Pilih ID Kasir:</p><div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">{users.filter(u => u.role === 'kasir').map(kasir => (<button key={kasir.id} onClick={() => { setLoginTargetUser(kasir); setLoginStep('password'); }} className="w-full flex items-center justify-between px-4 py-3 bg-[#2a1f1b]/80 hover:bg-red-900/50 border border-amber-900/50 text-amber-50 rounded-xl font-bold transition-all"><span>{kasir.name}</span><ArrowLeft size={16} className="rotate-180 text-amber-500" /></button>))}</div><button onClick={() => setLoginStep('role')} className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-amber-500 hover:text-amber-300 py-2"><ArrowLeft size={16} /> Kembali</button></div>)}
          {loginStep === 'password' && (<form onSubmit={handleLogin} className="space-y-4"><p className="text-sm text-amber-500 font-semibold mb-2">Akses Otentikasi: <span className="text-amber-100">{loginTargetUser?.name}</span></p><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" size={20} /><input autoFocus type="password" placeholder="Masukkan PIN/Sandi" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-[#1a1412]/80 border border-amber-900/50 text-amber-100 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-center tracking-widest text-lg"/></div>{loginError && <p className="text-xs text-red-400 font-bold animate-pulse">{loginError}</p>}<div className="flex gap-2 pt-2"><button type="button" onClick={() => setLoginStep('role')} className="p-3 bg-[#2a1f1b]/80 hover:bg-[#30231f] border border-amber-900/50 text-amber-500 rounded-xl"><ArrowLeft size={20} /></button><button type="submit" className="flex-1 bg-red-800/90 hover:bg-red-700 text-amber-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-red-600/50">Otorisasi <Key size={18} /></button></div></form>)}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] w-full font-sans overflow-hidden relative ${theme.textMain} ${printType === 'receipt' || printType === 'reprint' ? 'print-mode-receipt' : printType === 'report' ? 'print-mode-report' : ''}`}>
      
      <div id="printable-receipt" className="hidden bg-white z-[9999] p-2 text-black">
        {(lastTransaction || reprintTransaction) && (() => {
          const trx = lastTransaction || reprintTransaction;
          return (<div className="text-center w-full"><h2 className="text-lg font-bold mb-1">GG PASORYAN</h2><p className="text-[10px] mb-2 border-b border-black pb-2">Jl. Enterprise No.1<br/>Telp: 0812-XXXX-XXXX</p><div className="text-left text-[10px] mb-2"><p>No: {trx.id}</p><p>Tgl: {new Date(trx.timestamp).toLocaleString('id-ID')}</p><p>Kasir: {trx.kasirName}</p>{trx.lastEditedBy && <p>Diubah: {trx.lastEditedBy}</p>}</div><table className="w-full text-[10px] text-left border-t border-b border-black border-dashed my-2 py-2"><tbody>{(trx.items || []).map((item, idx) => (<tr key={idx}><td className="w-3/5 pb-1">{item.name}<br/>{item.qty} x {item.price}</td><td className="w-2/5 text-right align-bottom pb-1">{item.qty * item.price}</td></tr>))}</tbody></table><div className="text-[10px] text-right mb-4"><p>Subtotal: {trx.subtotal}</p>{trx.discount > 0 && <p>Diskon: -{trx.discount}</p>}{trx.tax > 0 && <p>Pajak 10%: {trx.tax}</p>}<p className="font-bold text-[12px] mt-1">TOTAL: Rp {trx.total}</p><p>Tipe Bayar: {trx.paymentMethod}</p></div><p className="text-[10px] text-center italic border-t border-black pt-2">{printType === 'reprint' ? '** CETAK ULANG **' : 'Terima kasih atas kunjungan Anda!'}</p></div>);
        })()}
      </div>
      <div id="printable-report" className="hidden z-[9999]"></div>

      <div id="app-root-container" className={`flex h-[100dvh] w-full overflow-hidden relative ${printType ? 'hidden' : 'block'}`}>
        
        {/* LAYER WARNA DASAR TEMA */}
        <div className={`fixed inset-0 z-[-2] ${theme.bgBase} transition-colors duration-500`}></div>

        {/* ✅ CLEAR GLASS: Background tampil penuh, overlay sangat tipis */}
        <div className="fixed inset-0 z-[-1] transition-colors duration-500">
          {backgroundImages.map((img, idx) => (
            <img key={idx} src={img} alt={`bg-${idx}`} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentBg ? 'opacity-100' : 'opacity-0'}`} />
          ))}
          <div className={`absolute inset-0 ${
            currentThemeKey === 'terang'     ? 'bg-white/35' :
            currentThemeKey === 'retro'      ? 'bg-[#F4ECD8]/40' :
            currentThemeKey === 'cyberpunk'  ? 'bg-yellow-400/30' :
            currentThemeKey === 'neon'       ? 'bg-black/35' :
                                               'bg-black/30'
          } backdrop-blur-[1px] transition-colors duration-500`}></div>
        </div>

        {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
        
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 ${theme.bgPanel} backdrop-blur-xl border-r ${theme.border} flex flex-col shadow-2xl transition-transform duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className={`p-6 border-b ${theme.border} flex items-center gap-3 bg-black/10`}>
            <div className="w-10 h-10 rounded-full bg-red-800 flex items-center justify-center border border-amber-500 shadow-[0_0_10px_rgba(220,38,38,0.3)] shrink-0"><span className="text-xl font-serif text-amber-300">G</span></div>
            <div><h1 className="text-xl font-bold tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>GG <span className={theme.accent}>POS</span></h1><div className="flex items-center gap-1 mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase truncate max-w-[120px]">{currentUser?.name}</p></div></div>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem id="pos" icon={LayoutDashboard} label="Kasir & Transaksi" rolesAllowed={['admin', 'kasir']} />
            <NavItem id="history" icon={FileText} label="Riwayat & Retur" rolesAllowed={['admin', 'kasir']} />
            <NavItem id="holdbills" icon={Clock} label="Pesanan Tertahan" rolesAllowed={['admin', 'kasir']} />
            <NavItem id="customers" icon={BookOpen} label="Buku Piutang" rolesAllowed={['admin', 'kasir', 'owner']} />
            <NavItem id="inventory" icon={Package} label="Data Inventaris" rolesAllowed={['admin', 'owner']} />
            <NavItem id="expenses" icon={Wallet} label="Jurnal Pengeluaran" rolesAllowed={['admin', 'kasir', 'owner']} />
            <NavItem id="reports" icon={BarChart3} label="Laporan Eksekutif" rolesAllowed={['admin', 'owner']} />
            <NavItem id="stocklogs" icon={ClipboardList} label="Buku Kartu Stok" rolesAllowed={['admin', 'owner']} />
            <NavItem id="users" icon={Users} label="Sistem Pengguna" rolesAllowed={['admin']} />
          </nav>
          <div className={`p-4 border-t ${theme.border} space-y-2 bg-black/10`}>
            <div className="flex items-center gap-2 mb-3 px-2">
              <Palette size={16} className={theme.textMuted}/>
              {currentUser?.role === 'admin' ? (
                <select value={currentThemeKey} onChange={(e) => handleChangeTheme(e.target.value)} className={`w-full bg-transparent ${theme.textMain} text-sm focus:outline-none cursor-pointer font-semibold`}>
                  {Object.keys(themes).map(k => <option key={k} value={k} className="bg-[#1a1412] text-amber-50">{themes[k].name}</option>)}
                </select>
              ) : (
                <div className={`w-full bg-transparent ${theme.textMain} text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis`}>Tema: {themes[currentThemeKey]?.name}</div>
              )}
            </div>
            {currentUser?.role === 'kasir' && (<button onClick={() => { setShiftAction('close'); setShiftCashInput(""); setShiftModalOpen(true); }} className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-black/20 border border-current hover:bg-black/40 rounded-xl font-semibold transition-all text-sm ${theme.textMuted}`}><Lock size={16} /> Tutup Laci</button>)}
            <button onClick={handleLogout} className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-black/20 border ${theme.border} hover:bg-red-900/50 hover:text-red-300 rounded-xl font-semibold transition-all text-sm`}><LogOut size={16} /> Akhiri Sesi</button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full z-10 relative min-w-0">
          <header className={`lg:hidden p-4 ${theme.bgPanel} backdrop-blur-md border-b ${theme.border} flex justify-between items-center shrink-0`}>
            <button onClick={() => setIsSidebarOpen(true)} className={`p-2 hover:bg-black/20 rounded-lg ${theme.textMain}`}><MenuIcon size={24} /></button>
            <span className={`font-bold tracking-wider uppercase ${theme.textMain}`}>{activeTab}</span>
            {(activeTab === 'pos' && ['admin', 'kasir'].includes(currentUser?.role)) ? (<button onClick={() => setIsCartOpen(true)} className={`relative p-2 hover:bg-black/20 rounded-lg ${theme.textMain}`}><ShoppingCart size={24} />{cart.length > 0 && (<span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.reduce((sum, item) => sum + (item.qty || 0), 0)}</span>)}</button>) : <div className="w-10"></div>}
          </header>

          {activeTab === 'pos' && ['admin', 'kasir'].includes(currentUser?.role) ? (
            <POSScreen props={posProps} theme={theme} />
          ) : (
            <DashboardPanels activeTab={activeTab} props={dashboardProps} theme={theme} />
          )}
        </main>
      </div> 

      {/* === MODALS GLOBAL === */}

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className={`${theme.bgPanel} border border-red-500/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center`}><AlertTriangle className="text-red-500 mx-auto mb-4" size={48} /><h3 className={`text-lg font-bold ${theme.textMain} mb-2`}>{confirmDialog.title}</h3><p className={`text-sm ${theme.textMuted} mb-6`}>{confirmDialog.message}</p><div className="flex gap-2"><button onClick={() => setConfirmDialog({isOpen: false})} className={`flex-1 p-3 rounded-xl border ${theme.border} ${theme.textMuted} hover:bg-black/20 font-semibold`}>Batal</button><button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({isOpen: false}); }} className={`flex-1 p-3 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-bold`}>Ya, Lanjutkan</button></div></div></div>
      )}

      {promptDialog.isOpen && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className={`${theme.bgPanel} border ${theme.border} rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl`}><div className={`p-4 bg-black/20 border-b ${theme.border}`}><h3 className={`text-lg font-bold ${theme.textMain}`}>{promptDialog.title}</h3></div><div className="p-5"><p className={`text-sm ${theme.textMuted} mb-3`}>{promptDialog.message}</p><input autoFocus type="text" value={promptDialog.value} onChange={(e) => setPromptDialog({...promptDialog, value: e.target.value})} placeholder={promptDialog.placeholder} className={`w-full bg-black/20 border ${theme.border} rounded-xl p-3 ${theme.textMain} focus:outline-none mb-4`}/><div className="flex gap-2"><button onClick={() => setPromptDialog({isOpen: false})} className={`flex-1 p-3 rounded-xl border ${theme.border} ${theme.textMuted} font-semibold`}>Batal</button><button onClick={() => { promptDialog.onConfirm(promptDialog.value); setPromptDialog({isOpen: false}); }} className={`flex-1 p-3 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-bold`}>Simpan</button></div></div></div></div>
      )}

      {checkoutModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className={`${theme.bgPanel} border border-emerald-600/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl`}><div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}><h3 className={`text-lg font-bold ${theme.textMain}`}>Sistem Pembayaran</h3><button onClick={() => setCheckoutModalOpen(false)} className={`${theme.textMuted} hover:text-white`}><X size={20}/></button></div><form onSubmit={processCheckoutOrUpdate} className="p-5 space-y-4"><div className={`text-center bg-black/20 border ${theme.border} p-4 rounded-xl`}><p className={`text-sm ${theme.textMuted} uppercase`}>Tagihan Akhir</p><p className={`text-3xl font-black ${theme.accent} font-mono`}>{formatRupiah(grandTotal)}</p></div><div><label className={`block text-xs font-semibold ${theme.textMuted} mb-1`}>Instrumen Pembayaran</label><div className="flex gap-2">{['Tunai', 'QRIS', 'Tempo'].map(m => <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`flex-1 py-2 rounded-lg font-bold text-sm border ${paymentMethod === m ? theme.buttonBg + ' ' + theme.buttonText : 'bg-transparent border-current ' + theme.textMuted}`}>{m}</button>)}</div></div>{paymentMethod === 'Tempo' && (<div className="bg-red-900/20 border border-red-700/30 p-3 rounded-xl"><label className="block text-xs font-semibold text-red-400 mb-1">Bebankan Ke Pelanggan:</label><select required value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="w-full bg-black/40 border border-red-700/50 rounded-lg p-2.5 text-white text-sm focus:outline-none"><option value="">-- Pilih Relasi --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} (Hutang: {formatRupiah(c.debt)})</option>)}</select></div>)}{paymentMethod === 'Tunai' && !editingTransactionId && (<div><label className={`block text-xs font-semibold ${theme.textMuted} mb-1`}>Kas Diterima (Rp)</label><input required type="number" min={grandTotal} value={amountTendered} onChange={e => setAmountTendered(e.target.value)} className="w-full bg-black/20 border border-emerald-700/50 rounded-lg p-3 text-emerald-400 text-lg font-bold text-center focus:outline-none"/>{Number(amountTendered) >= grandTotal && <p className="text-center text-sm font-bold text-emerald-400 mt-2">Uang Kembali: {formatRupiah(Number(amountTendered) - grandTotal)}</p>}</div>)}<button type="submit" className={`w-full p-3 rounded-xl text-white font-bold text-lg mt-4 shadow-lg ${editingTransactionId ? 'bg-amber-700 hover:bg-amber-600' : 'bg-emerald-800/90 hover:bg-emerald-700'}`}>{editingTransactionId ? 'Selesaikan Update & Retur' : 'Selesaikan Pembayaran'}</button></form></div></div>
      )}

      {isStockModalOpen && stockUpdateItem && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className={`${theme.bgPanel} border border-emerald-600/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl`}><div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}><h3 className={`text-lg font-bold ${theme.textMain} flex items-center gap-2`}><RefreshCw size={20}/> Mutasi Inventaris</h3><button onClick={() => setIsStockModalOpen(false)}><X size={20} className={theme.textMuted}/></button></div><form onSubmit={handleProcessUpdateStock} className="p-5 space-y-4"><div className="text-center mb-2"><p className={`text-sm ${theme.textMuted}`}>SKU: <strong className={`block text-lg ${theme.textMain}`}>{stockUpdateItem.name}</strong></p><p className="text-xs text-emerald-400 font-mono bg-emerald-900/20 py-1 rounded inline-block px-3 mt-1">Stok: {stockUpdateItem.stock || 0} | HPP Lama: {formatRupiah(stockUpdateItem.cost)}</p></div><div><label className={`block text-xs font-semibold ${theme.textMuted} mb-1 text-center`}>Tipe Mutasi</label><select value={stockUpdateReason} onChange={e => setStockUpdateReason(e.target.value)} className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none mb-3`}><option value="Restock Barang Masuk">Restock (Barang Masuk)</option><option value="Koreksi Barang Rusak/Expired">Koreksi Rusak/Expired (Pengurangan)</option><option value="Audit Stok Opname">Audit Stok Opname</option></select><label className={`block text-xs font-semibold ${theme.textMuted} mb-1 text-center`}>Volume / Jumlah Barang</label><input autoFocus required type="number" placeholder="Contoh: 10 atau -5" value={stockUpdateAmount} onChange={e => setStockUpdateAmount(e.target.value)} className="w-full bg-black/20 border border-emerald-700/50 rounded-xl p-3 text-emerald-400 font-bold text-center focus:outline-none text-lg"/></div>{Number(stockUpdateAmount) > 0 && stockUpdateReason === 'Restock Barang Masuk' && (<div className="bg-emerald-900/10 border border-emerald-900/30 p-3 rounded-xl"><label className="block text-xs font-semibold text-emerald-400 mb-2 text-center">Input Harga Beli Baru (Satuan) Untuk HPP Average</label><input required type="number" min="0" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} className="w-full bg-black/20 border border-emerald-700/50 rounded-xl p-3 text-emerald-400 font-bold text-center focus:outline-none"/></div>)}<button type="submit" className="w-full p-3 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold mt-2">Simpan Pembukuan Stok</button></form></div></div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className={`${theme.bgPanel} border ${theme.border} rounded-2xl w-full max-w-md overflow-hidden shadow-2xl`}><div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}><h3 className={`text-lg font-bold ${theme.textMain}`}>Registrasi Master Item</h3><button onClick={() => setIsAddModalOpen(false)}><X size={20} className={theme.textMuted}/></button></div><form onSubmit={handleAddProduct} className="p-5 space-y-4"><div><label className={`block text-xs ${theme.textMuted} mb-1`}>Nama SKU/Item</label><input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none`}/></div><div><label className={`block text-xs ${theme.textMuted} mb-1`}>Kategori Induk</label><select required value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none`}><option value="">-- Pilih --</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className={`block text-xs ${theme.textMuted} mb-1`}>HPP Awal (Rp)</label><input required type="number" min="0" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none`}/></div><div><label className={`block text-xs ${theme.textMuted} mb-1`}>Harga Jual (Rp)</label><input required type="number" min="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none`}/></div></div><div><label className={`block text-xs ${theme.textMuted} mb-1`}>Inisiasi Volume Stok</label><input required type="number" min="0" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none`}/></div><button type="submit" className={`w-full p-3 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-bold text-sm mt-2`}>Publish ke Server</button></form></div></div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className={`${theme.bgPanel} border ${theme.border} rounded-2xl w-full max-w-md overflow-hidden shadow-2xl`}><div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}><h3 className={`text-lg font-bold ${theme.textMain} flex items-center gap-2`}><Tags size={20}/> Kelola Kategori</h3><button onClick={() => setIsCategoryModalOpen(false)}><X size={20} className={theme.textMuted}/></button></div><div className="p-5 space-y-4"><form onSubmit={handleAddCategory} className="flex gap-2"><input required autoFocus type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nama kategori baru..." className={`flex-1 bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none`}/><button type="submit" className={`px-4 py-2 ${theme.buttonBg} ${theme.buttonText} rounded-lg font-bold text-sm shadow-lg`}>Tambah</button></form><div className={`bg-black/10 border ${theme.border} rounded-xl overflow-hidden max-h-60 overflow-y-auto`}><ul className={`divide-y ${theme.border}`}>{categories.map(cat => (<li key={cat} className="p-3 flex justify-between items-center hover:bg-black/20 transition-colors"><span className={`${theme.textMain} font-medium text-sm`}>{cat}</span><button onClick={() => handleRemoveCategory(cat)} className="p-1.5 text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button></li>))}{categories.length === 0 && <li className={`p-4 text-center text-sm ${theme.textMuted}`}>Belum ada kategori kustom.</li>}</ul></div></div></div></div>
      )}

      {/* ✅ MODAL SHIFT: DITAMBAH TOMBOL KEMBALI DI HEADER DAN FOOTER */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className={`${theme.bgPanel} border-2 ${theme.border} rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl`}>
            {/* Header dengan tombol kembali di kiri */}
            <div className={`p-4 bg-black/20 border-b ${theme.border} flex items-center gap-3`}>
              <button
                type="button"
                onClick={() => setShiftModalOpen(false)}
                className={`p-2 rounded-xl border ${theme.border} ${theme.textMuted} hover:bg-black/30 hover:${theme.textMain} transition-all shrink-0`}
                title="Kembali"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className={`flex-1 text-center text-xl font-black ${theme.accent} uppercase tracking-widest pr-10`}>
                {shiftAction === 'open' ? 'BUKA LACI KASIR' : 'TUTUP LACI KASIR'}
              </h3>
            </div>
            <form onSubmit={handleProcessShift} className="p-6 space-y-5">
              <p className={`text-sm ${theme.textMuted} text-center`}>
                {shiftAction === 'open'
                  ? `Halo ${currentUser?.name || 'Kasir'}! Masukkan uang modal laci Anda untuk mulai shift.`
                  : 'Masukkan total uang fisik yang ada di dalam laci kasir saat ini.'}
              </p>
              <div>
                <label className={`block text-xs font-semibold ${theme.textMuted} mb-2 text-center`}>
                  {shiftAction === 'open' ? 'MODAL AWAL SHIFT (Rp)' : 'TOTAL UANG FISIK (Rp)'}
                </label>
                <input
                  required
                  autoFocus
                  type="number"
                  min="0"
                  placeholder="Rp 0"
                  value={shiftCashInput}
                  onChange={e => setShiftCashInput(e.target.value)}
                  className={`w-full bg-black/20 border-2 ${theme.border} rounded-xl p-4 ${theme.textMain} text-2xl font-bold text-center focus:outline-none`}
                />
              </div>
              {/* Dua tombol: Kembali + Konfirmasi */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShiftModalOpen(false)}
                  className={`flex-1 p-4 rounded-xl border-2 ${theme.border} ${theme.textMuted} hover:bg-black/20 font-bold uppercase tracking-widest transition-all text-sm`}
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className={`flex-1 p-4 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-black transition-all text-lg shadow-xl uppercase tracking-widest`}
                >
                  {shiftAction === 'open' ? 'Mulai' : 'Tutup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payDebtModalOpen && debtCustomer && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className={`${theme.bgPanel} border border-emerald-600/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl`}><div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}><h3 className={`text-lg font-bold ${theme.textMain}`}>Pelunasan Piutang</h3><button onClick={() => setPayDebtModalOpen(false)}><X size={20} className={theme.textMuted}/></button></div><form onSubmit={processPayDebt} className="p-5 space-y-4 text-center"><p className={`text-sm ${theme.textMuted}`}>Pembayaran untuk: <strong className={`block text-lg ${theme.textMain}`}>{debtCustomer.name}</strong></p><p className="text-xs text-red-400">Sisa Hutang: {formatRupiah(debtCustomer.debt)}</p><div><input autoFocus required type="number" min="1" max={debtCustomer.debt} placeholder="Nominal Uang (Rp)" value={payDebtAmount} onChange={e => setPayDebtAmount(e.target.value)} className="w-full bg-black/20 border border-emerald-700/50 rounded-xl p-3 text-emerald-400 font-bold text-center focus:outline-none text-lg"/></div><button type="submit" className="w-full p-3 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold transition-all border border-emerald-600/50">Konfirmasi Pembayaran Tunai</button></form></div></div>
      )}

      {expenseModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className={`${theme.bgPanel} border border-red-600/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl`}><div className={`p-4 bg-black/20 border-b ${theme.border} flex justify-between items-center`}><h3 className={`text-lg font-bold ${theme.textMain} flex items-center gap-2`}><Wallet size={20} className="text-red-500" /> Catat Kas Keluar</h3><button onClick={() => setExpenseModalOpen(false)}><X size={20} className={theme.textMuted}/></button></div><form onSubmit={handleAddExpense} className="p-5 space-y-4"><div><label className={`block text-xs font-semibold ${theme.textMuted} mb-1`}>Keterangan / Tujuan Kas</label><input required type="text" placeholder="Misal: Beli Token Listrik" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none`}/></div><div className="grid grid-cols-2 gap-4"><div><label className={`block text-xs font-semibold ${theme.textMuted} mb-1`}>Kategori Biaya</label><select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none`}><option value="Operasional">Operasional (Listrik dll)</option><option value="Gaji">Gaji Karyawan</option><option value="Lain-lain">Lain-lain</option></select></div><div><label className={`block text-xs font-semibold ${theme.textMuted} mb-1`}>Nominal (Rp)</label><input required type="number" min="1" placeholder="0" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className={`w-full bg-black/20 border border-red-700/50 rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none`}/></div></div><button type="submit" className="w-full p-3 rounded-xl bg-red-800/90 hover:bg-red-700 text-white font-bold transition-all text-sm mt-2">Simpan Pengeluaran</button></form></div></div>
      )}

      {lastTransaction && !editingTransactionId && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${theme.bgPanel} border border-emerald-600/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center`}>
            <CheckCircle className="text-emerald-400 mx-auto mb-4" size={56} />
            <h3 className={`text-xl font-bold ${theme.textMain} mb-2`}>Transaksi Berhasil!</h3>
            <p className={`text-sm mb-2 font-mono ${theme.textMuted}`}>{lastTransaction.id}</p>
            <div className={`bg-black/20 border ${theme.border} rounded-xl p-4 my-4`}>
              <p className={`text-xs uppercase ${theme.textMuted}`}>Debet Transaksi</p>
              <p className={`text-2xl font-black ${theme.accent} font-mono`}>{formatRupiah(lastTransaction.total)}</p>
              {lastTransaction.paymentMethod === 'Tempo' && <p className="text-xs text-red-400 font-bold mt-2 bg-red-900/30 py-1 rounded">Dicatat Sebagai Piutang</p>}
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <button onClick={handlePrintReceipt} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-800/90 border border-emerald-500/50 text-emerald-50 hover:bg-emerald-700 font-bold shadow-lg"><Printer size={20} /> Cetak Struk (USB/Bluetooth)</button>
              <button onClick={handleFinishTransaction} className={`w-full p-4 rounded-xl border ${theme.border} ${theme.textMuted} hover:bg-black/20 font-semibold`}>Selesai Tanpa Cetak</button>
            </div>
          </div>
        </div>
      )}

      {alertMsg && (
        <div className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className={`${theme.bgPanel} border border-red-500/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center`}><h3 className={`text-lg font-bold ${theme.textMain} mb-4 whitespace-pre-wrap`}>{alertMsg}</h3><button onClick={() => setAlertMsg("")} className={`w-full p-3 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-bold`}>Tutup Notifikasi</button></div></div>
      )}
      
    </div>
  );
}
