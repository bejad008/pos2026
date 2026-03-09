// === KUMPULAN FUNGSI ALAT BANTU (UTILITIES) ===

export const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(num || 0);

export const generateInvoiceID = () => {
  const d   = new Date();
  const dtm = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dtm}-${rnd}`;
};

export const getCatEmoji = (cat) => {
  const l = (cat || '').toLowerCase();
  if (l.includes('makan'))                 return '🍛';
  if (l.includes('minum'))                 return '🍹';
  if (l.includes('cemil') || l.includes('snack')) return '🍟';
  if (l === 'semua')                       return '🛒';
  return '📦';
};

// ─── Plain-text receipt for logging / RawBT ──────────────────
export const buildRawText = (trx, cfg = {}) => {
  const {
    storeName    = 'GG PASORYAN',
    storeAddress = 'Jl. Enterprise No.1',
    storePhone   = '0812-XXXX-XXXX',
    isReprint    = false,
  } = cfg;

  const W   = 32;
  const fmt = (n) => `Rp${Number(n ?? 0).toLocaleString('id-ID')}`;
  const row = (l, r) => {
    const rs  = String(r ?? '');
    const ls  = String(l ?? '').slice(0, W - rs.length - 1).padEnd(W - rs.length - 1);
    return ls + ' ' + rs + '\n';
  };
  const LINE  = '-'.repeat(W) + '\n';
  const DLINE = '='.repeat(W) + '\n';

  const dt = new Date(trx.timestamp).toLocaleString('id-ID');
  let t  = '\n';
  t += `        ${storeName}        \n`;
  t += `   ${storeAddress}   \n`;
  t += `      Telp: ${storePhone}      \n`;
  t += LINE;
  t += `No   : ${trx.id}\n`;
  t += `Tgl  : ${dt}\n`;
  t += `Kasir: ${trx.kasirName ?? '-'}\n`;
  if (trx.lastEditedBy) t += `Edit : ${trx.lastEditedBy}\n`;
  t += LINE;

  for (const item of (trx.items ?? [])) {
    t += `${item.name}\n`;
    t += row(`  ${item.qty} x ${fmt(item.price)}`, fmt(item.qty * item.price));
  }

  t += LINE;
  t += row('Subtotal', fmt(trx.subtotal));
  if (trx.discount > 0) t += row('Diskon', `-${fmt(trx.discount)}`);
  if (trx.tax > 0)      t += row('PPN 10%', `+${fmt(trx.tax)}`);
  t += DLINE;
  t += row('TOTAL', fmt(trx.total));
  t += row('Bayar', trx.paymentMethod ?? 'Tunai');
  t += LINE;
  if (isReprint)  t += '        ** CETAK ULANG **        \n';
  t += '     Terima kasih!     \n\n\n';
  return t;
};

// Alias for backward compat
export const generateRawTextReceipt = buildRawText;

// ─── CSV Download ─────────────────────────────────────────────
export const downloadCSV = (data, filename) => {
  if (!data?.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows    = data
    .map(row =>
      Object.values(row)
        .map(val => `"${String(val ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
  const csv  = 'data:text/csv;charset=utf-8,\uFEFF' + headers + '\n' + rows;
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csv));
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
