import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, 
  Search, Menu as MenuIcon, X, LayoutDashboard, Package, 
  BarChart3, FileText, AlertTriangle, Tags, Edit2, Save, 
  TrendingUp, Printer, CheckCircle, LogOut, UserSquare, 
  ShieldAlert, Eye, Users, Key, Lock, ArrowLeft, RefreshCw,
  Loader2, Wallet, Clock, PauseCircle, PlayCircle, BookOpen,
  ClipboardList, Download, Calendar
} from 'lucide-react';

// === IMPORT FIREBASE SDK ===
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  deleteDoc, updateDoc, writeBatch 
} from "firebase/firestore";

// === KONFIGURASI FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyBhywK6pmA7RpmM-m3oRGyI4xMKwxCfhSk",
  authDomain: "fir-pos-32e65.firebaseapp.com",
  projectId: "fir-pos-32e65",
  storageBucket: "fir-pos-32e65.firebasestorage.app",
  messagingSenderId: "45991053532",
  appId: "1:45991053532:web:6d452deb5b0cbcf04d0c19"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'gg-pasoryan-v2';
const getColRef = (colName) => collection(db, 'artifacts', APP_ID, 'public', 'data', colName);

// === KONFIGURASI GITHUB (BACKGROUND) ===
const GITHUB_USERNAME = "oktetod"; 
const GITHUB_REPO = "pos2026";           
const GITHUB_FOLDER = ""; 

export default function App() {
  // 1. STATE GLOBAL & AUTH
  const [isDbReady, setIsDbReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); 
  const [users, setUsers] = useState([]);
  
  // 2. STATE LOGIN
  const [loginStep, setLoginStep] = useState('role'); 
  const [loginTargetUser, setLoginTargetUser] = useState(null);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [newKasirName, setNewKasirName] = useState("");

  // 3. STATE NAVIGASI & DATA UTAMA
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
  
  // 4. STATE POS (KASIR)
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(false);

  // 5. STATE MODAL & FORM GLOBAL
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
  
  // 6. STATE TRANSAKSI & CETAK
  const [activeShift, setActiveShift] = useState(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftAction, setShiftAction] = useState('open'); 
  const [shiftCashInput, setShiftCashInput] = useState("");
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai'); 
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [amountTendered, setAmountTendered] = useState("");
  const [lastTransaction, setLastTransaction] = useState(null);
  const [printType, setPrintType] = useState(null); // 'receipt' atau 'report'

  // 7. STATE PELANGGAN & PENGELUARAN
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: 'Operasional' });
  const [payDebtModalOpen, setPayDebtModalOpen] = useState(false);
  const [debtCustomer, setDebtCustomer] = useState(null);
  const [payDebtAmount, setPayDebtAmount] = useState("");

  // 8. STATE LAPORAN
  const [reportPeriod, setReportPeriod] = useState("hari_ini");

  const [backgroundImages, setBackgroundImages] = useState(["https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=1920&auto=format&fit=crop"]);
  const [currentBg, setCurrentBg] = useState(0);

  // ==========================================
  // EFEK INIT DATABASE
  // ==========================================
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
        const url = GITHUB_FOLDER ? `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}` : `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents`;
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

  // ==========================================
  // HELPER CUSTOM DIALOG & UTILITY
  // ==========================================
  const showConfirm = (title, message, onConfirmCallback) => setConfirmDialog({ isOpen: true, title, message, onConfirm: onConfirmCallback });
  const showPrompt = (title, message, defaultValue, placeholder, onConfirmCallback) => setPromptDialog({ isOpen: true, title, message, value: defaultValue, placeholder, onConfirm: onConfirmCallback });
  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  
  const generateInvoiceID = () => {
    const date = new Date();
    const dtm = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `INV-${dtm}-${random}`;
  };

  const displayCategories = ["Semua", ...categories];
  const getCatEmoji = (cat) => {
    const lower = cat.toLowerCase();
    if(lower.includes('makan')) return '🍛';
    if(lower.includes('minum')) return '🍹';
    if(lower.includes('cemil') || lower.includes('snack')) return '🍟';
    if(lower === 'semua') return '🛒';
    return '📦';
  };

  const printReceipt = () => {
    setPrintType('receipt');
    setTimeout(() => { window.print(); setPrintType(null); }, 300);
  };
  
  const handlePrintReport = () => {
    setPrintType('report');
    setTimeout(() => { window.print(); setPrintType(null); }, 300);
  };

  // EKSPOR CSV
  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) { setAlertMsg("Tidak ada data untuk diekspor."); return; }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // LOGIKA POS KERANJANG
  // ==========================================
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
        if (newQty > item.stock) { setAlertMsg("Stok barang tidak mencukupi!"); return item; }
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

  const processCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || !firebaseUser || !currentUser) return;
    if (paymentMethod === 'Tempo' && !selectedCustomerId) { setAlertMsg("Pilih pelanggan untuk sistem Kasbon!"); return; }
    if (paymentMethod === 'Tunai' && Number(amountTendered) < grandTotal) { setAlertMsg("Uang diterima kurang dari total!"); return; }

    const trxId = generateInvoiceID();
    const newTransaction = {
      id: trxId, type: 'Sale', timestamp: Date.now(), date: new Date().toISOString(),
      items: cart, subtotal, discount, tax: taxAmount, total: grandTotal, totalCost, netProfit, 
      paymentMethod, customerId: selectedCustomerId || null,
      kasirName: currentUser.name || 'Kasir', shiftId: activeShift?.id || 'NO-SHIFT'
    };
    
    try {
      const batch = writeBatch(db);
      batch.set(doc(getColRef('transactions'), trxId), newTransaction);
      
      cart.forEach(item => {
        const prodRef = doc(getColRef('products'), item.id.toString());
        const newStock = (item.stock || 0) - (item.qty || 0);
        batch.update(prodRef, { stock: newStock });

        const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        batch.set(doc(getColRef('stockLogs'), logId), {
          id: logId, productId: item.id, productName: item.name, type: 'OUT', reason: `Penjualan ${trxId}`, qtyChange: -(item.qty || 0), finalStock: newStock, hpp: item.cost, timestamp: Date.now(), user: currentUser.name
        });
      });

      if (paymentMethod === 'Tempo' && selectedCustomerId) {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (customer) {
          const custRef = doc(getColRef('customers'), selectedCustomerId);
          batch.update(custRef, { debt: (customer.debt || 0) + grandTotal });
        }
      }

      await batch.commit();
      if (paymentMethod === 'Tunai') {
        const kembali = Number(amountTendered) - grandTotal;
        setAlertMsg(`Transaksi Sukses!\nUang Kembali: ${formatRupiah(kembali)}`);
      } else { setAlertMsg(`Transaksi ${paymentMethod} Sukses!`); }

      setLastTransaction(newTransaction); setCart([]); setDiscount(0); setCheckoutModalOpen(false); setIsCartOpen(false); setAmountTendered("");
    } catch (error) { setAlertMsg("Gagal transaksi. Cek koneksi internet."); }
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

  // ==========================================
  // FITUR: INVENTARIS & KATEGORI
  // ==========================================
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const updatedList = [...categories, newCategoryName.trim()];
    await setDoc(doc(getColRef('settings'), 'categories'), { list: updatedList });
    setNewCategoryName(""); setAlertMsg(`Kategori ditambahkan.`);
  };

  const handleRemoveCategory = (catToRemove) => {
    showConfirm("Hapus Kategori", `Yakin ingin menghapus kategori "${catToRemove}"?`, async () => {
      const updatedList = categories.filter(c => c !== catToRemove);
      await setDoc(doc(getColRef('settings'), 'categories'), { list: updatedList });
      setAlertMsg(`Kategori dihapus.`);
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.category) return;
    const newId = `PROD-${Date.now()}`;
    
    const batch = writeBatch(db);
    batch.set(doc(getColRef('products'), newId), { id: newId, ...newItem, price: Number(newItem.price), cost: Number(newItem.cost), stock: Number(newItem.stock) });

    if (Number(newItem.stock) > 0) {
      const logId = `LOG-${Date.now()}`;
      batch.set(doc(getColRef('stockLogs'), logId), { id: logId, productId: newId, productName: newItem.name, type: 'IN', reason: `Stok Awal Sistem`, qtyChange: Number(newItem.stock), finalStock: Number(newItem.stock), hpp: Number(newItem.cost), timestamp: Date.now(), user: currentUser?.name || 'Sistem' });
    }

    await batch.commit(); setIsAddModalOpen(false); setNewItem({ name: '', category: categories[0] || '', cost: 0, price: 0, stock: 0 }); setAlertMsg("Menu baru ditambahkan.");
  };

  const openUpdateStockModal = (product) => { setStockUpdateItem(product); setStockUpdateAmount(""); setNewCostPrice(product.cost || ""); setStockUpdateReason("Restock Barang Masuk"); setIsStockModalOpen(true); };

  const handleProcessUpdateStock = async (e) => {
    e.preventDefault();
    const addedQty = Number(stockUpdateAmount);
    if (!stockUpdateItem || isNaN(addedQty) || addedQty === 0) return;
    const oldQty = stockUpdateItem.stock || 0;
    const oldCost = stockUpdateItem.cost || 0;
    const finalQty = oldQty + addedQty;

    if (finalQty < 0) { setAlertMsg("Stok akhir tidak boleh minus!"); return; }

    let updatedCost = oldCost;
    if (addedQty > 0 && stockUpdateReason === 'Restock Barang Masuk') {
        const newCost = Number(newCostPrice);
        if (isNaN(newCost) || newCost < 0) { setAlertMsg("Harga beli tidak valid!"); return; }
        updatedCost = ((oldQty * oldCost) + (addedQty * newCost)) / finalQty;
    } 

    const batch = writeBatch(db);
    batch.update(doc(getColRef('products'), stockUpdateItem.id.toString()), { stock: finalQty, cost: updatedCost });

    const logId = `LOG-${Date.now()}`;
    batch.set(doc(getColRef('stockLogs'), logId), { id: logId, productId: stockUpdateItem.id, productName: stockUpdateItem.name, type: addedQty > 0 ? 'IN' : 'OUT', reason: stockUpdateReason, qtyChange: addedQty, finalStock: finalQty, hpp: updatedCost, timestamp: Date.now(), user: currentUser?.name || 'Admin' });

    await batch.commit(); setIsStockModalOpen(false); setAlertMsg(`Stok ${stockUpdateItem.name} diperbarui.`);
  };

  const handleDeleteItem = (id) => {
    showConfirm("Hapus Barang", "Yakin hapus barang ini permanen?", async () => { await deleteDoc(doc(getColRef('products'), id.toString())); setAlertMsg("Item dihapus."); });
  };

  // ==========================================
  // SHIFT, PELANGGAN & PENGELUARAN
  // ==========================================
  const handleProcessShift = async (e) => {
    e.preventDefault();
    if (!firebaseUser || !currentUser) return;
    const cashAmount = Number(shiftCashInput) || 0;

    if (shiftAction === 'open') {
      const shiftId = `SHIFT-${Date.now()}`;
      await setDoc(doc(getColRef('shifts'), shiftId), { id: shiftId, userId: currentUser.id, kasirName: currentUser.name, startTime: Date.now(), startingCash: cashAmount, status: 'open' });
      setAlertMsg("Shift dibuka.");
    } else {
      if (!activeShift) return;
      const shiftTrx = transactions.filter(t => t.shiftId === activeShift.id && t.paymentMethod === 'Tunai');
      const shiftExp = expenses.filter(e => e.shiftId === activeShift.id);
      const expectedCash = activeShift.startingCash + shiftTrx.reduce((s,t)=>s+(t.total||0),0) - shiftExp.reduce((s,e)=>s+(e.amount||0),0);
      const difference = cashAmount - expectedCash;

      await updateDoc(doc(getColRef('shifts'), activeShift.id), { endTime: Date.now(), endingCash: cashAmount, expectedCash, difference, status: 'closed' });
      setAlertMsg(`Shift ditutup. Selisih: ${formatRupiah(difference)}`);
      if (currentUser.role === 'kasir') handleLogout();
    }
    setShiftModalOpen(false);
  };

  const handleAddCustomer = async (e) => { e.preventDefault(); if (!newCustomerName.trim()) return; const newId = `CUST-${Date.now()}`; await setDoc(doc(getColRef('customers'), newId), { id: newId, name: newCustomerName.trim(), phone: newCustomerPhone, debt: 0 }); setNewCustomerName(""); setNewCustomerPhone(""); };

  const processPayDebt = async (e) => {
    e.preventDefault();
    const amount = Number(payDebtAmount);
    if (amount <= 0 || amount > (debtCustomer.debt || 0)) { setAlertMsg("Nominal tidak valid."); return; }
    const batch = writeBatch(db);
    batch.update(doc(getColRef('customers'), debtCustomer.id), { debt: (debtCustomer.debt || 0) - amount });
    const trxId = generateInvoiceID();
    batch.set(doc(getColRef('transactions'), trxId), { id: trxId, type: 'PayDebt', timestamp: Date.now(), total: amount, paymentMethod: 'Tunai', customerId: debtCustomer.id, customerName: debtCustomer.name, kasirName: currentUser.name, shiftId: activeShift?.id || 'NO-SHIFT', items: [{name: `Pelunasan Hutang`}] });
    await batch.commit(); setPayDebtModalOpen(false); setPayDebtAmount(""); setAlertMsg("Pembayaran piutang dicatat.");
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.description || newExpense.amount <= 0) return;
    const newId = `EXP-${Date.now()}`;
    await setDoc(doc(getColRef('expenses'), newId), { id: newId, ...newExpense, amount: Number(newExpense.amount), timestamp: Date.now(), kasirName: currentUser.name, shiftId: activeShift?.id || 'NO-SHIFT' });
    setExpenseModalOpen(false); setNewExpense({ description: '', amount: 0, category: 'Operasional' });
  };

  // ==========================================
  // MANAJEMEN USER & LOGIN
  // ==========================================
  const handleAddKasir = async (e) => {
    e.preventDefault();
    if (!newKasirName.trim()) return;
    const newId = `kasir-${Date.now()}`;
    await setDoc(doc(getColRef('users'), newId), { id: newId, role: 'kasir', name: newKasirName.trim(), password: '008' });
    setNewKasirName(""); setAlertMsg("Kasir ditambahkan (Pwd: 008)");
  };

  const openPasswordModal = (user) => { showPrompt("Ubah Kata Sandi", `Sandi baru untuk ${user.name}:`, "", "Sandi baru...", async (newPass) => { if (newPass) { await updateDoc(doc(getColRef('users'), user.id), { password: newPass }); setAlertMsg("Sandi diperbarui."); } }); };
  const handleDeleteUser = (id, name) => { showConfirm("Hapus Akses", `Yakin hapus akun ${name}?`, async () => { await deleteDoc(doc(getColRef('users'), id)); setAlertMsg("Akun dihapus."); }); };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword === loginTargetUser?.password) {
      setCurrentUser(loginTargetUser); setLoginPassword(""); setLoginStep('role');
      setActiveTab(loginTargetUser.role === 'owner' ? 'reports' : 'pos');
      if (loginTargetUser.role === 'kasir') {
         const hasOpenShift = shifts.find(s => s.userId === loginTargetUser.id && s.status === 'open');
         if (!hasOpenShift) { setShiftAction('open'); setShiftCashInput(""); setShiftModalOpen(true); } 
         else { setShiftModalOpen(false); }
      }
    } else { setLoginError("Kredensial salah!"); }
  };

  const handleLogout = () => { setCurrentUser(null); setCart([]); setIsCartOpen(false); setActiveShift(null); };

  // ==========================================
  // RENDER UI & CSS PRINT INJECTION
  // ==========================================
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        .print-mode-receipt #printable-receipt, .print-mode-receipt #printable-receipt * { visibility: visible; }
        .print-mode-report #printable-report, .print-mode-report #printable-report * { visibility: visible; }
        
        #printable-receipt { position: absolute; left: 0; top: 0; width: 58mm; padding: 0; margin: 0; font-family: monospace; font-size: 12px; color: black !important; }
        #printable-report { position: absolute; left: 0; top: 0; width: 100%; font-family: sans-serif; color: black !important; padding: 20px; background: white; }
        
        @page { margin: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (!isDbReady) { return (<div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-[#1a1412] text-amber-50"><Loader2 size={48} className="text-red-500 animate-spin z-10" /><p className="mt-4 text-amber-500/80 font-mono tracking-widest z-10">INISIALISASI SISTEM ENTERPRISE...</p></div>); }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[100dvh] w-full text-amber-50 font-sans relative overflow-hidden">
        <div className="fixed inset-0 z-[-1] bg-[#1a1412]">{backgroundImages.map((img, idx) => (<img key={idx} src={img} alt={`bg-${idx}`} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentBg ? 'opacity-40' : 'opacity-0'}`} />))}<div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div></div>
        <div className="bg-[#221815]/80 backdrop-blur-xl border border-red-900/50 rounded-3xl p-8 max-w-sm w-full z-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-center">
          <div className="w-16 h-16 rounded-full bg-red-800 flex items-center justify-center border border-amber-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] mx-auto mb-4"><span className="text-3xl font-serif text-amber-300">G</span></div>
          <h1 className="text-2xl font-bold tracking-widest text-amber-50 uppercase mb-1" style={{ fontFamily: 'Georgia, serif' }}>GG <span className="text-red-500">PASORYAN</span></h1>
          <p className="text-xs text-amber-500/70 font-mono tracking-widest mb-8">SISTEM KASIR ENTERPRISE</p>
          
          {loginStep === 'role' && (
            <div className="space-y-3">
              <button onClick={() => { setLoginTargetUser(users.find(u => u.id === 'admin')); setLoginStep('password'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-red-800/90 hover:bg-red-700 text-amber-50 rounded-xl font-bold transition-all border border-red-600/50"><ShieldAlert size={20} /> Masuk Administrator</button>
              <button onClick={() => setLoginStep('kasir-list')} className="w-full flex items-center gap-3 px-4 py-3 bg-[#2a1f1b]/80 hover:bg-[#30231f] border border-amber-900/50 text-amber-400 rounded-xl font-bold transition-all"><UserSquare size={20} /> Masuk Area Kasir</button>
              <button onClick={() => { setLoginTargetUser(users.find(u => u.id === 'owner')); setLoginStep('password'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-[#2a1f1b]/80 hover:bg-[#30231f] border border-amber-900/50 text-amber-400 rounded-xl font-bold transition-all"><Eye size={20} /> Masuk Area Pemilik</button>
            </div>
          )}
          {loginStep === 'kasir-list' && (
            <div className="space-y-3"><p className="text-sm text-amber-400 mb-4 font-semibold">Pilih ID Kasir:</p><div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">{users.filter(u => u.role === 'kasir').map(kasir => (<button key={kasir.id} onClick={() => { setLoginTargetUser(kasir); setLoginStep('password'); }} className="w-full flex items-center justify-between px-4 py-3 bg-[#2a1f1b]/80 hover:bg-red-900/50 border border-amber-900/50 text-amber-50 rounded-xl font-bold transition-all"><span>{kasir.name}</span><ArrowLeft size={16} className="rotate-180 text-amber-500" /></button>))}</div><button onClick={() => setLoginStep('role')} className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-amber-500 hover:text-amber-300 py-2"><ArrowLeft size={16} /> Kembali</button></div>
          )}
          {loginStep === 'password' && (
            <form onSubmit={handleLogin} className="space-y-4"><p className="text-sm text-amber-500 font-semibold mb-2">Akses Otentikasi: <span className="text-amber-100">{loginTargetUser?.name}</span></p><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" size={20} /><input autoFocus type="password" placeholder="Masukkan PIN/Sandi" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-[#1a1412]/80 border border-amber-900/50 text-amber-100 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-center tracking-widest text-lg"/></div>{loginError && <p className="text-xs text-red-400 font-bold animate-pulse">{loginError}</p>}<div className="flex gap-2 pt-2"><button type="button" onClick={() => setLoginStep('role')} className="p-3 bg-[#2a1f1b]/80 hover:bg-[#30231f] border border-amber-900/50 text-amber-500 rounded-xl"><ArrowLeft size={20} /></button><button type="submit" className="flex-1 bg-red-800/90 hover:bg-red-700 text-amber-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-red-600/50">Otorisasi <Key size={18} /></button></div></form>
          )}
        </div>
      </div>
    );
  }

  // LOGIKA RBAC KETAT MENU SIDEBAR
  const NavItem = ({ id, icon: Icon, label, rolesAllowed }) => {
    if (!rolesAllowed.includes(currentUser?.role)) return null;
    return (
      <button onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-red-900/60 text-red-300 border border-red-800/50 shadow-inner' : 'text-amber-100/70 hover:bg-[#2a1f1b]/80 hover:text-amber-300'}`}>
        <Icon size={20} /><span className="font-semibold tracking-wide">{label}</span>
      </button>
    );
  };

  const filteredProductsSafe = products.filter(product => {
    const matchesSearch = (product.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "Semua" || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`flex h-[100dvh] w-full text-amber-50 font-sans overflow-hidden relative selection:bg-red-800 ${printType === 'receipt' ? 'print-mode-receipt' : printType === 'report' ? 'print-mode-report' : ''}`}>
      
      {/* ========================================================= */}
      {/* AREA CETAK TERSEMBUNYI (STRUK & LAPORAN) */}
      {/* ========================================================= */}
      <div id="printable-receipt" className="hidden bg-white z-[9999] p-2">
        {lastTransaction && (
          <div className="text-center w-full">
            <h2 className="text-lg font-bold mb-1">GG PASORYAN</h2>
            <p className="text-[10px] mb-2 border-b border-black pb-2">Jl. Enterprise No.1<br/>Telp: 0812-XXXX-XXXX</p>
            <div className="text-left text-[10px] mb-2"><p>No: {lastTransaction.id}</p><p>Tgl: {new Date(lastTransaction.timestamp).toLocaleString('id-ID')}</p><p>Kasir: {lastTransaction.kasirName}</p></div>
            <table className="w-full text-[10px] text-left border-t border-b border-black border-dashed my-2 py-2">
              <tbody>{(lastTransaction.items || []).map((item, idx) => (<tr key={idx}><td className="w-3/5 pb-1">{item.name}<br/>{item.qty} x {item.price}</td><td className="w-2/5 text-right align-bottom pb-1">{item.qty * item.price}</td></tr>))}</tbody>
            </table>
            <div className="text-[10px] text-right mb-4"><p>Subtotal: {lastTransaction.subtotal}</p>{lastTransaction.discount > 0 && <p>Diskon: -{lastTransaction.discount}</p>}{lastTransaction.tax > 0 && <p>Pajak 10%: {lastTransaction.tax}</p>}<p className="font-bold text-[12px] mt-1">TOTAL: {lastTransaction.total}</p><p>Tipe Bayar: {lastTransaction.paymentMethod}</p></div>
            <p className="text-[10px] text-center italic border-t border-black pt-2">Terima kasih atas kunjungan Anda!</p>
          </div>
        )}
      </div>

      <div id="printable-report" className="hidden z-[9999]">
         {/* Konten Report disuntikkan secara dinamis saat merender tab report */}
      </div>

      <div className="fixed inset-0 z-[-1] bg-[#1a1412]">{backgroundImages.map((img, idx) => (<img key={idx} src={img} alt={`bg-${idx}`} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentBg ? 'opacity-40' : 'opacity-0'}`} />))}<div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div></div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#221815]/90 backdrop-blur-xl border-r border-red-900/30 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-red-900/20 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-red-800 flex items-center justify-center border border-amber-500 shadow-[0_0_10px_rgba(220,38,38,0.3)] shrink-0"><span className="text-xl font-serif text-amber-300">G</span></div><div><h1 className="text-xl font-bold tracking-widest text-amber-50 uppercase" style={{ fontFamily: 'Georgia, serif' }}>GG <span className="text-red-500">PASORYAN</span></h1><div className="flex items-center gap-1 mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase truncate max-w-[120px]">{currentUser?.name}</p></div></div></div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem id="pos" icon={LayoutDashboard} label="Kasir & Transaksi" rolesAllowed={['admin', 'kasir']} />
          <NavItem id="holdbills" icon={Clock} label="Pesanan Tertahan" rolesAllowed={['admin', 'kasir']} />
          <NavItem id="customers" icon={BookOpen} label="Buku Piutang" rolesAllowed={['admin', 'kasir', 'owner']} />
          <NavItem id="inventory" icon={Package} label="Data Inventaris" rolesAllowed={['admin', 'owner']} />
          <NavItem id="expenses" icon={Wallet} label="Jurnal Pengeluaran" rolesAllowed={['admin', 'kasir', 'owner']} />
          <NavItem id="reports" icon={BarChart3} label="Laporan Eksekutif" rolesAllowed={['admin', 'owner']} />
          <NavItem id="stocklogs" icon={ClipboardList} label="Buku Kartu Stok" rolesAllowed={['admin', 'owner']} />
          <NavItem id="users" icon={Users} label="Sistem Pengguna" rolesAllowed={['admin']} />
        </nav>

        <div className="p-4 border-t border-red-900/20 space-y-2">
          {currentUser?.role === 'kasir' && (<button onClick={() => { setShiftAction('close'); setShiftCashInput(""); setShiftModalOpen(true); }} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-900/40 border border-amber-700/50 hover:bg-amber-800/60 text-amber-200 rounded-xl font-semibold transition-all text-sm"><Lock size={16} /> Tutup Laci Kasir</button>)}
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1d1411]/80 border border-amber-900/30 hover:bg-red-900/50 hover:text-red-300 hover:border-red-900/50 text-amber-500 rounded-xl font-semibold transition-all text-sm"><LogOut size={16} /> Akhiri Sesi</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full z-10 relative min-w-0">
        <header className="lg:hidden p-4 bg-[#221815]/90 backdrop-blur-md border-b border-red-900/30 flex justify-between items-center shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-amber-500 hover:bg-red-900/30 rounded-lg"><MenuIcon size={24} /></button>
          <span className="font-bold text-amber-50 tracking-wider uppercase">{activeTab}</span>
          {(activeTab === 'pos' && ['admin', 'kasir'].includes(currentUser?.role)) ? (<button onClick={() => setIsCartOpen(true)} className="relative p-2 text-amber-500 hover:bg-red-900/30 rounded-lg"><ShoppingCart size={24} />{cart.length > 0 && (<span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.reduce((sum, item) => sum + (item.qty || 0), 0)}</span>)}</button>) : <div className="w-10"></div>}
        </header>

        {/* TAB 1: POS */}
        {activeTab === 'pos' && ['admin', 'kasir'].includes(currentUser?.role) && (
          <div className="flex-1 flex h-full min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-4 md:p-6 pb-2 space-y-4 shrink-0 bg-[#1a1412]/60 backdrop-blur-sm"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/70" size={20} /><input type="text" placeholder="Cari kode sku / nama barang..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#261c19]/80 border border-amber-700/50 text-amber-50 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-red-500 focus:ring-1 transition-all placeholder:text-amber-500/50 backdrop-blur-md"/></div><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{displayCategories.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border backdrop-blur-md ${activeCategory === cat ? 'bg-red-800/90 border-red-500 text-white shadow-lg' : 'bg-[#2a1f1b]/70 border-amber-700/30 text-amber-100 hover:bg-[#30231f]/90'}`}><span className="text-lg">{getCatEmoji(cat)}</span> {cat}</button>))}</div></div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-0 bg-transparent"><div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-4 mt-2">{filteredProductsSafe.map(product => {const isOutOfStock = (product.stock || 0) <= 0; return (<div key={product.id} onClick={() => !isOutOfStock && addToCart(product)} className={`bg-[#261c19]/80 backdrop-blur-md border border-amber-700/30 rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-300 relative p-4 shadow-lg ${isOutOfStock ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:border-red-500/50 hover:bg-[#30231f]/90 group'}`}><div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{product.category || 'Lain-lain'}</span><span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isOutOfStock ? 'bg-red-900/80 text-red-200' : 'bg-amber-900/60 text-amber-200'}`}>Stok: {product.stock || 0}</span></div><h3 className={`font-semibold text-base leading-tight my-3 flex-1 text-amber-50 ${!isOutOfStock && 'group-hover:text-red-300'}`}>{product.name || 'Produk Tanpa Nama'}</h3><div className="flex items-end justify-between mt-auto border-t border-amber-900/30 pt-3"><span className="text-amber-300 font-bold text-lg">{formatRupiah(product.price)}</span>{!isOutOfStock && (<button className="w-8 h-8 rounded-full bg-red-900/60 text-red-200 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors"><Plus size={16} /></button>)}</div>{isOutOfStock && <div className="absolute inset-0 flex items-center justify-center bg-black/70 font-bold text-red-500 uppercase tracking-widest text-lg border-2 border-red-500 rounded-2xl backdrop-blur-sm">Habis</div>}</div>)})}</div></div>
            </div>
            {/* KERANJANG */}
            <div className={`fixed lg:static inset-y-0 right-0 z-50 w-full max-w-[380px] bg-[#221815]/95 backdrop-blur-xl border-l border-red-900/30 flex flex-col shadow-2xl transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} shrink-0`}><div className="p-4 border-b border-red-900/20 flex justify-between items-center bg-[#1d1411]/80 shrink-0"><div className="flex items-center gap-2"><ShoppingCart className="text-amber-500" size={20} /><h2 className="font-bold text-amber-50 tracking-wide">Struk Pembelian</h2></div><div className="flex gap-1"><button onClick={handleHoldBill} disabled={cart.length===0} className="p-2 text-amber-400 hover:text-emerald-400 disabled:opacity-30" title="Simpan Meja"><PauseCircle size={18} /></button><button onClick={clearCart} disabled={cart.length===0} className="p-2 text-amber-500 hover:text-red-400 disabled:opacity-30"><Trash2 size={18} /></button><button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 text-amber-500 hover:text-white"><X size={20} /></button></div></div><div className="flex-1 overflow-y-auto p-3 space-y-2">{cart.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-amber-100/30"><ShoppingCart size={40} /><p className="mt-2 text-sm">Belum ada item di-scan</p></div>) : (cart.map(item => (<div key={item.id} className="flex gap-3 bg-[#2a1f1b]/80 p-3 rounded-xl border border-amber-900/30 items-center"><div className="flex-1 min-w-0"><h4 className="font-semibold text-amber-50 text-sm truncate">{item.name}</h4><div className="text-amber-400 text-xs mt-1">{formatRupiah(item.price)}</div></div><div className="flex items-center bg-[#1d1411]/80 rounded-lg border border-amber-700/30 shrink-0 h-8"><button onClick={() => updateQty(item.id, -1)} className="w-8 h-full flex items-center justify-center text-amber-400 hover:text-red-400"><Minus size={14} /></button><span className="w-6 text-center text-sm font-bold text-amber-50">{item.qty || 0}</span><button onClick={() => updateQty(item.id, 1)} className="w-8 h-full flex items-center justify-center text-amber-400 hover:text-emerald-400"><Plus size={14} /></button></div></div>)))}</div><div className="bg-[#1d1411]/90 border-t border-red-900/30 p-4 shrink-0 space-y-3"><div className="flex gap-2"><input type="number" placeholder="Potongan Diskon (Rp)" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="flex-1 bg-[#1a1412] border border-amber-700/50 rounded-lg p-2 text-amber-50 text-xs focus:outline-none"/><button onClick={() => setTaxEnabled(!taxEnabled)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${taxEnabled ? 'bg-red-800 text-white border-red-500' : 'bg-[#1a1412] text-amber-500 border-amber-700/50'}`}>+ PPN 10%</button></div><div className="space-y-1"><div className="flex justify-between text-xs text-amber-500/80"><span>Subtotal Dasar</span><span>{formatRupiah(subtotal)}</span></div>{discount > 0 && <div className="flex justify-between text-xs text-emerald-400"><span>Diskon Manual</span><span>-{formatRupiah(discount)}</span></div>}{taxEnabled && <div className="flex justify-between text-xs text-red-400"><span>Pajak Transaksi 10%</span><span>+{formatRupiah(taxAmount)}</span></div>}<div className="pt-2 border-t border-amber-900/30 flex justify-between items-center"><span className="text-sm font-bold">Total Pembayaran</span><span className="text-xl font-black text-amber-300">{formatRupiah(grandTotal)}</span></div></div><button onClick={() => setCheckoutModalOpen(true)} disabled={cart.length === 0} className="w-full flex items-center justify-center gap-2 py-3 bg-red-800/90 text-amber-50 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg border border-red-600/50"><Banknote size={20} /> Checkout Enterprise</button></div></div>
          </div>
        )}

        {/* TAB 2: HOLD BILLS */}
        {activeTab === 'holdbills' && ['admin', 'kasir'].includes(currentUser?.role) && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/40 backdrop-blur-sm"><div className="max-w-5xl mx-auto"><h2 className="text-2xl font-bold text-amber-50 mb-6 flex items-center gap-3"><Clock className="text-amber-500"/> Manajemen Pesanan Meja</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{holdBills.length === 0 ? <p className="text-amber-500/50">Tidak ada antrean pesanan meja.</p> : holdBills.map(bill => (<div key={bill.id} className="bg-[#221815]/90 border border-amber-700/50 rounded-2xl p-5 shadow-lg relative"><h3 className="text-lg font-bold text-amber-100 mb-1">{bill.name || 'Tanpa Nama'}</h3><p className="text-xs text-amber-500/80 mb-3">{new Date(bill.timestamp || Date.now()).toLocaleTimeString('id-ID')} - Kasir: {bill.kasirName}</p><div className="space-y-1 mb-4 text-sm text-amber-50">{(bill.items || []).map(i => <div key={i.id} className="flex justify-between border-b border-amber-900/20 pb-1"><span>{i.qty}x</span> <span className="text-right">{i.name}</span></div>)}</div><button onClick={() => resumeHoldBill(bill)} className="w-full py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm flex justify-center items-center gap-2 border border-emerald-500/50"><PlayCircle size={16}/> Proses ke Kasir</button></div>))}</div></div></div>
        )}

        {/* TAB 3: CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/40 backdrop-blur-sm">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center gap-3 mb-6"><BookOpen className="text-red-500" size={28} /><h2 className="text-2xl font-bold text-amber-50">Buku Besar Piutang</h2></div>
              
              {/* Hanya Admin & Kasir yang bisa Input Piutang */}
              {['admin', 'kasir'].includes(currentUser?.role) && (
                <div className="bg-[#221815]/90 backdrop-blur-xl border border-amber-900/30 rounded-2xl p-6 shadow-2xl mb-6">
                  <h3 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2"><Plus size={20}/> Registrasi Mitra/Pelanggan</h3>
                  <form onSubmit={handleAddCustomer} className="flex flex-col sm:flex-row gap-3">
                    <input type="text" placeholder="Nama Entitas Pelanggan" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="flex-1 bg-[#1a1412]/80 border border-amber-700/50 rounded-xl p-3 text-amber-50 focus:border-red-500 focus:outline-none"/>
                    <input type="text" placeholder="Nomor Telepon" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="flex-1 bg-[#1a1412]/80 border border-amber-700/50 rounded-xl p-3 text-amber-50 focus:border-red-500 focus:outline-none"/>
                    <button type="submit" className="px-6 py-3 bg-red-800/90 border border-red-600/50 text-white rounded-xl font-bold whitespace-nowrap">Simpan Data</button>
                  </form>
                </div>
              )}

              <div className="bg-[#221815]/90 backdrop-blur-xl border border-amber-900/30 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-[#1d1411]/80 border-b border-red-900/30 text-amber-500 text-sm"><th className="p-4">Nama Pelanggan</th><th className="p-4">Kontak</th><th className="p-4 text-right">Saldo Piutang Aktif</th>{['admin', 'kasir'].includes(currentUser?.role) && <th className="p-4 text-center">Tindakan</th>}</tr></thead>
                  <tbody className="divide-y divide-amber-900/20">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-[#2a1f1b]/60 transition-colors">
                        <td className="p-4 font-bold text-amber-50">{c.name}</td><td className="p-4 text-sm text-amber-400">{c.phone || '-'}</td><td className="p-4 text-right font-bold text-red-400 text-lg">{formatRupiah(c.debt)}</td>
                        {['admin', 'kasir'].includes(currentUser?.role) && (<td className="p-4 text-center"><button onClick={() => {setDebtCustomer(c); setPayDebtModalOpen(true);}} disabled={(c.debt || 0) <= 0} className="px-4 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-30 border border-emerald-500/50">Lunasi Piutang</button></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/40 backdrop-blur-sm">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3"><Wallet className="text-red-500" size={28} /><h2 className="text-2xl font-bold text-amber-50">Jurnal Pengeluaran Operasional</h2></div>
                {['admin', 'kasir'].includes(currentUser?.role) && (<button onClick={() => setExpenseModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-800/90 border border-red-500/50 hover:bg-red-700 text-amber-50 rounded-lg font-semibold shadow-lg backdrop-blur-md"><Plus size={18} /> Entri Kas Keluar</button>)}
              </div>
              <div className="bg-[#221815]/90 backdrop-blur-xl border border-amber-900/30 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-[#1d1411]/80 border-b border-red-900/30 text-amber-500 text-sm"><th className="p-4">Timestamp</th><th className="p-4">Keterangan Jurnal</th><th className="p-4">Kategori Akun</th><th className="p-4 text-right">Nominal (Kredit)</th><th className="p-4">PIC / User</th></tr></thead>
                  <tbody className="divide-y divide-amber-900/20">
                    {expenses.map(e => (<tr key={e.id} className="hover:bg-[#2a1f1b]/60 transition-colors"><td className="p-4 text-xs text-amber-100">{new Date(e.timestamp).toLocaleString('id-ID')}</td><td className="p-4 font-bold text-amber-50">{e.description}</td><td className="p-4 text-sm text-amber-400">{e.category}</td><td className="p-4 text-right font-bold text-red-400">{formatRupiah(e.amount)}</td><td className="p-4 text-xs text-amber-500/80">{e.kasirName}</td></tr>))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INVENTORY */}
        {activeTab === 'inventory' && ['admin', 'owner'].includes(currentUser?.role) && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/40 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3"><Package className="text-red-500" size={28} /><h2 className="text-2xl font-bold text-amber-50">Master Data Inventaris</h2></div>
                {currentUser?.role === 'admin' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#2a1f1b]/80 border border-amber-700/50 hover:bg-[#30231f] text-amber-100 rounded-lg font-semibold"><Tags size={18} /> Master Kategori</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-red-800/90 border border-red-500/50 hover:bg-red-700 text-amber-50 rounded-lg font-semibold"><Plus size={18} /> Tambah SKU Baru</button>
                  </div>
                )}
              </div>

              <div className="bg-[#221815]/90 backdrop-blur-xl border border-amber-900/30 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-[#1d1411]/80 border-b border-red-900/30 text-amber-500 text-sm"><th className="p-4">SKU / Nama Barang</th><th className="p-4">Kategori Dasar</th><th className="p-4">Penetapan Harga (Modal/Jual)</th><th className="p-4 text-center">Stok Sistem</th>{currentUser?.role === 'admin' && <th className="p-4 text-center">Tindakan</th>}</tr></thead>
                    <tbody className="divide-y divide-amber-900/20">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-[#2a1f1b]/60 transition-colors">
                          <td className="p-4 font-bold text-amber-50">{p.name}</td><td className="p-4 text-sm text-amber-400">{p.category}</td><td className="p-4 text-sm"><div className="text-amber-500/80">HPP Avg: <span className="text-amber-200">{formatRupiah(p.cost)}</span></div><div className="text-amber-400">Harga Jual: <span className="font-bold text-amber-300">{formatRupiah(p.price)}</span></div></td><td className="p-4 text-center"><span className={`text-lg font-black ${p.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>{p.stock || 0}</span></td>
                          {currentUser?.role === 'admin' && (<td className="p-4 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => openUpdateStockModal(p)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-800/80 border border-emerald-500/50 hover:bg-emerald-700 text-emerald-50 rounded-lg text-xs font-bold"><RefreshCw size={14} /> Mutasi</button><button onClick={() => handleDeleteItem(p.id)} className="p-1.5 text-amber-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg"><Trash2 size={18} /></button></div></td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: STOCK LOGS */}
        {activeTab === 'stocklogs' && ['admin', 'owner'].includes(currentUser?.role) && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/40 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-3 mb-6"><div className="flex items-center gap-3"><ClipboardList className="text-red-500" size={28} /><h2 className="text-2xl font-bold text-amber-50">Buku Mutasi Stok (Audit Trail)</h2></div>
              <button onClick={() => downloadCSV(stockLogs.map(l => ({"Waktu": new Date(l.timestamp).toLocaleString('id-ID'), "Produk": l.productName, "Tipe": l.type, "Alasan": l.reason, "Perubahan Qty": l.qtyChange, "Stok Akhir": l.finalStock, "HPP": l.hpp, "User": l.user})), "Buku_Mutasi_Stok")} className="flex items-center gap-2 bg-[#2a1f1b] border border-amber-700/50 hover:bg-[#30231f] text-amber-300 px-4 py-2 rounded-xl text-sm font-bold transition"><Download size={16}/> Ekspor Excel</button>
              </div>
              <div className="bg-[#221815]/90 backdrop-blur-xl border border-amber-900/30 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead><tr className="bg-[#1d1411]/80 border-b border-red-900/30 text-amber-500"><th className="p-4">Waktu Mutasi</th><th className="p-4">SKU / Nama Barang</th><th className="p-4">Tipe</th><th className="p-4">Keterangan Mutasi</th><th className="p-4 text-center">QTY</th><th className="p-4 text-center">Sisa Stok Akhir</th><th className="p-4">HPP Avg Saat Ini</th><th className="p-4">User PIC</th></tr></thead>
                  <tbody className="divide-y divide-amber-900/20">
                    {stockLogs.slice(0, 100).map(log => (
                      <tr key={log.id} className="hover:bg-[#2a1f1b]/60 transition-colors"><td className="p-4 text-xs text-amber-100">{new Date(log.timestamp).toLocaleString('id-ID')}</td><td className="p-4 font-bold text-amber-50">{log.productName}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${log.type === 'IN' ? 'bg-emerald-900/80 text-emerald-300' : 'bg-red-900/80 text-red-300'}`}>{log.type}</span></td><td className="p-4 text-amber-300">{log.reason}</td><td className={`p-4 text-center font-black ${log.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>{log.qtyChange > 0 ? `+${log.qtyChange}` : log.qtyChange}</td><td className="p-4 text-center font-bold text-amber-100">{log.finalStock}</td><td className="p-4 text-amber-500">{formatRupiah(log.hpp)}</td><td className="p-4 text-xs text-amber-500/80">{log.user}</td></tr>
                    ))}
                    {stockLogs.length === 0 && (<tr><td colSpan="8" className="p-8 text-center text-amber-100/50">Belum ada riwayat pergerakan barang.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PENGGUNA */}
        {activeTab === 'users' && currentUser?.role === 'admin' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/40 backdrop-blur-sm"><div className="max-w-4xl mx-auto space-y-6"><div className="flex items-center gap-3 mb-6"><Users className="text-red-500" size={28} /><h2 className="text-2xl font-bold text-amber-50">Sistem Manajemen Pengguna</h2></div><div className="bg-[#221815]/90 border border-amber-900/30 rounded-2xl p-6 mb-6"><form onSubmit={handleAddKasir} className="flex flex-col sm:flex-row gap-3"><input type="text" placeholder="Buat ID Kasir Baru..." value={newKasirName} onChange={e => setNewKasirName(e.target.value)} className="flex-1 bg-[#1a1412] border border-amber-700/50 rounded-xl p-3 text-amber-50 focus:border-red-500"/><button type="submit" className="px-6 py-3 bg-red-800/90 text-white rounded-xl font-bold">Daftarkan Kredensial</button></form></div><div className="bg-[#221815]/90 border border-amber-900/30 rounded-2xl overflow-hidden"><table className="w-full text-left"><thead><tr className="bg-[#1d1411]/80 text-amber-500"><th className="p-4">Identitas User</th><th className="p-4">Role Akses</th><th className="p-4 text-center">Keamanan</th></tr></thead><tbody className="divide-y divide-amber-900/20">{users.map(u => (<tr key={u.id}><td className="p-4 font-bold text-amber-50">{u.name}</td><td className="p-4"><span className="px-3 py-1 bg-amber-900/80 text-amber-200 rounded-lg text-xs font-bold uppercase">{u.role}</span></td><td className="p-4 text-center flex justify-center gap-2"><button onClick={() => openPasswordModal(u)} className="p-2 bg-[#1d1411]/80 text-amber-400 hover:text-emerald-300 rounded-lg"><Key size={18}/></button>{u.role === 'kasir' && <button onClick={() => handleDeleteUser(u.id, u.name)} className="p-2 bg-[#1d1411]/80 text-red-400 hover:text-red-300 rounded-lg"><Trash2 size={18}/></button>}</td></tr>))}</tbody></table></div></div></div>
        )}

        {/* TAB 8: LAPORAN (REPORTING ENGINE) */}
        {activeTab === 'reports' && ['admin', 'owner'].includes(currentUser?.role) && (() => {
          
          // SISTEM FILTER LAPORAN WAKTU (Hari Ini, Bulan Ini, Tahun Ini)
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

          const totalExpense = filteredExp.reduce((s,e) => s + (e.amount || 0), 0);
          const totalSales = filteredTrx.filter(t => t.type !== 'PayDebt').reduce((s,t) => s + (t.total || 0), 0);
          const totalCostGoods = filteredTrx.filter(t => t.type !== 'PayDebt').reduce((s,t) => s + (t.totalCost || 0), 0);
          const grossProfit = totalSales - totalCostGoods;
          const realNetProfit = grossProfit - totalExpense;
          const totalPiutang = customers.reduce((s,c) => s + (c.debt || 0), 0);

          // FUNGSI EXPORT KE EXCEL/CSV
          const exportReportCSV = () => {
            const data = filteredTrx.map(t => ({
              "ID Transaksi": t.id,
              "Tanggal Transaksi": new Date(t.timestamp).toLocaleString('id-ID'),
              "Metode Pembayaran": t.paymentMethod,
              "Tipe": t.type,
              "Pelanggan": t.customerName || "-",
              "Total Nilai Transaksi": t.total || 0,
              "HPP (Modal Produk)": t.totalCost || 0,
              "Laba Kotor": (t.total || 0) - (t.totalCost || 0),
              "PIC / Kasir": t.kasirName
            }));
            downloadCSV(data, `Laporan_Keuangan_Enterprise_${reportPeriod}_${new Date().toISOString().split('T')[0]}`);
          };

          // INJEKSI KONTEN PRINT A4
          if (printType === 'report') {
            const printElement = document.getElementById('printable-report');
            if (printElement) {
              printElement.innerHTML = `
                <div style="font-family: sans-serif; color: #000; padding: 20px;">
                  <h1 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">LAPORAN LABA RUGI ENTERPRISE</h1>
                  <p style="text-align: center; margin-bottom: 30px;">Periode: ${reportPeriod.replace('_', ' ').toUpperCase()}</p>
                  
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Pendapatan Kotor (Gross Sales)</td>
                      <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatRupiah(totalSales)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">Laba Kotor (Gross Profit)</td>
                      <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatRupiah(grossProfit)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd; color: red;">Biaya Operasional (OpEx)</td>
                      <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: red;">-${formatRupiah(totalExpense)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border: 2px solid #000; font-weight: bold; font-size: 16px;">LABA BERSIH (EBITDA)</td>
                      <td style="padding: 10px; border: 2px solid #000; text-align: right; font-weight: bold; font-size: 16px;">${formatRupiah(realNetProfit)}</td>
                    </tr>
                  </table>
                  
                  <h3>Ringkasan Transaksi (${filteredTrx.length} TRX)</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px;">
                    <thead>
                      <tr style="background: #eee;">
                        <th style="border: 1px solid #aaa; padding: 8px; text-align: left;">Tanggal</th>
                        <th style="border: 1px solid #aaa; padding: 8px; text-align: left;">ID / Tipe</th>
                        <th style="border: 1px solid #aaa; padding: 8px; text-align: left;">Metode</th>
                        <th style="border: 1px solid #aaa; padding: 8px; text-align: right;">Total Transaksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${filteredTrx.map(t => `
                        <tr>
                          <td style="border: 1px solid #aaa; padding: 6px;">${new Date(t.timestamp).toLocaleDateString('id-ID')}</td>
                          <td style="border: 1px solid #aaa; padding: 6px;">${t.id}</td>
                          <td style="border: 1px solid #aaa; padding: 6px;">${t.paymentMethod}</td>
                          <td style="border: 1px solid #aaa; padding: 6px; text-align: right;">${formatRupiah(t.total)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `;
            }
          }

          return (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/40 backdrop-blur-sm">
              <div className="max-w-6xl mx-auto space-y-6">
                
                {/* HEADER & CONTROLS */}
                <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3"><BarChart3 className="text-red-500" size={28} /><h2 className="text-2xl font-bold text-amber-50">Laporan Laba Rugi Eksekutif</h2></div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="bg-[#1a1412] p-1 border border-amber-900/50 rounded-xl flex items-center">
                      {[ {id: 'hari_ini', label: 'Hari Ini'}, {id: 'bulan_ini', label: 'Bulan Ini'}, {id: 'tahun_ini', label: 'Tahun Ini'}, {id: 'semua', label: 'Semua'} ].map(p => (
                        <button key={p.id} onClick={() => setReportPeriod(p.id)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${reportPeriod === p.id ? 'bg-red-900/80 text-white shadow-lg' : 'text-amber-500/70 hover:text-amber-300'}`}>{p.label}</button>
                      ))}
                    </div>
                    <button onClick={exportReportCSV} className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-900/60 border border-emerald-700/50 hover:bg-emerald-800 text-emerald-300 rounded-xl font-bold text-sm shadow-lg transition"><Download size={16}/> Export Data (CSV)</button>
                    <button onClick={handlePrintReport} className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-900/60 border border-amber-700/50 hover:bg-amber-800 text-amber-300 rounded-xl font-bold text-sm shadow-lg transition"><Printer size={16}/> Cetak Kertas (A4)</button>
                  </div>
                </div>
                
                {/* METRICS */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-[#221815]/90 border border-amber-700/30 p-5 rounded-2xl"><p className="text-xs text-amber-500/80 uppercase">Pendapatan Kotor</p><p className="text-2xl font-bold text-amber-100">{formatRupiah(totalSales)}</p></div>
                  <div className="bg-[#221815]/90 border border-amber-700/30 p-5 rounded-2xl"><p className="text-xs text-amber-500/80 uppercase">Laba Kotor (Gross Profit)</p><p className="text-2xl font-bold text-blue-300">{formatRupiah(grossProfit)}</p></div>
                  <div className="bg-[#221815]/90 border border-red-900/50 p-5 rounded-2xl"><p className="text-xs text-red-400/80 uppercase">Biaya Operasional</p><p className="text-2xl font-bold text-red-400">-{formatRupiah(totalExpense)}</p></div>
                  <div className="bg-[#221815]/90 border border-emerald-700/50 p-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)]"><p className="text-xs text-emerald-400/80 uppercase">Laba Bersih (EBITDA)</p><p className="text-3xl font-black text-emerald-400">{formatRupiah(realNetProfit)}</p></div>
                </div>
                
                {/* LEDGER TRANSAKSI */}
                <div className="bg-[#221815]/90 border border-amber-900/30 rounded-2xl p-5 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-amber-900/30 pb-3 mb-4"><h3 className="text-lg font-bold text-amber-50 flex items-center gap-2"><Calendar size={20} /> Ledger Transaksi ({filteredTrx.length} TRX)</h3><div className="text-sm font-bold text-red-400 bg-red-900/30 px-3 py-1 rounded-lg">Total Piutang Global Berjalan: {formatRupiah(totalPiutang)}</div></div>
                  <div className="space-y-3">
                    {filteredTrx.length === 0 && <p className="text-center text-amber-100/30 py-8">Tidak ada transaksi pada periode ini.</p>}
                    {filteredTrx.slice(0, 150).map(trx => (
                      <div key={trx.id} className="flex justify-between p-4 bg-[#2a1f1b]/60 rounded-xl border border-amber-700/30 hover:bg-[#30231f] transition-colors">
                        <div>
                          <div className="font-mono text-xs text-amber-400">{trx.id} • {new Date(trx.timestamp).toLocaleString('id-ID')}</div>
                          <div className="text-sm text-amber-50 mt-1">{trx.type === 'PayDebt' ? `Pelunasan Piutang: ${trx.customerName}` : (trx.items || []).map(i => `${i.name}(${i.qty})`).join(', ')}</div>
                        </div>
                        <div className="text-right flex flex-col justify-center">
                          <div className="text-lg font-bold text-amber-200">{formatRupiah(trx.total)}</div>
                          <div className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block self-end mt-1 uppercase tracking-wider bg-[#1a1412] text-amber-500 border border-amber-700/50">{trx.paymentMethod}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

      </main>

      {/* ========================================================= */}
      {/* MODALS GLOBAL */}
      {/* ========================================================= */}
      
      {/* CUSTOM CONFIRM DIALOG */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#221815] border border-red-500/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
            <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-bold text-amber-50 mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-amber-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDialog({isOpen: false})} className="flex-1 p-3 rounded-xl border border-amber-700/50 text-amber-400 hover:bg-[#1d1411] font-semibold">Batal</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({isOpen: false}); }} className="flex-1 p-3 rounded-xl bg-red-800/90 text-white font-bold hover:bg-red-700">Ya, Lanjutkan</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM PROMPT DIALOG */}
      {promptDialog.isOpen && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#221815] border border-amber-500/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#1d1411] border-b border-amber-900/30"><h3 className="text-lg font-bold text-amber-50">{promptDialog.title}</h3></div>
            <div className="p-5">
              <p className="text-sm text-amber-400 mb-3">{promptDialog.message}</p>
              <input autoFocus type="text" value={promptDialog.value} onChange={(e) => setPromptDialog({...promptDialog, value: e.target.value})} placeholder={promptDialog.placeholder} className="w-full bg-[#1a1412] border border-amber-700/50 rounded-xl p-3 text-amber-50 focus:border-red-500 focus:outline-none mb-4"/>
              <div className="flex gap-2">
                <button onClick={() => setPromptDialog({isOpen: false})} className="flex-1 p-3 rounded-xl border border-amber-700/50 text-amber-400 hover:bg-[#1d1411] font-semibold">Batal</button>
                <button onClick={() => { promptDialog.onConfirm(promptDialog.value); setPromptDialog({isOpen: false}); }} className="flex-1 p-3 rounded-xl bg-red-800/90 text-white font-bold hover:bg-red-700">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#221815] border border-red-600/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#1d1411] border-b border-red-900/30 flex justify-between items-center"><h3 className="text-lg font-bold text-amber-50">Sistem Pembayaran</h3><button onClick={() => setCheckoutModalOpen(false)} className="text-amber-500 hover:text-white"><X size={20}/></button></div>
            <form onSubmit={processCheckout} className="p-5 space-y-4">
              <div className="text-center bg-[#1a1412] border border-amber-700/30 p-4 rounded-xl"><p className="text-sm text-amber-500/80 uppercase">Tagihan Akhir</p><p className="text-3xl font-black text-amber-300 font-mono">{formatRupiah(grandTotal)}</p></div>
              <div><label className="block text-xs font-semibold text-amber-400 mb-1">Instrumen Pembayaran</label><div className="flex gap-2">{['Tunai', 'QRIS', 'Tempo'].map(m => <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`flex-1 py-2 rounded-lg font-bold text-sm border ${paymentMethod === m ? 'bg-red-800 text-white border-red-500' : 'bg-[#1a1412] text-amber-500 border-amber-700/50 hover:bg-[#30231f]'}`}>{m}</button>)}</div></div>
              {paymentMethod === 'Tempo' && (<div className="bg-red-900/20 border border-red-700/30 p-3 rounded-xl"><label className="block text-xs font-semibold text-red-400 mb-1">Bebankan Ke Entitas Pelanggan:</label><select required value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="w-full bg-[#1a1412] border border-red-700/50 rounded-lg p-2.5 text-amber-50 text-sm focus:outline-none"><option value="">-- Pilih Relasi --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} (Hutang: {formatRupiah(c.debt)})</option>)}</select></div>)}
              {paymentMethod === 'Tunai' && (<div><label className="block text-xs font-semibold text-amber-400 mb-1">Kas Diterima (Rp)</label><input required type="number" min={grandTotal} value={amountTendered} onChange={e => setAmountTendered(e.target.value)} className="w-full bg-[#1a1412] border border-emerald-700/50 rounded-lg p-3 text-emerald-400 text-lg font-bold text-center focus:outline-none"/>{Number(amountTendered) >= grandTotal && <p className="text-center text-sm font-bold text-emerald-400 mt-2">Uang Kembali: {formatRupiah(Number(amountTendered) - grandTotal)}</p>}</div>)}
              <button type="submit" className="w-full p-3 rounded-xl bg-emerald-800/90 text-white hover:bg-emerald-700 font-bold text-lg mt-4">Eksekusi Transaksi</button>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STOK & HPP MODAL */}
      {isStockModalOpen && stockUpdateItem && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#221815] border border-emerald-600/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#1d1411] border-b border-emerald-900/30 flex justify-between items-center"><h3 className="text-lg font-bold text-amber-50 flex items-center gap-2"><RefreshCw size={20}/> Mutasi Inventaris</h3><button onClick={() => setIsStockModalOpen(false)} className="text-amber-500 hover:text-white"><X size={20}/></button></div>
            <form onSubmit={handleProcessUpdateStock} className="p-5 space-y-4">
              <div className="text-center mb-2"><p className="text-sm text-amber-400">SKU: <strong className="text-amber-100 block text-lg">{stockUpdateItem.name}</strong></p><p className="text-xs text-emerald-400 font-mono bg-emerald-900/20 py-1 rounded inline-block px-3 mt-1">Stok Tercatat: {stockUpdateItem.stock || 0} | HPP Lama: {formatRupiah(stockUpdateItem.cost)}</p></div>
              <div><label className="block text-xs font-semibold text-amber-500 mb-1 text-center">Tipe Mutasi</label><select value={stockUpdateReason} onChange={e => setStockUpdateReason(e.target.value)} className="w-full bg-[#1a1412] border border-amber-700/50 rounded-lg p-2.5 text-amber-50 text-sm focus:outline-none mb-3"><option value="Restock Barang Masuk">Restock (Barang Masuk)</option><option value="Koreksi Barang Rusak/Expired">Koreksi Rusak/Expired (Pengurangan)</option><option value="Audit Stok Opname">Audit Stok Opname</option></select><label className="block text-xs font-semibold text-amber-500 mb-1 text-center">Volume / Jumlah Barang</label><input autoFocus required type="number" placeholder="Contoh: 10 atau -5" value={stockUpdateAmount} onChange={e => setStockUpdateAmount(e.target.value)} className="w-full bg-[#1a1412] border border-emerald-700/50 rounded-xl p-3 text-emerald-400 font-bold text-center focus:outline-none text-lg"/></div>
              {Number(stockUpdateAmount) > 0 && stockUpdateReason === 'Restock Barang Masuk' && (<div className="bg-emerald-900/10 border border-emerald-900/30 p-3 rounded-xl"><label className="block text-xs font-semibold text-emerald-400 mb-2 text-center">Input Harga Beli Baru (Satuan) Untuk HPP Average</label><input required type="number" min="0" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} className="w-full bg-[#1a1412] border border-emerald-700/50 rounded-xl p-3 text-emerald-400 font-bold text-center focus:outline-none"/></div>)}
              <button type="submit" className="w-full p-3 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold mt-2">Simpan Pembukuan Stok</button>
            </form>
          </div>
        </div>
      )}

      {/* TAMBAH MENU MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#221815] border border-red-600/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#1d1411] border-b border-red-900/30 flex justify-between items-center"><h3 className="text-lg font-bold text-amber-50">Registrasi Master Item</h3><button onClick={() => setIsAddModalOpen(false)} className="text-amber-500 hover:text-white"><X size={20}/></button></div>
            <form onSubmit={handleAddProduct} className="p-5 space-y-4">
              <div><label className="block text-xs text-amber-400 mb-1">Nama SKU/Item</label><input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-[#1a1412] border border-amber-700/50 rounded-lg p-2.5 text-amber-50 text-sm focus:outline-none"/></div><div><label className="block text-xs text-amber-400 mb-1">Kategori Induk</label><select required value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full bg-[#1a1412] border border-amber-700/50 rounded-lg p-2.5 text-amber-50 text-sm focus:outline-none"><option value="">-- Pilih --</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-amber-400 mb-1">HPP Awal (Rp)</label><input required type="number" min="0" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} className="w-full bg-[#1a1412] border border-amber-700/50 rounded-lg p-2.5 text-amber-50 text-sm focus:outline-none"/></div><div><label className="block text-xs text-amber-400 mb-1">Harga Jual (Rp)</label><input required type="number" min="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full bg-[#1a1412] border border-amber-700/50 rounded-lg p-2.5 text-amber-50 text-sm focus:outline-none"/></div></div><div><label className="block text-xs text-amber-400 mb-1">Inisiasi Volume Stok</label><input required type="number" min="0" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} className="w-full bg-[#1a1412] border border-amber-700/50 rounded-lg p-2.5 text-amber-50 text-sm focus:outline-none"/></div><button type="submit" className="w-full p-3 rounded-xl bg-red-800/90 text-white font-bold text-sm mt-2">Publish ke Server</button>
            </form>
          </div>
        </div>
      )}

      {/* KELOLA KATEGORI */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#221815] border border-red-600/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#1d1411] border-b border-red-900/30 flex justify-between items-center"><h3 className="text-lg font-bold text-amber-50 flex items-center gap-2"><Tags size={20}/> Kelola Kategori</h3><button onClick={() => setIsCategoryModalOpen(false)} className="text-amber-500 hover:text-white"><X size={20}/></button></div>
            <div className="p-5 space-y-4">
              <form onSubmit={handleAddCategory} className="flex gap-2"><input required autoFocus type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nama kategori baru..." className="flex-1 bg-[#1a1412] border border-amber-700/50 rounded-lg p-2.5 text-amber-50 text-sm focus:outline-none focus:border-red-500"/><button type="submit" className="px-4 py-2 bg-red-800/90 text-white rounded-lg font-bold text-sm shadow-lg">Tambah</button></form>
              <div className="bg-[#1a1412] border border-amber-900/30 rounded-xl overflow-hidden max-h-60 overflow-y-auto"><ul className="divide-y divide-amber-900/20">{categories.map(cat => (<li key={cat} className="p-3 flex justify-between items-center hover:bg-[#2a1f1b]/60 transition-colors"><span className="text-amber-100 font-medium text-sm">{cat}</span><button onClick={() => handleRemoveCategory(cat)} className="p-1.5 text-amber-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button></li>))}{categories.length === 0 && <li className="p-4 text-center text-sm text-amber-500/50">Belum ada kategori kustom.</li>}</ul></div>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT MODAL */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#221815] border-2 border-amber-500/80 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)]">
            <div className="p-4 bg-[#1d1411] border-b border-amber-900/50 text-center"><h3 className="text-xl font-black text-amber-400 uppercase tracking-widest">{shiftAction === 'open' ? 'BUKA LACI KASIR' : 'TUTUP LACI KASIR'}</h3></div>
            <form onSubmit={handleProcessShift} className="p-6 space-y-5">
              <p className="text-sm text-amber-500/80 text-center">{shiftAction === 'open' ? `Halo ${currentUser?.name || 'Kasir'}! Masukkan uang modal laci Anda untuk mulai shift.` : 'Masukkan total uang fisik yang ada di dalam laci kasir saat ini.'}</p>
              <div><label className="block text-xs font-semibold text-amber-500 mb-2 text-center">{shiftAction === 'open' ? 'MODAL AWAL SHIFT (Rp)' : 'TOTAL UANG FISIK (Rp)'}</label><input required autoFocus type="number" min="0" placeholder="Rp 0" value={shiftCashInput} onChange={e => setShiftCashInput(e.target.value)} className="w-full bg-[#1a1412] border-2 border-amber-700/50 rounded-xl p-4 text-amber-50 text-2xl font-bold text-center focus:border-amber-400 focus:outline-none"/></div>
              <button type="submit" className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border border-amber-500/50 text-white font-black transition-all text-lg shadow-xl uppercase tracking-widest">{shiftAction === 'open' ? 'Mulai Bekerja' : 'Laporkan & Tutup'}</button>
            </form>
          </div>
        </div>
      )}

      {/* TRANSAKSI SUKSES / NOTA */}
      {lastTransaction && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#221815] border border-emerald-600/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
            <CheckCircle className="text-emerald-400 mx-auto mb-4" size={56} />
            <h3 className="text-xl font-bold text-amber-50 mb-2">Transaksi Valid!</h3>
            <p className="text-amber-400 text-sm mb-2 font-mono">{lastTransaction.id}</p>
            <div className="bg-[#1d1411] border border-amber-700/30 rounded-xl p-4 my-4"><p className="text-xs text-amber-500 uppercase">Debet Transaksi</p><p className="text-2xl font-black text-amber-300 font-mono">{formatRupiah(lastTransaction.total)}</p>{lastTransaction.paymentMethod === 'Tempo' && <p className="text-xs text-red-400 font-bold mt-2 bg-red-900/30 py-1 rounded">Dicatat di Buku Besar Piutang</p>}</div>
            <div className="flex flex-col gap-3"><button onClick={printReceipt} disabled={isPrinting} className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-800/90 text-emerald-50 hover:bg-emerald-700 font-bold shadow-lg"><Printer size={18} /> Generate Struk Thermal</button><button onClick={() => setLastTransaction(null)} className="w-full p-3.5 rounded-xl border border-amber-700/50 text-amber-400 hover:bg-[#1d1411] font-semibold">Tutup</button></div>
          </div>
        </div>
      )}

      {/* ALERT GLOBAL */}
      {alertMsg && (
        <div className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#221815] border border-amber-500/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center"><h3 className="text-lg font-bold text-amber-50 mb-4 whitespace-pre-wrap">{alertMsg}</h3><button onClick={() => setAlertMsg("")} className="w-full p-3 rounded-xl bg-red-800/90 text-white font-bold hover:bg-red-700">Tutup Notifikasi</button></div>
        </div>
      )}
      
    </div>
  );
}


