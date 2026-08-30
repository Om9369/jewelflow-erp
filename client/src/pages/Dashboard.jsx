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
  Plus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#64748B'];

const defaultDashboardData = {
  stock_summary: {
    total_stock_value_inr: 3575543,
    gold_gross_grams: 148.5,
    gold_fine_grams: 135.2,
    silver_grams: 850.0,
    diamond_carats: 1.85,
    in_stock_items: 16,
    karigar_metal_grams: 74.5
  },
  sales_summary: {
    total_revenue: 2276987,
    retail_revenue: 804793,
    wholesale_revenue: 1472194,
    total_gold_grams_sold: 308.5,
    invoices_count: 5,
    top_employee: { name: 'Aarav Verma', revenue: 462703 }
  },
  category_breakdown: [
    { name: 'Necklaces', value: 980000 },
    { name: 'Bangles', value: 594000 },
    { name: 'Rings', value: 650000 },
    { name: 'Wholesale Lots', value: 945000 }
  ],
  sales_trend: [
    { day: 'Mon', retail: 120000, wholesale: 350000, total: 470000, gold_grams: 68 },
    { day: 'Tue', retail: 185000, wholesale: 0, total: 185000, gold_grams: 28 },
    { day: 'Wed', retail: 210000, wholesale: 880224, total: 1090224, gold_grams: 158 },
    { day: 'Thu', retail: 95000, wholesale: 0, total: 95000, gold_grams: 14 },
    { day: 'Fri', retail: 387074, wholesale: 591970, total: 979044, gold_grams: 132 },
    { day: 'Sat', retail: 420000, wholesale: 250000, total: 670000, gold_grams: 95 },
    { day: 'Sun (Today)', retail: 209658, wholesale: 253045, total: 462703, gold_grams: 80.9 }
  ],
  metal_distribution: [
    { name: 'Gold 22K/24K', weight_grams: 148.5, color: '#F59E0B' },
    { name: 'Silver 999/925', weight_grams: 850.0, color: '#94A3B8' },
    { name: 'With Karigars (Gold)', weight_grams: 74.5, color: '#6366F1' }
  ]
};

export default function Dashboard({ onNavigate, onOpenAddModal, onOpenRateModal }) {
  const [data, setData] = useState(defaultDashboardData);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
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
  const sales_trend = data?.sales_trend || defaultDashboardData.sales_trend;
  const category_breakdown = data?.category_breakdown || defaultDashboardData.category_breakdown;
  const metal_distribution = data?.metal_distribution || defaultDashboardData.metal_distribution;
  const topSalesExec = employees.length > 0 ? employees[0] : null;

  return (
    <div className="p-6 space-y-6">
      
      {/* Top Banner: Quick Actions & Live Valuation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
              LIVE PORTFOLIO OVERVIEW
            </span>
            <span className="text-xs text-slate-400">| Real-time Market Valuation</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-slate-100">
            Showroom & Wholesale Stock Value:{' '}
            <span className="text-amber-400 font-mono">
              ₹{(stock_summary.total_stock_value_inr || 3575543).toLocaleString()}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Valued automatically based on live daily gold & silver rates across all trays, vaults, and karigar job work.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2.5 z-10">
          <button
            onClick={() => onNavigate('retail-pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Retail Sale</span>
          </button>

          <button
            onClick={() => onNavigate('wholesale-pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Wholesale Challan</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Inward Stock</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Physical Gold Grams */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 rounded-2xl p-5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gold In Showroom</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {stock_summary.gold_gross_grams}g
            </span>
            <span className="text-xs text-amber-400/80 font-mono">
              ({stock_summary.gold_fine_grams}g Fine)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span>In-Stock Ready Items:</span>
            <span className="font-semibold text-slate-200">{stock_summary.in_stock_items} pieces</span>
          </div>
        </div>

        {/* Physical Silver Grams */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-400/30 rounded-2xl p-5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Silver Holdings</span>
            <div className="w-8 h-8 rounded-xl bg-slate-700/30 border border-slate-600/30 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {stock_summary.silver_grams}g
            </span>
            <span className="text-xs text-slate-400">999 Fine & 925</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Utensils & Coins:</span>
            <span className="font-semibold text-slate-200">Full Audit Match</span>
          </div>
        </div>

        {/* Karigar Pending Bullion */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Karigar Job Work</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-400">
              {stock_summary.karigar_metal_grams}g
            </span>
            <span className="text-xs text-slate-400">24K Bullion Issued</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Active Orders:</span>
            <button
              onClick={() => onNavigate('karigar')}
              className="font-semibold text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View Ledger</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Month Sales Revenue */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ₹{(sales_summary.total_revenue || 2276987).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Gold Sold:</span>
            <span className="font-semibold text-slate-200">{sales_summary.total_gold_grams_sold}g net</span>
          </div>
        </div>

      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-slate-100 text-base">Weekly Sales Trend</h3>
              <p className="text-xs text-slate-400">Daily Retail vs B2B Wholesale Revenue</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-slate-300">Retail Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-slate-300">Wholesale B2B</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRetail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWholesale" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="retail" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorRetail)" name="Retail Sales" />
                <Area type="monotone" dataKey="wholesale" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorWholesale)" name="Wholesale B2B" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metal Distribution Pie */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-slate-100 text-base">Metal Stock Distribution</h3>
            <p className="text-xs text-slate-400">Total grams weight breakdown across custody</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metal_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="weight_grams"
                >
                  {metal_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(v, n, item) => [`${v}g`, item.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            {metal_distribution.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-slate-300">{m.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-100">{m.weight_grams}g</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Lower Row: Category Breakdown & Staff Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-slate-100 text-base">Stock Valuation by Category</h3>
              <p className="text-xs text-slate-400">Showcase distribution in Indian Rupees</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Manage Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {category_breakdown.map((cat, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 block">{cat.name}</span>
                <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">
                  ₹{cat.value.toLocaleString()}
                </span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (cat.value / 1200000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performer Card */}
        <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/20 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                STAR SALES EXECUTIVE
              </span>
              <Award className="w-5 h-5 text-amber-400" />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold text-lg font-serif">
                {topSalesExec ? topSalesExec.name.charAt(0) : 'A'}
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-base">{topSalesExec ? topSalesExec.name : 'Aarav Verma'}</h4>
                <p className="text-xs text-slate-400">{topSalesExec ? topSalesExec.role.replace('_', ' ') : 'Senior Sales Executive'}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Total Volume Sold:</span>
                <span className="font-mono font-bold text-amber-400">
                  ₹{(topSalesExec?.performance?.total_revenue || 462703).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Gold Target Attained:</span>
                <span className="font-mono font-semibold text-emerald-400">115.4% (Over Target)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Commission Earned:</span>
                <span className="font-mono font-semibold text-slate-100">
                  ₹{(topSalesExec?.performance?.commission_earned || 5552).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('employees')}
            className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Staff Analytics Hub</span>
          </button>
        </div>

      </div>

    </div>
  );
}
