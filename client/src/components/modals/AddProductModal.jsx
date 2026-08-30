import React, { useState } from 'react';
import { X, Plus, Layers, Sparkles, Scale, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function AddProductModal({ isOpen, onClose, onProductAdded, rates }) {
  const [itemType, setItemType] = useState('RETAIL_SINGLE');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Necklaces',
    metal_type: 'Gold',
    purity: '22K (916)',
    gross_weight: '',
    stone_weight: '0',
    stone_type: 'None',
    stone_cents: '0',
    stone_price: '0',
    wastage_pct: '1.5',
    making_charge_type: 'PER_GRAM',
    making_charge_value: '450',
    huid: '',
    counter_tray: 'Showcase A - Tray 1',
    pieces: '1',
    cost_price: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const grossWt = parseFloat(formData.gross_weight) || 0;
  const stoneWt = parseFloat(formData.stone_weight) || 0;
  const netWt = Math.max(0, parseFloat((grossWt - stoneWt).toFixed(3)));

  // Touch % based on purity
  let touchPct = 91.6;
  if (formData.purity.includes('24K')) touchPct = 99.9;
  else if (formData.purity.includes('22K')) touchPct = 91.6;
  else if (formData.purity.includes('18K')) touchPct = 75.0;
  else if (formData.purity.includes('14K')) touchPct = 58.5;
  else if (formData.purity.includes('999')) touchPct = 99.9;
  else if (formData.purity.includes('925')) touchPct = 92.5;

  const fineGoldEquiv = parseFloat(((netWt * touchPct) / 100).toFixed(3));

  // Current rate estimation
  const rateItem = rates?.find(r => r.metal === formData.metal_type && r.purity === formData.purity);
  const currentRate = rateItem?.rate_per_gram || (formData.metal_type === 'Gold' ? 6750 : 88);
  const metalVal = netWt * currentRate;
  const makingVal = formData.making_charge_type === 'FIXED'
    ? (parseFloat(formData.making_charge_value) || 0)
    : (netWt * (parseFloat(formData.making_charge_value) || 0));
  const stoneVal = parseFloat(formData.stone_price) || 0;
  const estTotal = Math.round(metalVal + makingVal + stoneVal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.title || !formData.gross_weight) {
      setError('Please fill in title and gross weight');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        item_type: itemType,
        gross_weight: grossWt,
        stone_weight: stoneWt,
        stone_cents: parseFloat(formData.stone_cents) || 0,
        stone_price: stoneVal,
        wastage_pct: parseFloat(formData.wastage_pct) || 0,
        making_charge_value: parseFloat(formData.making_charge_value) || 0,
        pieces: parseInt(formData.pieces) || 1,
        cost_price: parseFloat(formData.cost_price) || 0
      };

      const res = await api.createProduct(payload);
      if (res.success) {
        onProductAdded(res.product);
        onClose();
      } else {
        setError(res.error || 'Failed to add product');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Stock Inward / Add Jewellery Item</h3>
              <p className="text-xs text-slate-400">Record showroom jewellery with Gross/Net weights, HUID, and Tray location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300 block mb-1">Item Title / Description *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kundan Heritage Necklace, 22K Casting Rings Lot..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Necklaces">Necklaces</option>
                <option value="Bangles">Bangles & Bracelets</option>
                <option value="Rings">Rings</option>
                <option value="Earrings">Earrings & Jhumkas</option>
                <option value="Chains">Chains</option>
                <option value="Mangalsutra">Mangalsutra</option>
                <option value="Pendants">Pendants</option>
                <option value="Coins & Bars">Coins & Bars</option>
                <option value="Pooja Items">Pooja Silver</option>
                <option value="Payal">Payal</option>
              </select>
            </div>

            {/* Metal & Purity */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Metal</label>
                <select
                  value={formData.metal_type}
                  onChange={(e) => setFormData({ ...formData, metal_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Purity</label>
                <select
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {formData.metal_type === 'Gold' ? (
                    <>
                      <option value="22K (916)">22K (916)</option>
                      <option value="24K (999)">24K (999 Pure)</option>
                      <option value="18K (750)">18K (750 Diamond)</option>
                      <option value="14K (585)">14K (585)</option>
                    </>
                  ) : formData.metal_type === 'Silver' ? (
                    <>
                      <option value="999 Fine">999 Fine</option>
                      <option value="925 Sterling">925 Sterling</option>
                    </>
                  ) : (
                    <option value="950 Pure">950 Pure</option>
                  )}
                </select>
              </div>
            </div>

            {/* Weights Section */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Gross Weight (grams) *</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                placeholder="0.000"
                value={formData.gross_weight}
                onChange={(e) => setFormData({ ...formData, gross_weight: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Stone / Dust Weight (grams)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.000"
                value={formData.stone_weight}
                onChange={(e) => setFormData({ ...formData, stone_weight: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Showcase / Tray Location */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Showcase Tray / Counter</label>
              <input
                type="text"
                placeholder="e.g. Showcase A - Tray 1"
                value={formData.counter_tray}
                onChange={(e) => setFormData({ ...formData, counter_tray: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* HUID or Pieces */}
            {itemType === 'RETAIL_SINGLE' ? (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  BIS HUID (Hallmark Unique ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HUID916A8721 (leave blank to auto-gen)"
                  value={formData.huid}
                  onChange={(e) => setFormData({ ...formData, huid: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Total Pieces in Lot</label>
                <input
                  type="number"
                  min="1"
                  value={formData.pieces}
                  onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Making Charges */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Making Charge Type</label>
                <select
                  value={formData.making_charge_type}
                  onChange={(e) => setFormData({ ...formData, making_charge_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="PER_GRAM">Per Gram (₹/g)</option>
                  <option value="FIXED">Flat Fixed (₹)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Making Charge (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.making_charge_value}
                  onChange={(e) => setFormData({ ...formData, making_charge_value: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Stone / Diamond Price */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Stone / Diamond Value (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.stone_price}
                onChange={(e) => setFormData({ ...formData, stone_price: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

          </div>

          {/* Real-time Dynamic Calculation Preview Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] text-slate-400">Net Metal Weight:</p>
              <p className="font-mono font-bold text-amber-400 text-sm">{netWt.toFixed(3)}g</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Fine Metal (99.9%):</p>
              <p className="font-mono font-bold text-blue-400 text-sm">{fineGoldEquiv.toFixed(3)}g</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400">Estimated Retail Val:</p>
              <p className="font-mono font-bold text-emerald-400 text-sm">₹{estTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
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
              {loading ? 'Adding...' : 'Save & Stock Inward'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
