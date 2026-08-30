import React, { useState, useEffect } from 'react';
import {
  Coins,
  Plus,
  Scale,
  DollarSign,
  AlertCircle,
  Receipt,
  Sparkles,
  CheckCircle2,
  Gem
} from 'lucide-react';
import { api } from '../services/api';

export default function OldGoldPage({ rates }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const gold24k = rates?.find(r => r.metal === 'Gold' && r.purity.includes('24K'))?.rate_per_gram || 7250;

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    gross_weight: '',
    stone_dust_deduction: '0',
    purity_touch_pct: '87.5',
    valuation_rate_per_gram: (gold24k * 0.88).toFixed(0),
    settlement_mode: 'CASH_PAYOUT',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getOldGold();
      if (res.success) {
        setTransactions(res.transactions);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const gWt = parseFloat(form.gross_weight) || 0;
  const dust = parseFloat(form.stone_dust_deduction) || 0;
  const nWt = Math.max(0, gWt - dust);
  const touch = parseFloat(form.purity_touch_pct) || 87.5;
  const fineGold = (nWt * touch) / 100;
  const rate = parseFloat(form.valuation_rate_per_gram) || 6250;
  const totalValuation = Math.round(fineGold * rate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createOldGold(form);
      if (res.success) {
        setShowModal(false);
        setForm({
          customer_name: '',
          customer_phone: '',
          gross_weight: '',
          stone_dust_deduction: '0',
          purity_touch_pct: '87.5',
          valuation_rate_per_gram: (gold24k * 0.88).toFixed(0),
          settlement_mode: 'CASH_PAYOUT',
          notes: ''
        });
        loadData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              OLD GOLD EXCHANGE & SCRAP
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Customer Old Gold & Scrap Valuation</h2>
          </div>
          <p className="text-xs text-slate-400">
            Valuate walk-in scrap jewellery with touch testing, dust deduction, and pure gold valuation rates.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Old Gold Buyback</span>
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">Total Scrap Gold Purchased</span>
            <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
              {summary.total_scrap_weight_grams}g Scrap Weight
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">Total Payouts & Invoice Credits</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              ₹{summary.total_valuation_paid_or_credited.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Gross Wt</th>
                <th className="py-3 px-4 text-right">Net Wt</th>
                <th className="py-3 px-4 text-right">Touch %</th>
                <th className="py-3 px-4 text-right">Fine Gold</th>
                <th className="py-3 px-4 text-right">Valuation (₹)</th>
                <th className="py-3 px-4">Settlement Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">
                    {tx.receipt_no}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-100">{tx.customer_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{tx.customer_phone}</p>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {Number(tx.gross_weight).toFixed(3)}g
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                    {Number(tx.net_weight).toFixed(3)}g
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {tx.purity_touch_pct}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-400">
                    {Number(tx.fine_gold_weight).toFixed(3)}g
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    ₹{tx.total_valuation?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-300">
                      {tx.settlement_mode}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 mb-4 pb-2 border-b border-slate-800">
              New Customer Old Gold Buyback
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Gross Scrap Wt (g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.gross_weight}
                    onChange={(e) => setForm({ ...form, gross_weight: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Purity / Touch % *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={form.purity_touch_pct}
                    onChange={(e) => setForm({ ...form, purity_touch_pct: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Valuation Rate (₹/g pure)</label>
                  <input
                    type="number"
                    value={form.valuation_rate_per_gram}
                    onChange={(e) => setForm({ ...form, valuation_rate_per_gram: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Settlement Mode</label>
                  <select
                    value={form.settlement_mode}
                    onChange={(e) => setForm({ ...form, settlement_mode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="CASH_PAYOUT">Cash Payout</option>
                    <option value="INVOICE_CREDIT">Invoice Credit</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 flex justify-between font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Fine Gold (99.9%):</span>
                  <span className="font-bold text-blue-400">{fineGold.toFixed(3)}g</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Payout:</span>
                  <span className="font-bold text-emerald-400 text-sm">₹{totalValuation.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Record Buyback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
