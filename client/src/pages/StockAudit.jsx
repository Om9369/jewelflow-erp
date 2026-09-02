import React, { useState, useEffect } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Layers,
  History,
  ShieldAlert,
  Search,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function StockAudit() {
  const [trays, setTrays] = useState([]);
  const [audits, setAudits] = useState([]);
  const [selectedTray, setSelectedTray] = useState(null);
  const [physCount, setPhysCount] = useState('');
  const [physWeight, setPhysWeight] = useState('');
  const [auditedBy, setAuditedBy] = useState('Store Manager');
  const [notes, setNotes] = useState('');
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trayRes, histRes] = await Promise.all([
        api.getTrayList(),
        api.getAuditHistory()
      ]);
      if (trayRes.success) {
        setTrays(trayRes.trays);
        if (trayRes.trays.length > 0) {
          selectTray(trayRes.trays[0]);
        }
      }
      if (histRes.success) setAudits(histRes.audits);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectTray = (tray) => {
    setSelectedTray(tray);
    setPhysCount(tray.items_count.toString());
    setPhysWeight(tray.total_gross_weight.toString());
    setAuditResult(null);
  };

  const handleSubmitAudit = async (e) => {
    e.preventDefault();
    if (!selectedTray) return;

    try {
      const payload = {
        tray_name: selectedTray.tray_name || 'Showcase Tray',
        category: selectedTray.categories ? Object.keys(selectedTray.categories).join(', ') : (selectedTray.category || 'All'),
        metal_type: selectedTray.metals ? Object.keys(selectedTray.metals).join(', ') : (selectedTray.metal_type || 'Gold'),
        physical_items_count: parseInt(physCount) || 0,
        physical_total_weight: parseFloat(physWeight) || 0,
        audited_by: auditedBy,
        notes: notes
      };

      const submitFn = api.submitTrayAudit || api.submitAudit;
      const res = await submitFn(payload);
      if (res && res.success) {
        setAuditResult(res.variance || { variance_pieces: 0, variance_weight: 0, status: 'RECONCILED' });
        loadData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const pWeight = parseFloat(physWeight) || 0;
  const sysWeight = selectedTray ? selectedTray.total_gross_weight : 0;
  const liveVariance = parseFloat((pWeight - sysWeight).toFixed(3));

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              PHYSICAL AUDIT & RECONCILIATION
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Showcase & Tray Stock Verification</h2>
          </div>
          <p className="text-xs text-slate-400">
            Reconcile physical weighing scale measurements against ERP expected stock to prevent in-store theft and weight leakage.
          </p>
        </div>
      </div>

      {/* Grid: Left (Trays List), Right (Weighing Scale Auditor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 5 Cols: Trays */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Showcase Trays & Vault Drawers ({trays.length})
          </h3>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {trays.map((tray, idx) => {
              const isSelected = selectedTray?.tray_name === tray.tray_name;

              return (
                <div
                  key={idx}
                  onClick={() => selectTray(tray)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 text-slate-100 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {tray.items_count || 0} pcs • {typeof tray.categories === 'object' && tray.categories ? Object.keys(tray.categories).join(', ') : (tray.category || 'All')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-amber-300 block">{tray.total_gross_weight}g</span>
                    <span className="text-[10px] text-slate-400">Gross Weight</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Physical Scale Weighing Auditor */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTray && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span>Auditing: {selectedTray.tray_name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">Place the entire tray on precision scale and enter reading</p>
                </div>

                <span className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-950 text-amber-400 border border-slate-800 rounded-lg">
                  Expected: {selectedTray.total_gross_weight}g
                </span>
              </div>

              {/* Items in Tray Details */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Registered Tray Contents ({selectedTray.items?.length || 0} items):
                </p>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {(selectedTray.items || []).map((it, itemIdx) => (
                    <div key={it.id || itemIdx} className="flex justify-between text-slate-300 font-mono text-[11px]">
                      <span>{it.title} ({it.sku})</span>
                      <span className="text-amber-400 font-bold">{it.gross_weight}g</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Audit Input Form */}
              <form onSubmit={handleSubmitAudit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Physical Scale Reading (Gross Grams) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={physWeight}
                      onChange={(e) => setPhysWeight(e.target.value)}
                      className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Counted Pieces *
                    </label>
                    <input
                      type="number"
                      required
                      value={physCount}
                      onChange={(e) => setPhysCount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Auditor / Manager</label>
                    <input
                      type="text"
                      value={auditedBy}
                      onChange={(e) => setAuditedBy(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Audit Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Verified by night shift supervisor"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                </div>

                {/* Variance Live Indicator Box */}
                <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
                  Math.abs(liveVariance) <= 0.05
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <div className="flex items-center gap-2">
                    {Math.abs(liveVariance) <= 0.05 ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-sm">
                        {Math.abs(liveVariance) <= 0.05 ? 'Weight Perfectly Reconciled' : 'Weight Discrepancy Detected!'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {Math.abs(liveVariance) <= 0.05
                          ? 'Physical scale matches system catalog within 0.05g tolerance.'
                          : 'Variance exceeds acceptable limits. Immediate manager inspection required.'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Variance (Diff):</span>
                    <span className="font-bold text-base">
                      {liveVariance > 0 ? `+${liveVariance}g` : `${liveVariance}g`}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Physical Audit Log & Seal Tray</span>
                </button>
              </form>

            </div>
          )}

          {/* Audit History Log */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-400" />
              Recent Tray Audit History
            </h3>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {audits.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No audits recorded yet.</p>
              ) : (
                audits.map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-slate-200">{a.tray_name}</span>
                      <span className="text-[10px] text-slate-500 block">
                        {a.audit_date} by {a.audited_by}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`font-bold ${a.status === 'RECONCILED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {a.variance_weight > 0 ? `+${a.variance_weight}g` : `${a.variance_weight}g`}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{a.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
