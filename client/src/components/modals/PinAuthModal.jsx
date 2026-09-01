import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, X, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { verifyOwnerPin } from '../../services/storeConfig';

export default function PinAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Owner Verification Required',
  description = 'Enter your 4-digit Owner Security PIN to proceed.'
}) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError('');
      setTimeout(() => {
        if (inputRefs[0].current) inputRefs[0].current.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    // Move to next box if digit entered
    if (value && index < 3 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current.focus();
    }

    // Auto-verify when 4th digit entered
    if (index === 3 && value) {
      const fullPin = newPin.slice(0, 3).join('') + value.slice(-1);
      submitPin(fullPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0 && inputRefs[index - 1].current) {
      inputRefs[index - 1].current.focus();
    }
    if (e.key === 'Enter') {
      submitPin(pin.join(''));
    }
  };

  const submitPin = (enteredPin) => {
    if (enteredPin.length !== 4) {
      setError('Please enter complete 4-digit PIN');
      return;
    }

    if (verifyOwnerPin(enteredPin)) {
      setError('');
      onSuccess();
      onClose();
    } else {
      setError('Incorrect Owner PIN. Default is 1234.');
      setPin(['', '', '', '']);
      if (inputRefs[0].current) inputRefs[0].current.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 className="font-serif font-bold text-base text-slate-100">{title}</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">{description}</p>

        {/* 4 Digit PIN Input Circles */}
        <div className="flex justify-center gap-3 mb-4">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-12 h-14 text-center font-mono text-2xl font-bold rounded-2xl border transition-all ${
                error
                  ? 'border-rose-500 bg-rose-500/10 text-rose-300 ring-2 ring-rose-500/20'
                  : digit
                  ? 'border-amber-500 bg-slate-950 text-amber-300 ring-2 ring-amber-500/20'
                  : 'border-slate-700 bg-slate-950 text-slate-100 focus:border-amber-500'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-[11px] text-slate-500 mb-5">
          <span>Showroom Master PIN: Default is </span>
          <span className="font-mono font-bold text-slate-400">1234</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submitPin(pin.join(''))}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            Verify & Unlock
          </button>
        </div>

      </div>
    </div>
  );
}
