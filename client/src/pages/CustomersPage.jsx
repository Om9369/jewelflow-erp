import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  Coins,
  Send,
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  Gem,
  Sparkles,
  MapPin,
  Calendar,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { getStoreConfig } from '../services/storeConfig';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL'); // 'ALL' | 'DIAMOND_VIP' | 'PLATINUM' | 'GOLD' | 'SILVER'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Customer history modal
  const [storeConfig, setStoreConfig] = useState(getStoreConfig());

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    pan_card: '',
    gst_number: '',
    address: '',
    city: 'Mumbai',
    type: 'RETAIL_CUSTOMER'
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers();
      if (res.success) {
        setCustomers(res.customers || []);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Please provide customer name and mobile phone number.');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        pan_card: formData.pan_card.trim().toUpperCase(),
        gst_number: formData.gst_number.trim().toUpperCase(),
        address: formData.address.trim() || formData.city,
        city: formData.city,
        type: formData.type
      };

      const res = await api.createCustomer(payload);
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          phone: '',
          email: '',
          pan_card: '',
          gst_number: '',
          address: '',
          city: 'Mumbai',
          type: 'RETAIL_CUSTOMER'
        });
        loadCustomers();
      } else {
        alert(res.error || 'Failed to add customer');
      }
    } catch (err) {
      console.error('Add customer error:', err);
      alert('Error adding customer: ' + err.message);
    }
  };

  const handleSendOfferWhatsApp = (cust) => {
    const tierName = (cust.loyalty_tier || 'SILVER').replace('_', ' ');
    const text = `✨ *Exclusive VIP Invitation from ${storeConfig.store_name}* ✨\n\nDear *${cust.name}*,\nAs our valued *${tierName} Member* (Total Purchases: ₹${(cust.total_purchases_inr || 0).toLocaleString('en-IN')}), we are pleased to offer you:\n\n💎 *FLAT 25% OFF ON MAKING CHARGES*\n🪙 *ZERO DEDUCTION ON OLD GOLD EXCHANGE*\n🎁 *${cust.loyalty_points || 0} Reward Points Available for Redemption*\n\nVisit our showroom to explore certified BIS Hallmarked Gold & Diamond collections!\n\n📍 *${storeConfig.address}*\n📞 *${storeConfig.phone}*`;

    let phone = (cust.phone || '').replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm) ||
      (c.pan_card || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.gst_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = selectedTier === 'ALL' || c.loyalty_tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const totalClients = customers.length;
  const diamondVips = customers.filter(c => c.loyalty_tier === 'DIAMOND_VIP');
  const platinumMembers = customers.filter(c => c.loyalty_tier === 'PLATINUM');
  const kycVerifiedCount = customers.filter(c => c.kyc_verified);
  const totalLifetimeSpent = customers.reduce((sum, c) => sum + (c.total_purchases_inr || 0), 0);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              CRM & COMPLIANCE
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Customer Directory & VIP KYC Records</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time client purchase history, automated VIP tier upgrades, PAN card verification, and WhatsApp marketing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Clients</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-100">{totalClients}</div>
          <div className="mt-1 text-[10px] text-slate-400">{kycVerifiedCount.length} KYC Verified</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Diamond & Platinum</span>
            <Gem className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-purple-300">
            {diamondVips.length + platinumMembers.length}
          </div>
          <div className="mt-1 text-[10px] text-purple-400/80">{diamondVips.length} Diamond VIP (₹10L+)</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Lifetime Client Spend</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            ₹{totalLifetimeSpent.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Aggregated across all bills</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">KYC & PAN Compliance</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-blue-400">
            {Math.round((kycVerifiedCount.length / Math.max(1, totalClients)) * 100)}%
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Section 269ST & PMLA Ready</div>
        </div>

      </div>

      {/* Tier Filter Tabs & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Tier Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: `All Clients (${customers.length})` },
              { id: 'DIAMOND_VIP', label: `💎 Diamond VIP (${diamondVips.length})` },
              { id: 'PLATINUM', label: `✨ Platinum (${platinumMembers.length})` },
              { id: 'GOLD', label: `🥇 Gold` },
              { id: 'SILVER', label: `🥈 Silver` }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTier(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTier === t.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, mobile, PAN, GST..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60">
          <table className="w-full text-left border-collapse min-w-[850px] text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase bg-slate-950">
                <th className="py-3 px-3">Client Profile</th>
                <th className="py-3 px-3">Contact & City</th>
                <th className="py-3 px-3 text-center">KYC & PAN</th>
                <th className="py-3 px-3">VIP Membership Tier</th>
                <th className="py-3 px-3 text-right">Lifetime Spent (₹)</th>
                <th className="py-3 px-3 text-right">Gold Purchased</th>
                <th className="py-3 px-3 text-center">Invoices</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredCustomers.map((cust) => {
                const isDiamond = cust.loyalty_tier === 'DIAMOND_VIP';
                const isPlat = cust.loyalty_tier === 'PLATINUM';
                const isGold = cust.loyalty_tier === 'GOLD';

                return (
                  <tr key={cust.id} className="hover:bg-slate-800/30 transition-colors">
                    
                    {/* Name & ID */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isDiamond
                            ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20'
                            : isPlat
                            ? 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-100 block text-xs">{cust.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {cust.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Contact & City */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-200">{cust.phone || '-'}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{cust.address || cust.city || 'Mumbai'}</span>
                      </div>
                    </td>

                    {/* KYC & PAN */}
                    <td className="py-3 px-3 text-center">
                      {cust.kyc_verified ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            KYC Verified
                          </span>
                          {cust.pan_card && (
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">
                              PAN: {cust.pan_card}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[9px]">
                          Pending PAN
                        </span>
                      )}
                    </td>

                    {/* VIP Membership Tier */}
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                        isDiamond
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                          : isPlat
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : isGold
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {isDiamond ? <Gem className="w-3 h-3 text-purple-400" /> : <Award className="w-3 h-3 text-amber-400" />}
                        {cust.loyalty_tier ? cust.loyalty_tier.replace('_', ' ') : 'SILVER MEMBER'}
                      </span>
                      {cust.loyalty_points > 0 && (
                        <span className="text-[9px] font-mono text-amber-400/80 block mt-0.5">
                          ⭐ {cust.loyalty_points} Reward Points
                        </span>
                      )}
                    </td>

                    {/* Lifetime Purchases */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono font-bold text-slate-100 text-sm block">
                        ₹{(cust.total_purchases_inr || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400">Total Billed</span>
                    </td>

                    {/* Gold Purchased */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono font-bold text-amber-300 block">
                        {cust.total_gold_bought_grams || 0}g
                      </span>
                      <span className="text-[10px] text-slate-400">Gross Weight</span>
                    </td>

                    {/* Invoices Count */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-mono font-bold transition-colors inline-flex items-center gap-1"
                        title="View Purchase History"
                      >
                        <FileText className="w-3 h-3 text-amber-400" />
                        <span>{cust.invoice_count || (cust.invoices ? cust.invoices.length : 0)} Bills</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleSendOfferWhatsApp(cust)}
                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                        title="Send VIP WhatsApp Offer"
                      >
                        <Send className="w-3 h-3" />
                        <span>VIP WhatsApp</span>
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL: ADD NEW CUSTOMER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-slate-100 text-base">Register Client & KYC</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Singhania"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">PAN Card Number (KYC)</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="ABCPS1234F"
                    value={formData.pan_card}
                    onChange={(e) => setFormData({ ...formData, pan_card: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">GSTIN (If Business)</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="27AAAC..."
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Address / City</label>
                <input
                  type="text"
                  placeholder="e.g. Bandra West, Mumbai"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  Save & Verify Client
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER PURCHASE HISTORY */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-100 text-base flex items-center gap-2">
                    {selectedCustomer.name}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                      {selectedCustomer.loyalty_tier ? selectedCustomer.loyalty_tier.replace('_', ' ') : 'SILVER'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Phone: {selectedCustomer.phone} · Total Spent: ₹{(selectedCustomer.total_purchases_inr || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-200 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-2 text-xs">
              {(!selectedCustomer.invoices || selectedCustomer.invoices.length === 0) ? (
                <div className="p-6 text-center text-slate-500">
                  No previous bills recorded for this client yet.
                </div>
              ) : (
                selectedCustomer.invoices.map((inv) => (
                  <div key={inv.id || inv.invoice_no} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-amber-400 block">{inv.invoice_no}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(inv.created_at).toLocaleDateString('en-IN')} · Mode: {inv.payment_mode || 'Cash'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-100 text-sm block">
                        ₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">✓ Settled</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
