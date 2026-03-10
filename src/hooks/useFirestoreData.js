/**
 * useFirestoreData — Centralized Firebase real-time listeners
 *
 * FIX: Memory leak bug — inner onSnapshot listeners sekarang di-cleanup
 * dengan benar saat komponen unmount DAN saat auth re-fires.
 *
 * FIX: onAuthStateChanged bisa fire >1x — listener lama sekarang
 * di-unsubscribe sebelum listener baru didaftarkan.
 */
import { useEffect, useState, useRef } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, getColRef } from '../firebase';

const INITIAL = {
  users:           [],
  products:        [],
  categories:      [],
  transactions:    [],
  customers:       [],
  expenses:        [],
  shifts:          [],
  holdBills:       [],
  stockLogs:       [],
  currentThemeKey: 'gelap',
};

export function useFirestoreData() {
  const [isDbReady,    setIsDbReady]    = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [data,         setData]         = useState(INITIAL);
  const innerUnsubsRef                  = useRef([]);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error('[Auth]', err));

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      setFirebaseUser(user);

      // ✅ FIX: Cleanup any previously registered snapshot listeners
      // before registering new ones. Prevents duplicate listeners
      // when onAuthStateChanged fires more than once (token refresh, etc.)
      innerUnsubsRef.current.forEach(unsub => {
        try { unsub(); } catch {}
      });
      innerUnsubsRef.current = [];

      // ── Users ──
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

      // ── Theme ──
      const themeUnsub = onSnapshot(doc(getColRef('settings'), 'theme'), (snap) => {
        if (!snap.exists()) {
          setDoc(doc(getColRef('settings'), 'theme'), { activeTheme: 'gelap' });
        } else {
          setData(prev => ({ ...prev, currentThemeKey: snap.data().activeTheme || 'gelap' }));
        }
      });

      // ── Products ──
      const prodUnsub = onSnapshot(getColRef('products'), (snap) => {
        setData(prev => ({
          ...prev,
          products: snap.docs.map(d => d.data()).sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          ),
        }));
      });

      // ── Categories ──
      const catUnsub = onSnapshot(doc(getColRef('settings'), 'categories'), (snap) => {
        if (!snap.exists()) {
          setDoc(doc(getColRef('settings'), 'categories'), {
            list: ['Makanan', 'Minuman', 'Cemilan'],
          });
        } else {
          setData(prev => ({ ...prev, categories: snap.data().list || [] }));
        }
      });

      // ── Transactions ──
      const trxUnsub = onSnapshot(getColRef('transactions'), (snap) => {
        setData(prev => ({
          ...prev,
          transactions: snap.docs.map(d => d.data()).sort((a, b) =>
            (b.timestamp || 0) - (a.timestamp || 0)
          ),
        }));
      });

      // ── Customers ──
      const custUnsub = onSnapshot(getColRef('customers'), (snap) => {
        setData(prev => ({
          ...prev,
          customers: snap.docs.map(d => d.data()).sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          ),
        }));
      });

      // ── Expenses ──
      const expUnsub = onSnapshot(getColRef('expenses'), (snap) => {
        setData(prev => ({
          ...prev,
          expenses: snap.docs.map(d => d.data()).sort((a, b) =>
            (b.timestamp || 0) - (a.timestamp || 0)
          ),
        }));
      });

      // ── Shifts ──
      const shiftUnsub = onSnapshot(getColRef('shifts'), (snap) => {
        setData(prev => ({
          ...prev,
          shifts: snap.docs.map(d => d.data()).sort((a, b) =>
            (b.startTime || 0) - (a.startTime || 0)
          ),
        }));
      });

      // ── Hold Bills ──
      const holdUnsub = onSnapshot(getColRef('holdBills'), (snap) => {
        setData(prev => ({
          ...prev,
          holdBills: snap.docs.map(d => d.data()).sort((a, b) =>
            (b.timestamp || 0) - (a.timestamp || 0)
          ),
        }));
      });

      // ── Stock Logs ──
      const logUnsub = onSnapshot(getColRef('stockLogs'), (snap) => {
        setData(prev => ({
          ...prev,
          stockLogs: snap.docs.map(d => d.data()).sort((a, b) =>
            (b.timestamp || 0) - (a.timestamp || 0)
          ),
        }));
      });

      // ✅ FIX: Store all inner unsubs in ref for proper cleanup
      innerUnsubsRef.current = [
        userUnsub, themeUnsub, prodUnsub, catUnsub,
        trxUnsub, custUnsub, expUnsub, shiftUnsub,
        holdUnsub, logUnsub,
      ];

      setIsDbReady(true);
    });

    // ✅ FIX: Cleanup both auth listener AND all snapshot listeners
    return () => {
      unsubAuth();
      innerUnsubsRef.current.forEach(unsub => {
        try { unsub(); } catch {}
      });
      innerUnsubsRef.current = [];
    };
  }, []);

  return { isDbReady, firebaseUser, data };
}
