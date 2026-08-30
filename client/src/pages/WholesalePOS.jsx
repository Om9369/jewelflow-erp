import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Building2,
  CheckCircle2,
  Scale,
  Coins,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Percent,
  Plus
} from 'lucide-react';
import { api } from '../services/api';

export default function WholesalePOS({ rates, onInvoiceCreated }) {
  const [dealers, setDealers] = useState([]);
  const [wholesaleLots, setWholesaleLots] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedLots, setSelectedLots] = useState([]);
  const [settlementMode, setSettlementMode] = useState('FINE_GOLD_PLUS_MAKING');
  const [fineGoldSettled, setFineGoldSettled] = useState('');
  const [cashPaid, setCashPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [custRes, invRes, empRes] = await Promise.all([
        api.getCustomers({ type: 'B2B_DEALER' }),
        api.getInventory({ status: 'IN_STOCK', item_type: 'WHOLESALE_LOT' }),
        api.getEmployees()
      ]);

      if (custRes.success) {
        setDealers(custRes.customers);
        if (custRes.customers.length > 0) setSelectedDealerId(custRes.customers[0].id);
      }
      if (invRes.success) setWholesaleLots(invRes.items);
      if (empRes.success) {
        const wholesaleAgents = empRes.employees.filter(e => e.role === 'WHOLESALE_AGENT' || e.role === 'SALES_EXECUTIVE');
        setEmployees(wholesaleAgents.length > 0 ? wholesaleAgents : empRes.employees);
        if (empRes.employees.length > 0) setSelectedAgentId(empRes.employees[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRateFor = (metal, purity) => {
    const r = rates?.find(item => item.metal === metal && item.purity === purity);
    return r ? r.rate_per_gram : 6750;
  };

  const toggleLot = (lot) => {
    if (selectedLots.find(l => l.id === lot.id)) {
      setSelectedLots(selectedLots.filter(l => l.id !== lot.id));
    } else {
      const liveRate = getRateFor(lot.metal_type, lot.purity);
      const making = lot.making_charge_type === 'FIXED' ? lot.making_charge_value : (lot.net_weight * lot.making_charge_value);
      setSelectedLots([...selectedLots, {
        ...lot,
        product_id: lot.id,
        metal_rate: liveRate,
        making_charge: making
      }]);
    }
  };

  const currentDealer = dealers.find(d => d.id === parseInt(selectedDealerId));

  // Calculations
  const totalGrossWeight = selectedLots.reduce((sum, l) => sum + l.gross_weight, 0);
  const totalNetWeight = selectedLots.reduce((sum, l) => sum + l.net_weight, 0);
  const totalFineGoldGrams = selectedLots.reduce((sum, l) => {
    const touch = l.touch_pct || 91.6;
    return sum + (l.net_weight * touch) / 100;
  }, 0);
  const totalMakingCharges = selectedLots.reduce((sum, l) => sum + (l.making_charge || 0), 0);
  const totalMetalValue = selectedLots.reduce((sum, l) => sum + (l.net_weight * (l.metal_rate || 6750)), 0);
  const totalChallanValue = Math.round(totalMetalValue + totalMakingCharges);

  const handleCreateChallan = async () => {
    if (selectedLots.length === 0) {
      setError('Select at least one wholesale lot to dispatch.');
      return;
    }
    if (!selectedDealerId) {
      setError('Please select a B2B Dealer party.');
      return;
    }
    if (!selectedAgentId) {
      setError('Please attribute this dispatch to a wholesale agent.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customer_id: parseInt(selectedDealerId),
        customer_name: currentDealer?.name || 'B2B Client',
        customer_phone: currentDealer?.phone || '',
        employee_id: parseInt(selectedAgentId),
        items: selectedLots,
        fine_gold_settled: parseFloat(fineGoldSettled) || (settlementMode === 'FINE_GOLD_PLUS_MAKING' ? totalFineGoldGrams : 0),
        cash_paid: parseFloat(cashPaid) || (settlementMode === 'FINE_GOLD_PLUS_MAKING' ? totalMakingCharges : totalChallanValue),
        payment_mode: settlementMode,
        notes: notes || `Wholesale Dispatch: ${selectedLots.length} Lots to ${currentDealer?.name}`
      };

      const res = await api.createWholesaleChallan(payload);
      if (res.success) {
        setSelectedLots([]);
        setFineGoldSettled('');
        setCashPaid('');
        setNotes('');
        loadData();
        if (onInvoiceCreated) {
          onInvoiceCreated(res.invoice);
        }
      } else {
        setError(res.error || 'Failed to generate wholesale challan');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded uppercase">
              WHOLESALE B2B MODULE
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">B2B Delivery Challan & Metal Ledger</h2>
          </div>
          <p className="text-xs text-slate-400">
            Dispatch bulk packets, calculate Touch & Fine Gold (99.9%) balances, and settle metal accounts.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Left (Dealer & Lots Selection), Right (Metal Settlement Engine) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Select B2B Dealer Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              1. Select B2B Wholesale Dealer & Agent
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Select Dealer / Stockist *</label>
                <select
                  value={selectedDealerId}
                  onChange={(e) => setSelectedDealerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.address})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Attributed Wholesale Agent *</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dealer Balance Banner */}
            {currentDealer && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Party Fine Gold Balance:</span>
                  <span className={`font-bold ${currentDealer.fine_gold_balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentDealer.fine_gold_balance > 0 ? `+${currentDealer.fine_gold_balance}g` : `${currentDealer.fine_gold_balance}g`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Party Cash Balance:</span>
                  <span className="font-bold text-amber-300">
                    ₹{currentDealer.cash_balance?.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Wholesale Lots In Stock */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                2. Select Wholesale Bulk Packets / Lots
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedLots.length} lots selected
              </span>
            </div>

            {wholesaleLots.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No wholesale lots currently in stock. Add lots from Stock Inward.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {wholesaleLots.map((lot) => {
                  const isSelected = selectedLots.some(l => l.id === lot.id);
                  const fineEquiv = ((lot.net_weight * (lot.touch_pct || 91.6)) / 100).toFixed(2);

                  return (
                    <div
                      key={lot.id}
                      onClick={() => toggleLot(lot)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-100 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100">{lot.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {lot.sku} • {lot.pieces} pcs • {lot.purity} ({lot.touch_pct}% touch)
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <p className="font-bold text-amber-300">{lot.gross_weight}g Gross</p>
                        <p className="text-[10px] text-blue-400">{fineEquiv}g Fine Gold</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right 5 Cols: Metal Ledger Settlement Engine */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              3. Metal Settlement & Challan Calculation
            </h3>

            {/* Settlement Mode Selection */}
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 block">Settlement Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettlementMode('FINE_GOLD_PLUS_MAKING')}
                  className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                    settlementMode === 'FINE_GOLD_PLUS_MAKING'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <p className="font-bold">Fine Gold + Making</p>
                  <p className="text-[10px] font-normal text-slate-400 mt-0.5">Party pays 99.9% Gold bar + Cash making</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSettlementMode('FULL_CASH_BHAV_CUTTING')}
                  className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                    settlementMode === 'FULL_CASH_BHAV_CUTTING'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <p className="font-bold">Bhav Cutting (Cash)</p>
                  <p className="text-[10px] font-normal text-slate-400 mt-0.5">Fixed at today rate, full cash settlement</p>
                </button>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Total Net Weight:</span>
                <span className="font-bold text-slate-200">{totalNetWeight.toFixed(3)}g</span>
              </div>
              <div className="flex justify-between text-blue-400">
                <span>Pure Fine Gold (99.9%):</span>
                <span className="font-bold">{totalFineGoldGrams.toFixed(3)}g</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Making Charges:</span>
                <span className="font-bold text-slate-200">₹{totalMakingCharges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-400 pt-1 border-t border-slate-800">
                <span>Full Valuation (Bhav):</span>
                <span className="font-bold">₹{totalChallanValue.toLocaleString()}</span>
              </div>
            </div>

            {/* Input Settlement Received */}
            {settlementMode === 'FINE_GOLD_PLUS_MAKING' ? (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Fine Gold Bar Received (grams 99.9%)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder={`Expected: ${totalFineGoldGrams.toFixed(3)}g`}
                    value={fineGoldSettled}
                    onChange={(e) => setFineGoldSettled(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-blue-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Cash Making Charges Received (₹)</label>
                  <input
                    type="number"
                    placeholder={`Expected: ₹${totalMakingCharges.toLocaleString()}`}
                    value={cashPaid}
                    onChange={(e) => setCashPaid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cash / Bank Payment Received (₹)</label>
                <input
                  type="number"
                  placeholder={`Expected: ₹${totalChallanValue.toLocaleString()}`}
                  value={cashPaid}
                  onChange={(e) => setCashPaid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Dispatch Logistics Notes / Vehicle</label>
              <input
                type="text"
                placeholder="e.g. Dispatched via BVC Armored Logistics Challan #4401"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Dispatch Button */}
            <button
              onClick={handleCreateChallan}
              disabled={loading || selectedLots.length === 0}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Generating Challan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Issue Delivery Challan & Update Metal Ledger</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
