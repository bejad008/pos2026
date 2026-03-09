/**
 * ============================================================
 * GG PASORYAN ENTERPRISE PRINT ENGINE v4.0
 * ============================================================
 *
 * Mendukung 5 metode cetak:
 *  1. Browser Print   → USB / WiFi via driver OS (SEMUA platform)
 *  2. Web Bluetooth   → BLE langsung ke thermal printer (Chrome/Edge)
 *  3. RawBT Intent    → Android APK / WebView (via app RawBT)
 *  4. Network / WiFi  → ESC/POS over HTTP ke IP printer
 *  5. Android Bridge  → Capacitor / custom WebView Java bridge
 *
 * Auto-detect platform: Browser | Android WebView | Electron EXE
 * ============================================================
 */

// ─────────────────────────────────────────────
// ESC/POS COMMAND TABLE
// ─────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;
const HT  = 0x09;

export const CMD = {
  INIT:            [ESC, 0x40],
  ALIGN_LEFT:      [ESC, 0x61, 0x00],
  ALIGN_CENTER:    [ESC, 0x61, 0x01],
  ALIGN_RIGHT:     [ESC, 0x61, 0x02],
  BOLD_ON:         [ESC, 0x45, 0x01],
  BOLD_OFF:        [ESC, 0x45, 0x00],
  UNDERLINE_ON:    [ESC, 0x2d, 0x01],
  UNDERLINE_OFF:   [ESC, 0x2d, 0x00],
  SIZE_NORMAL:     [ESC, 0x21, 0x00],
  SIZE_DOUBLE_H:   [ESC, 0x21, 0x10],
  SIZE_DOUBLE_W:   [ESC, 0x21, 0x20],
  SIZE_DOUBLE:     [ESC, 0x21, 0x30],
  LF:              [LF],
  FEED:            (n = 3) => [ESC, 0x64, n],
  CUT_PARTIAL:     [GS,  0x56, 0x01],
  CUT_FULL:        [GS,  0x56, 0x00],
  OPEN_DRAWER:     [ESC, 0x70, 0x00, 0x19, 0xfa],
  BEEP:            [ESC, 0x42, 0x01, 0x09],
  // QR Code
  QR_MODEL:        [GS,  0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00],
  QR_SIZE:         (s=4) => [GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, s],
  QR_ERROR:        [GS,  0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30],
  QR_STORE:        (data) => {
    const len = data.length + 3;
    const pL = len & 0xff;
    const pH = (len >> 8) & 0xff;
    return [GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...new TextEncoder().encode(data)];
  },
  QR_PRINT:        [GS,  0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30],
};

// ─────────────────────────────────────────────
// BLUETOOTH SERVICE UUIDs (common thermal brands)
// ─────────────────────────────────────────────
const BT_SERVICES = [
  // Generic ESC/POS
  { service: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' },
  // Epson / Star
  { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-8841-43f4-a8d4-ecbe34729bb3' },
  // Xprinter / Rongta
  { service: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', char: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f' },
  // ZJiang / common Android BT printers
  { service: '0000ff00-0000-1000-8000-00805f9b34fb', char: '0000ff02-0000-1000-8000-00805f9b34fb' },
];

// ─────────────────────────────────────────────
// PLATFORM DETECTION
// ─────────────────────────────────────────────
export const detectPlatform = () => {
  const ua = navigator.userAgent.toLowerCase();
  if (typeof window !== 'undefined' && window.__TAURI__) return 'tauri';
  if (typeof window !== 'undefined' && window.process?.type === 'renderer') return 'electron';
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) return 'capacitor';
  if (ua.includes('android') && (ua.includes('; wv)') || ua.includes('webview'))) return 'android-webview';
  if (ua.includes('android')) return 'android-browser';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'browser';
};

export const PLATFORM = detectPlatform();

export const CAPS = {
  browserPrint:   typeof window !== 'undefined' && 'print' in window,
  bluetooth:      typeof navigator !== 'undefined' && 'bluetooth' in navigator,
  usb:            typeof navigator !== 'undefined' && 'usb' in navigator,
  serial:         typeof navigator !== 'undefined' && 'serial' in navigator,
  androidBridge:  typeof window !== 'undefined' && !!window.Android,
  capacitor:      PLATFORM === 'capacitor',
  isAndroid:      PLATFORM.startsWith('android'),
  isWebView:      PLATFORM === 'android-webview',
  isElectron:     PLATFORM === 'electron',
  platform:       PLATFORM,
};

// ─────────────────────────────────────────────
// BYTE HELPERS
// ─────────────────────────────────────────────
const enc = new TextEncoder();

function toBytes(...parts) {
  const arrays = parts
    .filter(p => p !== '' && p !== null && p !== undefined)
    .map(p => {
      if (typeof p === 'string')     return enc.encode(p);
      if (Array.isArray(p))          return new Uint8Array(p);
      if (p instanceof Uint8Array)   return p;
      return new Uint8Array([p]);
    });
  const len = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

// String formatting helpers for 32-char wide receipt
const W = 32;
const pad = (s, n, right = false) => {
  const str = String(s ?? '').slice(0, n);
  return right ? str.padStart(n) : str.padEnd(n);
};
const row = (left, right) => {
  const r = String(right ?? '');
  const l = String(left ?? '').slice(0, W - r.length - 1).padEnd(W - r.length - 1);
  return l + ' ' + r + '\n';
};
const center = (s, w = W) => {
  const str = String(s ?? '').slice(0, w);
  const total = w - str.length;
  const left = Math.floor(total / 2);
  return ' '.repeat(left) + str + '\n';
};
const LINE  = '-'.repeat(W) + '\n';
const DLINE = '='.repeat(W) + '\n';

// ─────────────────────────────────────────────
// ESC/POS RECEIPT BUILDER
// ─────────────────────────────────────────────
export function buildReceiptBytes(trx, cfg = {}) {
  const {
    storeName    = 'GG PASORYAN',
    storeAddress = 'Jl. Enterprise No.1',
    storePhone   = '0812-XXXX-XXXX',
    storeFooter  = 'Terima kasih telah berbelanja!',
    isReprint    = false,
    openDrawer   = false,
    cutPaper     = true,
    qrData       = '',
  } = cfg;

  const fmt = (n) => `Rp${Number(n ?? 0).toLocaleString('id-ID')}`;
  const dt = new Date(trx.timestamp).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  let bytes = toBytes(
    CMD.INIT,
    openDrawer ? CMD.OPEN_DRAWER : [],

    // ── HEADER ──
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON,
    CMD.SIZE_DOUBLE,
    storeName + '\n',
    CMD.SIZE_NORMAL,
    CMD.BOLD_OFF,
    storeAddress + '\n',
    `Telp: ${storePhone}\n`,
    CMD.ALIGN_LEFT,
    LINE,

    // ── META ──
    `No   : ${trx.id}\n`,
    `Tgl  : ${dt}\n`,
    `Kasir: ${trx.kasirName ?? '-'}\n`,
    trx.lastEditedBy ? `Edit : ${trx.lastEditedBy}\n` : '',
    trx.shiftId ? `Shift: ${trx.shiftId.slice(-8)}\n` : '',
    LINE,
  );

  // ── ITEMS ──
  for (const item of (trx.items ?? [])) {
    const name = String(item.name ?? '').slice(0, W);
    const unitPrice = Number(item.price ?? 0);
    const qty       = Number(item.qty ?? 0);
    const subtot    = qty * unitPrice;
    bytes = toBytes(bytes,
      CMD.BOLD_ON, name + '\n', CMD.BOLD_OFF,
      row(`  ${qty} x ${fmt(unitPrice)}`, fmt(subtot)),
    );
  }

  // ── TOTALS ──
  bytes = toBytes(bytes,
    LINE,
    row('Subtotal', fmt(trx.subtotal)),
    (trx.discount > 0) ? row('Diskon', `-${fmt(trx.discount)}`) : '',
    (trx.tax > 0)      ? row('PPN 10%', `+${fmt(trx.tax)}`) : '',
    DLINE,
    CMD.BOLD_ON,
    CMD.SIZE_DOUBLE_H,
    row('TOTAL', fmt(trx.total)),
    CMD.SIZE_NORMAL,
    CMD.BOLD_OFF,
    row('Bayar', trx.paymentMethod ?? 'Tunai'),
    trx.paymentMethod === 'Tempo' ? row('STATUS', '** KASBON **') : '',
    LINE,
  );

  // ── QR CODE (optional) ──
  if (qrData) {
    bytes = toBytes(bytes,
      CMD.ALIGN_CENTER,
      CMD.QR_MODEL,
      CMD.QR_SIZE(4),
      CMD.QR_ERROR,
      CMD.QR_STORE(qrData),
      CMD.QR_PRINT,
      CMD.ALIGN_LEFT,
    );
  }

  // ── FOOTER ──
  bytes = toBytes(bytes,
    CMD.ALIGN_CENTER,
    isReprint ? CMD.BOLD_ON : '',
    isReprint ? '** CETAK ULANG **\n' : '',
    isReprint ? CMD.BOLD_OFF : '',
    storeFooter + '\n',
    `${new Date().toLocaleDateString('id-ID')}\n`,
    CMD.ALIGN_LEFT,
    cutPaper ? [...CMD.FEED(4), ...CMD.CUT_PARTIAL] : CMD.FEED(4),
  );

  return bytes;
}

// ─────────────────────────────────────────────
// METHOD 1 — BROWSER PRINT (USB / WiFi via OS)
// ─────────────────────────────────────────────
export function printViaBrowser(onAfter) {
  const handler = () => {
    window.removeEventListener('afterprint', handler);
    onAfter?.();
  };
  window.addEventListener('afterprint', handler, { once: true });

  // Fallback timeout in case afterprint doesn't fire (mobile Safari, etc.)
  const timeout = setTimeout(() => {
    window.removeEventListener('afterprint', handler);
    onAfter?.();
  }, 30_000);

  window.addEventListener('afterprint', () => clearTimeout(timeout), { once: true });
  setTimeout(() => window.print(), 150);
}

// ─────────────────────────────────────────────
// METHOD 2 — WEB BLUETOOTH API
// Chrome 56+ desktop, Chrome Android 56+
// Does NOT work on: Firefox, Safari, iOS
// ─────────────────────────────────────────────
export async function printViaBluetooth(bytes, onStatus) {
  if (!CAPS.bluetooth) {
    throw new Error(
      'Web Bluetooth tidak didukung.\n' +
      'Gunakan Google Chrome / Microsoft Edge di Android atau PC.\n' +
      'iOS/Safari tidak mendukung fitur ini.'
    );
  }

  onStatus?.('🔍 Mencari printer Bluetooth...');

  // Build filter list
  const filters = [
    ...BT_SERVICES.map(s => ({ services: [s.service] })),
    ...['POS', 'Printer', 'printer', 'RPP', 'PT-', 'MTP', 'SP-', 'BT', 'XP-', 'RP-']
       .map(n => ({ namePrefix: n })),
  ];

  let device;
  try {
    device = await navigator.bluetooth.requestDevice({
      filters,
      optionalServices: BT_SERVICES.map(s => s.service),
    });
  } catch (err) {
    if (err.name === 'NotFoundError') {
      throw new Error('Tidak ada printer ditemukan. Pastikan printer BT menyala & dalam jangkauan (< 10m).');
    }
    throw err;
  }

  onStatus?.(`🔗 Menghubungkan ke "${device.name || 'printer'}"...`);
  const server = await device.gatt.connect();

  // Discover writable characteristic
  let characteristic = null;
  const allServices = await server.getPrimaryServices().catch(() => []);

  for (const { service: svcUUID, char: charUUID } of BT_SERVICES) {
    try {
      const svc  = await server.getPrimaryService(svcUUID);
      const char = await svc.getCharacteristic(charUUID);
      characteristic = char;
      break;
    } catch { /* try next */ }
  }

  if (!characteristic) {
    for (const svc of allServices) {
      const chars = await svc.getCharacteristics().catch(() => []);
      for (const ch of chars) {
        if (ch.properties.write || ch.properties.writeWithoutResponse) {
          characteristic = ch;
          break;
        }
      }
      if (characteristic) break;
    }
  }

  if (!characteristic) {
    await device.gatt.disconnect();
    throw new Error('Karakteristik printer tidak ditemukan. Printer mungkin tidak kompatibel atau sudah digunakan aplikasi lain.');
  }

  onStatus?.('🖨️ Mengirim data cetak...');

  // Stream bytes in BLE-safe chunks
  const CHUNK = 128;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const chunk = bytes.slice(i, i + CHUNK);
    try {
      await characteristic.writeValueWithoutResponse(chunk.buffer);
    } catch {
      await characteristic.writeValue(chunk.buffer);
    }
    await new Promise(r => setTimeout(r, 40));
  }

  onStatus?.('✅ Selesai cetak!');
  setTimeout(() => { try { device.gatt.disconnect(); } catch {} }, 2000);
}

// ─────────────────────────────────────────────
// METHOD 3 — RAWBT INTENT (Android APK/WebView)
// Requires RawBT app: https://rawbt.ru
// ─────────────────────────────────────────────
export function printViaRawBT(bytes) {
  // Convert Uint8Array → base64
  let binary = '';
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.slice(i, i + CHUNK));
  }
  const b64 = btoa(binary);

  // Primary: rawbt URL scheme
  const rawbtUrl = `rawbt://base64,${b64}`;

  // Inject hidden iframe (non-intrusive for WebView)
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;';
  iframe.src = rawbtUrl;
  document.body.appendChild(iframe);

  setTimeout(() => {
    document.body.removeChild(iframe);

    // Fallback: Android explicit intent
    const intentUrl = `intent:${rawbtUrl}#Intent;` +
      `scheme=rawbt;` +
      `package=ru.a402d.rawbtprinter;` +
      `end;`;
    try { window.location.href = intentUrl; } catch {}
  }, 800);

  return true;
}

// ─────────────────────────────────────────────
// METHOD 4 — NETWORK WiFi PRINTER (ESC/POS over IP)
// Printer must be on same WiFi network
// ─────────────────────────────────────────────
export async function printViaNetwork(bytes, ip, port = 9100) {
  if (!ip) throw new Error('IP printer tidak dikonfigurasi.');

  // Some printers expose HTTP endpoints
  const endpoints = [
    { url: `http://${ip}/print`, method: 'POST', body: bytes },
    { url: `http://${ip}:${port}/cgi-bin/epos/service.cgi`, method: 'POST', body: bytes },
    // Epson ePOS-Print SDK
    { url: `http://${ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`, method: 'POST', body: bytes },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method:  ep.method,
        headers: { 'Content-Type': 'application/octet-stream' },
        body:    ep.body,
        signal:  controller.signal,
        mode:    'no-cors', // Allow cross-origin to LAN device
      });
      clearTimeout(timer);
      return true;
    } catch (e) {
      if (e.name === 'AbortError') break;
      // Try next endpoint
    }
  }

  clearTimeout(timer);
  throw new Error(
    `Tidak dapat terhubung ke printer di ${ip}:${port}.\n` +
    `Pastikan:\n` +
    `• Printer & device terhubung ke WiFi yang sama\n` +
    `• IP printer benar (cek di menu printer)\n` +
    `• Firewall tidak memblokir koneksi`
  );
}

// ─────────────────────────────────────────────
// METHOD 5 — ANDROID JAVA BRIDGE
// Custom APK dengan WebView + JavascriptInterface
// ─────────────────────────────────────────────
export function printViaAndroidBridge(bytes) {
  if (window.Android?.printESCPOS) {
    // Raw bytes as array
    const arr = Array.from(bytes);
    window.Android.printESCPOS(JSON.stringify(arr));
    return true;
  }
  if (window.Android?.printText) {
    window.Android.printText(new TextDecoder().decode(bytes));
    return true;
  }
  if (window.Capacitor?.Plugins?.ThermalPrinter) {
    // Capacitor plugin
    const b64 = btoa(String.fromCharCode(...bytes));
    window.Capacitor.Plugins.ThermalPrinter.printBase64({ data: b64 });
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────
// WEB SERIAL API (USB direct, Chrome 89+)
// Untuk printer USB tanpa driver
// ─────────────────────────────────────────────
export async function printViaSerial(bytes, onStatus) {
  if (!CAPS.serial) throw new Error('Web Serial API tidak didukung di browser ini.');

  onStatus?.('🔌 Memilih port USB...');
  let port;
  try {
    port = await navigator.serial.requestPort();
  } catch (err) {
    if (err.name === 'NotFoundError') throw new Error('Tidak ada perangkat USB dipilih.');
    throw err;
  }

  await port.open({ baudRate: 9600 });
  const writer = port.writable.getWriter();

  onStatus?.('🖨️ Mengirim ke USB printer...');
  await writer.write(bytes);
  writer.releaseLock();
  await port.close();
  onStatus?.('✅ Selesai!');
}

// ─────────────────────────────────────────────
// PLAIN TEXT RECEIPT (for RawBT / logging)
// ─────────────────────────────────────────────
export function buildRawText(trx, cfg = {}) {
  const {
    storeName    = 'GG PASORYAN',
    storeAddress = 'Jl. Enterprise No.1',
    storePhone   = '0812-XXXX-XXXX',
    isReprint    = false,
  } = cfg;

  const fmt = (n) => `Rp${Number(n ?? 0).toLocaleString('id-ID')}`;
  const dt  = new Date(trx.timestamp).toLocaleString('id-ID');

  let t  = `        ${storeName}        \n`;
  t += `   ${storeAddress}   \n`;
  t += `      Telp: ${storePhone}      \n`;
  t += LINE;
  t += `No   : ${trx.id}\n`;
  t += `Tgl  : ${dt}\n`;
  t += `Kasir: ${trx.kasirName ?? '-'}\n`;
  if (trx.lastEditedBy) t += `Edit : ${trx.lastEditedBy}\n`;
  t += LINE;

  for (const item of (trx.items ?? [])) {
    const subtot = Number(item.qty) * Number(item.price);
    t += `${item.name}\n`;
    t += `  ${item.qty} x ${fmt(item.price)}   ${fmt(subtot)}\n`;
  }

  t += LINE;
  t += row('Subtotal', fmt(trx.subtotal));
  if (trx.discount > 0) t += row('Diskon', `-${fmt(trx.discount)}`);
  if (trx.tax > 0)      t += row('PPN 10%', `+${fmt(trx.tax)}`);
  t += DLINE;
  t += row('TOTAL', fmt(trx.total));
  t += row('Bayar', trx.paymentMethod ?? 'Tunai');
  t += LINE;
  t += isReprint ? '        ** CETAK ULANG **        \n' : '';
  t += '     Terima kasih!     \n\n\n';
  return t;
}

// ─────────────────────────────────────────────
// PRINT MANAGER — Singleton class
// ─────────────────────────────────────────────
export class PrintManager {
  constructor() {
    this.settings = this._loadSettings();
  }

  _loadSettings() {
    // Default settings per platform
    const defaults = {
      method:       CAPS.isAndroid ? 'rawbt' : 'browser',
      printerIp:    '',
      printerPort:  9100,
      storeName:    'GG PASORYAN',
      storeAddress: 'Jl. Enterprise No.1',
      storePhone:   '0812-XXXX-XXXX',
      storeFooter:  'Terima kasih telah berbelanja!',
      cutPaper:     true,
      openDrawer:   false,
      qrEnabled:    false,
    };
    try {
      const saved = JSON.parse(sessionStorage.getItem('gg_print_settings') || '{}');
      return { ...defaults, ...saved };
    } catch {
      return defaults;
    }
  }

  saveSettings(patch) {
    this.settings = { ...this.settings, ...patch };
    try {
      sessionStorage.setItem('gg_print_settings', JSON.stringify(this.settings));
    } catch {}
  }

  getSettings() { return { ...this.settings }; }

  /**
   * Print a receipt (struk)
   * @param {Object} trx  - Transaction object
   * @param {Object} opts - { isReprint, onStatus, onAfterBrowserPrint }
   */
  async printReceipt(trx, opts = {}) {
    const { isReprint = false, onStatus, onAfterBrowserPrint } = opts;
    const cfg = { ...this.settings, isReprint };

    // Always log raw text for debugging / Bluetooth fallback
    const rawText = buildRawText(trx, cfg);
    console.log('=== RAW RECEIPT (ESC/POS TEXT) ===\n', rawText);

    if (this.settings.method === 'browser') {
      printViaBrowser(onAfterBrowserPrint);
      return { ok: true, method: 'browser' };
    }

    const bytes = buildReceiptBytes(trx, cfg);
    return this._dispatch(bytes, onStatus, onAfterBrowserPrint);
  }

  /**
   * Print a text report
   * Uses browser print for all methods (report is HTML/A4)
   */
  printReport(onAfter) {
    printViaBrowser(onAfter);
    return { ok: true, method: 'browser' };
  }

  async _dispatch(bytes, onStatus, onAfterBrowserPrint) {
    const method = this.settings.method;

    try {
      switch (method) {
        case 'bluetooth':
          await printViaBluetooth(bytes, onStatus);
          return { ok: true, method: 'bluetooth' };

        case 'network':
          await printViaNetwork(bytes, this.settings.printerIp, this.settings.printerPort);
          onStatus?.('✅ Dikirim ke printer WiFi!');
          return { ok: true, method: 'network' };

        case 'rawbt':
          printViaRawBT(bytes);
          onStatus?.('✅ Dikirim ke RawBT!');
          return { ok: true, method: 'rawbt' };

        case 'serial':
          await printViaSerial(bytes, onStatus);
          return { ok: true, method: 'serial' };

        case 'android-bridge': {
          const ok = printViaAndroidBridge(bytes);
          if (ok) return { ok: true, method: 'android-bridge' };
          throw new Error('Android bridge tidak tersedia');
        }

        default:
          printViaBrowser(onAfterBrowserPrint);
          return { ok: true, method: 'browser' };
      }
    } catch (err) {
      console.warn(`[PrintEngine] ${method} FAILED:`, err.message);
      onStatus?.(`⚠️ ${method} gagal — beralih ke browser print...`);
      printViaBrowser(onAfterBrowserPrint);
      return { ok: true, method: 'browser-fallback', error: err.message };
    }
  }
}

// Singleton
export const printer = new PrintManager();
export default printer;
