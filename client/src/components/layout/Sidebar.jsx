import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Users,
  Hammer,
  Scale,
  Coins,
  FileSpreadsheet,
  Building2,
  Store,
  Boxes,
  X
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'CORE' },
  { id: 'retail-pos', label: 'Retail POS Billing', icon: ShoppingCart, category: 'RETAIL', badge: 'Counter' },
  { id: 'inventory', label: 'Stock & Jewellery Catalog', icon: Layers, category: 'CORE', badge: 'Tags' },
  { id: 'wholesale-pos', label: 'Wholesale & B2B Challan', icon: Building2, category: 'WHOLESALE', badge: 'Lots' },
  { id: 'employee-hub', label: 'Employee Analytics Hub', icon: Users, category: 'CORE', highlight: true },
  { id: 'karigar', label: 'Karigar / Artisan Orders', icon: Hammer, category: 'OPERATIONS' },
  { id: 'stock-audit', label: 'Showcase Tray Audit', icon: Scale, category: 'OPERATIONS', badge: 'Audit' },
  { id: 'old-gold', label: 'Old Gold & Scrap Buyback', icon: Coins, category: 'OPERATIONS' },
  { id: 'reports', label: 'Stock Ledger & Reports', icon: FileSpreadsheet, category: 'REPORTS' },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeMode,
  setActiveMode,
  isOpen,
  onClose
}) {
  const content = (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 h-full min-h-screen lg:min-h-[calc(100vh-61px)]">
      
      {/* Mobile Header with Close button */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between lg:hidden bg-slate-950">
        <span className="text-xs font-bold text-amber-300 font-serif tracking-wider">NAVIGATION MENU</span>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Switcher Banner */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Operations Mode
        </label>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              setActiveMode('RETAIL');
              if (onClose) onClose();
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
              activeMode === 'RETAIL'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Retail</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('WHOLESALE');
              if (onClose) onClose();
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
              activeMode === 'WHOLESALE'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>B2B Lots</span>
          </button>
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
          <span className="font-mono text-[11px] text-amber-400">27AAACS1234M1Z5</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>BIS Hallmarking:</span>
          <span className="text-emerald-400 font-medium">HM-IND-916001</span>
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
