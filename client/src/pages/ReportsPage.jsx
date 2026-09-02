import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  Receipt,
  Printer,
  ShieldCheck,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingUp,
  Truck,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { getStoreConfig } from '../services/storeConfig';

export default function ReportsPage({ onPrintInvoice }) {
  const [activeTab, setActiveTab] = useState('ALL_REPORTS'); // 'ALL_REPORTS' | 'B2C_CASH' | 'B2C_GST' | 'B2B_PURCHASES' | 'STOCK_AUDIT'
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('ALL'); // 'ALL' | '2026-08' | '2026-07' | '2026-06'
  const [searchTerm, setSearchTerm] = useState('');

  const storeConfig = getStoreConfig();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, purRes, ledgRes] = await Promise.all([
        api.getInvoices(),
        api.getPurchases ? api.getPurchases() : { success: true, purchases: [] },
        api.getStockLedger({ movement_type: 'ALL' })
      ]);

      if (invRes && invRes.success) setInvoices(invRes.invoices || []);
      if (purRes && purRes.success) setPurchases(purRes.purchases || []);
      if (ledgRes && ledgRes.success) setLedger(ledgRes.ledger || []);
    } catch (err) {
      console.error('Error loading reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter by Month
  const filterByMonth = (dateStr) => {
    if (selectedMonth === 'ALL') return true;
    if (!dateStr) return true;
    return dateStr.startsWith(selectedMonth);
  };

  // 1. Separate B2C Cash Slips vs B2C GST Invoices vs B2B Challans
  const isInvoiceCash = (inv) => {
    const mode = (inv.payment_mode || '').toUpperCase();
    const tax = Number(inv.tax_amount || inv.gst_amount || 0);
    return mode === 'CASH' || tax === 0;
  };

  const b2cCashInvoices = invoices.filter(inv => {
    return isInvoiceCash(inv) && inv.type !== 'WHOLESALE_CHALLAN' && filterByMonth(inv.created_at);
  });

  const b2cGstInvoices = invoices.filter(inv => {
    return !isInvoiceCash(inv) && inv.type !== 'WHOLESALE_CHALLAN' && filterByMonth(inv.created_at);
  });

  const b2bChallans = invoices.filter(inv => {
    return inv.type === 'WHOLESALE_CHALLAN' && filterByMonth(inv.created_at);
  });

  const filteredPurchases = purchases.filter(p => filterByMonth(p.created_at || p.date));

  // Financial KPI Calculations
  const totalCashSales = b2cCashInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const totalGstSales = b2cGstInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const totalTaxableValue = b2cGstInvoices.reduce((sum, i) => sum + (Number(i.subtotal || i.taxable_amount || (i.total_amount / 1.03)) || 0), 0);
  const totalCgst = b2cGstInvoices.reduce((sum, i) => sum + (Number(i.cgst_amount || ((i.total_amount - (i.total_amount / 1.03)) / 2)) || 0), 0);
  const totalSgst = b2cGstInvoices.reduce((sum, i) => sum + (Number(i.sgst_amount || ((i.total_amount - (i.total_amount / 1.03)) / 2)) || 0), 0);
  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);

  // CSV Helpers
  const downloadCSV = (filename, csvString) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1-Click Master GSTR-1 & Sales CA Export
  const exportMasterGSTR1 = () => {
    const dateTag = selectedMonth === 'ALL' ? new Date().toISOString().slice(0, 10) : selectedMonth;
    let csv = `========================================================================================================\n`;
    csv += `SHOWROOM TAX AUDIT & MONTHLY SALES REPORT - ${storeConfig.store_name}\n`;
    csv += `GSTIN: ${storeConfig.gstin} | Period: ${selectedMonth === 'ALL' ? 'FY 2026-27' : selectedMonth}\n`;
    csv += `Generated On: ${new Date().toLocaleString()}\n`;
    csv += `========================================================================================================\n\n`;

    // SECTION 1: B2C CASH SALES (0% GST - EXEMPT)
    csv += `SECTION 1: B2C CASH SALES SLIPS (0% GST EXEMPT)\n`;
    csv += `Invoice No,Date,Customer Name,Phone,Gross Wt (g),Net Gold Wt (g),Items Count,Total Amount (INR),Payment Mode,GST Rate\n`;
    b2cCashInvoices.forEach(inv => {
      const gross = inv.items?.reduce((s, it) => s + (Number(it.gross_weight) || 0), 0) || 0;
      const net = inv.items?.reduce((s, it) => s + (Number(it.net_weight) || 0), 0) || 0;
      csv += `"${inv.invoice_no}","${new Date(inv.created_at).toLocaleDateString()}","${inv.customer_name || 'Walk-in Customer'}","${inv.customer_phone || '-'}","${gross.toFixed(3)}","${net.toFixed(3)}",${inv.items?.length || 1},${inv.total_amount},"CASH","0%"\n`;
    });
    csv += `Total B2C Cash Sales:,,,,,,,${totalCashSales.toFixed(2)},,\n\n`;

    // SECTION 2: B2C GST INVOICES (3% GST)
    csv += `SECTION 2: B2C GST TAX INVOICES (3% GST - COMPLIANT)\n`;
    csv += `Invoice No,Date,Customer Name,Phone/PAN,Taxable Value (INR),CGST 1.5% (INR),SGST 1.5% (INR),Total GST Tax (INR),Grand Total (INR),Payment Mode\n`;
    b2cGstInvoices.forEach(inv => {
      const taxable = Number(inv.subtotal || inv.taxable_amount || (inv.total_amount / 1.03));
      const cgst = Number(inv.cgst_amount || ((inv.total_amount - taxable) / 2));
      const sgst = Number(inv.sgst_amount || ((inv.total_amount - taxable) / 2));
      const totalTax = cgst + sgst;
      csv += `"${inv.invoice_no}","${new Date(inv.created_at).toLocaleDateString()}","${inv.customer_name || 'Customer'}","${inv.customer_pan || inv.customer_phone || '-'}","${taxable.toFixed(2)}","${cgst.toFixed(2)}","${sgst.toFixed(2)}","${totalTax.toFixed(2)}","${inv.total_amount}","${inv.payment_mode || 'UPI/CARD'}"\n`;
    });
    csv += `Total B2C GST Sales:,,,,${totalTaxableValue.toFixed(2)},${totalCgst.toFixed(2)},${totalSgst.toFixed(2)},${(totalCgst + totalSgst).toFixed(2)},${totalGstSales.toFixed(2)},\n\n`;

    // SECTION 3: B2B PURCHASES & SUPPLIER INWARD CHALLANS
    csv += `SECTION 3: B2B PURCHASES & SUPPLIER INWARD CHALLANS\n`;
    csv += `Voucher No,Date,Supplier Firm,Supplier GSTIN,Gross Weight (g),Net Weight (g),Total Bill (INR),Cash Paid,RTGS Paid,Fine Gold Given (g),Udhar Due (INR)\n`;
    filteredPurchases.forEach(p => {
      csv += `"${p.bill_no || p.id}","${new Date(p.created_at || p.date).toLocaleDateString()}","${p.supplier_name}","${p.supplier_gstin || '-'}","${Number(p.gross_weight || 0).toFixed(3)}","${Number(p.net_weight || 0).toFixed(3)}",${p.total_amount || 0},${p.settlement?.cash_amount || 0},${p.settlement?.bank_transfer_amount || 0},"${Number(p.settlement?.fine_metal_grams || 0).toFixed(3)}g",${p.settlement?.udhar_due || 0}\n`;
    });
    csv += `Total B2B Purchases:,,,,,,${totalPurchasesAmount.toFixed(2)},,,,\n`;

    downloadCSV(`JewelFlow_CA_Tax_Report_${dateTag}.csv`, csv);
  };

  // Export B2C Cash Slips only
  const exportCashSlips = () => {
    let csv = `Invoice No,Date,Customer Name,Phone,Gross Wt (g),Net Gold Wt (g),Total Amount (INR),Payment Mode\n`;
    b2cCashInvoices.forEach(inv => {
      const gross = inv.items?.reduce((s, it) => s + (Number(it.gross_weight) || 0), 0) || 0;
      const net = inv.items?.reduce((s, it) => s + (Number(it.net_weight) || 0), 0) || 0;
      csv += `"${inv.invoice_no}","${new Date(inv.created_at).toLocaleDateString()}","${inv.customer_name || 'Walk-in'}","${inv.customer_phone || '-'}","${gross.toFixed(3)}","${net.toFixed(3)}",${inv.total_amount},"CASH"\n`;
    });
    downloadCSV(`B2C_Cash_Slips_${selectedMonth}.csv`, csv);
  };

  // Export B2C GST Tax Invoices only
  const exportGstInvoices = () => {
    let csv = `Invoice No,Date,Customer Name,Phone/PAN,Taxable Value (INR),CGST 1.5% (INR),SGST 1.5% (INR),Total Tax (INR),Invoice Total (INR),Payment Mode\n`;
    b2cGstInvoices.forEach(inv => {
      const taxable = Number(inv.subtotal || inv.taxable_amount || (inv.total_amount / 1.03));
      const cgst = Number(inv.cgst_amount || ((inv.total_amount - taxable) / 2));
      const sgst = Number(inv.sgst_amount || ((inv.total_amount - taxable) / 2));
      csv += `"${inv.invoice_no}","${new Date(inv.created_at).toLocaleDateString()}","${inv.customer_name || 'Customer'}","${inv.customer_pan || inv.customer_phone || '-'}","${taxable.toFixed(2)}","${cgst.toFixed(2)}","${sgst.toFixed(2)}","${(cgst + sgst).toFixed(2)}","${inv.total_amount}","${inv.payment_mode}"\n`;
    });
    downloadCSV(`B2C_GST_Tax_Invoices_${selectedMonth}.csv`, csv);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              CA & TAX AUDIT
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Monthly Sales Records & GSTR-1 Tax Registers</h2>
          </div>
          <p className="text-xs text-slate-400">
            1-Click CA Excel breakdown into B2C Cash Slips (0% GST), B2C GST Invoices (3%), and B2B Purchase Challans.
          </p>
        </div>

        {/* 1-Click Master Export Button */}
        <button
          onClick={exportMasterGSTR1}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>1-Click Master GSTR-1 CA Export</span>
        </button>
      </div>

      {/* Month Filter & Quick Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">B2C Cash Sales (0% GST)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-bold font-mono text-amber-300">
              ₹{totalCashSales.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{b2cCashInvoices.length} slips</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">B2C GST Taxable Sales (3%)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
              ₹{totalGstSales.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{b2cGstInvoices.length} bills</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Total GST Tax Collected (3%)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-bold font-mono text-blue-400">
              ₹{(totalCgst + totalSgst).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">1.5% CGST + 1.5% SGST</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">B2B Purchases Inwarded</span>
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-bold font-mono text-slate-200">
              ₹{totalPurchasesAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{filteredPurchases.length} inward</span>
          </div>
        </div>

      </div>

      {/* Tabs & Month Selector */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-2 bg-slate-900/80 border border-slate-800 rounded-2xl">
        
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('ALL_REPORTS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ALL_REPORTS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Sales Records ({invoices.length})
          </button>

          <button
            onClick={() => setActiveTab('B2C_CASH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'B2C_CASH'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            💵 B2C Cash Slips ({b2cCashInvoices.length})
          </button>

          <button
            onClick={() => setActiveTab('B2C_GST')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'B2C_GST'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            🏛️ B2C GST Tax Invoices ({b2cGstInvoices.length})
          </button>

          <button
            onClick={() => setActiveTab('B2B_PURCHASES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'B2B_PURCHASES'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            🚚 B2B Purchase Challans ({filteredPurchases.length})
          </button>
        </div>

        {/* Month Selector & Individual Download Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Entire Financial Year (All Time)</option>
              <option value="2026-09" className="bg-slate-900">September 2026 (Current)</option>
              <option value="2026-08" className="bg-slate-900">August 2026</option>
              <option value="2026-07" className="bg-slate-900">July 2026</option>
              <option value="2026-06" className="bg-slate-900">June 2026</option>
            </select>
          </div>

          {activeTab === 'B2C_CASH' && (
            <button
              onClick={exportCashSlips}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-xl border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Cash CSV</span>
            </button>
          )}

          {activeTab === 'B2C_GST' && (
            <button
              onClick={exportGstInvoices}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs rounded-xl border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export GST CSV</span>
            </button>
          )}
        </div>

      </div>

      {/* Main Table Display */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold">
                <th className="py-3 px-4">Invoice / Voucher</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer / Supplier</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Taxable Subtotal</th>
                <th className="py-3 px-4 text-right">GST (3%)</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Payment Mode</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              
              {/* Display Invoices */}
              {(activeTab === 'ALL_REPORTS' || activeTab === 'B2C_CASH' || activeTab === 'B2C_GST') && (
                (activeTab === 'B2C_CASH' ? b2cCashInvoices : activeTab === 'B2C_GST' ? b2cGstInvoices : invoices.filter(i => filterByMonth(i.created_at))).map((inv) => {
                  const isCash = inv.payment_mode === 'CASH' || inv.tax_rate === 0 || inv.gst_amount === 0;
                  const taxable = Number(inv.subtotal || inv.taxable_amount || (inv.total_amount / (isCash ? 1 : 1.03)));
                  const gst = isCash ? 0 : (Number(inv.gst_amount) || (inv.total_amount - taxable));

                  return (
                    <tr key={inv.id || inv.invoice_no} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                        {inv.invoice_no}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {inv.customer_name || 'Walk-in Customer'}
                        {inv.customer_phone && <span className="text-[10px] text-slate-400 block font-mono">{inv.customer_phone}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCash
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}>
                          {isCash ? 'B2C Cash (0% GST)' : 'B2C Tax (3% GST)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        ₹{Math.round(taxable).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-blue-400">
                        {isCash ? '₹0 (0%)' : `₹${Math.round(gst).toLocaleString('en-IN')} (3%)`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                        ₹{Number(inv.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono font-semibold">
                          {inv.payment_mode || (isCash ? 'CASH' : 'UPI/CARD')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onPrintInvoice(inv)}
                          title="Print / View Invoice"
                          className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Bill</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Display Purchases when tab is B2B */}
              {activeTab === 'B2B_PURCHASES' && (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {p.bill_no || p.id}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(p.created_at || p.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {p.supplier_name}
                      {p.supplier_gstin && <span className="text-[10px] text-slate-400 block font-mono">GST: {p.supplier_gstin}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        B2B Stock Inward
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {Number(p.net_weight || 0).toFixed(3)}g
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">
                      {p.settlement?.fine_metal_grams ? `${p.settlement.fine_metal_grams}g Bar` : '₹0'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      ₹{Number(p.total_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[10px]">
                      {p.settlement?.udhar_due > 0 ? (
                        <span className="text-amber-400">Due: ₹{p.settlement.udhar_due}</span>
                      ) : (
                        <span className="text-emerald-400">Settled</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] text-slate-400 font-mono">Voucher Inward</span>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
