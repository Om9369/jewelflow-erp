import React, { useState, useEffect } from 'react';
import {
  Coins,
  Users,
  Plus,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Send,
  Download,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { getStoreConfig } from '../services/storeConfig';

const INITIAL_SCHEMES = [
  {
    id: 'SCH-1001',
    customer_name: 'Pooja R. Deshmukh',
    phone: '9820199881',
    scheme_name: 'Swarna Varsha 11+1 Scheme',
    monthly_amount: 5000,
    tenure_months: 11,
    installments_paid: 8,
    total_amount_paid: 40000,
    accumulated_gold_grams: 5.925,
    start_date: '2025-12-15',
    next_due_date: '2026-09-15',
    status: 'ACTIVE',
    bonus_amount: 5000
  },
  {
    id: 'SCH-1002',
    customer_name: 'Sunita Sharma',
    phone: '9819283746',
    scheme_name: 'Shree Dhanteras Gold SIP',
    monthly_amount: 10000,
    tenure_months: 11,
    installments_paid: 11,
    total_amount_paid: 110000,
    accumulated_gold_grams: 16.296,
    start_date: '2025-09-01',
    next_due_date: '2026-08-01',
    status: 'MATURED',
    bonus_amount: 10000
  },
  {
    id: 'SCH-1003',
    customer_name: 'Rajesh K. Mehta',
    phone: '9821034567',
    scheme_name: 'Swarna Varsha 11+1 Scheme',
    monthly_amount: 15000,
    tenure_months: 11,
    installments_paid: 4,
    total_amount_paid: 60000,
    accumulated_gold_grams: 8.888,
    start_date: '2026-04-10',
    next_due_date: '2026-09-10',
    status: 'ACTIVE',
    bonus_amount: 15000
  }
];

export default function GoldSchemePage({ rates }) {
  const [schemes, setSchemes] = useState(() => {
    const saved = localStorage.getItem('jewelflow_gold_schemes');
    return saved ? JSON.parse(saved) : INITIAL_SCHEMES;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [storeConfig, setStoreConfig] = useState(getStoreConfig());

  // Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    scheme_name: 'Swarna Varsha 11+1 Scheme',
    monthly_amount: '5000',
    tenure_months: '11'
  });

  const gold22kRate = rates?.find(r => r.metal === 'Gold' && r.purity.includes('22K'))?.rate_per_gram || 6750;

  useEffect(() => {
    localStorage.setItem('jewelflow_gold_schemes', JSON.stringify(schemes));
  }, [schemes]);

  const handleEnroll = (e) => {
    e.preventDefault();
    const monthlyAmt = parseFloat(formData.monthly_amount) || 5000;
    const initialGrams = parseFloat((monthlyAmt / gold22kRate).toFixed(3));

    const newScheme = {
      id: `SCH-${1000 + schemes.length + 1}`,
      customer_name: formData.customer_name,
      phone: formData.phone,
      scheme_name: formData.scheme_name,
      monthly_amount: monthlyAmt,
      tenure_months: parseInt(formData.tenure_months) || 11,
      installments_paid: 1,
      total_amount_paid: monthlyAmt,
      accumulated_gold_grams: initialGrams,
      start_date: new Date().toISOString().slice(0, 10),
      next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'ACTIVE',
      bonus_amount: monthlyAmt
    };

    setSchemes([newScheme, ...schemes]);
    setIsEnrollModalOpen(false);
    setFormData({
      customer_name: '',
      phone: '',
      scheme_name: 'Swarna Varsha 11+1 Scheme',
      monthly_amount: '5000',
      tenure_months: '11'
    });
  };

  const handlePayInstallment = (schemeId) => {
    const updated = schemes.map(s => {
      if (s.id === schemeId) {
        const newPaid = s.installments_paid + 1;
        const newTotal = s.total_amount_paid + s.monthly_amount;
        const gramsAdded = parseFloat((s.monthly_amount / gold22kRate).toFixed(3));
        const newGrams = parseFloat((s.accumulated_gold_grams + gramsAdded).toFixed(3));
        const isMatured = newPaid >= s.tenure_months;

        return {
          ...s,
          installments_paid: newPaid,
          total_amount_paid: newTotal,
          accumulated_gold_grams: newGrams,
          status: isMatured ? 'MATURED' : 'ACTIVE',
          next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        };
      }
      return s;
    });

    setSchemes(updated);
  };

  const handleSendWhatsAppReceipt = (scheme) => {
    const text = `✨ *${storeConfig.store_name}* ✨\n🪙 *GOLD SAVINGS PASSBOOK RECEIPT*\n\n👤 *Member:* ${scheme.customer_name}\n📄 *Passbook A/C:* ${scheme.id}\n📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n\n💰 *Monthly Amount:* ₹${scheme.monthly_amount.toLocaleString('en-IN')}\n📊 *Installments Paid:* ${scheme.installments_paid} / ${scheme.tenure_months}\n🪙 *Gold Accumulated:* *${scheme.accumulated_gold_grams}g* (22K Fine)\n💵 *Total Cash Deposited:* ₹${scheme.total_amount_paid.toLocaleString('en-IN')}\n🎁 *Maturity Store Bonus:* ₹${scheme.bonus_amount.toLocaleString('en-IN')}\n\n${scheme.status === 'MATURED' ? '🎉 *YOUR SCHEME IS READY FOR REDEMPTION! Visit showroom to claim your jewellery.*' : '🗓️ *Next Due Date:* ' + scheme.next_due_date}\n\n🙏 *Thank you for saving in gold with us!*`;
    
    let phone = scheme.phone.replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Aggregates
  const totalActive = schemes.filter(s => s.status === 'ACTIVE').length;
  const totalMatured = schemes.filter(s => s.status === 'MATURED').length;
  const totalDeposited = schemes.reduce((sum, s) => sum + s.total_amount_paid, 0);
  const totalGoldGrams = schemes.reduce((sum, s) => sum + s.accumulated_gold_grams, 0).toFixed(3);

  const filtered = schemes.filter(s =>
    s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              SWARNA YOJANA
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Gold Savings Scheme & Monthly SIP Hub</h2>
          </div>
          <p className="text-xs text-slate-400">
            11+1 Monthly customer gold accumulation scheme with live 22K rate booking and WhatsApp passbook receipts.
          </p>
        </div>

        <button
          onClick={() => setIsEnrollModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll New Member</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Active Accounts</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">{totalActive}</div>
          <div className="mt-1 text-[11px] text-slate-400">{totalMatured} matured for redemption</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Deposit Pool</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">₹{totalDeposited.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-slate-400">Advance customer capital</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Gold Booked (22K)</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-300">{totalGoldGrams}g</div>
          <div className="mt-1 text-[11px] text-slate-400">Locked at live daily rates</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Today 22K Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-300">₹{gold22kRate.toLocaleString('en-IN')}/g</div>
          <div className="mt-1 text-[11px] text-slate-400">Base booking rate today</div>
        </div>

      </div>

      {/* Scheme Members Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Registered Gold Scheme Passbooks</h3>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search member, phone, A/C..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase bg-slate-950/50">
                <th className="py-2.5 px-3">Passbook A/C</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Scheme</th>
                <th className="py-2.5 px-3">Monthly EMI</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3 text-right">Gold Accumulated</th>
                <th className="py-2.5 px-3 text-right">Total Paid</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">{s.id}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-100">{s.customer_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.phone}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-[11px]">{s.scheme_name}</td>
                  <td className="py-3 px-3 font-mono font-semibold">₹{s.monthly_amount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-200">{s.installments_paid}/{s.tenure_months}</span>
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${(s.installments_paid / s.tenure_months) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                    {s.accumulated_gold_grams}g
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                    ₹{s.total_amount_paid.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      s.status === 'MATURED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {s.status === 'ACTIVE' && (
                        <button
                          onClick={() => handlePayInstallment(s.id)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg shadow transition-all active:scale-95"
                          title="Record Monthly Installment"
                        >
                          + Pay EMI
                        </button>
                      )}
                      <button
                        onClick={() => handleSendWhatsAppReceipt(s)}
                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                        title="Send Passbook Statement to WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Enroll New Member */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-serif font-bold text-slate-100 text-base mb-1">Enroll in Gold Savings Scheme</h3>
            <p className="text-xs text-slate-400 mb-4">Start an 11+1 monthly gold accumulation passbook for the customer.</p>

            <form onSubmit={handleEnroll} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="e.g. Meera Singhania"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">WhatsApp Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Monthly Amount (₹) *</label>
                  <select
                    value={formData.monthly_amount}
                    onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold"
                  >
                    <option value="2000">₹2,000 / month</option>
                    <option value="5000">₹5,000 / month</option>
                    <option value="10000">₹10,000 / month</option>
                    <option value="25000">₹25,000 / month</option>
                    <option value="50000">₹50,000 / month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    disabled
                    value={formData.tenure_months}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                <span className="font-bold">11+1 Bonus Plan:</span> Customer pays 11 months, Showroom sponsors the 12th month instalment (₹{Number(formData.monthly_amount).toLocaleString('en-IN')}) upon jewellery purchase!
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
