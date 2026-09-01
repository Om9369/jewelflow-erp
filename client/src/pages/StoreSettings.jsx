import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Store,
  FileText,
  DollarSign,
  KeyRound,
  Lock,
  AlertCircle
} from 'lucide-react';
import { getStoreConfig, saveStoreConfig, updateOwnerPin } from '../services/storeConfig';

export default function StoreSettings() {
  const [config, setConfig] = useState(getStoreConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // PIN Change State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveStoreConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleUpdatePin = (e) => {
    e.preventDefault();
    const res = updateOwnerPin(currentPin, newPin);
    if (res.success) {
      setPinMessage({ text: 'Owner Master PIN updated successfully!', type: 'success' });
      setCurrentPin('');
      setNewPin('');
    } else {
      setPinMessage({ text: res.error || 'Failed to update PIN', type: 'error' });
    }
    setTimeout(() => setPinMessage({ text: '', type: '' }), 4000);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              SHOWROOM PROFILE
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Store Profile & Security Setup</h2>
          </div>
          <p className="text-xs text-slate-400">
            Configure your jewellery store billing details, GSTIN, BIS Hallmark, bank accounts, and Owner PIN.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Store Identity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Store className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Store Identity & Legal Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Store / Showroom Name *</label>
              <input
                type="text"
                name="store_name"
                value={config.store_name}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                placeholder="e.g. Tanishq Fine Jewellers"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tagline / Subheading</label>
              <input
                type="text"
                name="tagline"
                value={config.tagline}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100"
                placeholder="e.g. Gold & Diamond Specialists"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Showroom Address (Printed on Invoices) *</label>
              <input
                type="text"
                name="address"
                value={config.address}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100"
                placeholder="Shop No, Market, City, State - PIN"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Official Mobile / Phone *</label>
              <input
                type="tel"
                name="phone"
                value={config.phone}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-mono"
                placeholder="+91 98200 11223"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Official Email</label>
              <input
                type="email"
                name="email"
                value={config.email}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100"
                placeholder="info@jewellers.com"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Compliance & Hallmark */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Statutory, GST & Hallmark Licenses</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">GSTIN Number (15 Digits) *</label>
              <input
                type="text"
                name="gstin"
                value={config.gstin}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold uppercase"
                placeholder="27AAACS1234M1Z5"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">BIS Hallmarking License No. *</label>
              <input
                type="text"
                name="bis_hallmark"
                value={config.bis_hallmark}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                placeholder="e.g. HM-IND-916001"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Currency Symbol</label>
              <input
                type="text"
                name="currency_symbol"
                value={config.currency_symbol}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-bold"
                placeholder="₹ or $ or AED"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Default Making Charge (%)</label>
              <input
                type="number"
                name="default_making_charge_pct"
                value={config.default_making_charge_pct}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-mono"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Banking & UPI Details */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Bank & Payment Settlement</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Bank Name</label>
              <input
                type="text"
                name="bank_name"
                value={config.bank_name}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100"
                placeholder="HDFC Bank"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Account Number</label>
              <input
                type="text"
                name="bank_account_no"
                value={config.bank_account_no}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-mono"
                placeholder="50200012345678"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Bank IFSC Code</label>
              <input
                type="text"
                name="bank_ifsc"
                value={config.bank_ifsc}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-mono"
                placeholder="HDFC0000128"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">UPI ID (VPA)</label>
              <input
                type="text"
                name="upi_id"
                value={config.upi_id}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-blue-400 font-mono font-bold"
                placeholder="jeweller@upi"
              />
            </div>
          </div>
        </div>

        {/* Save Store Profile Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Profile</span>
          </button>
        </div>

      </form>

      {/* Section 4: Owner Security PIN Management */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <KeyRound className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Owner Master PIN Protection</h3>
            <p className="text-xs text-slate-400">Protects gold rate changes, admin setup, and purchase ledger modifications from sales staff.</p>
          </div>
        </div>

        {pinMessage.text && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-in fade-in ${
            pinMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {pinMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{pinMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-end">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Current 4-Digit PIN *</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="Default: 1234"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-mono tracking-widest text-center font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">New 4-Digit PIN *</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="e.g. 5678"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-amber-300 font-mono tracking-widest text-center font-bold"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Update Owner PIN</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
