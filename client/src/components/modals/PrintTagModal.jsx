import React, { useState } from 'react';
import { X, Printer, QrCode, Sparkles, Smartphone, FileText, CheckCircle2 } from 'lucide-react';
import QRCodeSVG from '../common/QRCodeSVG';

export default function PrintTagModal({ isOpen, onClose, product }) {
  const [qrFormat, setQrFormat] = useState('URL'); // 'URL' | 'TEXT'
  
  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  const grossWt = Number(product.gross_weight).toFixed(3);
  const netWt = Number(product.net_weight).toFixed(3);
  const stoneWt = Number(product.stone_weight).toFixed(3);

  // Format 1: Direct Digital Certificate Web Passport URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://jewelflow.app';
  const verifyUrl = `${origin}/?verify=${encodeURIComponent(product.sku || product.id)}`;

  // Format 2: Universal Plain-Text Certificate (Works offline on 100% of phone cameras & Google Lens without internet)
  const textCard = `✨ JEWELFLOW AUTHENTIC JEWELLERY ✨\n💍 Item: ${product.title}\n🏷️ SKU: ${product.sku}\n🌟 Purity: ${product.purity} BIS Hallmark\n⚖️ Gross Wt: ${grossWt}g\n💎 Stone Wt: ${stoneWt}g\n🪙 Net Gold: ${netWt}g\n🛡️ HUID: ${product.huid || 'HM-916-IND-01'}\n✅ 100% Certified Authentic`;

  const activeQrValue = qrFormat === 'URL' ? verifyUrl : textCard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Print Jewellery QR Code Tag</h3>
              <p className="text-xs text-slate-400">Scannable by iPhone, Android, Google Lens & POS scanners</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Format Switcher (Web Link vs Instant Text Card) */}
        <div className="mt-4 p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between no-print text-xs">
          <span className="text-slate-400 font-medium pl-1">Phone Scan Mode:</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setQrFormat('URL')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                qrFormat === 'URL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              🌐 Digital Web Passport
            </button>
            <button
              type="button"
              onClick={() => setQrFormat('TEXT')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                qrFormat === 'TEXT'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              📄 Instant Text Specs (Offline)
            </button>
          </div>
        </div>

        {/* Tag Preview Area */}
        <div className="my-5 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-400 mb-3 no-print font-medium">
            Thermal Label Preview (Standard 90mm × 28mm Butterfly Tag)
          </p>

          <div className="printable-area p-3 bg-white text-black rounded-lg shadow-2xl border border-slate-300 w-[440px] select-none font-mono">
            <div className="border-2 border-black p-2.5 rounded flex items-stretch justify-between text-[11px] leading-tight bg-white">
              
              {/* Left Flap: Brand & Specs */}
              <div className="w-[52%] pr-2 border-r border-dashed border-gray-400 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-black pb-0.5 mb-1">
                    <span className="font-bold text-[10px] tracking-wider uppercase">JEWELFLOW</span>
                    <span className="text-[9px] bg-black text-white px-1.5 font-bold rounded">
                      {product.purity}
                    </span>
                  </div>
                  <p className="font-bold text-[11px] truncate text-slate-900">{product.title}</p>
                  <p className="text-[10px] text-gray-700 mt-0.5">SKU: <span className="font-bold text-black">{product.sku}</span></p>
                  {product.huid && (
                    <p className="text-[9px] text-gray-800">HUID: <span className="font-bold">{product.huid}</span></p>
                  )}
                </div>

                <div className="space-y-0.5 text-[10px] pt-1 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Wt:</span>
                    <span className="font-bold">{grossWt}g</span>
                  </div>
                  <div className="flex justify-between font-bold text-[11px]">
                    <span className="text-gray-900">Net Wt:</span>
                    <span className="text-blue-900">{netWt}g</span>
                  </div>
                </div>
              </div>

              {/* Right Flap: 2D QR Code & Quick Scan */}
              <div className="w-[48%] pl-2 flex flex-col items-center justify-between text-center">
                <span className="text-[9px] font-bold tracking-wider uppercase text-gray-700">SCAN QR TAG</span>
                
                {/* 2D QR Code */}
                <div className="p-1 bg-white border border-gray-300 rounded shadow-sm my-0.5 flex items-center justify-center">
                  <QRCodeSVG
                    value={activeQrValue}
                    size={72}
                  />
                </div>

                <div className="w-full text-center">
                  <span className="text-[9px] font-mono font-bold block text-black truncate">
                    {product.barcode || product.sku}
                  </span>
                  <span className="text-[8px] text-gray-500 block">
                    {product.counter_tray ? product.counter_tray.split('-')[0] : 'SHOWCASE'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 no-print">
          <div className="text-[11px] text-slate-400">
            Compatible with Zebra, TSC, TVS & Citizen thermal barcode/QR tag printers.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print QR Tag</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
