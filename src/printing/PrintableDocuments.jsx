import React from 'react';
import { formatRupiah } from '../utils';

/**
 * RECEIPT TEMPLATE — 58mm / 80mm thermal paper
 *
 * FIX: Sebelumnya items di-render 2 kali — semua nama dulu,
 * lalu semua qty. Sekarang setiap item di-render lengkap (nama + qty)
 * dalam urutan yang benar menggunakan React.Fragment.
 */
export function ReceiptDocument({ trx, isReprint = false, settings = {} }) {
  if (!trx) return null;

  const {
    storeName    = 'GG PASORYAN',
    storeAddress = 'Jl. Enterprise No.1',
    storePhone   = '0812-XXXX-XXXX',
    storeFooter  = 'Terima kasih telah berbelanja!',
  } = settings;

  const dt = new Date(trx.timestamp).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const cellStyle = { padding: '1px 0', border: 'none' };

  return (
    <div id="printable-receipt" style={{
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '12px',
      color: '#000',
      backgroundColor: '#fff',
      width: '72mm',
      padding: '4mm 2mm',
      margin: '0 auto',
    }}>
      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px' }}>
          {storeName}
        </div>
        <div style={{ fontSize: '11px' }}>{storeAddress}</div>
        <div style={{ fontSize: '11px' }}>Telp: {storePhone}</div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* ── Meta ── */}
      <div style={{ fontSize: '11px', marginBottom: '4px' }}>
        <div>No   : {trx.id}</div>
        <div>Tgl  : {dt}</div>
        <div>Kasir: {trx.kasirName ?? '-'}</div>
        {trx.lastEditedBy && <div>Edit : {trx.lastEditedBy}</div>}
        {trx.shiftId && <div>Shift: {String(trx.shiftId).slice(-8)}</div>}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* ── Items — FIX: render nama + qty bersama per item ── */}
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
        <tbody>
          {(trx.items ?? []).map((item, i) => {
            const qty    = Number(item.qty ?? 0);
            const price  = Number(item.price ?? 0);
            const subtot = qty * price;
            return (
              <React.Fragment key={i}>
                {/* Baris nama item */}
                <tr>
                  <td colSpan={2} style={{ ...cellStyle, fontWeight: 'bold', paddingBottom: '1px' }}>
                    {item.name}
                  </td>
                </tr>
                {/* Baris qty × harga = subtotal */}
                <tr>
                  <td style={{ ...cellStyle, paddingLeft: '8px', color: '#444', paddingBottom: '5px' }}>
                    {qty} × {price.toLocaleString('id-ID')}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold', paddingBottom: '5px' }}>
                    {subtot.toLocaleString('id-ID')}
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* ── Totals ── */}
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={cellStyle}>Subtotal</td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>
              {Number(trx.subtotal).toLocaleString('id-ID')}
            </td>
          </tr>
          {(trx.discount > 0) && (
            <tr>
              <td style={cellStyle}>Diskon</td>
              <td style={{ ...cellStyle, textAlign: 'right' }}>
                -{Number(trx.discount).toLocaleString('id-ID')}
              </td>
            </tr>
          )}
          {(trx.tax > 0) && (
            <tr>
              <td style={cellStyle}>PPN 10%</td>
              <td style={{ ...cellStyle, textAlign: 'right' }}>
                +{Number(trx.tax).toLocaleString('id-ID')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ borderTop: '2px solid #000', margin: '4px 0' }} />

      {/* ── Grand Total ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: 'bold', fontSize: '14px' }}>TOTAL</td>
            <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
              Rp {Number(trx.total).toLocaleString('id-ID')}
            </td>
          </tr>
          <tr>
            <td style={{ fontSize: '11px', paddingTop: '2px' }}>Metode Bayar</td>
            <td style={{ textAlign: 'right', fontSize: '11px', paddingTop: '2px' }}>
              {trx.paymentMethod}
            </td>
          </tr>
          {trx.paymentMethod === 'Tempo' && (
            <tr>
              <td colSpan={2} style={{
                textAlign: 'center', fontWeight: 'bold', fontSize: '11px',
                color: '#cc0000', paddingTop: '4px',
              }}>
                *** DICATAT SEBAGAI KASBON ***
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', fontSize: '11px' }}>
        {isReprint && (
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>** CETAK ULANG **</div>
        )}
        <div>{storeFooter}</div>
        <div style={{ marginTop: '4px', fontSize: '10px' }}>
          {new Date().toLocaleDateString('id-ID')}
        </div>
      </div>
    </div>
  );
}

/**
 * REPORT DOCUMENT — A4 landscape/portrait
 */
export function ReportDocument({ data, period }) {
  if (!data) return null;

  const {
    totalSales, totalCostGoods, grossProfit,
    totalExpense, realNetProfit,
    filteredTrx, filteredExp,
  } = data;

  const now = new Date().toLocaleString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const periodLabel = {
    hari_ini:  'Hari Ini',
    bulan_ini: 'Bulan Ini',
    tahun_ini: 'Tahun Ini',
    semua:     'Semua Waktu',
  }[period] ?? period;

  // Top selling items
  const itemMap = {};
  (filteredTrx ?? []).filter(t => t.type !== 'PayDebt').forEach(t => {
    (t.items ?? []).forEach(item => {
      if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      itemMap[item.name].qty     += Number(item.qty ?? 0);
      itemMap[item.name].revenue += Number(item.qty ?? 0) * Number(item.price ?? 0);
    });
  });
  const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const fmt = (n) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  return (
    <div id="printable-report" style={{
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      backgroundColor: '#fff',
      padding: '20px',
      fontSize: '12px',
    }}>
      {/* ── Header ── */}
      <div style={{
        textAlign: 'center',
        borderBottom: '3px solid #000',
        paddingBottom: '12px',
        marginBottom: '16px',
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px', letterSpacing: '2px' }}>
          GG PASORYAN
        </h1>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px' }}>
          LAPORAN LABA RUGI ENTERPRISE
        </h2>
        <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>
          Periode: <strong>{periodLabel}</strong> &nbsp;|&nbsp; Dicetak: {now}
        </p>
      </div>

      {/* ── Summary ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          {[
            { label: 'Total Transaksi', val: `${(filteredTrx ?? []).filter(t => t.type !== 'PayDebt').length} transaksi`, bg: '#f0f0f0' },
            { label: 'Pendapatan Kotor (Gross Revenue)', val: fmt(totalSales), bg: '#f0f0f0' },
            { label: 'HPP (Harga Pokok Penjualan)', val: `-${fmt(totalCostGoods)}`, bg: '#fff0f0' },
            { label: 'Laba Kotor (Gross Profit)', val: fmt(grossProfit), bg: '#f0f8ff' },
            { label: 'Biaya Operasional (OpEx)', val: `-${fmt(totalExpense)}`, bg: '#fff0f0' },
          ].map((row, i) => (
            <tr key={i} style={{ backgroundColor: row.bg }}>
              <td style={{ padding: '8px 12px', border: '1px solid #ccc', width: '60%' }}>{row.label}</td>
              <td style={{ padding: '8px 12px', border: '1px solid #ccc', textAlign: 'right', fontWeight: 'bold' }}>{row.val}</td>
            </tr>
          ))}
          <tr style={{ backgroundColor: realNetProfit >= 0 ? '#e8ffe8' : '#ffe8e8' }}>
            <td style={{ padding: '12px', border: '2px solid #000', fontSize: '16px', fontWeight: 'bold' }}>
              LABA BERSIH (EBITDA)
            </td>
            <td style={{
              padding: '12px', border: '2px solid #000',
              textAlign: 'right', fontSize: '18px', fontWeight: 'bold',
              color: realNetProfit >= 0 ? '#008800' : '#cc0000',
            }}>
              {fmt(realNetProfit)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Top Products ── */}
      {topItems.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '14px', fontWeight: 'bold',
            borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px',
          }}>
            Produk Terlaris
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#333', color: '#fff' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>No</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Produk</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Qty Terjual</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}>{i + 1}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd', textAlign: 'right' }}>{fmt(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Expenses Detail ── */}
      {(filteredExp ?? []).length > 0 && (
        <div>
          <h3 style={{
            fontSize: '14px', fontWeight: 'bold',
            borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px',
          }}>
            Detail Pengeluaran Operasional
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#cc4444', color: '#fff' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Waktu</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Keterangan</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Kategori</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Nominal</th>
              </tr>
            </thead>
            <tbody>
              {(filteredExp ?? []).map((e, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff5f5' : '#fff' }}>
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd', fontSize: '11px' }}>
                    {new Date(e.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}>{e.description}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}>{e.category}</td>
                  <td style={{
                    padding: '5px 8px', border: '1px solid #ddd',
                    textAlign: 'right', color: '#cc0000', fontWeight: 'bold',
                  }}>
                    {fmt(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        marginTop: '30px', borderTop: '1px solid #000',
        paddingTop: '8px', textAlign: 'center',
        fontSize: '11px', color: '#555',
      }}>
        <p>Dokumen ini dicetak secara otomatis oleh GG Pasoryan Enterprise POS System</p>
        <p>Dicetak pada: {now} &nbsp;|&nbsp; Dokumen ini SAH tanpa tanda tangan</p>
      </div>
    </div>
  );
}
