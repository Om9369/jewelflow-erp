import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  Target,
  DollarSign,
  Gem,
  Coins,
  ArrowUpRight,
  Sparkles,
  Edit,
  Plus,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { api } from '../services/api';

export default function EmployeeAnalytics({ onNavigate }) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit / Add Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'SALES_EXECUTIVE',
    target_monthly_revenue: '2000000',
    target_monthly_grams: '300',
    commission_rate_pct: '1.2',
    avatar_color: '#D97706'
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployees();
      if (res.success) {
        setEmployees(res.employees);
        if (res.employees.length > 0) {
          setSelectedEmp(res.employees[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (emp) => {
    setFormData({
      name: emp.name,
      email: emp.email || '',
      phone: emp.phone || '',
      role: emp.role,
      target_monthly_revenue: emp.targets.monthly_revenue.toString(),
      target_monthly_grams: emp.targets.monthly_grams.toString(),
      commission_rate_pct: emp.performance.commission_rate_pct.toString(),
      avatar_color: emp.avatar_color || '#D97706'
    });
    setShowEditModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      if (showEditModal && selectedEmp) {
        await api.updateEmployee(selectedEmp.id, formData);
      } else if (showAddModal) {
        await api.createEmployee(formData);
      }
      setShowEditModal(false);
      setShowAddModal(false);
      loadEmployees();
    } catch (err) {
      alert(`Error saving employee: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Summary Metrics Across Team
  const totalTeamRevenue = employees.reduce((sum, e) => sum + e.performance.total_revenue, 0);
  const totalTeamGrams = employees.reduce((sum, e) => sum + e.performance.total_gold_grams, 0);
  const totalTeamCommissions = employees.reduce((sum, e) => sum + e.performance.commission_earned, 0);

  const chartData = employees.map(e => ({
    name: e.name.split(' ')[0],
    revenue: e.performance.total_revenue,
    target: e.targets.monthly_revenue,
    grams: e.performance.total_gold_grams,
    color: e.avatar_color
  }));

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              STAFF BI & COMMISSIONS
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Employee Analytics & Performance Hub</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time sales attribution, Gold grams sold, target achievements, and tiered commission payouts.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              phone: '',
              role: 'SALES_EXECUTIVE',
              target_monthly_revenue: '2000000',
              target_monthly_grams: '300',
              commission_rate_pct: '1.2',
              avatar_color: '#D97706'
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* 3 Executive Metric Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Team Sales Closed</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            ₹{totalTeamRevenue.toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Across all retail counters & B2B agents</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Gold Weight Sold</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Gem className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {totalTeamGrams.toFixed(2)}g
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Total bullion & ornament weight shifted</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Commission Pool</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-purple-300 mt-2">
            ₹{totalTeamCommissions.toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Earned staff incentives this cycle</p>
        </div>
      </div>

      {/* Main Grid: Left (Leaderboard & Team Chart), Right (Selected Staff Deep Dive) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Leaderboard & Chart */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Revenue Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Sales Comparison by Employee (₹)</h3>
                <p className="text-xs text-slate-400">Total revenue generated vs targets</p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#D97706'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Staff Rankings & Commission Engine
            </h3>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {employees.map((emp) => {
                const isSelected = selectedEmp?.id === emp.id;

                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmp(emp)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-slate-100 shadow-md ring-1 ring-amber-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow"
                        style={{ backgroundColor: emp.avatar_color }}
                      >
                        #{emp.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-100">{emp.name}</p>
                          <span className="px-1.5 py-0.2 text-[9px] bg-slate-800 text-slate-300 font-semibold rounded">
                            {emp.role.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {emp.performance.total_tickets} sales • Gold Sold: {emp.performance.total_gold_grams}g
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-amber-300 text-sm">
                        ₹{emp.performance.total_revenue.toLocaleString()}
                      </p>
                      <span className="text-[10px] font-mono font-semibold text-emerald-400">
                        ₹{emp.performance.commission_earned.toLocaleString()} Comm. ({emp.performance.revenue_achievement_pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 5 Cols: Selected Employee Deep Dive Details */}
        <div className="lg:col-span-5 space-y-4">
          {selectedEmp && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              
              {/* Profile Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-lg"
                    style={{ backgroundColor: selectedEmp.avatar_color }}
                  >
                    {selectedEmp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{selectedEmp.name}</h3>
                    <p className="text-xs text-slate-400">{selectedEmp.role.replace('_', ' ')} • {selectedEmp.phone}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleEditOpen(selectedEmp)}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit Targets & Commission %"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              {/* Target vs Achievement Gauges */}
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                
                {/* Revenue Target Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Revenue Goal:</span>
                    <span className="font-mono text-slate-200">
                      ₹{selectedEmp.performance.total_revenue.toLocaleString()} / ₹{selectedEmp.targets.monthly_revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                      style={{ width: `${Math.min(100, selectedEmp.performance.revenue_achievement_pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Progress: {selectedEmp.performance.revenue_achievement_pct}%</span>
                    <span className="text-amber-400 font-bold">Grade: {selectedEmp.performance.performance_grade}</span>
                  </div>
                </div>

                {/* Grams Target Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gold Grams Weight Target:</span>
                    <span className="font-mono text-slate-200">
                      {selectedEmp.performance.total_gold_grams}g / {selectedEmp.targets.monthly_grams}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      style={{ width: `${Math.min(100, selectedEmp.performance.grams_achievement_pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Progress: {selectedEmp.performance.grams_achievement_pct}%</span>
                  </div>
                </div>

              </div>

              {/* Commission Breakdown Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 border border-amber-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                    Commission & Incentive Payout
                  </span>
                  <span className="font-mono text-slate-400">
                    Rate: {selectedEmp.performance.commission_rate_pct}%
                  </span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Base Sales Commission:</span>
                  <span className="font-mono font-semibold">
                    ₹{Math.round((selectedEmp.performance.total_revenue * selectedEmp.performance.commission_rate_pct) / 100).toLocaleString()}
                  </span>
                </div>

                {selectedEmp.performance.revenue_achievement_pct >= 100 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Exceeded Target Bonus:</span>
                    <span className="font-mono">
                      +₹{Math.round(((selectedEmp.performance.total_revenue - selectedEmp.targets.monthly_revenue) * (selectedEmp.performance.commission_rate_pct * 0.5)) / 100).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="font-bold text-slate-100">Total Net Incentive:</span>
                  <span className="font-mono text-lg font-bold text-amber-400">
                    ₹{selectedEmp.performance.commission_earned.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* KPI Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Average Ticket Size:</span>
                  <span className="font-mono font-bold text-slate-200">
                    ₹{selectedEmp.performance.average_ticket_size.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Top Category Sold:</span>
                  <span className="font-bold text-amber-400 truncate block">
                    {selectedEmp.performance.top_category}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Edit / Add Modal */}
      {(showEditModal || showAddModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 mb-4 pb-2 border-b border-slate-800">
              {showEditModal ? `Update Settings: ${selectedEmp?.name}` : 'Add New Staff Member'}
            </h3>

            <form onSubmit={handleSaveEmployee} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="SALES_EXECUTIVE">Sales Executive</option>
                    <option value="WHOLESALE_AGENT">Wholesale Agent</option>
                    <option value="CASHIER">Cashier</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Target Revenue (₹)</label>
                  <input
                    type="number"
                    value={formData.target_monthly_revenue}
                    onChange={(e) => setFormData({ ...formData, target_monthly_revenue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Target Gold (Grams)</label>
                  <input
                    type="number"
                    value={formData.target_monthly_grams}
                    onChange={(e) => setFormData({ ...formData, target_monthly_grams: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Commission Rate (% on Sales)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.commission_rate_pct}
                  onChange={(e) => setFormData({ ...formData, commission_rate_pct: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
