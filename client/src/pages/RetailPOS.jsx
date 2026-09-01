import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Coins,
  CreditCard,
  User,
  Users,
  ShieldCheck,
  Percent,
  CheckCircle2,
  AlertCircle,
  Gem,
  Phone,
  Award,
  X,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export default function RetailPOS({ rates, onInvoiceCreated }) {
  const [stockItems, setStockItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Customer & Attribution Info
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const customerSearchRef = useRef(null);

  // Old Gold Exchange Section
  const [enableOldGold, setEnableOldGold] = useState(false);
  const [oldGold, setOldGold] = useState({
    gross_weight: '',
    stone_dust_deduction: '0',
    purity_touch_pct: '87.5',
    valuation_rate: '6250'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();

    const handleClickOutside = (e) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      const [invRes, empRes, custRes] = await Promise.all([
        api.getInventory({ status: 'IN_STOCK', item_type: 'RETAIL_SINGLE' }),
        api.getEmployees(),
        api.getCustomers()
      ]);
      if (invRes && invRes.success) setStockItems(invRes.products || invRes.items || []);
      if (custRes && custRes.success) setCustomersList(custRes.customers || []);
      if (empRes && empRes.success && empRes.employees) {
        setEmployees(empRes.employees);
        if (empRes.employees.length > 0) {
          setSelectedEmployeeId(empRes.employees[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRateFor = (metal, purity) => {
    const r = rates?.find(item => item.metal === metal && item.purity === purity);
    return r ? r.rate_per_gram : 6750;
  };

  // Add Item to Cart
  const addToCart = (product) => {
    if (cart.find(item => item.product_id === product.id)) return;

    const liveRate = getRateFor(product.metal_type, product.purity);
    const metalVal = product.net_weight * liveRate;
    const makingVal = product.making_charge_type === 'FIXED'
      ? product.making_charge_value
      : (product.net_weight * product.making_charge_value);
    const stoneVal = product.stone_price || 0;
    const totalItemPrice = Math.round(metalVal + makingVal + stoneVal);

    const cartItem = {
      product_id: product.id,
      sku: product.sku,
      barcode: product.barcode,
      title: product.title,
      category: product.category,
      metal_type: product.metal_type,
      purity: product.purity,
      gross_weight: product.gross_weight,
      net_weight: product.net_weight,
      stone_weight: product.stone_weight,
      metal_rate: liveRate,
      making_charge: makingVal,
      stone_price: stoneVal,
      total_item_price: totalItemPrice,
      huid: product.huid,
      pieces: 1
    };

    setCart([...cart, cartItem]);
  };

  const removeFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Handle Quick Barcode Scan or Enter
  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      const found = stockItems.find(
        p => p.barcode === searchTerm.trim() || p.sku.toLowerCase() === searchTerm.trim().toLowerCase() || (p.huid && p.huid.toLowerCase() === searchTerm.trim().toLowerCase())
      );
      if (found) {
        addToCart(found);
        setSearchTerm('');
      } else {
        setError(`No in-stock item found for code: "${searchTerm}"`);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // Old Gold Calculations
  const ogGross = parseFloat(oldGold.gross_weight) || 0;
  const ogDust = parseFloat(oldGold.stone_dust_deduction) || 0;
  const ogNet = Math.max(0, ogGross - ogDust);
  const ogTouch = parseFloat(oldGold.purity_touch_pct) || 87.5;
  const ogFineGold = (ogNet * ogTouch) / 100;
  const ogRate = parseFloat(oldGold.valuation_rate) || 6250;
  const oldGoldCreditVal = enableOldGold ? Math.round(ogFineGold * ogRate) : 0;

  // Invoice Totals & GST Mode
  // If payment is in CASH, 3% GST is not included (0% GST) as requested. For UPI/Card/RTGS, standard 3% GST applies.
  const isCashPayment = paymentMode.toUpperCase() === 'CASH';
  const effectiveGstRate = isCashPayment ? 0 : 3;

  const subtotalMetalAndStones = cart.reduce((sum, it) => sum + (it.net_weight * it.metal_rate + it.stone_price), 0);
  const totalMaking = cart.reduce((sum, it) => sum + it.making_charge, 0);
  const subtotal = subtotalMetalAndStones + totalMaking;
  const discountVal = parseFloat(discount) || 0;
  const taxableAmount = Math.max(0, subtotal - discountVal);
  const gstAmount = isCashPayment ? 0 : parseFloat(((taxableAmount * 0.03)).toFixed(2)); // 0% on Cash, 3% on Digital
  const grandTotal = Math.max(0, Math.round(taxableAmount + gstAmount - oldGoldCreditVal));

  const totalGrossWeight = cart.reduce((sum, it) => sum + it.gross_weight, 0);
  const totalNetWeight = cart.reduce((sum, it) => sum + it.net_weight, 0);

  // Handle Checkout & Create Invoice
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty. Select jewellery items to bill.');
      return;
    }
    if (!customerName) {
      setError('Please provide customer name.');
      return;
    }
    if (!selectedEmployeeId) {
      setError('Please attribute this sale to a sales executive.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null,
        customer_name: customerName,
        customer_phone: customerPhone,
        employee_id: parseInt(selectedEmployeeId),
        items: cart,
        discount: discountVal,
        payment_mode: paymentMode,
        tax_rate: effectiveGstRate,
        notes: notes,
        old_gold: enableOldGold && oldGoldCreditVal > 0 ? {
          gross_weight: ogGross,
          stone_dust_deduction: ogDust,
          net_weight: ogNet,
          purity_touch_pct: ogTouch,
          fine_gold_weight: parseFloat(ogFineGold.toFixed(3)),
          valuation_rate: ogRate,
          total_valuation: oldGoldCreditVal
        } : null
      };

      const res = await api.createRetailInvoice(payload);
      if (res.success) {
        // Clear cart and refresh stock
        setCart([]);
        setEnableOldGold(false);
        setSelectedCustomerId('');
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        setDiscount('0');
        loadData();
        if (onInvoiceCreated) {
          onInvoiceCreated(res.invoice);
        }
      } else {
        setError(res.error || 'Checkout failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = stockItems.filter(
    p => !cart.some(c => c.product_id === p.id) &&
      (p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (p.huid && p.huid.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              RETAIL SHOWROOM POS
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Dynamic Billing & Checkout Terminal</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time live rate metal pricing with HUID hallmarking, making charges, Old Gold exchange, and Staff Attribution.
          </p>
        </div>

        {/* Barcode / Tag Quick Scanner Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="⚡ Scan Jewellery Tag / SKU / HUID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleBarcodeScan}
              className="w-72 sm:w-84 bg-slate-950 border border-amber-500/50 rounded-xl pl-9 pr-24 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 shadow-inner"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold font-mono uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Scanner Ready
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Terminal Grid: Left (Stock & Cart), Right (Billing Summary & Old Gold) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Cart & Available Stock */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Active Cart Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Billing Cart ({cart.length} items)</h3>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Total Net Wt: <span className="text-amber-400 font-bold">{totalNetWeight.toFixed(3)}g</span>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                <Gem className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>No jewellery items added to cart yet.</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Scan a barcode above or click items from the stock catalog below.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 truncate">{item.title}</span>
                        <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 rounded">
                          {item.purity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                        <span>Net: <b className="text-slate-200">{item.net_weight}g</b></span>
                        <span>•</span>
                        <span>Rate: ₹{item.metal_rate}/g</span>
                        <span>•</span>
                        <span>Making: ₹{item.making_charge.toLocaleString()}</span>
                        {item.stone_price > 0 && <span>• Stone: ₹{item.stone_price.toLocaleString()}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-amber-300">
                        ₹{item.total_item_price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Item Picker Catalog */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Available Showroom Stock ({filteredStock.length} items)
              </h4>
              <span className="text-[11px] text-slate-500">Click to add to bill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {filteredStock.slice(0, 10).map((prod) => {
                const liveRate = getRateFor(prod.metal_type, prod.purity);
                const estPrice = Math.round(prod.net_weight * liveRate + (prod.making_charge_type === 'FIXED' ? prod.making_charge_value : prod.net_weight * prod.making_charge_value) + (prod.stone_price || 0));

                return (
                  <button
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-left group flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate">
                        {prod.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {prod.purity} • Net {prod.net_weight}g • {prod.counter_tray ? prod.counter_tray.split('-')[0] : 'Tray'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-400 block">
                        ₹{estPrice.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono">+ Add</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 5 Cols: Attribution, Old Gold & Billing Summary */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Sales Staff Attribution & Customer Details */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Customer & Sales Staff Attribution
            </h3>

            {/* Salesperson Selector (Required for analytics) */}
            <div>
              <label className="text-[11px] font-semibold text-amber-400 block mb-1">
                Attributed Sales Executive * (Commission Engine)
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-400"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role ? emp.role.replace('_', ' ') : 'Staff'}){emp.performance?.revenue_achievement_pct !== undefined ? ` - ${emp.performance.revenue_achievement_pct}% Target` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Search by Mobile No / Name & Attribution */}
            <div className="space-y-2.5">
              
              {/* Search Box with Floating Auto-Complete */}
              <div className="relative" ref={customerSearchRef}>
                <label className="text-[11px] font-semibold text-amber-400 block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    Search Customer by Mobile No. or Name
                  </span>
                  {selectedCustomerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setSelectedCustomerObj(null);
                        setCustomerName('Walk-in Customer');
                        setCustomerPhone('');
                        setCustomerSearchQuery('');
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-normal flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Clear / Walk-in
                    </button>
                  )}
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Type mobile (e.g. 98111...) or customer name..."
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <Phone className="w-4 h-4 text-amber-400/70 absolute left-3 top-1/2 -translate-y-1/2" />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchQuery('');
                        setShowCustomerDropdown(false);
                      }}
                      className="text-slate-400 hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Floating Matches Dropdown */}
                {showCustomerDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-amber-500/40 rounded-xl shadow-2xl z-40 max-h-56 overflow-y-auto divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                    {customersList
                      .filter(c => {
                        if (!customerSearchQuery.trim()) return true;
                        const q = customerSearchQuery.toLowerCase().trim();
                        const phone = (c.phone || '').replace(/[^0-9]/g, '');
                        const name = (c.name || '').toLowerCase();
                        const pan = (c.pan_card || '').toLowerCase();
                        return phone.includes(q) || name.includes(q) || pan.includes(q);
                      })
                      .slice(0, 8)
                      .map(c => {
                        const isDiamond = c.loyalty_tier === 'DIAMOND_VIP';
                        const isPlat = c.loyalty_tier === 'PLATINUM';
                        const isGold = c.loyalty_tier === 'GOLD';

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setSelectedCustomerObj(c);
                              setCustomerName(c.name);
                              setCustomerPhone(c.phone || '');
                              setCustomerSearchQuery('');
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full p-2.5 text-left hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isDiamond
                                  ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white'
                                  : isPlat
                                  ? 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-100 block truncate text-xs">{c.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  📱 {c.phone || 'No phone'} {c.city ? `· ${c.city}` : ''}
                                </span>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-flex items-center gap-0.5 ${
                                isDiamond
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : isPlat
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : isGold
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {isDiamond ? <Gem className="w-2.5 h-2.5" /> : <Award className="w-2.5 h-2.5" />}
                                {c.loyalty_tier ? c.loyalty_tier.replace('_', ' ') : 'MEMBER'}
                              </span>
                              {c.total_purchases_inr > 0 && (
                                <span className="text-[9px] text-emerald-400 font-mono block mt-0.5">
                                  ₹{c.total_purchases_inr.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}

                    {customersList.filter(c => {
                      if (!customerSearchQuery.trim()) return true;
                      const q = customerSearchQuery.toLowerCase().trim();
                      const phone = (c.phone || '').replace(/[^0-9]/g, '');
                      const name = (c.name || '').toLowerCase();
                      return phone.includes(q) || name.includes(q);
                    }).length === 0 && (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        No registered customer found for "{customerSearchQuery}". Fill name & phone below to register new!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Customer Active VIP Card Banner */}
              {selectedCustomerObj && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                      <Gem className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100">{selectedCustomerObj.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold font-mono">
                          {selectedCustomerObj.loyalty_tier ? selectedCustomerObj.loyalty_tier.replace('_', ' ') : 'VIP'}
                        </span>
                        {selectedCustomerObj.kyc_verified && (
                          <span className="text-emerald-400 text-[9px] font-bold inline-flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> KYC
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        📱 {selectedCustomerObj.phone} · Spent: ₹{(selectedCustomerObj.total_purchases_inr || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId('');
                      setSelectedCustomerObj(null);
                      setCustomerName('Walk-in Customer');
                      setCustomerPhone('');
                    }}
                    className="text-slate-400 hover:text-slate-200 p-1"
                    title="Deselect customer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Editable Customer Name & Phone for Invoice */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (selectedCustomerObj && e.target.value !== selectedCustomerObj.name) {
                        setSelectedCustomerId('');
                        setSelectedCustomerObj(null);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Customer Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      const match = customersList.find(c => c.phone && c.phone.replace(/[^0-9]/g, '') === clean);
                      if (match) {
                        setSelectedCustomerId(match.id);
                        setSelectedCustomerObj(match);
                        setCustomerName(match.name);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

            </div>

            {/* Payment Mode */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['UPI', 'CARD', 'CASH'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMode === mode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Old Gold Customer Exchange Accordion */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Customer Old Gold Exchange</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableOldGold}
                  onChange={(e) => setEnableOldGold(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {enableOldGold && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-in fade-in">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Old Gross Wt (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={oldGold.gross_weight}
                      onChange={(e) => setOldGold({ ...oldGold, gross_weight: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Touch / Purity %</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="87.5"
                      value={oldGold.purity_touch_pct}
                      onChange={(e) => setOldGold({ ...oldGold, purity_touch_pct: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Exchange Credit Valuation:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    -₹{oldGoldCreditVal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Billing Breakdown & Checkout Button */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal (Metal + Stones):</span>
              <span className="font-mono font-medium text-slate-200">₹{Math.round(subtotalMetalAndStones).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Total Making Charges:</span>
              <span className="font-mono font-medium text-slate-200">₹{Math.round(totalMaking).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span>GST:</span>
                {isCashPayment ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    0% (Cash Payment)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                    3% (1.5% CGST + 1.5% SGST)
                  </span>
                )}
              </span>
              <span className={`font-mono font-medium ${isCashPayment ? 'text-emerald-400' : 'text-slate-200'}`}>
                {isCashPayment ? '₹0' : `₹${gstAmount.toLocaleString()}`}
              </span>
            </div>

            {enableOldGold && oldGoldCreditVal > 0 && (
              <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                <span>Old Gold Exchange Credit:</span>
                <span className="font-mono">-₹{oldGoldCreditVal.toLocaleString()}</span>
              </div>
            )}

            {/* Discount */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">Special Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-right font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Net Grand Total */}
            <div className="pt-2 border-t-2 border-slate-800 flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Final Payable Amount:
              </span>
              <span className="text-xl font-bold font-mono text-amber-400">
                ₹{grandTotal.toLocaleString()}
              </span>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Generating Invoice...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Sale & Generate GST Invoice</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
