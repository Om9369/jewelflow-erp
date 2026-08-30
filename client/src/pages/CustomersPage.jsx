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
  AlertCircle
} from 'lucide-react';
import { getStoreConfig } from '../services/storeConfig';

const INITIAL_CUSTOMERS = [
  {
    id: 'CUST-101',
    name: 'Meera Singhania',
    phone: '9876543210',
    email: 'meera.s@gmail.com',
    pan_number: 'ABCPS1234F',
    kyc_verified: true,
    loyalty_tier: 'DIAMOND_VIP',
    total_purchases_inr: 845000,
    total_gold_bought_grams: 112.5,
    khata_balance_inr: 0,
    city: 'Mumbai'
  },
  {
    id: 'CUST-102',
    name: 'Aarav K. Patel',
    phone: '9820011223',
    email: 'aarav.patel@yahoo.com',
    pan_number: 'BHKPP9876K',
    kyc_verified: true,
    loyalty_tier: 'GOLD',
    total_purchases_inr: 320000,
    total_gold_bought_grams: 48.0,
    khata_balance_inr: -15000, // Udhar
    city: 'Ahmedabad'
  },
  {
    id: 'CUST-103',
    name: 'Rohan Deshmukh',
    phone: '9819087654',
    email: 'rohan.d@gmail.com',
    pan_number: '',
    kyc_verified: false,
    loyalty_tier: 'SILVER',
    total_purchases_inr: 95000,
    total_gold_bought_grams: 14.5,
    khata_balance_inr: 0,
    city: 'Pune'
  }
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('jewelflow_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [storeConfig, setStoreConfig] = useState(getStoreConfig());

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    pan_number: '',
    city: 'Mumbai',
    loyalty_tier: 'SILVER'
  });

  useEffect(() => {
    localStorage.setItem('jewelflow_customers', JSON.stringify(customers));
  }, [customers]);

  const handleAddCustomer = (e) => {
    e.preventDefault();
    const newCust = {
      id: `CUST-${100 + customers.length + 1}`,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      pan_number: formData.pan_number.toUpperCase(),
      kyc_verified: formData.pan_number.length >= 10,
      loyalty_tier: formData.loyalty_tier,
      total_purchases_inr: 0,
      total_gold_bought_grams: 0,
      khata_balance_inr: 0,
      city: formData.city
    };

    setCustomers([newCust, ...customers]);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      pan_number: '',
      city: 'Mumbai',
      loyalty_tier: 'SILVER'
    });
  };

  const handleSendOfferWhatsApp = (cust) => {
    const text = `✨ *Exclusive Invitation from ${storeConfig.store_name}* ✨\n\nDear *${cust.name}*,\nAs our esteemed *${cust.loyalty_tier.replace('_', ' ')} Member*, we are delighted to offer you:\n\n💎 *FLAT 25% OFF ON MAKING CHARGES*\n🪙 *ZERO DEDUCTION ON OLD GOLD EXCHANGE*\n\nVisit our showroom this week to explore our new Festive & Bridal Jewellery collection!\n\n📍 *${storeConfig.address}*\n📞 *${storeConfig.phone}*`;
    
    let phone = cust.phone.replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const totalClients = customers.length;
  const totalPurchases = customers.reduce((sum, c) => sum + c.total_purchases_inr, 0);
  const totalGoldSold = customers.reduce((sum, c) => sum + c.total_gold_bought_grams, 0).toFixed(1);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.pan_number && c.pan_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              CLIENT RELATIONSHIP
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Customer Directory & Khata Ledger</h2>
          </div>
          <p className="text-xs text-slate-400">
            Govt PAN KYC verification for transactions &gt; ₹2 Lakhs, loyalty tiers, purchase histories, and WhatsApp greetings.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Registered Customers</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">{totalClients}</div>
          <div className="mt-1 text-[11px] text-slate-400">Verified retail & wholesale clients</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Lifetime Customer Sales</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">₹{totalPurchases.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-slate-400">Across retail showroom billing</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Gold Delivered</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-300">{totalGoldSold}g</div>
          <div className="mt-1 text-[11px] text-slate-400">BIS Hallmarked jewellery grams</div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Customer Records</h3>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer, phone, PAN..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase bg-slate-950/50">
                <th className="py-2.5 px-3">Customer ID</th>
                <th className="py-2.5 px-3">Name & Contact</th>
                <th className="py-2.5 px-3">Govt PAN / KYC</th>
                <th className="py-2.5 px-3">VIP Tier</th>
                <th className="py-2.5 px-3 text-right">Lifetime Spends</th>
                <th className="py-2.5 px-3 text-right">Gold Bought</th>
                <th className="py-2.5 px-3 text-right">Khata / Udhar</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">{c.id}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-100">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                      <span>{c.phone}</span>
                      <span>•</span>
                      <span>{c.city}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {c.pan_number ? (
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-[11px] font-bold text-slate-200">{c.pan_number}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-400 text-[10px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Pending PAN</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {c.loyalty_tier.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                    ₹{c.total_purchases_inr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                    {c.total_gold_bought_grams}g
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">
                    {c.khata_balance_inr < 0 ? (
                      <span className="text-rose-400 font-bold">Due: ₹{Math.abs(c.khata_balance_inr).toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-emerald-400">Clear</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleSendOfferWhatsApp(c)}
                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors inline-flex items-center gap-1"
                      title="Send WhatsApp VIP Offer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Offer</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Customer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-serif font-bold text-slate-100 text-base mb-1">Add New Customer</h3>
            <p className="text-xs text-slate-400 mb-4">Register client for tax invoices and KYC compliance.</p>

            <form onSubmit={handleAddCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">WhatsApp Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">City / Region</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">PAN Card Number (Required for &gt; ₹2 Lakhs)</label>
                <input
                  type="text"
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                  placeholder="ABCDE1234F"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">VIP Tier</label>
                <select
                  value={formData.loyalty_tier}
                  onChange={(e) => setFormData({ ...formData, loyalty_tier: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                >
                  <option value="SILVER">Silver Member</option>
                  <option value="GOLD">Gold Member</option>
                  <option value="DIAMOND_VIP">Diamond VIP Member</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
