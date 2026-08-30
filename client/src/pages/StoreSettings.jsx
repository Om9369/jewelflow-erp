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
  DollarSign
} from 'lucide-react';
import { getStoreConfig, saveStoreConfig } from '../services/storeConfig';

export default function StoreSettings() {
  const [config, setConfig] = useState(getStoreConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setConfig(getStoreConfig());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveStoreConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `JewelFlow_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              WHITE-LABEL CONFIG
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Store Profile & Software Settings</h2>
          </div>
          <p className="text-xs text-slate-400">
            Customize showroom branding, GSTIN, BIS Hallmark licenses, banking details, and backup data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
            title="Download full database backup"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Backup (JSON)</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Store profile settings saved successfully! All invoices, live rates, and WhatsApp receipts are updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Showroom Identity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Store className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Showroom Branding</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Showroom / Store Name *</label>
              <input
                type="text"
                name="store_name"
                value={config.store_name}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-bold"
                placeholder="e.g. SHREE GANESH JEWELLERS"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tagline / Subtitle</label>
              <input
                type="text"
                name="tagline"
                value={config.tagline}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100"
                placeholder="e.g. Pure 916 Gold & Diamond Jewellery"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Showroom Full Address *</label>
              <input
                type="text"
                name="address"
                value={config.address}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100"
                placeholder="e.g. Shop 12, Sarafa Bazaar, Indore - 452002"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Store Phone / Mobile *</label>
              <input
                type="text"
                name="phone"
                value={config.phone}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-mono"
                placeholder="e.g. +91 98260 12345"
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
                placeholder="billing@shreeganesh.com"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Compliance (GSTIN & BIS) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Government Compliance & Hallmarking</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">GSTIN Number *</label>
              <input
                type="text"
                name="gstin"
                value={config.gstin}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold"
                placeholder="e.g. 23AABCS1429M1Z8"
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

        {/* Save Button */}
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
    </div>
  );
}
