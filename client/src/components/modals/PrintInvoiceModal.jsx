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
  Share2
} from 'lucide-react';
import { downloadInvoicePDF, shareInvoicePDFOnWhatsApp } from '../../services/pdfGenerator';

export default function PrintInvoiceModal({ isOpen, onClose, invoice }) {
  const [viewMode, setViewMode] = useState('MOBILE_SLIP'); // 'MOBILE_SLIP' | 'A4_INVOICE'
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(invoice?.customer_phone || '');
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen || !invoice) return null;

  const isWholesale = invoice.type === 'WHOLESALE_CHALLAN';

  // 1-Click WhatsApp PDF Sharing Action
  const handleSharePDF = async () => {
    try {
      setIsSharing(true);
      await shareInvoicePDFOnWhatsApp(invoice, customPhone);
    } catch (err) {
      console.error('PDF WhatsApp Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  // 1-Click Direct PDF Download
  const handleDownloadPDF = () => {
    downloadInvoicePDF(invoice);
  };

  // Plain Text WhatsApp Message (Alternative)
  const generateWhatsAppMessage = () => {
    const itemsList = (invoice.items || []).map((item, i) => {
      const gWt = Number(item.gross_weight || 0).toFixed(3);
      const nWt = Number(item.net_weight || 0).toFixed(3);
      const rate = item.metal_rate_applied ? `₹${item.metal_rate_applied.toLocaleString('en-IN')}/g` : '';
      const price = item.total_item_price ? `₹${item.total_item_price.toLocaleString('en-IN')}` : '';
      return `${i + 1}. *${item.title}*\n   • Purity: ${item.purity || '22K'} ${item.huid ? `| HUID: ${item.huid}` : ''}\n   • Wt: ${gWt}g (${nWt}g Net) ${rate ? `| Rate: ${rate}` : ''}\n   • Total: ${price}`;
    }).join('\n\n');

    const oldGoldNote = invoice.old_gold ? `\n• *Old Gold Credit:* -₹${Number(invoice.old_gold.total_valuation || invoice.old_gold_deduction || 0).toLocaleString('en-IN')} (${invoice.old_gold.net_weight || 0}g scrap)` : '';

    const text = `✨ *JEWELFLOW FINE JEWELLERS* ✨
💎 *${isWholesale ? 'B2B DELIVERY CHALLAN' : 'TAX INVOICE & RECEIPT'}*
📄 *Invoice No:* ${invoice.invoice_no}
📅 *Date:* ${new Date(invoice.created_at || Date.now()).toLocaleDateString('en-IN')}
👤 *Customer:* ${invoice.customer_name || 'Valued Customer'}
🏛️ *GSTIN:* 27AAACS1234M1Z5 | *BIS:* HM-IND-916001
━━━━━━━━━━━━━━━━━━━━
📦 *PURCHASED ITEMS:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT SUMMARY:*
• Subtotal: ₹${Number(invoice.subtotal || invoice.total_amount || 0).toLocaleString('en-IN')}
• Making Charges: ₹${Number(invoice.making_charges_total || invoice.making_charges || 0).toLocaleString('en-IN')}
• GST (3%): ₹${Number(invoice.gst_amount || invoice.tax_amount || 0).toLocaleString('en-IN')}${oldGoldNote}
${invoice.discount > 0 ? `• Special Discount: -₹${Number(invoice.discount).toLocaleString('en-IN')}\n` : ''}• *NET PAID:* *₹${Number(invoice.total_amount || 0).toLocaleString('en-IN')}* (${invoice.payment_mode || 'UPI'})
• Attended By: ${invoice.employee_name || 'Store Executive'}
━━━━━━━━━━━━━━━━━━━━
✅ *100% Certified BIS Hallmarked Gold & Silver*
📍 *JewelFlow Flagship Store, Zaveri Bazaar, Mumbai*`;

    return encodeURIComponent(text);
  };

  const handleSendWhatsAppText = () => {
    let phone = (customPhone || invoice.customer_phone || '').replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const msg = generateWhatsAppMessage();
    const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const rawText = decodeURIComponent(generateWhatsAppMessage());
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 no-print flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{isWholesale ? 'Wholesale Challan' : 'Retail Tax Invoice'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {invoice.invoice_no}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">PDF document ready for WhatsApp dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setViewMode('MOBILE_SLIP')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'MOBILE_SLIP'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Slip</span>
              </button>
              <button
                onClick={() => setViewMode('A4_INVOICE')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'A4_INVOICE'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Tax Bill</span>
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

        {/* WhatsApp & PDF Dispatch Action Bar */}
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

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Primary Action: Share PDF directly on WhatsApp */}
            <button
              onClick={handleSharePDF}
              disabled={isSharing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              title="Send real PDF document directly to WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isSharing ? 'Generating PDF...' : 'Share PDF on WhatsApp'}</span>
            </button>

            {/* Direct PDF Download */}
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
              title="Download official PDF to phone/computer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>PDF</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1"
              title="Print standard Tax Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Scrollable Invoice Document Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          
          {/* VIEW MODE 1: MOBILE DIGITAL SLIP (Optimized specifically for phone screens) */}
          {viewMode === 'MOBILE_SLIP' ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-4">
              
              {/* Store Identity */}
              <div className="text-center pb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold mx-auto mb-2 shadow-lg shadow-amber-500/20">
                  <Gem className="w-5 h-5" />
                </div>
                <h2 className="font-serif font-bold text-base text-amber-300 tracking-wide">
                  JEWELFLOW FINE JEWELLERS
                </h2>
                <p className="text-[10px] text-slate-400">108 Diamond Heritage Plaza, Zaveri Bazaar, Mumbai</p>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">GSTIN: 27AAACS1234M1Z5 | BIS: HM-IND-916001</p>
              </div>

              {/* Customer & Invoice Meta Details */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]">
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

              {/* Mobile Item Cards */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Purchased Items ({invoice.items?.length || 1})
                </span>

                {(invoice.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-100 text-xs">{item.title}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                          <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                            {item.purity}
                          </span>
                          {item.huid && <span className="font-mono">HUID: {item.huid}</span>}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-400 text-sm whitespace-nowrap">
                        ₹{(item.total_item_price || item.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                      <div>Gross: <span className="text-slate-200 font-semibold">{Number(item.gross_weight || 0).toFixed(3)}g</span></div>
                      <div>Net: <span className="text-slate-200 font-semibold">{Number(item.net_weight || 0).toFixed(3)}g</span></div>
                      <div className="text-right">Rate: <span className="text-slate-200 font-semibold">₹{item.metal_rate_applied?.toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation Breakup */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">₹{(invoice.subtotal || invoice.total_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Making Charges:</span>
                  <span className="font-mono text-slate-200">₹{(invoice.making_charges_total || invoice.making_charges || 0).toLocaleString('en-IN')}</span>
                </div>
                {(invoice.gst_amount > 0 || invoice.tax_amount > 0) && (
                  <div className="flex justify-between text-slate-400">
                    <span>GST (3%):</span>
                    <span className="font-mono text-slate-200">₹{(invoice.gst_amount || invoice.tax_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {invoice.old_gold && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Old Gold Exchange Deduction:</span>
                    <span className="font-mono">-₹{(invoice.old_gold.total_valuation || invoice.old_gold_deduction || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-rose-400 font-semibold">
                    <span>Special Discount:</span>
                    <span className="font-mono">-₹{Number(invoice.discount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-slate-100">
                  <span>Total Paid ({invoice.payment_mode}):</span>
                  <span className="font-mono text-amber-400 text-base">₹{Number(invoice.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-slate-500 pt-1">
                <p>100% Certified BIS Hallmark • Lifetime Buyback Policy</p>
                <p className="text-slate-600 mt-0.5">Thank you for shopping with JewelFlow!</p>
              </div>

            </div>
          ) : (
            /* VIEW MODE 2: FORMAL A4 PRINTABLE TAX INVOICE */
            <div className="printable-area p-4 sm:p-6 bg-white text-slate-900 rounded-xl shadow-xl font-sans text-xs border border-slate-200 overflow-x-auto">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-4 mb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                      <Gem className="w-5 h-5" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-serif font-black tracking-wide text-slate-950">
                      JEWELFLOW FINE JEWELLERS
                    </h1>
                  </div>
                  <p className="text-slate-600 text-[10px] sm:text-[11px]">108, Diamond Heritage Plaza, Zaveri Bazaar, Mumbai - 400002</p>
                  <p className="text-slate-600 text-[10px] sm:text-[11px]">Phone: +91 22 2845 9900 | GSTIN: 27AAACS1234M1Z5</p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-2.5 py-0.5 bg-slate-950 text-white font-bold text-[10px] rounded uppercase">
                    {isWholesale ? 'B2B CHALLAN' : 'TAX INVOICE'}
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">{invoice.invoice_no}</p>
                  <p className="text-[10px] text-slate-600">
                    Date: {new Date(invoice.created_at || Date.now()).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Customer Box */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-[11px]">
                <div>
                  <p className="text-slate-500 font-bold uppercase text-[9px]">Billed To</p>
                  <p className="font-bold text-slate-950">{invoice.customer_name}</p>
                  {invoice.customer_phone && <p className="text-slate-600">{invoice.customer_phone}</p>}
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-bold uppercase text-[9px]">Payment Mode</p>
                  <p className="font-bold text-slate-900">{invoice.payment_mode || 'UPI'}</p>
                  <p className="text-emerald-700 font-semibold">Status: PAID</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse mb-4 min-w-[480px]">
                  <thead>
                    <tr className="border-b-2 border-slate-900 bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2">Purity</th>
                      <th className="py-2 px-2 text-right">Gross Wt</th>
                      <th className="py-2 px-2 text-right">Net Wt</th>
                      <th className="py-2 px-2 text-right">Rate/g</th>
                      <th className="py-2 px-2 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {(invoice.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-2">
                          <p className="font-bold text-slate-900">{item.title}</p>
                          {item.huid && <p className="text-[9px] font-mono text-slate-500">HUID: {item.huid}</p>}
                        </td>
                        <td className="py-2 px-2 font-semibold">{item.purity}</td>
                        <td className="py-2 px-2 text-right font-mono">{Number(item.gross_weight || 0).toFixed(3)}g</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">{Number(item.net_weight || 0).toFixed(3)}g</td>
                        <td className="py-2 px-2 text-right font-mono">₹{item.metal_rate_applied?.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-950">
                          ₹{(item.total_item_price || item.price || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2 border-t border-slate-300 text-[11px]">
                <div className="w-full sm:w-1/2 text-[10px] text-slate-500 leading-relaxed">
                  <p className="font-bold text-slate-700">Terms & Hallmarking Guarantee:</p>
                  <p>1. Gold purity certified under official BIS Hallmarking.</p>
                  <p>2. Making charges and GST are subject to statutory norms.</p>
                </div>

                <div className="w-full sm:w-1/2 space-y-1">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-mono font-semibold">₹{(invoice.subtotal || invoice.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Making Charges:</span>
                    <span className="font-mono font-semibold">₹{(invoice.making_charges_total || invoice.making_charges || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">GST (3%):</span>
                    <span className="font-mono font-semibold">₹{(invoice.gst_amount || invoice.tax_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-950">
                    <span>NET TOTAL:</span>
                    <span className="font-mono text-base">₹{Number(invoice.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
