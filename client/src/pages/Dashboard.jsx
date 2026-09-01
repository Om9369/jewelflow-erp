import React, { useState, useEffect } from 'react';
import {
  Gem,
  Coins,
  TrendingUp,
  Award,
  ShoppingCart,
  Layers,
  ArrowUpRight,
  Sparkles,
  Users,
  ShieldCheck,
  Scale,
  Plus,
  PiggyBank,
  Store,
  Receipt,
  Truck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { api } from '../services/api';
import { getStoreConfig } from '../services/storeConfig';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#64748B'];

const defaultDashboardData = {
  stock_summary: {
    total_stock_value_inr: 3575543,
    gold_gross_grams: 148.5,
    gold_fine_grams: 135.2,
    silver_grams: 850.0,
    diamond_carats: 1.85,
    in_stock_items: 16,
    old_gold_scrap_grams: 11.5,
    total_customers_count: 6
  },
  sales_summary: {
    total_revenue: 1845000,
    retail_revenue: 1845000,
    wholesale_revenue: 0,
    total_gold_grams_sold: 268.5,
    invoices_count: 24,
    top_employee: { name: 'Aarav Verma', revenue: 462703 }
  },
  category_breakdown: [
    { name: 'Bridal Necklaces', value: 980000 },
    { name: 'Gold Bangles & Kadas', value: 754000 },
    { name: 'Diamond & Solitaire Rings', value: 650000 },
    { name: 'Earrings & Jhumkas', value: 540000 },
    { name: 'Chains & Mangalsutra', value: 420000 },
    { name: 'Silver Coins & Utensils', value: 231543 }
  ],
  sales_trend: [
    { day: 'Mon', revenue: 220000, retail: 220000, wholesale: 0, total: 220000, gold_grams: 32 },
    { day: 'Tue', revenue: 285000, retail: 285000, wholesale: 0, total: 285000, gold_grams: 41 },
    { day: 'Wed', revenue: 310000, retail: 310000, wholesale: 0, total: 310000, gold_grams: 45 },
    { day: 'Thu', revenue: 295000, retail: 295000, wholesale: 0, total: 295000, gold_grams: 43 },
    { day: 'Fri', revenue: 387074, retail: 387074, wholesale: 0, total: 387074, gold_grams: 56 },
    { day: 'Sat', revenue: 420000, retail: 420000, wholesale: 0, total: 420000, gold_grams: 62 },
    { day: 'Sun (Today)', revenue: 462703, retail: 462703, wholesale: 0, total: 462703, gold_grams: 68.5 }
  ],
  metal_distribution: [
    { name: 'Showcase Gold (22K/18K)', weight_grams: 148.5, color: '#F59E0B' },
    { name: 'Silver Articles (999/925)', weight_grams: 850.0, color: '#94A3B8' },
    { name: 'Old Gold Scrap Vault', weight_grams: 11.5, color: '#10B981' }
  ]
};

export default function Dashboard({ onNavigate, onOpenAddModal, onOpenRateModal }) {
  const [data, setData] = useState(defaultDashboardData);
  const [employees, setEmployees] = useState([]);
  const [storeConfig, setStoreConfig] = useState(getStoreConfig());

  useEffect(() => {
    loadData();
    const handleStoreUpdate = () => setStoreConfig(getStoreConfig());
    window.addEventListener('store_config_updated', handleStoreUpdate);
    return () => window.removeEventListener('store_config_updated', handleStoreUpdate);
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, empRes] = await Promise.all([
        api.getDashboard(),
        api.getEmployees()
      ]);
      if (dashRes && dashRes.success && dashRes.data) {
        setData(dashRes.data);
      } else if (dashRes && dashRes.stock_summary) {
        setData(dashRes);
      }
      if (empRes && empRes.success && empRes.employees) {
        setEmployees(empRes.employees);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stock_summary = data?.stock_summary || defaultDashboardData.stock_summary;
  const sales_summary = data?.sales_summary || defaultDashboardData.sales_summary;
  const sales_trend = (data?.sales_trend || defaultDashboardData.sales_trend).map(item => ({
    ...item,
    revenue: Number(item.revenue || item.total || item.retail || 0)
  }));
  const category_breakdown = data?.category_breakdown || defaultDashboardData.category_breakdown;
  const metal_distribution = data?.metal_distribution || defaultDashboardData.metal_distribution;
  const topSalesExec = employees.length > 0 ? employees[0] : null;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Top Banner: Quick Actions & Live Valuation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
              RETAIL SHOWROOM LIVE PORTFOLIO
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">| Daily Auto-Valuation</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-slate-100 leading-snug">
            Showroom Stock Value:{' '}
            <span className="text-amber-400 font-mono block sm:inline">
              ₹{(stock_summary.total_stock_value_inr || 3575543).toLocaleString('en-IN')}
            </span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2 sm:line-clamp-none">
            Valued automatically based on today's live 22K & 24K gold rates across all counter showcase trays and vault inventory.
          </p>
        </div>

        {/* 3 Core Pillars Quick Launch Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex items-center gap-2 z-10 w-full lg:w-auto pt-2 lg:pt-0">
          <button
            onClick={() => onNavigate('retail-pos')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 flex-shrink-0" />
            <span>1. Sales Billing</span>
          </button>

          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <Layers className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>2. Showroom Stock</span>
          </button>

          <button
            onClick={() => onNavigate('purchases')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Truck className="w-4 h-4 flex-shrink-0" />
            <span>3. Purchases Inward</span>
          </button>
        </div>
      </div>

      {/* Primary Retail KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Physical Gold Grams */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 rounded-2xl p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Showcase Gold</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
              {stock_summary.gold_gross_grams}g
            </span>
            <span className="text-xs text-amber-400/80 font-mono">
              ({stock_summary.gold_fine_grams}g Fine)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span>In-Stock Tagged:</span>
            <span className="font-semibold text-slate-200">{stock_summary.in_stock_items} jewellery items</span>
          </div>
        </div>

        {/* Physical Silver Articles */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-400/30 rounded-2xl p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Silver Articles</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-700/30 border border-slate-600/30 flex items-center justify-center text-slate-300">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
              {stock_summary.silver_grams}g
            </span>
            <span className="text-xs text-slate-400">999 Fine & 925</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Utensils & Coins:</span>
            <span className="font-semibold text-slate-200">Full Audit Match</span>
          </div>
        </div>

        {/* Registered Clients & VIPs */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-purple-500/30 rounded-2xl p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Client Directory & KYC</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-purple-300">
              {stock_summary.total_customers_count || 6} Clients
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span>VIP KYC Registry:</span>
            <button
              onClick={() => onNavigate('customers')}
              className="font-semibold text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Directory</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Monthly Showroom Revenue */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Showroom Sales</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              ₹{(sales_summary.total_revenue || 1845000).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Gold Sold:</span>
            <span className="font-semibold text-slate-200">{sales_summary.total_gold_grams_sold}g net</span>
          </div>
        </div>

      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Sales Trend Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Weekly Showroom Counter Revenue</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Daily retail jewellery billing trend</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-amber-400 font-semibold">
              <Receipt className="w-3.5 h-3.5" />
              <span>3% GST Tax Invoices</span>
            </div>
          </div>

          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRetail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  formatter={(value) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, 'Sales Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRetail)" name="Retail Sales" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metal Distribution Pie */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Showroom Metal Custody</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">Total physical grams in trays and vaults</p>
          </div>

          <div className="h-44 sm:h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metal_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="weight_grams"
                >
                  {metal_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  formatter={(v, n, item) => [`${v}g`, item.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] sm:text-xs">
            {metal_distribution.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-slate-300">{m.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-100">{m.weight_grams}g</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Lower Row: Category Breakdown & Staff Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Category Breakdown */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Showcase Stock Valuation by Category</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Retail counter distribution in INR</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-[11px] sm:text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Catalog & Tags</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {category_breakdown.map((cat, idx) => (
              <div key={idx} className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] sm:text-xs text-slate-400 block truncate font-semibold">{cat.name}</span>
                <span className="text-sm sm:text-lg font-bold font-mono text-amber-400 mt-1 block">
                  ₹{cat.value.toLocaleString('en-IN')}
                </span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (cat.value / 1000000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performer Card */}
        <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/20 rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                STAR SALES EXECUTIVE
              </span>
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>

            <div className="mt-3 sm:mt-4 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold text-base sm:text-lg font-serif">
                {topSalesExec ? topSalesExec.name.charAt(0) : 'A'}
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm sm:text-base">{topSalesExec ? topSalesExec.name : 'Aarav Verma'}</h4>
                <p className="text-[11px] sm:text-xs text-slate-400">{topSalesExec ? topSalesExec.role.replace('_', ' ') : 'Senior Sales Executive'}</p>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Retail Sales Achieved:</span>
                <span className="font-mono font-bold text-amber-400">
                  ₹{(topSalesExec?.performance?.total_revenue || sales_summary?.top_employee?.revenue || 462703).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Gold Target Attained:</span>
                <span className="font-mono font-semibold text-emerald-400">115.4% (Over Target)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Commission Earned:</span>
                <span className="font-mono font-semibold text-slate-100">
                  ₹{(topSalesExec?.performance?.commission_earned || 5552).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('employee-hub')}
            className="w-full mt-3 sm:mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff Analytics & Targets</span>
          </button>
        </div>

      </div>

    </div>
  );
}
