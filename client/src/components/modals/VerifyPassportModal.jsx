import React from 'react';
import {
  ShieldCheck,
  Award,
  Gem,
  Coins,
  CheckCircle2,
  Calendar,
  X,
  Share2,
  Download,
  Store,
  Sparkles
} from 'lucide-react';
import { getStoreConfig } from '../../services/storeConfig';

export default function VerifyPassportModal({ isOpen, onClose, product, rates }) {
  if (!isOpen || !product) return null;

  const storeConfig = getStoreConfig();
  const rateObj = rates?.find(r => r.metal === product.metal_type && r.purity === product.purity);
  const liveRate = rateObj?.rate_per_gram || 6750;
  
  const netWt = Number(product.net_weight) || 0;
  const grossWt = Number(product.gross_weight) || 0;
  const stoneWt = Number(product.stone_weight) || 0;
  const estimatedValue = Math.round(netWt * liveRate);

  const handleShareWhatsApp = () => {
    const text = `✨ *${storeConfig.store_name}* ✨\n💎 *OFFICIAL DIGITAL JEWELLERY CERTIFICATE*\n\n💍 *Item:* ${product.title}\n🏷️ *SKU:* ${product.sku}\n🌟 *Purity:* ${product.purity}\n⚖️ *Gross Weight:* ${grossWt.toFixed(3)}g\n💎 *Stone Weight:* ${stoneWt.toFixed(3)}g\n🪙 *Net Gold Weight:* ${netWt.toFixed(3)}g\n🛡️ *BIS Hallmark HUID:* ${product.huid || storeConfig.bis_hallmark}\n💰 *Today's Certified Valuation:* ₹${estimatedValue.toLocaleString('en-IN')}\n\n🏛️ *Store:* ${storeConfig.store_name}, ${storeConfig.address}\n📞 *Contact:* ${storeConfig.phone}\n✅ *100% Certified Authentic & Hallmark Guaranteed*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden text-slate-100">
        
        {/* Background glow & watermark */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Card Header */}
        <div className="text-center space-y-1.5 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 mx-auto mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            100% BIS HALLMARK CERTIFIED
          </span>

          <h2 className="font-serif font-bold text-lg text-amber-100">{storeConfig.store_name}</h2>
          <p className="text-[11px] text-slate-400">Official Digital Jewellery Passport</p>
        </div>

        {/* Certificate Body */}
        <div className="mt-4 space-y-3.5 text-xs">
          
          {/* Item Title & Purity Badge */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">SKU: {product.sku}</span>
              <h3 className="font-bold text-slate-100 text-sm">{product.title}</h3>
              <span className="text-[11px] text-amber-400/90">{product.category}</span>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs font-mono block">
                {product.purity}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">{product.metal_type}</span>
            </div>
          </div>

          {/* Certified Weights Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Gross Weight</span>
              <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm">{grossWt.toFixed(3)}g</span>
            </div>

            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Stones/Beads</span>
              <span className="font-mono font-bold text-slate-300 text-xs sm:text-sm">
                {stoneWt > 0 ? `-${stoneWt.toFixed(3)}g` : '0.000g'}
              </span>
            </div>

            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30 text-center">
              <span className="text-[10px] text-amber-300 font-semibold block">Net Pure Gold</span>
              <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">{netWt.toFixed(3)}g</span>
            </div>
          </div>

          {/* Hallmarking & Security Details */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">BIS Hallmark HUID:</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {product.huid || storeConfig.bis_hallmark}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Today's Certified Valuation:</span>
              <span className="font-mono font-bold text-emerald-400">
                ₹{estimatedValue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Showcase Location:</span>
              <span className="text-slate-300 font-medium">
                {product.counter_tray || 'Counter Showcase'}
              </span>
            </div>
          </div>

          {/* Authentic Guarantee Banner */}
          <div className="p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex items-center gap-2.5 text-[10px] text-slate-300">
            <Award className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Lifetime guarantee of purity with full buyback facility at prevalent daily bullion rates.</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
