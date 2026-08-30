// Fallback Local Storage Data for GitHub Pages static deployment
export const initialMockData = {
  metal_rates: [
    { id: 1, metal: 'Gold', purity: '24K (999)', purity_pct: 99.9, rate_per_gram: 7250, unit: 'GRAM' },
    { id: 2, metal: 'Gold', purity: '22K (916)', purity_pct: 91.6, rate_per_gram: 6750, unit: 'GRAM' },
    { id: 3, metal: 'Gold', purity: '18K (750)', purity_pct: 75.0, rate_per_gram: 5550, unit: 'GRAM' },
    { id: 4, metal: 'Gold', purity: '14K (585)', purity_pct: 58.5, rate_per_gram: 4320, unit: 'GRAM' },
    { id: 5, metal: 'Silver', purity: 'Fine Silver 999', purity_pct: 99.9, rate_per_gram: 88.5, unit: 'GRAM' },
    { id: 6, metal: 'Silver', purity: 'Sterling 925', purity_pct: 92.5, rate_per_gram: 82.0, unit: 'GRAM' },
    { id: 7, metal: 'Platinum', purity: '950', purity_pct: 95.0, rate_per_gram: 3100, unit: 'GRAM' }
  ],
  employees: [
    {
      id: 1,
      name: 'Aarav Verma',
      employee_code: 'EMP-001',
      role: 'Senior Sales Executive',
      target_monthly_revenue: 1500000,
      target_gold_grams: 250,
      commission_rate_pct: 1.2,
      performance: { total_sales_count: 5, total_revenue: 379303, total_gold_grams: 56.4, commission_earned: 4552 }
    },
    {
      id: 2,
      name: 'Pooja Sharma',
      employee_code: 'EMP-002',
      role: 'Diamond & Bridal Consultant',
      target_monthly_revenue: 2000000,
      target_gold_grams: 200,
      commission_rate_pct: 1.5,
      performance: { total_sales_count: 4, total_revenue: 520000, total_gold_grams: 48.0, commission_earned: 7800 }
    },
    {
      id: 3,
      name: 'Rohan Mehta',
      employee_code: 'EMP-003',
      role: 'Wholesale & B2B Agent',
      target_monthly_revenue: 4000000,
      target_gold_grams: 600,
      commission_rate_pct: 0.8,
      performance: { total_sales_count: 3, total_revenue: 1377684, total_gold_grams: 204.1, commission_earned: 11021 }
    }
  ],
  products: [
    {
      id: 1,
      sku: 'JW-GLD-001',
      barcode: '8901234001',
      title: '22K Royal Calcutta Filigree Bridal Choker',
      category: 'Necklaces',
      metal_type: 'Gold',
      purity: '22K (916)',
      huid: 'HD916A492',
      gross_weight: 42.50,
      stone_weight: 0.50,
      net_weight: 42.00,
      fine_metal_weight: 38.472,
      stone_type: 'Ruby Cabochon',
      stone_price: 12000,
      making_charge_type: 'PER_GRAM',
      making_charge_value: 650,
      counter_tray: 'Showcase A - Tray 1',
      status: 'AVAILABLE',
      item_type: 'RETAIL_SINGLE'
    },
    {
      id: 2,
      sku: 'JW-GLD-002',
      barcode: '8901234002',
      title: '22K Handcrafted Peacock Kada Bangles (Pair)',
      category: 'Bangles',
      metal_type: 'Gold',
      purity: '22K (916)',
      huid: 'HD916B881',
      gross_weight: 38.20,
      stone_weight: 0.00,
      net_weight: 38.20,
      fine_metal_weight: 34.991,
      stone_type: 'None',
      stone_price: 0,
      making_charge_type: 'PERCENTAGE',
      making_charge_value: 12,
      counter_tray: 'Showcase B - Tray 2',
      status: 'AVAILABLE',
      item_type: 'RETAIL_SINGLE'
    },
    {
      id: 3,
      sku: 'JW-DIA-003',
      barcode: '8901234003',
      title: '18K Solitaire Diamond Ring (0.75ct VVS/EF)',
      category: 'Rings',
      metal_type: 'Gold',
      purity: '18K (750)',
      huid: 'HD750D102',
      gross_weight: 4.85,
      stone_weight: 0.15,
      net_weight: 4.70,
      fine_metal_weight: 3.525,
      stone_type: 'Natural Solitaire Diamond',
      stone_cents: 75,
      stone_price: 85000,
      making_charge_type: 'FIXED',
      making_charge_value: 3500,
      counter_tray: 'Showcase C - Tray 1',
      status: 'AVAILABLE',
      item_type: 'RETAIL_SINGLE'
    },
    {
      id: 4,
      sku: 'JW-WSL-004',
      barcode: '8901234004',
      title: 'Wholesale Lot: 22K Casting Men Rings (12 Pcs)',
      category: 'Wholesale Lots',
      metal_type: 'Gold',
      purity: '22K (916)',
      huid: 'HD-WSL-916-01',
      gross_weight: 68.40,
      stone_weight: 0.00,
      net_weight: 68.40,
      fine_metal_weight: 62.654,
      stone_type: 'None',
      stone_price: 0,
      making_charge_type: 'PER_GRAM',
      making_charge_value: 280,
      counter_tray: 'Vault - Bulk Tray 1',
      status: 'AVAILABLE',
      item_type: 'WHOLESALE_LOT',
      lot_pieces: 12
    }
  ],
  sales_invoices: [
    {
      id: 1,
      invoice_no: 'INV-20260830-1001',
      type: 'RETAIL_TAX_INVOICE',
      customer_name: 'Rajesh Singhania',
      customer_phone: '+91 98201 12345',
      employee_id: 1,
      employee_name: 'Aarav Verma',
      subtotal: 185000,
      making_charges_total: 12000,
      gst_amount: 5910,
      discount: 2000,
      old_gold_credit: 0,
      total_amount: 200910,
      total_net_grams: 28.5,
      payment_mode: 'CREDIT_CARD',
      item_count: 1,
      created_at: new Date().toISOString()
    }
  ],
  stock_ledger: [
    {
      id: 1,
      movement_type: 'IN_PURCHASE',
      sku: 'JW-GLD-001',
      title: '22K Royal Calcutta Filigree Bridal Choker',
      gross_weight: 42.5,
      net_weight: 42.0,
      reference_id: 'PO-2026-001',
      notes: 'Direct Inward from Manufacturer',
      timestamp: new Date().toISOString()
    }
  ],
  karigar_orders: [],
  old_gold_transactions: [],
  tray_audits: []
};

export const getLocalStore = () => {
  if (typeof window === 'undefined') return initialMockData;
  const stored = localStorage.getItem('jewelflow_store');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  localStorage.setItem('jewelflow_store', JSON.stringify(initialMockData));
  return initialMockData;
};

export const saveLocalStore = (data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jewelflow_store', JSON.stringify(data));
  }
};
