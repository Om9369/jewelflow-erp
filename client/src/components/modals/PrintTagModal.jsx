import React from 'react';
import { X, Printer, Tag, Sparkles } from 'lucide-react';

export default function PrintTagModal({ isOpen, onClose, product }) {
  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Print Jewellery Barcode Tag</h3>
              <p className="text-xs text-slate-400">Standard Barbell / Butterfly thermal label format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tag Preview Area */}
        <div className="my-6 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-400 mb-3 no-print">
            Thermal Label Preview (Standard 90mm × 28mm Jewellery Tag)
          </p>

          <div className="printable-area p-4 bg-white text-black rounded-lg shadow-xl border border-slate-300 w-[420px] select-none font-mono">
            <div className="border border-black p-2 rounded flex items-stretch justify-between text-[11px] leading-tight bg-white">
              
              {/* Left Flap: Brand & Specs */}
              <div className="w-1/2 pr-2 border-r border-dashed border-gray-400 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-black pb-0.5 mb-1">
                    <span className="font-bold text-[10px] tracking-wider uppercase">JEWELFLOW</span>
                    <span className="text-[9px] bg-black text-white px-1 font-bold rounded">
                      {product.purity}
                    </span>
                  </div>
                  <p className="font-bold text-[11px] truncate text-slate-900">{product.title}</p>
                  <p className="text-[10px] text-gray-700">SKU: <span className="font-bold">{product.sku}</span></p>
                  {product.huid && (
                    <p className="text-[9px] text-gray-700">HUID: <span className="font-bold">{product.huid}</span></p>
                  )}
                </div>
                <div className="pt-1 text-[9px] text-gray-600 flex items-center justify-between">
                  <span>BIS HALLMARK</span>
                  <span>{product.counter_tray ? product.counter_tray.split('-')[0] : 'SHOWCASE'}</span>
                </div>
              </div>

              {/* Right Flap: Weights & Barcode */}
              <div className="w-1/2 pl-2 flex flex-col justify-between">
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Wt:</span>
                    <span className="font-bold">{Number(product.gross_weight).toFixed(3)}g</span>
                  </div>
                  {product.stone_weight > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Stone Wt:</span>
                      <span>{Number(product.stone_weight).toFixed(3)}g</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-0.5 font-bold text-[11px]">
                    <span>Net Metal Wt:</span>
                    <span className="text-blue-900">{Number(product.net_weight).toFixed(3)}g</span>
                  </div>
                </div>

                {/* Simulated Barcode Graphic */}
                <div className="text-center pt-1">
                  <div className="h-6 flex items-center justify-center gap-[2px] overflow-hidden">
                    {Array.from({ length: 34 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-full bg-black inline-block"
                        style={{
                          width: (i % 3 === 0 ? '2.5px' : i % 2 === 0 ? '1.5px' : '1px'),
                          opacity: i % 7 === 0 ? 0.4 : 1
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] tracking-widest font-bold block">{product.barcode || product.sku}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between no-print">
          <span className="text-xs text-slate-400">
            Compatible with Zebra, TSC, and standard 2-inch barcode printers
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Barcode Tag</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
