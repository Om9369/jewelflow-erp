import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Coins,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Send,
  Download,
  Filter,
  Eye,
  Trash2,
  Edit3,
  Split,
  PlusCircle
} from 'lucide-react';
import { api } from '../services/api';
import { getStoreConfig } from '../services/storeConfig';
import PurchaseVoucherModal from '../components/modals/PurchaseVoucherModal';

const INITIAL_SUPPLIERS = [];
const INITIAL_PURCHASES = [];

export default function PurchasesPage({ rates }) {
  const [activeSubTab, setActiveSubTab] = useState('REGISTER'); // 'REGISTER' | 'SUPPLIERS'
  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem('jewelflow_purchases_v3');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });
  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('jewelflow_suppliers_v3');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [voucherModal, setVoucherModal] = useState({ open: false, purchase: null });
  const [storeConfig, setStoreConfig] = useState(getStoreConfig());

  // Settle Payment Modal State
  const [settleModal, setSettleModal] = useState({
    open: false,
    purchase: null,
    add_cash: '0',
    add_rtgs: '0',
    rtgs_ref: '',
    add_fine_metal: '0',
    add_old_gold: '0',
    notes: ''
  });

  // Form State for Inward Purchase (with Multiple Individual Items / Designs)
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_name: '',
    voucher_no: '',
    date: new Date().toISOString().slice(0, 10),
    purchase_rate_per_gram: '6750',
    cash_paid: '0',
    rtgs_paid: '0',
    rtgs_ref: '',
    fine_metal_grams_given: '0',
    old_gold_grams_given: '0',
    old_gold_valuation_rate: '6350',
    advance_adjusted: '0',
    notes: '',
    items: [
      {
        id: 'item-1',
        title: '22K Calcutta Filigree Bangle Pair',
        category: 'Bangles',
        metal_type: 'Gold',
        purity: '22K (916)',
        gross_weight: '35.000',
        stone_weight: '0',
        making_charge_value: '550',
        counter_tray: 'Showcase B - Tray 1',
        huid: ''
      }
    ]
  });

  // Bulk Quick Split Helper
  const [splitHelper, setSplitHelper] = useState({
    total_bulk_weight: '300',
    number_of_pieces: '6',
    design_prefix: '22K Handcrafted Bangle Design',
    category: 'Bangles',
    metal_type: 'Gold',
    purity: '22K (916)',
    making_charge_value: '550',
    counter_tray: 'Showcase B - Tray 1'
  });
  const [showSplitHelper, setShowSplitHelper] = useState(false);

  // Form State for Add Supplier
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    city: 'Mumbai',
    gstin: ''
  });

  useEffect(() => {
    localStorage.setItem('jewelflow_purchases_v3', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('jewelflow_suppliers_v3', JSON.stringify(suppliers));
  }, [suppliers]);

  const gold22kRate = rates?.find(r => r.metal === 'Gold' && r.purity.includes('22K'))?.rate_per_gram || 6750;
  const gold24kRate = rates?.find(r => r.metal === 'Gold' && r.purity.includes('24K'))?.rate_per_gram || 7250;

  // Add Item row to Inward Form
  const handleAddItemRow = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      title: `22K Jewellery Design ${purchaseForm.items.length + 1}`,
      category: 'Bangles',
      metal_type: 'Gold',
      purity: '22K (916)',
      gross_weight: '25.000',
      stone_weight: '0',
      making_charge_value: '550',
      counter_tray: 'Showcase B - Tray 1',
      huid: ''
    };
    setPurchaseForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Remove Item row
  const handleRemoveItemRow = (id) => {
    if (purchaseForm.items.length <= 1) return;
    setPurchaseForm(prev => ({
      ...prev,
      items: prev.items.filter(it => it.id !== id)
    }));
  };

  // Update Item row
  const handleUpdateItemRow = (id, field, value) => {
    setPurchaseForm(prev => ({
      ...prev,
      items: prev.items.map(it => it.id === id ? { ...it, [field]: value } : it)
    }));
  };

  // Apply Auto-Split Bulk Lot (e.g. 300g into 6 bangles of 50g each)
  const handleApplyAutoSplit = () => {
    const totalWt = parseFloat(splitHelper.total_bulk_weight) || 300;
    const count = parseInt(splitHelper.number_of_pieces) || 6;
    const perItemWt = (totalWt / count).toFixed(3);

    const generated = [];
    for (let i = 1; i <= count; i++) {
      generated.push({
        id: `split-${Date.now()}-${i}`,
        title: `${splitHelper.design_prefix} #${i}`,
        category: splitHelper.category,
        metal_type: splitHelper.metal_type,
        purity: splitHelper.purity,
        gross_weight: perItemWt,
        stone_weight: '0',
        making_charge_value: splitHelper.making_charge_value,
        counter_tray: splitHelper.counter_tray,
        huid: ''
      });
    }

    setPurchaseForm(prev => ({
      ...prev,
      items: generated
    }));
    setShowSplitHelper(false);
  };

  // Calculations for Inward Bill
  const inRate = parseFloat(purchaseForm.purchase_rate_per_gram) || 6750;
  const inTotalGross = purchaseForm.items.reduce((sum, it) => sum + (parseFloat(it.gross_weight) || 0), 0);
  const inTotalStone = purchaseForm.items.reduce((sum, it) => sum + (parseFloat(it.stone_weight) || 0), 0);
  const inTotalNet = Math.max(0, inTotalGross - inTotalStone);
  const inMetalSubtotal = inTotalNet * inRate;
  const inMakingTotal = purchaseForm.items.reduce((sum, it) => {
    const net = Math.max(0, (parseFloat(it.gross_weight) || 0) - (parseFloat(it.stone_weight) || 0));
    return sum + (net * (parseFloat(it.making_charge_value) || 0));
  }, 0);
  const inTotalAmount = Math.round(inMetalSubtotal + inMakingTotal);

  // Settlement Calculations
  const pCash = parseFloat(purchaseForm.cash_paid) || 0;
  const pRtgs = parseFloat(purchaseForm.rtgs_paid) || 0;
  const pFineGrams = parseFloat(purchaseForm.fine_metal_grams_given) || 0;
  const pFineVal = Math.round(pFineGrams * gold24kRate);
  const pOldGoldGrams = parseFloat(purchaseForm.old_gold_grams_given) || 0;
  const pOldGoldRate = parseFloat(purchaseForm.old_gold_valuation_rate) || 6350;
  const pOldGoldVal = Math.round(pOldGoldGrams * pOldGoldRate);
  const pAdvance = parseFloat(purchaseForm.advance_adjusted) || 0;
  
  const totalSettledVal = pCash + pRtgs + pFineVal + pOldGoldVal + pAdvance;
  const pendingDueVal = Math.max(0, inTotalAmount - totalSettledVal);

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (inTotalGross <= 0) {
      alert('Please enter valid gross weight for purchase');
      return;
    }

    const supplierName = purchaseForm.supplier_name || (suppliers.length > 0 ? suppliers[0].name : 'Bullion Refinery');
    const purchaseId = `PUR-${new Date().getFullYear()}-${String(purchases.length + 1).padStart(3, '0')}`;
    const voucherNo = purchaseForm.voucher_no || `VCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPurchase = {
      id: purchaseId,
      voucher_no: voucherNo,
      supplier_name: supplierName,
      date: purchaseForm.date,
      items_summary: `${purchaseForm.items.length} Designs / Pieces (${inTotalGross.toFixed(2)}g Gross)`,
      total_gross_weight: parseFloat(inTotalGross.toFixed(3)),
      total_net_weight: parseFloat(inTotalNet.toFixed(3)),
      total_fine_gold_grams: parseFloat(((inTotalNet * 0.916)).toFixed(3)),
      subtotal_inr: Math.round(inMetalSubtotal),
      making_charges_inr: Math.round(inMakingTotal),
      total_amount_inr: inTotalAmount,
      settlement: {
        cash_paid: pCash,
        rtgs_paid: pRtgs,
        rtgs_ref: purchaseForm.rtgs_ref,
        fine_metal_grams_given: pFineGrams,
        fine_metal_valuation_inr: pFineVal,
        old_gold_grams_given: pOldGoldGrams,
        old_gold_valuation_inr: pOldGoldVal,
        advance_adjusted: pAdvance,
        remaining_balance_due: pendingDueVal
      },
      status: pendingDueVal === 0 ? 'SETTLED' : 'PARTIAL_DUE'
    };

    // Tag and create EVERY individual jewellery item/design in MongoDB Inventory!
    for (let idx = 0; idx < purchaseForm.items.length; idx++) {
      const it = purchaseForm.items[idx];
      const gWt = parseFloat(it.gross_weight) || 0;
      const sWt = parseFloat(it.stone_weight) || 0;
      const nWt = Math.max(0, gWt - sWt);
      const mVal = parseFloat(it.making_charge_value) || 0;

      try {
        await api.createProduct({
          sku: `JW-${(it.metal_type || 'GLD').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          title: it.title || `Gold Design ${idx + 1}`,
          category: it.category || 'Bangles',
          metal_type: it.metal_type || 'Gold',
          purity: it.purity || '22K (916)',
          gross_weight: gWt,
          net_weight: nWt,
          stone_weight: sWt,
          stone_price: 0,
          making_charge_type: 'PER_GRAM',
          making_charge_value: mVal,
          counter_tray: it.counter_tray || 'Showcase B - Tray 1',
          huid: it.huid || '',
          pieces: 1,
          status: 'IN_STOCK',
          notes: `Inwarded via Voucher ${voucherNo} from ${supplierName}`
        });
      } catch (err) {
        console.warn('Auto-inward note:', err);
      }
    }

    // Update supplier ledger
    setSuppliers(prev => prev.map(s => {
      if (s.name === supplierName) {
        return {
          ...s,
          total_purchases_inr: s.total_purchases_inr + inTotalAmount,
          metal_delivered_grams: parseFloat((s.metal_delivered_grams + inTotalGross).toFixed(2)),
          pending_balance_inr: s.pending_balance_inr + pendingDueVal
        };
      }
      return s;
    }));

    setPurchases([newPurchase, ...purchases]);
    setIsPurchaseModalOpen(false);
  };

  // Handle Edit / Settle Payment for Pending Inward Voucher
  const handleOpenSettleModal = (purchase) => {
    setSettleModal({
      open: true,
      purchase,
      add_cash: '0',
      add_rtgs: '0',
      rtgs_ref: '',
      add_fine_metal: '0',
      add_old_gold: '0',
      notes: ''
    });
  };

  const handleSavePaymentSettlement = (e) => {
    e.preventDefault();
    const p = settleModal.purchase;
    if (!p) return;

    const extraCash = parseFloat(settleModal.add_cash) || 0;
    const extraRtgs = parseFloat(settleModal.add_rtgs) || 0;
    const extraFineGrams = parseFloat(settleModal.add_fine_metal) || 0;
    const extraFineVal = Math.round(extraFineGrams * gold24kRate);
    const extraOldGold = parseFloat(settleModal.add_old_gold) || 0;
    const extraOldGoldVal = Math.round(extraOldGold * 6350);

    const totalNewPayment = extraCash + extraRtgs + extraFineVal + extraOldGoldVal;
    const newRemainingDue = Math.max(0, p.settlement.remaining_balance_due - totalNewPayment);
    const newStatus = newRemainingDue === 0 ? 'SETTLED' : 'PARTIAL_DUE';

    const updatedPurchase = {
      ...p,
      status: newStatus,
      settlement: {
        ...p.settlement,
        cash_paid: p.settlement.cash_paid + extraCash,
        rtgs_paid: p.settlement.rtgs_paid + extraRtgs,
        rtgs_ref: settleModal.rtgs_ref ? `${p.settlement.rtgs_ref || ''} ${settleModal.rtgs_ref}`.trim() : p.settlement.rtgs_ref,
        fine_metal_grams_given: p.settlement.fine_metal_grams_given + extraFineGrams,
        fine_metal_valuation_inr: p.settlement.fine_metal_valuation_inr + extraFineVal,
        old_gold_grams_given: p.settlement.old_gold_grams_given + extraOldGold,
        old_gold_valuation_inr: p.settlement.old_gold_valuation_inr + extraOldGoldVal,
        remaining_balance_due: newRemainingDue
      }
    };

    setPurchases(prev => prev.map(item => item.id === p.id ? updatedPurchase : item));

    // Update supplier pending balance
    setSuppliers(prev => prev.map(s => {
      if (s.name === p.supplier_name) {
        return {
          ...s,
          pending_balance_inr: Math.max(0, s.pending_balance_inr - totalNewPayment)
        };
      }
      return s;
    }));

    setSettleModal({ open: false, purchase: null, add_cash: '0', add_rtgs: '0', rtgs_ref: '', add_fine_metal: '0', add_old_gold: '0', notes: '' });
  };

  const handleAddSupplier = (e) => {
    e.preventDefault();
    const newSup = {
      id: `SUP-${100 + suppliers.length + 1}`,
      name: supplierForm.name,
      contact_person: supplierForm.contact_person,
      phone: supplierForm.phone,
      city: supplierForm.city,
      gstin: supplierForm.gstin.toUpperCase(),
      total_purchases_inr: 0,
      metal_delivered_grams: 0,
      pending_balance_inr: 0,
      pending_fine_gold_grams: 0
    };
    setSuppliers([...suppliers, newSup]);
    setIsSupplierModalOpen(false);
    setSupplierForm({ name: '', contact_person: '', phone: '', city: 'Mumbai', gstin: '' });
  };

  const handleOpenVoucher = (p) => {
    setVoucherModal({ open: true, purchase: p });
  };

  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.total_amount_inr, 0);
  const totalPurchasedGoldGrams = purchases.reduce((sum, p) => sum + p.total_gross_weight, 0).toFixed(2);
  const totalCashPaidToVendors = purchases.reduce((sum, p) => sum + (p.settlement.cash_paid || 0) + (p.settlement.rtgs_paid || 0), 0);
  const totalPendingSupplierBalance = purchases.reduce((sum, p) => sum + (p.settlement.remaining_balance_due || 0), 0);

  const filteredPurchases = purchases.filter(p =>
    p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.voucher_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
              PILLAR 3 • INWARD & SUPPLIERS
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-100">Stock Purchases & Supplier Ledger</h2>
          </div>
          <p className="text-xs text-slate-400">
            Inward bulk stock with individual retail item tagging, multi-split settlements & payment balance editing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Add Supplier</span>
          </button>

          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Inward New Purchase</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Purchases (YTD)</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">₹{totalPurchasesAmount.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-slate-400">{purchases.length} Inward Vouchers</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Gold Inwarded</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-300">{totalPurchasedGoldGrams}g</div>
          <div className="mt-1 text-[11px] text-slate-400">Tagged into Showroom Trays</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Cash & RTGS Paid</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">₹{totalCashPaidToVendors.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-slate-400">Settled via Banking/Cash</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Pending Supplier Due</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">₹{totalPendingSupplierBalance.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-slate-400">Supplier Udhar / Khata balance</div>
        </div>

      </div>

      {/* Sub Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('REGISTER')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'REGISTER'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📥 Inward Purchases Register ({purchases.length})
        </button>

        <button
          onClick={() => setActiveSubTab('SUPPLIERS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'SUPPLIERS'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏢 Supplier & Bullion Directory ({suppliers.length})
        </button>
      </div>

      {/* TAB 1: PURCHASES REGISTER */}
      {activeSubTab === 'REGISTER' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Inward Purchases & Settlements</h3>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search voucher, supplier..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          {purchases.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
              <Truck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="font-semibold text-slate-300">No Inward Purchases Recorded Yet</p>
              <p className="text-[11px] text-slate-500 mt-1">Click "Inward New Purchase" to record stock receipts from Bullion dealers or Karigars.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase bg-slate-950/50">
                    <th className="py-2.5 px-3">Voucher / Date</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Tagged Items</th>
                    <th className="py-2.5 px-3 text-right">Weight (Gross/Fine)</th>
                    <th className="py-2.5 px-3 text-right">Total Bill</th>
                    <th className="py-2.5 px-3">Settlement Splits</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-amber-400">{p.voucher_no}</div>
                        <div className="text-[10px] text-slate-400">{p.date} • {p.id}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-100">{p.supplier_name}</td>
                      <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate">{p.items_summary}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-slate-100">{p.total_gross_weight}g Gross</div>
                        <div className="text-[10px] font-mono text-amber-400/80">{p.total_fine_gold_grams}g Fine</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                        ₹{p.total_amount_inr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-[10px] space-y-0.5">
                        {p.settlement.cash_paid > 0 && <div className="text-slate-300">💵 Cash: ₹{p.settlement.cash_paid.toLocaleString('en-IN')}</div>}
                        {p.settlement.rtgs_paid > 0 && <div className="text-blue-400">🏦 RTGS: ₹{p.settlement.rtgs_paid.toLocaleString('en-IN')}</div>}
                        {p.settlement.fine_metal_grams_given > 0 && <div className="text-amber-300">🪙 Fine Metal: {p.settlement.fine_metal_grams_given}g</div>}
                        {p.settlement.old_gold_grams_given > 0 && <div className="text-amber-400/80">🪙 Scrap: {p.settlement.old_gold_grams_given}g</div>}
                        {p.settlement.remaining_balance_due > 0 && <div className="text-rose-400 font-bold">⚠️ Due: ₹{p.settlement.remaining_balance_due.toLocaleString('en-IN')}</div>}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          p.status === 'SETTLED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.settlement.remaining_balance_due > 0 && (
                            <button
                              onClick={() => handleOpenSettleModal(p)}
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                              title="Settle Pending Balance / Add Payment"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Settle Due</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenVoucher(p)}
                            className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="View & Send PDF Voucher"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">Voucher</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPLIERS DIRECTORY */}
      {activeSubTab === 'SUPPLIERS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-slate-100 text-sm sm:text-base">Registered Suppliers & Karigar Houses</h3>
          </div>

          {suppliers.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="font-semibold text-slate-300">No Suppliers Registered Yet</p>
              <p className="text-[11px] text-slate-500 mt-1">Click "+ Add Supplier" to register your first bullion dealer or manufacturer.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {s.id}
                    </span>
                    <span className="text-[11px] text-slate-400">{s.city}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{s.name}</h4>
                    <p className="text-xs text-slate-400">Contact: {s.contact_person} ({s.phone})</p>
                    {s.gstin && <p className="text-[10px] font-mono text-amber-400/80 mt-0.5">GSTIN: {s.gstin}</p>}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Lifetime Purchases:</span>
                      <span className="font-mono font-bold text-slate-200">₹{s.total_purchases_inr.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Pending Udhar Due:</span>
                      <span className={`font-mono font-bold ${s.pending_balance_inr > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {s.pending_balance_inr > 0 ? `₹${s.pending_balance_inr.toLocaleString('en-IN')}` : 'All Clear'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: INWARD NEW PURCHASE (WITH ITEM BREAKDOWN & MULTI-SPLIT SETTLEMENT) */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-serif font-bold text-slate-100 text-base">Inward Stock Purchase & Item Tagging</h3>
                  <p className="text-[11px] text-slate-400">Each design/piece will be tagged in Inventory for individual retail POS billing</p>
                </div>
              </div>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4 mt-4 text-xs">
              
              {/* Section 1: Header Supplier & Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Select Supplier / Manufacturer *</label>
                  {suppliers.length > 0 ? (
                    <select
                      required
                      value={purchaseForm.supplier_name}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold"
                    >
                      <option value="">-- Choose Vendor --</option>
                      {suppliers.map(s => <option key={s.id} value={s.name}>{s.name} ({s.city})</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zaveri Bullion Refinery"
                      value={purchaseForm.supplier_name}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold"
                    />
                  )}
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Vendor Bill / Voucher No</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-ZBR-8891"
                    value={purchaseForm.voucher_no}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, voucher_no: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Gold Purchase Rate (₹/g)</label>
                  <input
                    type="number"
                    value={purchaseForm.purchase_rate_per_gram}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_rate_per_gram: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Section 2: Item Tagging & Breakdown */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                      1. Individual Jewellery Designs & Retail Pieces ({purchaseForm.items.length} items)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Total Inward Gross: <strong className="text-amber-300 font-mono">{inTotalGross.toFixed(3)}g</strong> • Net: <strong className="text-slate-200 font-mono">{inTotalNet.toFixed(3)}g</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSplitHelper(!showSplitHelper)}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>{showSplitHelper ? 'Close Auto-Split' : '⚡ Auto-Split Bulk Lot'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>+ Add Another Design</span>
                    </button>
                  </div>
                </div>

                {/* Auto-Split Helper Drawer */}
                {showSplitHelper && (
                  <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-xl space-y-2">
                    <p className="text-[11px] font-bold text-amber-300">Quick Bulk Split Tool:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <label className="text-slate-400 block mb-0.5">Total Bulk Lot Weight (g)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={splitHelper.total_bulk_weight}
                          onChange={(e) => setSplitHelper({ ...splitHelper, total_bulk_weight: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-0.5">Number of Pieces</label>
                        <input
                          type="number"
                          value={splitHelper.number_of_pieces}
                          onChange={(e) => setSplitHelper({ ...splitHelper, number_of_pieces: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-0.5">Design Prefix Title</label>
                        <input
                          type="text"
                          value={splitHelper.design_prefix}
                          onChange={(e) => setSplitHelper({ ...splitHelper, design_prefix: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleApplyAutoSplit}
                          className="w-full py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px]"
                        >
                          Generate {splitHelper.number_of_pieces} Pieces
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Table */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {purchaseForm.items.map((it, idx) => (
                    <div key={it.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-4">
                        <label className="text-[10px] text-slate-400 block">Design / Piece #{idx + 1}</label>
                        <input
                          type="text"
                          required
                          value={it.title}
                          onChange={(e) => handleUpdateItemRow(it.id, 'title', e.target.value)}
                          placeholder="e.g. Calcutta Floral Bangle 1"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 block">Gross Wt (g)</label>
                        <input
                          type="number"
                          step="0.001"
                          required
                          value={it.gross_weight}
                          onChange={(e) => handleUpdateItemRow(it.id, 'gross_weight', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-300 font-mono font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 block">Making (₹/g)</label>
                        <input
                          type="number"
                          value={it.making_charge_value}
                          onChange={(e) => handleUpdateItemRow(it.id, 'making_charge_value', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-slate-400 block">Showcase Tray</label>
                        <input
                          type="text"
                          value={it.counter_tray}
                          onChange={(e) => handleUpdateItemRow(it.id, 'counter_tray', e.target.value)}
                          placeholder="Showcase B - Tray 1"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                        />
                      </div>

                      <div className="sm:col-span-1 flex items-end justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(it.id)}
                          disabled={purchaseForm.items.length <= 1}
                          className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs">
                  <span className="text-slate-300">Total Inward Purchase Valuation:</span>
                  <span className="font-bold text-amber-400 text-sm">₹{inTotalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Section 3: Multi-Split Payment Settlement */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    2. Multi-Split Payment Settlement
                  </span>
                  <span className="text-[10px] text-slate-400">Mix Cash, RTGS, Fine Bullion, Old Gold & Udhar</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">💵 Cash Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={purchaseForm.cash_paid}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, cash_paid: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">🏦 RTGS / Online Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={purchaseForm.rtgs_paid}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, rtgs_paid: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-blue-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">RTGS / Bank UTR Ref</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFCR52026..."
                      value={purchaseForm.rtgs_ref}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, rtgs_ref: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">🪙 Pure Fine Metal Given (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={purchaseForm.fine_metal_grams_given}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, fine_metal_grams_given: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">Valued @ ₹{pFineVal.toLocaleString('en-IN')}</span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">🪙 Old Gold / Scrap Given (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={purchaseForm.old_gold_grams_given}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, old_gold_grams_given: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">Valued @ ₹{pOldGoldVal.toLocaleString('en-IN')}</span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">⏳ Advance Adjusted (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={purchaseForm.advance_adjusted}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, advance_adjusted: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Balance Due Banner */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Payments Applied: ₹{totalSettledVal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Remaining Supplier Udhar:</span>
                    <span className={`font-bold text-sm ${pendingDueVal > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {pendingDueVal > 0 ? `₹${pendingDueVal.toLocaleString('en-IN')} Due` : '✅ Fully Settled (₹0)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  Confirm Inward & Tag {purchaseForm.items.length} Items
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / SETTLE PENDING VENDOR PAYMENT */}
      {settleModal.open && settleModal.purchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-serif font-bold text-slate-100 text-base">Settle Pending Vendor Payment</h3>
                  <p className="text-[10px] text-slate-400">Voucher: {settleModal.purchase.voucher_no} • {settleModal.purchase.supplier_name}</p>
                </div>
              </div>
              <button onClick={() => setSettleModal({ ...settleModal, open: false })} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaymentSettlement} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Total Inward Bill Amount:</span>
                  <span className="font-bold text-slate-200">₹{settleModal.purchase.total_amount_inr.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Current Outstanding Due:</span>
                  <span className="font-bold text-base">₹{settleModal.purchase.settlement.remaining_balance_due.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">💵 Additional Cash Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={settleModal.add_cash}
                    onChange={(e) => setSettleModal({ ...settleModal, add_cash: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">🏦 Additional RTGS / Online Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={settleModal.add_rtgs}
                    onChange={(e) => setSettleModal({ ...settleModal, add_rtgs: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-blue-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Bank UTR / Transaction Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFCR52026..."
                    value={settleModal.rtgs_ref}
                    onChange={(e) => setSettleModal({ ...settleModal, rtgs_ref: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Real-time recalculated balance */}
              {(() => {
                const totalExtra = (parseFloat(settleModal.add_cash) || 0) + (parseFloat(settleModal.add_rtgs) || 0);
                const remaining = Math.max(0, settleModal.purchase.settlement.remaining_balance_due - totalExtra);
                return (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center font-mono">
                    <span className="text-slate-400">New Remaining Due:</span>
                    <span className={`font-bold text-sm ${remaining > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {remaining > 0 ? `₹${remaining.toLocaleString('en-IN')} Due` : '✅ Fully Settled (₹0)'}
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSettleModal({ ...settleModal, open: false })}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Save Payment & Update Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-serif font-bold text-slate-100 text-base mb-1">Add Supplier / Bullion Dealer</h3>
            <p className="text-xs text-slate-400 mb-4">Register vendor for stock inwarding and payment ledgers.</p>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Firm / Refinery Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zaveri Bullion Refinery"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Bhai"
                    value={supplierForm.contact_person}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Mobile / Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9820011223"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={supplierForm.city}
                    onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="27AAACZ..."
                    value={supplierForm.gstin}
                    onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PDF INWARD VOUCHER */}
      {voucherModal.open && voucherModal.purchase && (
        <PurchaseVoucherModal
          purchase={voucherModal.purchase}
          storeConfig={storeConfig}
          onClose={() => setVoucherModal({ open: false, purchase: null })}
        />
      )}

    </div>
  );
}
