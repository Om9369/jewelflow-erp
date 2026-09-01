import React, { useState } from 'react';
import { X, Plus, Layers, Sparkles, Scale, AlertCircle, Zap, Package, Tag, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export default function AddProductModal({ isOpen, onClose, onProductAdded, rates }) {
  const [inwardMode, setInwardMode] = useState('SINGLE'); // 'SINGLE' | 'RAPID_MULTI' | 'BULK_PACKET'
  
  // Single Piece Form State
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

  // Rapid Multi-Tag Form State
  const [multiData, setMultiData] = useState({
    title_prefix: '22K Ladies Ring',
    category: 'Rings',
    metal_type: 'Gold',
    purity: '22K (916)',
    making_charge_value: '450',
    counter_tray: 'Showcase A - Tray 1',
    weights_input: '1.250, 2.400, 3.150, 4.200, 5.600'
  });

  // Bulk Packet Form State
  const [packetData, setPacketData] = useState({
    title: '22K Casting Rings Lot (20 Pcs)',
    category: 'Rings',
    metal_type: 'Gold',
    purity: '22K (916)',
    total_gross_weight: '48.500',
    pieces: '20',
    making_charge_value: '450',
    counter_tray: 'Showcase A - Tray 1'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Single Item Calculations
  const grossWt = parseFloat(formData.gross_weight) || 0;
  const stoneWt = parseFloat(formData.stone_weight) || 0;
  const netWt = Math.max(0, parseFloat((grossWt - stoneWt).toFixed(3)));

  // Current rate estimation
  const rateItem = rates?.find(r => r.metal === formData.metal_type && r.purity === formData.purity);
  const currentRate = rateItem?.rate_per_gram || (formData.metal_type === 'Gold' ? 6750 : 88);
  const metalVal = netWt * currentRate;
  const makingVal = formData.making_charge_type === 'FIXED'
    ? (parseFloat(formData.making_charge_value) || 0)
    : (netWt * (parseFloat(formData.making_charge_value) || 0));
  const stoneVal = parseFloat(formData.stone_price) || 0;
  const estTotal = Math.round(metalVal + makingVal + stoneVal);

  // Single Submit
  const handleSingleSubmit = async (e) => {
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
        item_type: 'RETAIL_SINGLE',
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

  // Rapid Multi Submit (Generates individual tags from weight list)
  const handleRapidMultiSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Parse weights from input (splits by commas, spaces, newlines)
    const weightTokens = multiData.weights_input
      .split(/[\s,\n]+/)
      .map(w => parseFloat(w.trim()))
      .filter(w => !isNaN(w) && w > 0);

    if (weightTokens.length === 0) {
      setError('Please enter at least one valid weight (e.g. 1.25, 2.4, 3.8)');
      return;
    }

    setLoading(true);
    try {
      let createdCount = 0;
      for (let i = 0; i < weightTokens.length; i++) {
        const wt = weightTokens[i];
        const payload = {
          title: `${multiData.title_prefix} #${i + 1} (${wt}g)`,
          category: multiData.category,
          metal_type: multiData.metal_type,
          purity: multiData.purity,
          gross_weight: wt,
          stone_weight: 0,
          stone_type: 'None',
          stone_cents: 0,
          stone_price: 0,
          wastage_pct: 1.5,
          making_charge_type: 'PER_GRAM',
          making_charge_value: parseFloat(multiData.making_charge_value) || 450,
          huid: '',
          counter_tray: multiData.counter_tray,
          pieces: 1,
          item_type: 'RETAIL_SINGLE'
        };

        const res = await api.createProduct(payload);
        if (res.success) {
          createdCount++;
          onProductAdded(res.product);
        }
      }

      setSuccessMsg(`Successfully inwarded & generated tags for ${createdCount} items!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Packet Submit
  const handleBulkPacketSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const totalWt = parseFloat(packetData.total_gross_weight) || 0;
    const pcs = parseInt(packetData.pieces) || 1;

    if (totalWt <= 0 || pcs <= 0) {
      setError('Please enter valid total weight and number of pieces');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: packetData.title,
        category: packetData.category,
        metal_type: packetData.metal_type,
        purity: packetData.purity,
        gross_weight: totalWt,
        stone_weight: 0,
        stone_type: 'None',
        stone_cents: 0,
        stone_price: 0,
        wastage_pct: 1.5,
        making_charge_type: 'PER_GRAM',
        making_charge_value: parseFloat(packetData.making_charge_value) || 450,
        huid: '',
        counter_tray: packetData.counter_tray,
        pieces: pcs,
        item_type: 'RETAIL_SINGLE',
        notes: `Bulk Packet: ${pcs} pcs averaging ${(totalWt / pcs).toFixed(3)}g each`
      };

      const res = await api.createProduct(payload);
      if (res.success) {
        onProductAdded(res.product);
        onClose();
      } else {
        setError(res.error || 'Failed to add bulk packet');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Parsed weights summary for Rapid Multi
  const parsedWeights = multiData.weights_input
    .split(/[\s,\n]+/)
    .map(w => parseFloat(w.trim()))
    .filter(w => !isNaN(w) && w > 0);
  const totalMultiWeight = parsedWeights.reduce((sum, w) => sum + w, 0).toFixed(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 font-serif">Showroom Stock Inwarding</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Add individual pieces or inward bulk lots in seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inward Mode Switcher Bar */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] sm:text-xs font-semibold">
          <button
            type="button"
            onClick={() => setInwardMode('SINGLE')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
              inwardMode === 'SINGLE'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Single Piece</span>
          </button>

          <button
            type="button"
            onClick={() => setInwardMode('RAPID_MULTI')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
              inwardMode === 'RAPID_MULTI'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Rapid Multi-Tag</span>
          </button>

          <button
            type="button"
            onClick={() => setInwardMode('BULK_PACKET')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
              inwardMode === 'BULK_PACKET'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>📦 Bulk Packet</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MODE 1: SINGLE PIECE FORM                            */}
        {/* ---------------------------------------------------- */}
        {inwardMode === 'SINGLE' && (
          <form onSubmit={handleSingleSubmit} className="mt-3.5 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Optional Quick Tag / HUID Scan Bar */}
              <div className="md:col-span-2 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <label className="text-[11px] font-semibold text-amber-400 block mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>⚡ Quick Scan Supplier Tag Barcode or HUID Hallmark</span>
                  <span className="text-[9px] text-slate-400 font-normal font-mono">(Optional - Zap with Scanner Gun)</span>
                </label>
                <input
                  type="text"
                  placeholder="Zap tag barcode (e.g. 8901234) or HUID hallmark..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val) {
                        if (val.toUpperCase().startsWith('HD') || val.toUpperCase().startsWith('HM') || val.length === 6) {
                          setFormData(prev => ({ ...prev, huid: val.toUpperCase() }));
                        } else {
                          setFormData(prev => ({ ...prev, huid: val.toUpperCase(), notes: `Supplier Tag: ${val}` }));
                        }
                        e.target.value = '';
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <label className="text-slate-300 font-medium block mb-1">Item Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 22K Antique Temple Choker, Solitaire Ring..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:border-amber-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500"
                >
                  <option value="Necklaces">Necklaces & Short Haar</option>
                  <option value="Bangles">Bangles & Kadas</option>
                  <option value="Rings">Ladies & Gents Rings</option>
                  <option value="Earrings">Earrings & Jhumkas</option>
                  <option value="Chains">Chains</option>
                  <option value="Mangalsutra">Mangalsutra</option>
                  <option value="Pendants">Pendants</option>
                  <option value="Coins & Bars">Gold/Silver Coins</option>
                  <option value="Pooja Items">Pooja Silver</option>
                  <option value="Payal">Payal</option>
                </select>
              </div>

              {/* Metal & Purity */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Metal</label>
                  <select
                    value={formData.metal_type}
                    onChange={(e) => setFormData({ ...formData, metal_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Purity</label>
                  <select
                    value={formData.purity}
                    onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-bold"
                  >
                    <option value="22K (916)">22K (916)</option>
                    <option value="18K (750)">18K (750)</option>
                    <option value="24K (999)">24K (999)</option>
                    <option value="14K (585)">14K (585)</option>
                    <option value="999 Fine">999 Fine Silver</option>
                    <option value="925 Sterling">925 Sterling</option>
                  </select>
                </div>
              </div>

              {/* Weights: Gross, Stone, Net */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 md:col-span-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Gross Wt (g) *</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      placeholder="0.000"
                      value={formData.gross_weight}
                      onChange={(e) => setFormData({ ...formData, gross_weight: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Stone Wt (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={formData.stone_weight}
                      onChange={(e) => setFormData({ ...formData, stone_weight: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Net Gold Wt</label>
                    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold">
                      {netWt.toFixed(3)}g
                    </div>
                  </div>
                </div>
              </div>

              {/* HUID & Tray */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">HUID Hallmark Code</label>
                <input
                  type="text"
                  placeholder="e.g. HM8812"
                  value={formData.huid}
                  onChange={(e) => setFormData({ ...formData, huid: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Showcase Tray Location</label>
                <input
                  type="text"
                  placeholder="e.g. Showcase A - Tray 1"
                  value={formData.counter_tray}
                  onChange={(e) => setFormData({ ...formData, counter_tray: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              {/* Making Charge */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">Making Charge (₹/gram)</label>
                <input
                  type="number"
                  placeholder="450"
                  value={formData.making_charge_value}
                  onChange={(e) => setFormData({ ...formData, making_charge_value: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              {/* Estimated Retail Tag Price */}
              <div>
                <label className="text-slate-400 font-medium block mb-1">Est. Tag Price (Today Rate)</label>
                <div className="w-full bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold">
                  ₹{estTotal.toLocaleString('en-IN')}
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                {loading ? 'Saving...' : 'Save & Inward Piece'}
              </button>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------- */}
        {/* MODE 2: RAPID MULTI-TAG QUICK ENTRY                  */}
        {/* ---------------------------------------------------- */}
        {inwardMode === 'RAPID_MULTI' && (
          <form onSubmit={handleRapidMultiSubmit} className="mt-3.5 space-y-3.5 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
              <span className="font-bold">⚡ Rapid Multi-Tag:</span> Just type or paste all piece weights separated by commas (e.g. <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400">1.25, 2.40, 3.80, 5.60</code>). The system will create unique barcode tags for each item in 1 second!
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Item Title Prefix *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 22K Ladies Casting Ring"
                  value={multiData.title_prefix}
                  onChange={(e) => setMultiData({ ...multiData, title_prefix: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Category</label>
                <select
                  value={multiData.category}
                  onChange={(e) => setMultiData({ ...multiData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="Rings">Ladies & Gents Rings</option>
                  <option value="Necklaces">Necklaces & Short Haar</option>
                  <option value="Bangles">Bangles & Kadas</option>
                  <option value="Earrings">Earrings & Tops</option>
                  <option value="Chains">Chains</option>
                  <option value="Mangalsutra">Mangalsutra</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Purity</label>
                <select
                  value={multiData.purity}
                  onChange={(e) => setMultiData({ ...multiData, purity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-bold"
                >
                  <option value="22K (916)">22K (916)</option>
                  <option value="18K (750)">18K (750)</option>
                  <option value="24K (999)">24K (999)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Showcase Tray Location</label>
                <input
                  type="text"
                  placeholder="e.g. Ring Tray A1"
                  value={multiData.counter_tray}
                  onChange={(e) => setMultiData({ ...multiData, counter_tray: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold block">Enter Piece Weights in Grams (Comma or Space separated) *</label>
                <span className="text-[11px] font-mono text-amber-400 font-bold">
                  {parsedWeights.length} pieces | {totalMultiWeight}g Total
                </span>
              </div>
              <textarea
                rows={3}
                required
                placeholder="e.g. 1.250, 2.400, 3.150, 4.200, 5.600"
                value={multiData.weights_input}
                onChange={(e) => setMultiData({ ...multiData, weights_input: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-amber-300 font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || parsedWeights.length === 0}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                {loading ? 'Creating Tags...' : `⚡ Inward All ${parsedWeights.length} Items`}
              </button>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------- */}
        {/* MODE 3: BULK PACKET / BOX INWARD                     */}
        {/* ---------------------------------------------------- */}
        {inwardMode === 'BULK_PACKET' && (
          <form onSubmit={handleBulkPacketSubmit} className="mt-3.5 space-y-3.5 text-xs">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300">
              <span className="font-bold">📦 Bulk Packet Mode:</span> For storing assorted packets/boxes (e.g. 20 rings totaling 48.5g). The system maintains the whole packet and auto-deducts pieces/weight as they sell.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-medium block mb-1">Packet / Box Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 22K Casting Rings Lot (20 Pcs)"
                  value={packetData.title}
                  onChange={(e) => setPacketData({ ...packetData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Total Packet Gross Weight (g) *</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder="48.500"
                  value={packetData.total_gross_weight}
                  onChange={(e) => setPacketData({ ...packetData, total_gross_weight: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Total Pieces Quantity *</label>
                <input
                  type="number"
                  required
                  placeholder="20"
                  value={packetData.pieces}
                  onChange={(e) => setPacketData({ ...packetData, pieces: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Purity</label>
                <select
                  value={packetData.purity}
                  onChange={(e) => setPacketData({ ...packetData, purity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-bold"
                >
                  <option value="22K (916)">22K (916)</option>
                  <option value="18K (750)">18K (750)</option>
                  <option value="24K (999)">24K (999)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Making Charge (₹/gram)</label>
                <input
                  type="number"
                  placeholder="450"
                  value={packetData.making_charge_value}
                  onChange={(e) => setPacketData({ ...packetData, making_charge_value: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                {loading ? 'Saving...' : 'Inward Bulk Packet'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
