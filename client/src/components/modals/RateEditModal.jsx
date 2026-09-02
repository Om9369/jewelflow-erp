import React, { useState, useEffect } from 'react';
import { X, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function RateEditModal({ isOpen, onClose, rates, onRatesUpdated }) {
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (rates && rates.length > 0) {
      setFormData(rates.map(r => ({
        ...r,
        key: r._id || r.id || `${r.metal}_${r.purity}`
      })));
    }
  }, [rates, isOpen]);

  if (!isOpen) return null;

  const handleChange = (uniqueKey, newRate) => {
    setFormData(prev =>
      prev.map(item => {
        const k = item.key || item._id || item.id || `${item.metal}_${item.purity}`;
        return k === uniqueKey ? { ...item, rate_per_gram: newRate } : item;
      })
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = formData.map(r => ({
        _id: r._id,
        id: r.id,
        metal: r.metal,
        purity: r.purity,
        rate_per_gram: parseFloat(r.rate_per_gram) || 0
      }));
      const res = await api.bulkUpdateRates(payload);
      if (res.success) {
        onRatesUpdated(res.rates);
        setMessage('Rates updated successfully! All stock valuations recalculated.');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Update Daily Metal Bullion Rates</h3>
              <p className="text-xs text-slate-400">All POS calculations and stock valuations update dynamically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Rates Table / Inputs */}
        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <div className="max-h-[340px] overflow-y-auto space-y-2.5 pr-1">
            {formData.map((item) => {
              const uniqueKey = item.key || item._id || item.id || `${item.metal}_${item.purity}`;
              return (
                <div
                  key={uniqueKey}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400">{item.metal}</span>
                      <span className="text-xs font-semibold text-slate-200">{item.purity}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Last updated: {item.updated_at ? new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">₹/g</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={item.rate_per_gram}
                      onChange={(e) => handleChange(uniqueKey, e.target.value)}
                      className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-right font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Changes take effect immediately across all counters
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                {loading ? 'Saving...' : 'Apply Live Rates'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
