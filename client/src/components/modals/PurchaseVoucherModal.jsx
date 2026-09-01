import React, { useState } from 'react';
import {
  X,
  Truck,
  Printer,
  Download,
  Share2,
  Send,
  CheckCircle2,
  AlertCircle,
  Gem
} from 'lucide-react';
import { downloadPurchaseVoucherPDF, sharePurchaseVoucherOnWhatsApp } from '../../services/pdfGenerator';
import { getStoreConfig } from '../../services/storeConfig';

export default function PurchaseVoucherModal({ isOpen, onClose, purchase }) {
  const [supplierPhone, setSupplierPhone] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !purchase) return null;

  const storeConfig = getStoreConfig();
  const s = purchase.settlement || {};
  const isSettled = purchase.status === 'SETTLED';
  const pending = Number(s.remaining_balance_due || 0);

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      downloadPurchaseVoucherPDF(purchase);
    } catch (err) {
      alert('Error generating PDF: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    setIsSharing(true);
    try {
      await sharePurchaseVoucherOnWhatsApp(purchase, supplierPhone);
    } catch (err) {
      alert('Error sharing PDF: ' + err.message);
    } finally {
      setIsSharing(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[94vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Inward Purchase Voucher
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {purchase.voucher_no}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  isSettled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/20'
                }`}>
                  {isSettled ? '✓ Settled' : '⚠ Partial Due'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {purchase.supplier_name} · {purchase.date} · Ref: {purchase.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors no-print"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="no-print my-3 p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Send className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <input
              type="tel"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              placeholder="Supplier WhatsApp (+91...)"
              className="w-full sm:w-52 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              disabled={isSharing}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              title="Send official PDF Voucher on WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>{isSharing ? 'Preparing PDF...' : 'Send PDF on WhatsApp'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              title="Download PDF Voucher to device"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{isDownloading ? 'Saving...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-1.5"
              title="Print Voucher"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE VOUCHER PREVIEW */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="printable-area bg-white text-slate-900 rounded-xl shadow-xl p-5 sm:p-6 font-sans text-xs border border-slate-200">

            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
                    <Gem className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950">
                    {storeConfig.store_name}
                  </h1>
                </div>
                <p className="text-slate-600 text-[10px]">{storeConfig.address}</p>
                <p className="text-slate-600 text-[10px]">Phone: {storeConfig.phone} | Email: {storeConfig.email}</p>
                <p className="text-slate-700 font-mono text-[10px] font-semibold mt-0.5">GSTIN: {storeConfig.gstin}</p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 bg-slate-950 text-white font-bold text-[10px] rounded uppercase">
                  INWARD PURCHASE VOUCHER
                </span>
                <p className="text-xs font-mono font-bold text-slate-900 mt-1">Voucher: {purchase.voucher_no}</p>
                <p className="text-[10px] text-slate-600">Ref ID: {purchase.id}</p>
                <p className="text-[10px] text-slate-500">Date: {purchase.date}</p>
              </div>
            </div>

            {/* Supplier Row */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg mb-3 text-[11px]">
              <div>
                <span className="text-slate-500 font-bold uppercase text-[9px] block">Supplier / Vendor</span>
                <span className="font-bold text-slate-950 text-xs block">{purchase.supplier_name}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-bold uppercase text-[9px] block">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isSettled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {isSettled ? '✓ Fully Settled' : '⚠ Partial Due'}
                </span>
              </div>
            </div>

            {/* Items Inwarded Table */}
            <table className="w-full text-left border-collapse mb-2">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                  <th className="py-1.5 px-2">Items Inwarded</th>
                  <th className="py-1.5 px-2 text-right">Gross Wt</th>
                  <th className="py-1.5 px-2 text-right">Net Wt</th>
                  <th className="py-1.5 px-2 text-right">Fine Gold</th>
                  <th className="py-1.5 px-2 text-right">Metal Value (₹)</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-2 font-semibold text-slate-950">{purchase.items_summary}</td>
                  <td className="py-2 px-2 text-right font-mono">{Number(purchase.total_gross_weight || 0).toFixed(3)}g</td>
                  <td className="py-2 px-2 text-right font-mono font-bold">{Number(purchase.total_net_weight || 0).toFixed(3)}g</td>
                  <td className="py-2 px-2 text-right font-mono text-amber-700 font-bold">{Number(purchase.total_fine_gold_grams || 0).toFixed(3)}g</td>
                  <td className="py-2 px-2 text-right font-mono font-bold">₹{Number(purchase.subtotal_inr || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex flex-col items-end gap-0.5 text-[11px] mb-3">
              <div className="flex justify-between w-48 text-slate-600">
                <span>Making / Labour:</span>
                <span className="font-mono">₹{Number(purchase.making_charges_inr || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between w-48 border-t-2 border-slate-900 pt-1 text-sm font-black text-slate-950">
                <span>TOTAL BILL:</span>
                <span className="font-mono">₹{Number(purchase.total_amount_inr || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Settlement Breakdown */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg mb-3">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Multi-Split Payment Settlement Breakdown
              </p>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">💵 Cash Paid:</span>
                  <span className="font-mono font-semibold text-slate-900">₹{Number(s.cash_paid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">🏦 RTGS / Bank Transfer:{s.rtgs_ref ? ` (UTR: ${s.rtgs_ref})` : ''}</span>
                  <span className="font-mono font-semibold text-blue-700">₹{Number(s.rtgs_paid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">🪙 Pure Fine Metal Given: {Number(s.fine_metal_grams_given || 0).toFixed(3)}g</span>
                  <span className="font-mono font-semibold text-amber-700">₹{Number(s.fine_metal_valuation_inr || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">♻️ Old Gold / Scrap Given: {Number(s.old_gold_grams_given || 0).toFixed(3)}g</span>
                  <span className="font-mono font-semibold text-amber-600">₹{Number(s.old_gold_valuation_inr || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">⏳ Advance / Credit Adjusted:</span>
                  <span className="font-mono font-semibold text-slate-700">₹{Number(s.advance_adjusted || 0).toLocaleString('en-IN')}</span>
                </div>

                {/* Balance row */}
                <div className={`flex justify-between items-center pt-1.5 border-t-2 font-bold text-xs ${
                  pending > 0 ? 'border-rose-400 text-rose-700' : 'border-emerald-500 text-emerald-700'
                }`}>
                  {pending > 0 ? (
                    <>
                      <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> BALANCE DUE TO SUPPLIER:</span>
                      <span className="font-mono text-sm">₹{pending.toLocaleString('en-IN')}</span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5 w-full justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                      FULLY SETTLED — NO BALANCE DUE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-end text-[9px] text-slate-500">
              <div>
                <p className="font-bold text-slate-700 mb-0.5">Note:</p>
                <p>Weights are as weighed at time of inward receipt.</p>
                <p>Any weight discrepancy must be raised within 24 hours of delivery.</p>
              </div>
              <div className="text-center">
                <div className="w-28 border-b border-slate-400 mb-1" />
                <span className="font-bold text-slate-700 block">Authorized Signatory</span>
                <span>{storeConfig.store_name}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
