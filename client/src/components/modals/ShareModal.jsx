import React, { useState } from 'react';
import { X, Wifi, Smartphone, Globe, Copy, Check, QrCode, Monitor } from 'lucide-react';

export default function ShareModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '192.168.1.161';
  const lanUrl = `http://${currentHost}:3000`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(lanUrl)}&color=245-158-11&bgcolor=15-23-42`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Share JewelFlow ERP</h3>
              <p className="text-xs text-slate-400">Access from Mobile Phone, Tablet, or Another PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Method 1: Local Network (Instant QR Code) */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Wifi className="w-4 h-4" />
              <span>Option 1: Same Wi-Fi / Local Network</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* QR Code */}
              <div className="p-2 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-inner flex-shrink-0 flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="Scan QR code on Mobile"
                  className="w-32 h-32 rounded-xl"
                />
              </div>

              {/* Text Link & Copy */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-xs text-slate-300">
                  Scan this QR code with your phone camera, or open this URL in any phone or laptop connected to the same Wi-Fi:
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={lanUrl}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 select-all"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && <p className="text-[10px] text-emerald-400 font-semibold">✓ Link copied to clipboard!</p>}
              </div>
            </div>
          </div>

          {/* Method 2: Public Internet Tunnel */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
              <Globe className="w-4 h-4" />
              <span>Option 2: Share Across the Internet (Anywhere in the World)</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              To share this live with someone outside your Wi-Fi network, run this single command in a terminal:
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-emerald-400 flex items-center justify-between">
              <code>npx localtunnel --port 3000</code>
            </div>

            <p className="text-[11px] text-slate-500">
              This generates an instant HTTPS public link (e.g. <span className="text-slate-400 font-mono">https://jewelflow-xyz.loca.lt</span>) that anyone can open from any device globally.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
