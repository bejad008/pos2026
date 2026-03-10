# GG Pasoryan Enterprise POS v2.0

## 🖨️ Sistem Print Engine

Mendukung 5 metode cetak untuk semua platform:

| Metode | Platform | Keterangan |
|--------|----------|------------|
| **Browser Print** | SEMUA | USB/WiFi via dialog OS. Universal fallback. |
| **Web Bluetooth** | Chrome/Edge Android & Desktop | BLE langsung ke thermal printer. |
| **RawBT Intent** | Android APK/WebView | Butuh app RawBT dari Play Store. |
| **Network/WiFi** | SEMUA | ESC/POS langsung ke IP printer LAN. |
| **Web Serial** | Chrome 89+ Desktop | USB tanpa driver. |

### Untuk Android APK (WebToAPK / WebViewGold)
- Gunakan metode **RawBT** → Install RawBT di Android
- Atau metode **Browser Print** → muncul dialog print sistem Android

### Untuk EXE (WebToEXE / ExeOutput / Electron)
- Gunakan metode **Browser Print** → muncul dialog print Chromium
- Atau **Web Serial** untuk USB printer tanpa driver

## 🛠️ Bug Fixes v2.0
- ✅ Memory leak: semua onSnapshot listeners sekarang di-cleanup dengan benar
- ✅ printType prop tidak diteruskan ke DashboardPanels (cetak laporan tidak berfungsi)
- ✅ window.onafterprint override → diganti addEventListener dengan {once:true}
- ✅ stockLogs ID duplikat di handleAddProduct
- ✅ Kalkulasi cart tidak dibungkus useMemo

## 📁 Struktur
```
src/
├── App.jsx                    ← Main app (refactored, ~500 baris)
├── firebase.js                ← DB config
├── utils.js                   ← Helper functions
├── themes.js                  ← Theme system
├── index.css                  ← Global + Print CSS
├── main.jsx                   ← Entry point
├── hooks/
│   ├── useFirestoreData.js    ← Real-time listeners (memory leak fixed)
│   └── useCart.js             ← Cart logic + useMemo
├── printing/
│   ├── PrintEngine.js         ← Core print system (5 metode)
│   ├── PrintSettings.jsx      ← UI konfigurasi printer
│   └── PrintableDocuments.jsx ← HTML templates untuk browser print
└── components/
    ├── POSScreen.jsx           ← Layar kasir
    ├── DashboardPanels.jsx     ← Semua panel dashboard
    └── GlobalModals.jsx        ← Semua modal global
```

## 🚀 Install & Run
```bash
npm install
npm run dev
```
