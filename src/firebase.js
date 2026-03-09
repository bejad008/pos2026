// === MESIN PENGHUBUNG DATABASE (FIREBASE) ===
// File ini akan mengambil rahasia dari file .env secara otomatis
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor Auth dan Database agar bisa dipakai di App.jsx
export const auth = getAuth(app);
export const db = getFirestore(app);

// ID Toko Khusus
export const APP_ID = import.meta.env.VITE_APP_SCOPE_ID || 'gg-pasoryan-v2';

// Helper pemanggil koleksi database standar kita
export const getColRef = (colName) => collection(db, 'artifacts', APP_ID, 'public', 'data', colName);
