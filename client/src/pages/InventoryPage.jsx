import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  Printer,
  Plus,
  Tag,
  Gem,
  Coins,
  ChevronDown,
  Trash2,
  Edit,
  Boxes,
  Store,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function InventoryPage({ rates, onOpenAddModal, onPrintTag }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [metalFilter, setMetalFilter] = useState('ALL');
  const [purityFilter, setPurityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [itemTypeFilter, setItemTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('IN_STOCK');

  useEffect(() => {
    loadInventory();
  }, [metalFilter, purityFilter, categoryFilter, itemTypeFilter, statusFilter]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const [invRes, statsRes] = await Promise.all([
        api.getInventory({
          metal_type: metalFilter,
          purity: purityFilter,
          category: categoryFilter,
          item_type: itemTypeFilter,
          status: statusFilter
        }),
        api.getInventoryStats()
      ]);

      if (invRes && invRes.success) setItems(invRes.products || invRes.items || []);
      if (statsRes && statsRes.success) setStats(statsRes.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from inventory?`)) {
      try {
        await api.deleteProduct(id);
        loadInventory();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.barcode && item.barcode.includes(searchTerm)) ||
    (item.huid && item.huid.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              STOCK MANAGEMENT
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Jewellery & Wholesale Lot Inventory</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time Gross, Net, and Stone weights, HUID hallmarks, Tray locations, and Printable Barcode labels.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Stock / Lot</span>
        </button>
      </div>

      {/* Stock Holdings Stat Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Total In-Stock Items</span>
            <span className="text-lg font-bold font-mono text-slate-100">{stats.total_items}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Showroom Pieces</span>
            <span className="text-lg font-bold font-mono text-amber-400">{stats.retail_pieces}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Wholesale Lots</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{stats.wholesale_lots}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Gold Holding (Gross)</span>
            <span className="text-lg font-bold font-mono text-amber-300">{stats.gold_gross_weight_grams}g</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Fine Gold (99.9%)</span>
            <span className="text-lg font-bold font-mono text-blue-400">{stats.gold_fine_weight_grams}g</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Holding Valuation</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              ₹{Math.round(stats.total_stock_valuation_inr / 1000)}k
            </span>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Title, SKU, Barcode, HUID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Types (Pieces & Lots)</option>
              <option value="RETAIL_SINGLE">Showroom Pieces</option>
              <option value="WHOLESALE_LOT">Wholesale Bulk Lots</option>
            </select>

            <select
              value={metalFilter}
              onChange={(e) => setMetalFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Metals</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Platinum">Platinum</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Necklaces">Necklaces</option>
              <option value="Bangles">Bangles</option>
              <option value="Rings">Rings</option>
              <option value="Earrings">Earrings</option>
              <option value="Chains">Chains</option>
              <option value="Mangalsutra">Mangalsutra</option>
              <option value="Coins & Bars">Coins & Bars</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="IN_STOCK">In Stock Only</option>
              <option value="SOLD">Sold</option>
              <option value="ALL">All Records</option>
            </select>
          </div>

        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">SKU / HUID</th>
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-4">Purity / Metal</th>
                <th className="py-3 px-4 text-right">Gross Wt</th>
                <th className="py-3 px-4 text-right">Net Wt</th>
                <th className="py-3 px-4 text-right">Making</th>
                <th className="py-3 px-4 text-right">Est. Price (Live)</th>
                <th className="py-3 px-4">Showcase Tray</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  
                  {/* SKU & HUID */}
                  <td className="py-3 px-4 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-400">{item.sku}</span>
                      {item.item_type === 'WHOLESALE_LOT' && (
                        <span className="px-1 text-[9px] bg-emerald-500/10 text-emerald-400 rounded font-bold">
                          LOT
                        </span>
                      )}
                    </div>
                    {item.huid && <span className="text-[10px] text-slate-500 block">HUID: {item.huid}</span>}
                  </td>

                  {/* Title & Category */}
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-100">{item.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{item.category}</span>
                      {item.stone_price > 0 && <span className="text-blue-400">• Stone: {item.stone_type}</span>}
                    </div>
                  </td>

                  {/* Purity & Metal */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {item.purity}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{item.metal_type}</span>
                  </td>

                  {/* Weights */}
                  <td className="py-3 px-4 text-right font-mono text-slate-300 font-semibold">
                    {Number(item.gross_weight).toFixed(3)}g
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                    {Number(item.net_weight).toFixed(3)}g
                  </td>

                  {/* Making */}
                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                    {item.making_charge_type === 'FIXED'
                      ? `₹${item.making_charge_value}`
                      : `₹${item.making_charge_value}/g`}
                  </td>

                  {/* Est Live Price */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    ₹{item.estimated_retail_price?.toLocaleString()}
                  </td>

                  {/* Tray Location */}
                  <td className="py-3 px-4 text-slate-300 text-[11px]">
                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] block truncate max-w-[140px]">
                      {item.counter_tray || 'General'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onPrintTag(item)}
                        title="Print Jewellery Barcode Tag"
                        className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        title="Delete item"
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
