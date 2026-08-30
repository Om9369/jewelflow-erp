import React, { useState, useEffect } from 'react';
import {
  Hammer,
  Plus,
  CheckCircle2,
  AlertCircle,
  Gem,
  Scale,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function KarigarLedger() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [receiveModalOrder, setReceiveModalOrder] = useState(null);

  // Issue Form State
  const [issueForm, setIssueForm] = useState({
    karigar_name: '',
    karigar_phone: '',
    due_date: '',
    raw_metal_type: 'Gold Bullion',
    raw_metal_purity: '24K (999)',
    raw_metal_weight: '',
    expected_item_type: '22K Antique Necklace',
    expected_pieces: '1',
    agreed_wastage_pct: '1.2',
    notes: ''
  });

  // Receive Form State
  const [receiveForm, setReceiveForm] = useState({
    received_weight: '',
    received_pieces: '1',
    category: 'Necklaces',
    purity: '22K (916)',
    making_charge_value: '550',
    counter_tray: 'Showcase A - Tray 1',
    auto_add_inventory: true,
    notes: ''
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getKarigarOrders();
      if (res.success) {
        setOrders(res.orders);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createKarigarOrder(issueForm);
      if (res.success) {
        setShowIssueModal(false);
        setIssueForm({
          karigar_name: '',
          karigar_phone: '',
          due_date: '',
          raw_metal_type: 'Gold Bullion',
          raw_metal_purity: '24K (999)',
          raw_metal_weight: '',
          expected_item_type: '22K Antique Necklace',
          expected_pieces: '1',
          agreed_wastage_pct: '1.2',
          notes: ''
        });
        loadOrders();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!receiveModalOrder) return;
    try {
      const res = await api.receiveKarigarOrder(receiveModalOrder.id, receiveForm);
      if (res.success) {
        setReceiveModalOrder(null);
        loadOrders();
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
              ARTISAN JOB ORDERS
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Karigar & Bullion Issue Ledger</h2>
          </div>
          <p className="text-xs text-slate-400">
            Issue 24K raw bullion bars to artisans, receive finished hallmarked jewellery, and reconcile wastage %.
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Bullion to Karigar</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">Active Karigar Work Orders</span>
            <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
              {summary.active_orders} Orders
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">Raw Metal Issued (With Artisans)</span>
            <span className="text-2xl font-bold font-mono text-amber-300 mt-1 block">
              {summary.total_metal_weight_issued}g Gold
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">Karigar Wastage Allowance</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              1.0% - 1.5% Standard
            </span>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">Order No</th>
                <th className="py-3 px-4">Artisan / Karigar</th>
                <th className="py-3 px-4">Issued Metal Wt</th>
                <th className="py-3 px-4">Expected Item</th>
                <th className="py-3 px-4">Agreed Wastage</th>
                <th className="py-3 px-4">Received Wt</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                  
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">
                    {ord.order_no}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-100">{ord.karigar_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{ord.karigar_phone}</p>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-amber-300">
                    {ord.raw_metal_weight}g ({ord.raw_metal_purity})
                  </td>

                  <td className="py-3 px-4 text-slate-200">
                    {ord.expected_item_type} ({ord.expected_pieces} pcs)
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-400">
                    {ord.agreed_wastage_pct}%
                  </td>

                  <td className="py-3 px-4 font-mono font-bold">
                    {ord.status === 'COMPLETED' ? (
                      <span className="text-emerald-400">{ord.received_weight}g</span>
                    ) : (
                      <span className="text-slate-500">Pending</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ord.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {ord.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {ord.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => {
                          setReceiveModalOrder(ord);
                          setReceiveForm({
                            ...receiveForm,
                            received_weight: ord.raw_metal_weight.toString(),
                            received_pieces: ord.expected_pieces.toString()
                          });
                        }}
                        className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold"
                      >
                        Receive Goods
                      </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 mb-4 pb-2 border-b border-slate-800">
              Issue Raw Bullion to Karigar
            </h3>

            <form onSubmit={handleIssueSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Karigar / Workshop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sonar Workshop"
                  value={issueForm.karigar_name}
                  onChange={(e) => setIssueForm({ ...issueForm, karigar_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Raw Metal Weight (g) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    placeholder="100.00"
                    value={issueForm.raw_metal_weight}
                    onChange={(e) => setIssueForm({ ...issueForm, raw_metal_weight: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Agreed Wastage %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={issueForm.agreed_wastage_pct}
                    onChange={(e) => setIssueForm({ ...issueForm, agreed_wastage_pct: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Expected Finished Item *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 22K Heritage Filigree Choker (2 pcs)"
                  value={issueForm.expected_item_type}
                  onChange={(e) => setIssueForm({ ...issueForm, expected_item_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Issue Bullion & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {receiveModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Receive Finished Goods: {receiveModalOrder.order_no}
            </h3>
            <p className="text-xs text-slate-400 mb-4 pb-2 border-b border-slate-800">
              Artisan: <span className="text-amber-400 font-bold">{receiveModalOrder.karigar_name}</span> • Issued: {receiveModalOrder.raw_metal_weight}g
            </p>

            <form onSubmit={handleReceiveSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Received Weight (g) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={receiveForm.received_weight}
                    onChange={(e) => setReceiveForm({ ...receiveForm, received_weight: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Pieces Received</label>
                  <input
                    type="number"
                    value={receiveForm.received_pieces}
                    onChange={(e) => setReceiveForm({ ...receiveForm, received_pieces: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Assign Showcase Tray</label>
                <input
                  type="text"
                  value={receiveForm.counter_tray}
                  onChange={(e) => setReceiveForm({ ...receiveForm, counter_tray: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceiveModalOrder(null)}
                  className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                >
                  Confirm & Inward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
