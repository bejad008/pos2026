/**
 * useFirestoreData — Centralized Firebase real-time listeners
 *
 * FIX: Memory leak bug — sebelumnya inner onSnapshot listeners
 * tidak pernah di-unsubscribe karena return cleanup di dalam
 * onAuthStateChanged callback tidak dieksekusi oleh React.
 *
 * FIX: Semua onSnapshot di-track dalam ref dan di-cleanup
 * dengan benar saat komponen unmount.
 */
import { useEffect, useState, useRef } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, getColRef } from '../firebase';

const INITIAL = {
  users:        [],
  products:     [],
  categories:   [],
  transactions: [],
  customers:    [],
  expenses:     [],
  shifts:       [],
  holdBills:    [],
  stockLogs:    [],
  currentThemeKey: 'gelap',
};

export function useFirestoreData() {
  const [isDbReady, setIsDbReady]       = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [data, setData]                 = useState(INITIAL);
  const innerUnsubsRef                  = useRef([]);

  useEffect(() => {
    // Sign in anonymously to get Firebase access
    signInAnonymously(auth).catch(err => console.error('[Auth]', err));

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      setFirebaseUser(user);

      // Seed default users if DB is fresh
      const userUnsub = onSnapshot(getColRef('users'), (snap) => {
        if (snap.empty) {
          setDoc(doc(getColRef('users'), 'admin'), {
            id: 'admin', role: 'admin', name: 'Administrator', password: '008',
          });
          setDoc(doc(getColRef('users'), 'owner'), {
            id: 'owner', role: 'owner', name: 'Bos Besar', password: '008',
          });
        } else {
          setData(prev => ({ ...prev, users: snap.docs.map(d => d.data()) }));
        }
      });

      // Theme setting
      const themeUnsub = onSnapshot(doc(getColRef('settings'), 'theme'), (snap) => {
        if (!snap.exists()) {
          setDoc(doc(getColRef('settings'), 'theme'), { activeTheme: 'gelap' });
        } else {
          setData(prev => ({ ...prev, currentThemeKey: snap.data().activeTheme || 'gelap' }));
        }
      });

      // Products
      const prodUnsub = onSnapshot(getColRef('products'), (snap) => {
        setData(prev => ({
          ...prev,
          products: snap.docs.map(d => d.data()).sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          ),
        }));
      });

      // Categories
      const catUnsub = onSnapshot(doc(getColRef('settings'), 'categories'), (snap) => {
        if (!snap.exists()) {
          setDoc(doc(getColRef('settings'), 'categories'), {
            list: ['Makanan', 'Minuman', 'Cemilan'],
          });
        } else {
          setData(prev => ({ ...prev, categories: snap.data().list || [] }));
        }
      });

      // Transactions
      const trxUnsub = onSnapshot(getColRef('transactions'), (snap) => {
        setData(prev => ({
          ...prev,
          transactions: snap.docs.map(d => d.data()).sort((a, b) =>
            (b.timestamp || 0) - (a.timestamp || 0)
          ),
        }));
      });

      // Customers
      const custUnsub = onSnapshot(getColRef('customers'), (snap) => {
        setData(prev => ({
          ...prev,
          customers: snap.docs.map(d => d.data()).sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          ),
        }));
      });

      // Expenses
      const expUnsub = onSnapshot(getColRef('expenses'), (snap) => {
        setData(prev => ({
          ...prev,
          expenses: snap.docs.map(d => d.data()).sort((a, b) =>
            (b.timestamp || 0) - (a.timestamp || 0)
          ),
        }));
      });

      // Shifts
      const shiftUnsub = onSnapshot(getColRef('shifts'), (snap) => {
        setData(prev => ({
          ...prev,
          shifts: snap.docs.map(d => d.data()).sort((a, b) =>
            (b.startTime || 0) - (a.startTime || 0)
          ),
        }));
      });

      // Hold Bills
      const holdUnsub = onSnapshot(getColRef('holdBills'), (snap) => {
        setData(prev => ({
          ...prev,
          holdBills: snap.docs.map(d => d.data()).sort((a, b) =>
            (b.timestamp || 0) - (a.timestamp || 0)
          ),
        }));
      });

      // Stock Logs
      const logUnsub = onSnapshot(getColRef('stockLogs'), (snap) => {
        setData(prev => ({
          ...prev,
          stockLogs: snap.docs.map(d => d.data()).sort((a, b) =>
            (b.timestamp || 0) - (a.timestamp || 0)
          ),
        }));
      });

      // ✅ FIX: Store ALL inner unsubs so they can be cleaned up
      innerUnsubsRef.current = [
        userUnsub, themeUnsub, prodUnsub, catUnsub,
        trxUnsub, custUnsub, expUnsub, shiftUnsub,
        holdUnsub, logUnsub,
      ];

      setIsDbReady(true);
    });

    // ✅ FIX: Proper cleanup — both auth AND all snapshot listeners
    return () => {
      unsubAuth();
      innerUnsubsRef.current.forEach(unsub => {
        try { unsub(); } catch {}
      });
      innerUnsubsRef.current = [];
    };
  }, []); // Run once on mount

  return { isDbReady, firebaseUser, data };
}
