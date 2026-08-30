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
  Printer
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportsPage({ onPrintInvoice }) {
  const [activeTab, setActiveTab] = useState('LEDGER');
  const [ledger, setLedger] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [movementFilter, setMovementFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [movementFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ledgRes, invRes] = await Promise.all([
        api.getStockLedger({ movement_type: movementFilter }),
        api.getInvoices()
      ]);
      if (ledgRes.success) setLedger(ledgRes.ledger);
      if (invRes.success) setInvoices(invRes.invoices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (activeTab === 'LEDGER') {
      const headers = ['Timestamp', 'Type', 'SKU', 'Title', 'Gross Wt (g)', 'Net Wt (g)', 'Reference', 'Notes'];
      const rows = ledger.map(l => [
        `"${new Date(l.timestamp).toLocaleString()}"`,
        `"${l.movement_type}"`,
        `"${l.sku || ''}"`,
        `"${l.title || ''}"`,
        l.gross_weight,
        l.net_weight,
        `"${l.reference_id || ''}"`,
        `"${l.notes || ''}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `JewelFlow_Stock_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Invoice No', 'Type', 'Customer', 'Employee Attributed', 'Total Amount (₹)', 'Payment Mode', 'Date'];
      const rows = invoices.map(inv => [
        `"${inv.invoice_no}"`,
        `"${inv.type}"`,
        `"${inv.customer_name}"`,
        `"${inv.employee_name}"`,
        inv.total_amount,
        `"${inv.payment_mode}"`,
        `"${new Date(inv.created_at).toLocaleString()}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `JewelFlow_Sales_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              AUDIT & LEDGERS
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Stock Movements & Sales Ledger</h2>
          </div>
          <p className="text-xs text-slate-400">
            Immutable audit log of all inward, sales, karigar issues, old gold scrap receipts, and tax invoices.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 shadow transition-all"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export to CSV / Excel</span>
        </button>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'LEDGER'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Real-time Stock Movement Ledger ({ledger.length})
          </button>
          <button
            onClick={() => setActiveTab('SALES')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'SALES'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sales Invoices Register ({invoices.length})
          </button>
        </div>

        {activeTab === 'LEDGER' && (
          <select
            value={movementFilter}
            onChange={(e) => setMovementFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="ALL">All Stock Movements</option>
            <option value="IN_PURCHASE">Stock Inward / Purchase</option>
            <option value="OUT_RETAIL_SALE">Showroom Retail Sales</option>
            <option value="OUT_WHOLESALE">Wholesale B2B Dispatches</option>
            <option value="OUT_KARIGAR_ISSUE">Issued to Karigar</option>
            <option value="IN_KARIGAR">Received from Karigar</option>
            <option value="IN_OLD_GOLD">Old Gold Buyback</option>
          </select>
        )}
      </div>

      {/* Main Table */}
      {activeTab === 'LEDGER' ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4">Item / Description</th>
                  <th className="py-3 px-4 text-right">Gross Wt</th>
                  <th className="py-3 px-4 text-right">Net Wt</th>
                  <th className="py-3 px-4">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {ledger.map((entry) => {
                  const isInward = entry.movement_type.startsWith('IN_');

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors font-mono">
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                          isInward
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {isInward ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {entry.movement_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <p className="font-bold text-slate-100">{entry.title}</p>
                        {entry.sku && <p className="text-[10px] text-slate-400 font-mono">{entry.sku}</p>}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-300 font-bold">
                        {Number(entry.gross_weight).toFixed(3)}g
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-amber-300">
                        {Number(entry.net_weight).toFixed(3)}g
                      </td>

                      <td className="py-3 px-4 font-sans text-slate-300 text-[11px]">
                        <span className="font-mono text-[10px] text-slate-400 block">{entry.reference_id}</span>
                        {entry.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Customer / Party</th>
                  <th className="py-3 px-4">Attributed Staff</th>
                  <th className="py-3 px-4 text-right">Items</th>
                  <th className="py-3 px-4 text-right">Total Net Wt</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {inv.invoice_no}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.type === 'WHOLESALE_CHALLAN'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {inv.type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-100">{inv.customer_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{inv.customer_phone}</p>
                    </td>

                    <td className="py-3 px-4 font-semibold text-amber-300">
                      {inv.employee_name}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {inv.item_count} pcs
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                      {inv.total_net_grams}g
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      ₹{inv.total_amount?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onPrintInvoice(inv)}
                        className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                        title="View / Print Tax Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
