import React from 'react';
import { Sparkles, TrendingUp, Edit3, Search, Gem, Menu, X, Share2 } from 'lucide-react';

export default function Navbar({
  rates,
  onOpenRateModal,
  searchQuery,
  setSearchQuery,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onOpenShareModal
}) {
  const gold22k = rates.find(r => r.metal === 'Gold' && r.purity.includes('22K'))?.rate_per_gram || 6750;
  const gold24k = rates.find(r => r.metal === 'Gold' && r.purity.includes('24K'))?.rate_per_gram || 7250;
  const gold18k = rates.find(r => r.metal === 'Gold' && r.purity.includes('18K'))?.rate_per_gram || 5550;
  const silver999 = rates.find(r => r.metal === 'Silver' && r.purity.includes('999'))?.rate_per_gram || 88.5;

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        
        {/* Left: Hamburger + Branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-fit">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold flex-shrink-0">
            <Gem className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-base sm:text-lg text-amber-100 tracking-wide">
                JEWEL<span className="text-amber-400">FLOW</span>
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                ERP
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">Jewellery & Bullion Management</p>
          </div>
        </div>

        {/* Center: Live Metal Rates Ticker Bar (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 border border-amber-500/20 rounded-xl px-3 sm:px-4 py-1.5 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 pr-2 border-r border-slate-800">
            <TrendingUp className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span className="hidden lg:inline">LIVE RATES</span>
          </div>

          <div className="flex items-center gap-3 lg:gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">24K:</span>
              <span className="font-mono font-bold text-amber-300">₹{gold24k.toLocaleString()}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-1">
              <span className="text-slate-400">22K:</span>
              <span className="font-mono font-bold text-amber-400">₹{gold22k.toLocaleString()}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700 hidden lg:block" />
            <div className="hidden lg:flex items-center gap-1">
              <span className="text-slate-400">18K:</span>
              <span className="font-mono font-bold text-amber-200">₹{gold18k.toLocaleString()}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Sil 999:</span>
              <span className="font-mono font-bold text-slate-200">₹{silver999.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={onOpenRateModal}
            title="Update Daily Metal Rates"
            className="ml-2 p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions (Share link, Rate Modal, Profile) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl transition-all shadow-sm"
            title="Share with another device / colleague"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share App</span>
          </button>

          <button
            onClick={onOpenRateModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rates</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-amber-900/40 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-xs">
              AD
            </div>
          </div>

        </div>

      </div>

      {/* Mobile Live Rates Ticker Strip */}
      <div className="md:hidden mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] overflow-x-auto gap-2">
        <div className="flex items-center gap-1 text-amber-400 font-bold">
          <TrendingUp className="w-3 h-3 animate-pulse" />
          <span>Rates:</span>
        </div>
        <div className="flex items-center gap-2.5 font-mono">
          <span className="text-amber-300">24K: ₹{gold24k}</span>
          <span className="text-amber-400 font-bold">22K: ₹{gold22k}</span>
          <span className="text-slate-300">Sil: ₹{silver999}</span>
        </div>
        <button
          onClick={onOpenRateModal}
          className="text-[10px] text-amber-400 underline pl-1"
        >
          Edit
        </button>
      </div>
    </header>
  );
}
