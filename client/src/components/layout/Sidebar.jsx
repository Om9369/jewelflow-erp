import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Users,
  Hammer,
  Scale,
  Coins,
  FileSpreadsheet,
  Store,
  X,
  PiggyBank,
  UserCheck,
  Settings,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { getStoreConfig } from '../../services/storeConfig';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, category: 'CORE' },
  { id: 'retail-pos', label: 'Counter POS Billing', icon: ShoppingCart, category: 'CORE', badge: 'Billing' },
  { id: 'inventory', label: 'Showroom Stock & Tags', icon: Layers, category: 'CORE', badge: 'Tags' },
  { id: 'customers', label: 'Customer Directory & KYC', icon: UserCheck, category: 'CORE' },
  { id: 'karigar', label: 'Custom Orders & Karigars', icon: Hammer, category: 'OPERATIONS' },
  { id: 'stock-audit', label: 'Showcase Tray Audit', icon: Scale, category: 'OPERATIONS', badge: 'Audit' },
  { id: 'old-gold', label: 'Old Gold Scrap Buyback', icon: Coins, category: 'OPERATIONS' },
  { id: 'employee-hub', label: 'Sales Staff Hub & Targets', icon: Users, category: 'MANAGEMENT' },
  { id: 'reports', label: 'Daily Sales & Tax Ledger', icon: FileSpreadsheet, category: 'MANAGEMENT' },
  { id: 'store-settings', label: 'Showroom Profile & Setup', icon: Settings, category: 'SETTINGS' },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  isOpen,
  onClose
}) {
  const [storeConfig, setStoreConfig] = useState(getStoreConfig());

  useEffect(() => {
    const handleUpdate = () => setStoreConfig(getStoreConfig());
    window.addEventListener('store_config_updated', handleUpdate);
    return () => window.removeEventListener('store_config_updated', handleUpdate);
  }, []);

  const content = (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 h-full min-h-screen lg:min-h-[calc(100vh-61px)]">
      
      {/* Mobile Header with Close button */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between lg:hidden bg-slate-950">
        <span className="text-xs font-bold text-amber-300 font-serif tracking-wider">SHOWROOM MENU</span>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Showroom Status Indicator */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">RETAIL SHOWROOM ERP</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            LIVE
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    isActive
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 text-[10px]'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {item.highlight && !item.badge && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Store Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-slate-300">GSTIN:</span>
          <span className="font-mono text-[11px] text-amber-400">{storeConfig.gstin}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>BIS Hallmarking:</span>
          <span className="text-emerald-400 font-medium">{storeConfig.bis_hallmark}</span>
        </div>
      </div>

    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block">
        {content}
      </div>

      {/* Mobile Slide-in Drawer with Backdrop Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
