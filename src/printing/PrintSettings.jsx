import React, { useState } from 'react';
import { X, Printer, Wifi, Bluetooth, Usb, Smartphone, Settings, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { printer, CAPS, PLATFORM } from '../printing/PrintEngine';

const METHOD_CONFIG = [
  {
    id: 'browser',
    icon: Printer,
    label: 'Browser Print (USB / WiFi)',
    desc: 'Cetak via dialog browser. Mendukung printer USB & WiFi yang sudah terpasang driver di OS. Bekerja di semua platform.',
    compatible: true,
    badge: 'UNIVERSAL',
    badgeColor: 'text-emerald-400 bg-emerald-900/40 border-emerald-700/50',
  },
  {
    id: 'bluetooth',
    icon: Bluetooth,
    label: 'Web Bluetooth (BLE Langsung)',
    desc: 'Koneksi langsung ke thermal printer Bluetooth tanpa driver. Butuh Chrome/Edge. TIDAK didukung Firefox/Safari/iOS.',
    compatible: CAPS.bluetooth,
    badge: CAPS.bluetooth ? 'TERSEDIA' : 'TIDAK DIDUKUNG',
    badgeColor: CAPS.bluetooth
      ? 'text-blue-400 bg-blue-900/40 border-blue-700/50'
      : 'text-red-400 bg-red-900/40 border-red-700/50',
  },
  {
    id: 'rawbt',
    icon: Smartphone,
    label: 'RawBT (Android APK/WebView)',
    desc: 'Cetak via app RawBT yang terinstall di Android. Terbaik untuk APK & Android WebView. Install RawBT dari Play Store.',
    compatible: CAPS.isAndroid || true,
    badge: CAPS.isAndroid ? 'DIREKOMENDASIKAN (Android)' : 'UNTUK ANDROID',
    badgeColor: 'text-amber-400 bg-amber-900/40 border-amber-700/50',
  },
  {
    id: 'network',
    icon: Wifi,
    label: 'WiFi Network Printer (IP Langsung)',
    desc: 'Kirim ESC/POS langsung ke IP printer dalam jaringan WiFi yang sama. Printer harus mendukung HTTP print.',
    compatible: true,
    badge: 'WIFI LAN',
    badgeColor: 'text-cyan-400 bg-cyan-900/40 border-cyan-700/50',
  },
  {
    id: 'serial',
    icon: Usb,
    label: 'Web Serial (USB Tanpa Driver)',
    desc: 'Koneksi USB langsung tanpa install driver. Butuh Chrome 89+. Cocok untuk PC/laptop dengan printer USB.',
    compatible: CAPS.serial,
    badge: CAPS.serial ? 'TERSEDIA' : 'TIDAK DIDUKUNG',
    badgeColor: CAPS.serial
      ? 'text-purple-400 bg-purple-900/40 border-purple-700/50'
      : 'text-red-400 bg-red-900/40 border-red-700/50',
  },
];

export default function PrintSettingsModal({ isOpen, onClose, theme }) {
  const [settings, setSettings] = useState(() => printer.getSettings());
  const [testStatus, setTestStatus] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    printer.saveSettings(settings);
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestStatus('');
    const fakeTrx = {
      id: 'TEST-0000',
      timestamp: Date.now(),
      kasirName: 'Kasir Test',
      items: [
        { name: 'Test Item A', qty: 2, price: 15000 },
        { name: 'Test Item B', qty: 1, price: 25000 },
      ],
      subtotal: 55000, discount: 0, tax: 0, total: 55000,
      paymentMethod: 'Tunai',
    };
    try {
      printer.saveSettings(settings); // Apply current settings for test
      const result = await printer.printReceipt(fakeTrx, {
        isReprint: true,
        onStatus: (msg) => setTestStatus(msg),
        onAfterBrowserPrint: () => setTestStatus('✅ Dialog browser ditutup.'),
      });
      setTestStatus(prev => prev || `✅ Berhasil via ${result.method}`);
    } catch (err) {
      setTestStatus(`❌ Error: ${err.message}`);
    }
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className={`${theme.bgPanel} border ${theme.border} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}>
        
        {/* Header */}
        <div className={`sticky top-0 p-4 bg-black/40 backdrop-blur-xl border-b ${theme.border} flex justify-between items-center z-10`}>
          <div className="flex items-center gap-3">
            <Printer className={theme.accent} size={22} />
            <div>
              <h3 className={`text-lg font-bold ${theme.textMain}`}>Konfigurasi Printer Enterprise</h3>
              <p className={`text-xs ${theme.textMuted}`}>Platform: {PLATFORM} | Bluetooth: {CAPS.bluetooth ? '✅' : '❌'} | Serial: {CAPS.serial ? '✅' : '❌'}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg hover:bg-black/30 ${theme.textMuted}`}><X size={20}/></button>
        </div>

        <div className="p-5 space-y-6">

          {/* Metode Cetak */}
          <div>
            <h4 className={`text-sm font-bold ${theme.textMuted} uppercase tracking-widest mb-3 flex items-center gap-2`}>
              <Settings size={14}/> Metode Cetak Struk
            </h4>
            <div className="space-y-2">
              {METHOD_CONFIG.map(m => {
                const Icon = m.icon;
                const isSelected = settings.method === m.id;
                return (
                  <button key={m.id} onClick={() => setSettings(s => ({ ...s, method: m.id }))}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${theme.buttonBg} border-current`
                        : `bg-black/10 ${theme.border} hover:bg-black/20`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-black/20' : 'bg-black/10'}`}>
                        <Icon size={18} className={isSelected ? theme.buttonText : theme.textMuted} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm ${isSelected ? theme.buttonText : theme.textMain}`}>{m.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${m.badgeColor}`}>{m.badge}</span>
                        </div>
                        <p className={`text-xs mt-1 ${isSelected ? 'opacity-80' : theme.textMuted}`}>{m.desc}</p>
                      </div>
                      {isSelected && <CheckCircle size={18} className={theme.buttonText} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Network Settings */}
          {settings.method === 'network' && (
            <div className={`bg-cyan-900/10 border border-cyan-700/30 rounded-xl p-4 space-y-3`}>
              <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2"><Wifi size={14}/> Konfigurasi WiFi Printer</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={`block text-xs ${theme.textMuted} mb-1`}>IP Address Printer</label>
                  <input value={settings.printerIp} onChange={e => setSettings(s => ({ ...s, printerIp: e.target.value }))}
                    placeholder="192.168.1.100"
                    className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm font-mono focus:outline-none`}/>
                </div>
                <div>
                  <label className={`block text-xs ${theme.textMuted} mb-1`}>Port</label>
                  <input value={settings.printerPort} onChange={e => setSettings(s => ({ ...s, printerPort: Number(e.target.value) }))}
                    type="number" placeholder="9100"
                    className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm font-mono focus:outline-none`}/>
                </div>
              </div>
              <div className={`flex gap-2 text-xs ${theme.textMuted} bg-black/20 p-3 rounded-lg`}>
                <Info size={14} className="shrink-0 mt-0.5"/>
                <span>Cara cek IP printer: Matikan lalu nyalakan printer → biasanya cetak otomatis halaman info berisi IP address. Port default ESC/POS: 9100.</span>
              </div>
            </div>
          )}

          {/* RawBT Info */}
          {settings.method === 'rawbt' && (
            <div className={`bg-amber-900/10 border border-amber-700/30 rounded-xl p-4`}>
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-2"><Smartphone size={14}/> Panduan RawBT</h4>
              <ol className={`text-xs ${theme.textMuted} space-y-1 list-decimal list-inside`}>
                <li>Install <strong className="text-amber-300">RawBT Print Service</strong> dari Google Play Store</li>
                <li>Buka RawBT → Tambah printer Bluetooth/WiFi/USB Anda</li>
                <li>Kembali ke POS ini → Klik Cetak Struk</li>
                <li>RawBT akan otomatis mencetak ke printer yang dikonfigurasi</li>
              </ol>
            </div>
          )}

          {/* Bluetooth Info */}
          {settings.method === 'bluetooth' && !CAPS.bluetooth && (
            <div className={`bg-red-900/10 border border-red-700/30 rounded-xl p-4`}>
              <h4 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-2"><AlertTriangle size={14}/> Browser Tidak Mendukung</h4>
              <p className={`text-xs ${theme.textMuted}`}>Web Bluetooth API hanya tersedia di <strong className="text-red-300">Google Chrome</strong> dan <strong className="text-red-300">Microsoft Edge</strong> di desktop/Android. Silakan gunakan browser yang kompatibel atau pilih metode lain.</p>
            </div>
          )}

          {/* Store Info */}
          <div>
            <h4 className={`text-sm font-bold ${theme.textMuted} uppercase tracking-widest mb-3`}>Identitas Toko (Header Struk)</h4>
            <div className="space-y-3">
              {[
                { key: 'storeName',    label: 'Nama Toko',   placeholder: 'GG PASORYAN' },
                { key: 'storeAddress', label: 'Alamat',      placeholder: 'Jl. Enterprise No.1' },
                { key: 'storePhone',   label: 'No. Telpon',  placeholder: '0812-XXXX-XXXX' },
                { key: 'storeFooter',  label: 'Pesan Footer', placeholder: 'Terima kasih telah berbelanja!' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={`block text-xs ${theme.textMuted} mb-1`}>{label}</label>
                  <input value={settings[key] ?? ''} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={`w-full bg-black/20 border ${theme.border} rounded-lg p-2.5 ${theme.textMain} text-sm focus:outline-none`}/>
                </div>
              ))}
            </div>
          </div>

          {/* Printer Options */}
          <div>
            <h4 className={`text-sm font-bold ${theme.textMuted} uppercase tracking-widest mb-3`}>Opsi Printer</h4>
            <div className="space-y-2">
              {[
                { key: 'cutPaper',    label: 'Auto-cut Kertas setelah cetak' },
                { key: 'openDrawer',  label: 'Buka Laci Kas otomatis saat cetak' },
                { key: 'qrEnabled',   label: 'Cetak QR Code di struk' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border ${theme.border} hover:bg-black/20 transition-all`}
                >
                  <span className={`text-sm ${theme.textMain}`}>{label}</span>
                  <div className={`w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-emerald-600' : 'bg-gray-700'} relative`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`}/>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Test Print */}
          <div className={`bg-black/20 border ${theme.border} rounded-xl p-4`}>
            <h4 className={`text-sm font-bold ${theme.textMuted} mb-3`}>Test Cetak</h4>
            <button onClick={handleTest} disabled={isTesting}
              className={`w-full py-3 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-bold text-sm transition-all disabled:opacity-60`}>
              {isTesting ? '⏳ Mencetak...' : '🖨️ Cetak Struk Percobaan'}
            </button>
            {testStatus && (
              <p className={`text-xs mt-2 p-2 rounded-lg bg-black/20 ${theme.textMain} font-mono whitespace-pre-wrap`}>
                {testStatus}
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 p-4 bg-black/40 backdrop-blur-xl border-t ${theme.border} flex gap-3`}>
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl border ${theme.border} ${theme.textMuted} font-semibold`}>Batal</button>
          <button onClick={handleSave} className={`flex-1 py-3 rounded-xl ${theme.buttonBg} ${theme.buttonText} font-bold`}>Simpan Pengaturan</button>
        </div>
      </div>
    </div>
  );
}
