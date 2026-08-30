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

export default function Dashboard({ onNavigate, onOpenAddModal, onOpenRateModal }) {
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, empRes] = await Promise.all([
        api.getDashboard(),
        api.getEmployees()
      ]);
      if (dashRes.success) setData(dashRes.data);
      if (empRes.success) setEmployees(empRes.employees);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading live jewellery holdings & analytics...</p>
        </div>
      </div>
    );
  }

  const { stock_summary, sales_summary, sales_trend, category_breakdown, metal_distribution } = data;
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
              ₹{stock_summary.total_stock_value_inr.toLocaleString()}
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
            <Coins className="w-4 h-4" />
            <span>B2B Lot Challan</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Stock Inward</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards: Physical Metal Holdings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Gold Gross & Fine */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Gold Stock (Vault & Showcase)</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Gem className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-mono text-amber-300">
                {stock_summary.gold_gross_grams}g
              </h3>
              <span className="text-[11px] text-slate-400">Gross Wt</span>
            </div>
            <p className="text-[11px] text-amber-400/80 font-mono mt-1">
              Fine Gold Equiv: <span className="font-bold text-amber-300">{stock_summary.gold_fine_grams}g</span> (99.9%)
            </p>
          </div>
        </div>

        {/* Card 2: Silver Stock */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Silver Holding</span>
            <div className="p-2 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-700">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-mono text-slate-200">
                {stock_summary.silver_grams}g
              </h3>
              <span className="text-[11px] text-slate-400">Pooja & Payals</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Estimated ₹{(stock_summary.silver_grams * 85).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Card 3: Total Sales & Grams Sold */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Sales Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-mono text-emerald-400">
                ₹{sales_summary.total_revenue.toLocaleString()}
              </h3>
            </div>
            <p className="text-[11px] text-emerald-400/80 font-mono mt-1">
              Gold Weight Sold: <span className="font-bold">{sales_summary.total_gold_grams_sold}g</span>
            </p>
          </div>
        </div>

        {/* Card 4: Top Sales Staff */}
        <div
          onClick={() => onNavigate('employee-hub')}
          className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-amber-500/40 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Top Sales Performer</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors flex items-center justify-between">
              <span>{topSalesExec ? topSalesExec.name : 'N/A'}</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
            </h3>
            <p className="text-[11px] text-amber-400 font-mono mt-1">
              ₹{topSalesExec?.performance.total_revenue.toLocaleString()} ({topSalesExec?.performance.revenue_achievement_pct}% Target)
            </p>
          </div>
        </div>

      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Sales Revenue Trends (Retail vs Wholesale) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Daily Sales Revenue & Gold Grams Trend</h3>
              <p className="text-xs text-slate-400">Retail showroom counter sales vs Wholesale B2B challans</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-400">Retail</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-400">Wholesale</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="retailGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="wsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="retail" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#retailGrad)" />
                <Area type="monotone" dataKey="wholesale" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#wsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Category Sales Share */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Category Revenue Share</h3>
            <p className="text-xs text-slate-400">Necklaces, Bangles, Rings & Diamonds</p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={category_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {category_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val) => `₹${Number(val).toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            {category_breakdown.slice(0, 4).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate max-w-[120px]">{cat.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-100">₹{cat.value.toLocaleString()}</span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Employee Quick Leaderboard Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Sales Executives & Agent Performance Leaderboard</h3>
          </div>
          <button
            onClick={() => onNavigate('employee-hub')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>View Full Analysis & Commissions</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {employees.slice(0, 3).map((emp) => (
            <div
              key={emp.id}
              onClick={() => onNavigate('employee-hub')}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                    style={{ backgroundColor: emp.avatar_color }}
                  >
                    #{emp.rank}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{emp.name}</h4>
                    <p className="text-[10px] text-slate-400">{emp.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                  Grade {emp.performance.performance_grade}
                </span>
              </div>

              {/* Progress to Target */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Target Progress:</span>
                  <span className="font-mono text-amber-300 font-bold">{emp.performance.revenue_achievement_pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                    style={{ width: `${Math.min(100, emp.performance.revenue_achievement_pct)}%` }}
                  />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Revenue:</span>
                <span className="font-mono font-bold text-slate-100">₹{emp.performance.total_revenue.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
