import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Gem } from 'lucide-react';

export default function PrintInvoiceModal({ isOpen, onClose, invoice }) {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isWholesale = invoice.type === 'WHOLESALE_CHALLAN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8">
        
        {/* Header & Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {isWholesale ? 'Wholesale B2B Delivery Challan & Invoice' : 'Retail Tax Invoice & Receipt'}
              </h3>
              <p className="text-xs text-slate-400">
                Invoice No: <span className="font-mono text-amber-400 font-bold">{invoice.invoice_no}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div className="printable-area my-4 p-8 bg-white text-slate-900 rounded-xl shadow-xl font-sans text-xs border border-slate-200">
          
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                  <Gem className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-serif font-black tracking-wide text-slate-950">
                  JEWELFLOW FINE JEWELLERS
                </h1>
              </div>
              <p className="text-slate-600 text-[11px]">108, Diamond Heritage Plaza, Zaveri Bazaar, Mumbai - 400002</p>
              <p className="text-slate-600 text-[11px]">Phone: +91 22 2845 9900 | Email: billing@jewelflow.com</p>
              <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold text-slate-800">
                <span>GSTIN: <span className="font-mono">27AAACS1234M1Z5</span></span>
                <span>•</span>
                <span>BIS Hallmark No: <span className="font-mono">HM-IND-916001</span></span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-950 text-white font-bold text-xs rounded tracking-wider uppercase">
                {isWholesale ? 'B2B DELIVERY CHALLAN' : 'TAX INVOICE'}
              </span>
              <p className="text-sm font-mono font-bold text-slate-900 mt-2">{invoice.invoice_no}</p>
              <p className="text-[11px] text-slate-600">
                Date: {new Date(invoice.created_at).toLocaleDateString()} {new Date(invoice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[11px] font-semibold text-amber-800 mt-1">
                Attended By: {invoice.employee_name}
              </p>
            </div>
          </div>

          {/* Customer & Billing Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-[11px]">
            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px]">Billed To / Customer Details</p>
              <p className="text-xs font-bold text-slate-950 mt-0.5">{invoice.customer_name}</p>
              {invoice.customer_phone && <p className="text-slate-700">Phone: {invoice.customer_phone}</p>}
              {invoice.customer_address && <p className="text-slate-700">{invoice.customer_address}</p>}
            </div>

            <div className="text-right">
              <p className="text-slate-500 font-bold uppercase text-[10px]">Payment & Settlement</p>
              <p className="font-bold text-slate-900 mt-0.5">Mode: {invoice.payment_mode}</p>
              <p className="text-emerald-700 font-bold">Status: {invoice.status}</p>
              {invoice.fine_gold_settlement_grams > 0 && (
                <p className="text-blue-800 font-mono font-bold">
                  Fine Gold Received: {invoice.fine_gold_settlement_grams}g (99.9%)
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left border-collapse mb-4">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">Item Description</th>
                <th className="py-2 px-2">Purity</th>
                <th className="py-2 px-2 text-right">Gross Wt</th>
                <th className="py-2 px-2 text-right">Net Wt</th>
                <th className="py-2 px-2 text-right">Rate/g</th>
                <th className="py-2 px-2 text-right">Making</th>
                <th className="py-2 px-2 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-2 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <div className="text-[10px] text-slate-500 flex gap-2 font-mono">
                      <span>SKU: {item.sku}</span>
                      {item.stone_price > 0 && <span>Stone: ₹{item.stone_price.toLocaleString()}</span>}
                    </div>
                  </td>
                  <td className="py-2 px-2 font-semibold text-slate-800">{item.purity}</td>
                  <td className="py-2 px-2 text-right font-mono">{Number(item.gross_weight).toFixed(3)}g</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">{Number(item.net_weight).toFixed(3)}g</td>
                  <td className="py-2 px-2 text-right font-mono">₹{item.metal_rate_applied?.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right font-mono">₹{item.making_charge?.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-950">
                    ₹{item.total_item_price?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & Breakup */}
          <div className="flex justify-between items-start pt-2 border-t border-slate-300">
            <div className="w-1/2 pr-4 space-y-2">
              {invoice.old_gold && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-[10px]">
                  <p className="font-bold text-amber-900 uppercase">Old Gold Exchange Adjustment</p>
                  <p className="text-slate-700 mt-0.5">
                    Received {invoice.old_gold.net_weight}g scrap ({invoice.old_gold.purity_touch_pct}% touch) @ ₹{invoice.old_gold.valuation_rate_per_gram}/g
                  </p>
                  <p className="font-bold text-emerald-800 mt-0.5">
                    Credit Value: -₹{invoice.old_gold.total_valuation?.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="text-[10px] text-slate-500 leading-relaxed">
                <p className="font-bold text-slate-700">Terms & Conditions:</p>
                <p>1. Gold purity is guaranteed with official BIS Hallmark certification.</p>
                <p>2. Making charges and GST are not refundable upon return/exchange.</p>
                <p>3. Lifetime buyback/exchange at prevalent daily market metal rates.</p>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="w-1/2 pl-4 space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Subtotal (Metal + Stones):</span>
                <span className="font-mono font-semibold">₹{invoice.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Making Charges:</span>
                <span className="font-mono font-semibold">₹{invoice.making_charges?.toLocaleString()}</span>
              </div>
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">GST (3% - CGST 1.5% + SGST 1.5%):</span>
                  <span className="font-mono font-semibold">₹{invoice.tax_amount?.toLocaleString()}</span>
                </div>
              )}
              {invoice.old_gold_deduction > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-semibold">
                  <span>Old Gold Deduction:</span>
                  <span className="font-mono">-₹{invoice.old_gold_deduction?.toLocaleString()}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700 font-semibold">
                  <span>Special Discount:</span>
                  <span className="font-mono">-₹{invoice.discount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-950">
                <span>NET PAYABLE AMOUNT:</span>
                <span className="font-mono text-base">₹{invoice.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-10 mt-6 border-t border-slate-200 text-center text-[10px]">
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto mb-1" />
              <p className="font-semibold text-slate-700">Customer Signature</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto mb-1" />
              <p className="font-semibold text-slate-700">For JEWELFLOW FINE JEWELLERS</p>
              <p className="text-slate-500">Authorized Signatory</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
