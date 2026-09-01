import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Gem,
  Send,
  FileText,
  Smartphone,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles
} from 'lucide-react';
import { downloadInvoicePDF, shareInvoicePDFOnWhatsApp } from '../../services/pdfGenerator';
import { getStoreConfig } from '../../services/storeConfig';

export default function PrintInvoiceModal({ isOpen, onClose, invoice }) {
  const [viewMode, setViewMode] = useState('A4_INVOICE'); // 'A4_INVOICE' | 'MOBILE_SLIP'
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(invoice?.customer_phone || '');
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !invoice) return null;

  const storeConfig = getStoreConfig();
  const isWholesale = invoice.type === 'WHOLESALE_CHALLAN';
  const isCash = invoice.payment_mode === 'CASH' || invoice.tax_rate === 0 || invoice.gst_amount === 0;

  // 1-Click WhatsApp PDF Sharing Action
  const handleSharePDF = async () => {
    try {
      setIsSharing(true);
      await shareInvoicePDFOnWhatsApp(invoice, customPhone);
    } catch (err) {
      console.error('PDF WhatsApp Share error:', err);
      alert('Error sharing PDF: ' + err.message);
    } finally {
      setIsSharing(false);
    }
  };

  // 1-Click Direct PDF Download
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      await downloadInvoicePDF(invoice);
    } catch (err) {
      console.error('PDF Download error:', err);
      alert('Error downloading PDF: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [invoice];
  const taxableVal = Number(invoice.subtotal || invoice.taxable_amount || (invoice.total_amount / (isCash ? 1 : 1.03)));
  const cgstVal = isCash ? 0 : Number(invoice.cgst_amount || ((invoice.total_amount - taxableVal) / 2));
  const sgstVal = isCash ? 0 : Number(invoice.sgst_amount || ((invoice.total_amount - taxableVal) / 2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[94vh] flex flex-col">
        
        {/* Header & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 no-print flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{isWholesale ? 'Wholesale Challan' : (isCash ? 'Retail Cash Bill' : 'GST Tax Invoice')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {invoice.invoice_no}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">PDF generated & ready for thermal/laser print or WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('A4_INVOICE')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'A4_INVOICE'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Tax Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('MOBILE_SLIP')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'MOBILE_SLIP'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Slip</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar: WhatsApp PDF Dispatch & Print Buttons */}
        <div className="no-print my-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Send className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <input
              type="tel"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="Customer WhatsApp (+91...)"
              className="w-full sm:w-56 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action: Share PDF directly on WhatsApp */}
            <button
              onClick={handleSharePDF}
              disabled={isSharing}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              title="Generate and send official PDF bill to customer's WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>{isSharing ? 'Preparing PDF...' : 'Send PDF on WhatsApp'}</span>
            </button>

            {/* Direct PDF Download */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              title="Download official PDF to device"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{isDownloading ? 'Saving...' : 'Download PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-1.5"
              title="Print Tax Invoice (Thermal or A4)"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>

        {/* Scrollable Invoice Preview Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          
          {/* ALWAYS PRESENT PRINTABLE TAX INVOICE (Guaranteed visibility during window.print()) */}
          <div className={`printable-area ${viewMode === 'A4_INVOICE' ? 'block' : 'hidden print:block'} p-5 sm:p-6 bg-white text-slate-900 rounded-xl shadow-xl font-sans text-xs border border-slate-200 select-text`}>
            
            {/* Header: Store Identity & Invoice Title */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold">
                    <Gem className="w-4 h-4" />
                  </div>
                  <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950">
                    {storeConfig.store_name}
                  </h1>
                </div>
                <p className="text-slate-600 text-[10px]">{storeConfig.address}</p>
                <p className="text-slate-600 text-[10px]">Phone: {storeConfig.phone} | Email: {storeConfig.email}</p>
                <p className="text-slate-700 font-mono text-[10px] font-semibold mt-0.5">
                  GSTIN: {storeConfig.gstin} | BIS Hallmark: {storeConfig.bis_hallmark}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 bg-slate-950 text-white font-bold text-[10px] rounded uppercase">
                  {isWholesale ? 'B2B DELIVERY CHALLAN' : (isCash ? 'RETAIL CASH ESTIMATE' : 'GST TAX INVOICE')}
                </span>
                <p className="text-xs font-mono font-bold text-slate-900 mt-1">Invoice: {invoice.invoice_no}</p>
                <p className="text-[10px] text-slate-600">
                  Date: {new Date(invoice.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[10px] text-slate-500">Sales Exec: {invoice.employee_name || 'Counter Staff'}</p>
              </div>
            </div>

            {/* Customer & Settlement Row */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg mb-3 text-[11px]">
              <div>
                <span className="text-slate-500 font-bold uppercase text-[9px] block">Billed To Customer</span>
                <span className="font-bold text-slate-950 text-xs block">{invoice.customer_name || 'Walk-in Customer'}</span>
                {invoice.customer_phone && <span className="text-slate-600 font-mono text-[10px] block">Mobile: {invoice.customer_phone}</span>}
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-bold uppercase text-[9px] block">Payment Mode</span>
                <span className="font-bold text-slate-900 block">{invoice.payment_mode || (isCash ? 'CASH' : 'UPI')}</span>
                <span className="text-emerald-700 font-bold text-[10px]">Status: PAID & SETTLED</span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left border-collapse mb-3">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                  <th className="py-1.5 px-2">#</th>
                  <th className="py-1.5 px-2">Item Description</th>
                  <th className="py-1.5 px-2">HSN</th>
                  <th className="py-1.5 px-2">Purity</th>
                  <th className="py-1.5 px-2 text-right">Gross Wt</th>
                  <th className="py-1.5 px-2 text-right">Net Wt</th>
                  <th className="py-1.5 px-2 text-right">Rate/g</th>
                  <th className="py-1.5 px-2 text-right">Making</th>
                  <th className="py-1.5 px-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-1.5 px-2">
                      <span className="font-bold text-slate-950 block">{item.title}</span>
                      {item.huid && <span className="text-[9px] font-mono text-slate-500 block">HUID: {item.huid}</span>}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[10px] text-slate-600">
                      {item.hsn || (item.metal_type === 'Silver' ? '711311' : '711319')}
                    </td>
                    <td className="py-1.5 px-2 font-semibold">{item.purity}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{Number(item.gross_weight || item.net_weight || 0).toFixed(3)}g</td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">{Number(item.net_weight || 0).toFixed(3)}g</td>
                    <td className="py-1.5 px-2 text-right font-mono">₹{Number(item.metal_rate_applied || item.rate || 0).toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-slate-600">₹{Number(item.making_charge || 0).toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                      ₹{Number(item.total_item_price || item.price || item.total_amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Old Gold Deduction Row (if any) */}
            {(invoice.old_gold_deduction > 0 || invoice.old_gold) && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg flex justify-between items-center text-[11px] mb-3 font-semibold text-rose-700">
                <span>OLD GOLD SCRAP EXCHANGE CREDIT DEDUCTION:</span>
                <span className="font-mono font-bold">
                  - ₹{Number(invoice.old_gold_deduction || invoice.old_gold?.total_valuation || 0).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Financial Summary & Bank Details */}
            <div className="flex justify-between items-start gap-4 pt-2 border-t border-slate-300 text-[11px]">
              {/* Showroom Bank Info */}
              <div className="w-1/2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5 text-[10px] text-slate-600">
                <span className="font-bold text-slate-900 block mb-1">Showroom Bank & UPI:</span>
                <div>Bank: <span className="font-medium text-slate-800">{storeConfig.bank_name}</span></div>
                <div>A/C: <span className="font-mono font-medium text-slate-800">{storeConfig.bank_account_no}</span></div>
                <div>IFSC: <span className="font-mono font-medium text-slate-800">{storeConfig.bank_ifsc}</span></div>
                <div>UPI ID: <span className="font-mono font-bold text-blue-700">{storeConfig.upi_id}</span></div>
              </div>

              {/* Tax & Total Calculations */}
              <div className="w-1/2 space-y-1">
                <div className="flex justify-between py-0.5 text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-semibold">₹{Math.round(taxableVal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-0.5 text-slate-600">
                  <span>{isCash ? 'GST (Cash 0% Exempt):' : 'CGST (1.5%):'}</span>
                  <span className="font-mono font-semibold">{isCash ? '₹0 (0%)' : `₹${Math.round(cgstVal).toLocaleString('en-IN')}`}</span>
                </div>
                {!isCash && (
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>SGST (1.5%):</span>
                    <span className="font-mono font-semibold">₹{Math.round(sgstVal).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-t-2 border-slate-900 text-sm font-black text-slate-950">
                  <span>NET PAID ({invoice.payment_mode || 'Cash'}):</span>
                  <span className="font-mono text-base">₹{Number(invoice.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Terms & Signatures */}
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-end text-[9px] text-slate-500">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 block">Terms & Conditions:</span>
                <p>1. 100% Certified Authentic Gold & Silver certified under BIS Hallmarking Scheme.</p>
                <p>2. Lifetime buyback facility available at prevalent daily bullion market rates.</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1" />
                <span className="font-bold text-slate-800">Authorized Signatory</span>
              </div>
            </div>

          </div>

          {/* MOBILE SLIP VIEW (For fast screen review) */}
          {viewMode === 'MOBILE_SLIP' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-4 no-print">
              <div className="text-center pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold mx-auto mb-1.5 shadow-lg shadow-amber-500/20">
                  <Gem className="w-4 h-4" />
                </div>
                <h2 className="font-serif font-bold text-sm text-amber-300 tracking-wide">{storeConfig.store_name}</h2>
                <p className="text-[10px] text-slate-400">{storeConfig.address}</p>
                <p className="text-[10px] font-mono text-slate-500">GSTIN: {storeConfig.gstin} | BIS: {storeConfig.bis_hallmark}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">CUSTOMER:</span>
                  <span className="font-bold text-slate-100 block truncate">{invoice.customer_name}</span>
                  {invoice.customer_phone && <span className="text-slate-400 text-[10px] font-mono">{invoice.customer_phone}</span>}
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">INVOICE NO:</span>
                  <span className="font-mono font-bold text-amber-400">{invoice.invoice_no}</span>
                  <span className="text-slate-400 block text-[10px]">
                    {new Date(invoice.created_at || Date.now()).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Purchased Items ({items.length})
                </span>

                {items.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-100 text-xs">{item.title}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                            {item.purity}
                          </span>
                          {item.huid && <span className="font-mono">HUID: {item.huid}</span>}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        ₹{Number(item.total_item_price || item.price || item.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                      <div>Gross: <span className="text-slate-200">{Number(item.gross_weight || item.net_weight || 0).toFixed(3)}g</span></div>
                      <div>Net: <span className="text-slate-200">{Number(item.net_weight || 0).toFixed(3)}g</span></div>
                      <div className="text-right">Rate: <span className="text-slate-200">₹{Number(item.metal_rate_applied || item.rate || 0).toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">₹{Math.round(taxableVal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST (3%):</span>
                  <span className="font-mono text-slate-200">{isCash ? '₹0 (0% Cash)' : `₹${Math.round(cgstVal + sgstVal).toLocaleString('en-IN')}`}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-800 text-xs font-bold text-slate-100">
                  <span>Total Paid ({invoice.payment_mode || 'Cash'}):</span>
                  <span className="font-mono text-amber-400 text-sm">₹{Number(invoice.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
