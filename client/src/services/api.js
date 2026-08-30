import { getLocalStore, saveLocalStore } from './mockData';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};
const API_BASE = getApiBase();

export const api = {
  // Metal Rates
  getRates: async () => {
    try {
      const res = await fetch(`${API_BASE}/rates`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, rates: store.metal_rates };
  },

  updateRate: async (id, rate_per_gram) => {
    try {
      const res = await fetch(`${API_BASE}/rates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate_per_gram })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const target = store.metal_rates.find(r => r.id === parseInt(id));
    if (target) target.rate_per_gram = parseFloat(rate_per_gram);
    saveLocalStore(store);
    return { success: true };
  },

  bulkUpdateRates: async (rates) => {
    try {
      const res = await fetch(`${API_BASE}/rates/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    rates.forEach(r => {
      const t = store.metal_rates.find(m => m.id === r.id);
      if (t) t.rate_per_gram = parseFloat(r.rate_per_gram);
    });
    saveLocalStore(store);
    return { success: true };
  },

  // Inventory
  getInventory: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/inventory?${query}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, products: store.products, total: store.products.length };
  },

  getInventoryStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory/stats`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return {
      success: true,
      stats: {
        total_items: store.products.length,
        total_gross_weight: store.products.reduce((s, p) => s + (p.gross_weight || 0), 0),
        total_net_weight: store.products.reduce((s, p) => s + (p.net_weight || 0), 0),
        total_fine_gold_weight: store.products.reduce((s, p) => s + (p.fine_metal_weight || 0), 0),
        total_estimated_value: 3850000
      }
    };
  },

  createProduct: async (productData) => {
    try {
      const res = await fetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const newProd = {
      id: Date.now(),
      sku: `JW-${productData.metal_type?.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      barcode: `890${Math.floor(1000000 + Math.random() * 9000000)}`,
      huid: `HD${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'AVAILABLE',
      ...productData
    };
    store.products.push(newProd);
    saveLocalStore(store);
    return { success: true, product: newProd };
  },

  deleteProduct: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    store.products = store.products.filter(p => p.id !== parseInt(id));
    saveLocalStore(store);
    return { success: true };
  },

  // Sales & POS
  createRetailInvoice: async (invoiceData) => {
    try {
      const res = await fetch(`${API_BASE}/sales/retail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const invoice = {
      id: Date.now(),
      invoice_no: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'RETAIL_TAX_INVOICE',
      ...invoiceData,
      created_at: new Date().toISOString()
    };
    store.sales_invoices.unshift(invoice);
    saveLocalStore(store);
    return { success: true, invoice };
  },

  createWholesaleChallan: async (challanData) => {
    try {
      const res = await fetch(`${API_BASE}/sales/wholesale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challanData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const challan = {
      id: Date.now(),
      invoice_no: `WSL-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'WHOLESALE_CHALLAN',
      ...challanData,
      created_at: new Date().toISOString()
    };
    store.sales_invoices.unshift(challan);
    saveLocalStore(store);
    return { success: true, invoice: challan };
  },

  getInvoices: async () => {
    try {
      const res = await fetch(`${API_BASE}/sales/invoices`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, invoices: store.sales_invoices };
  },

  // Employees
  getEmployees: async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, employees: store.employees };
  },

  getEmployeeById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const emp = store.employees.find(e => e.id === parseInt(id));
    return { success: true, employee: emp, recent_sales: [] };
  },

  // Karigar
  getKarigarOrders: async () => {
    try {
      const res = await fetch(`${API_BASE}/karigar`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, orders: store.karigar_orders };
  },

  createKarigarOrder: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/karigar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const order = { id: Date.now(), order_no: `KG-${Math.floor(100 + Math.random() * 900)}`, ...data };
    store.karigar_orders.unshift(order);
    saveLocalStore(store);
    return { success: true, order };
  },

  // Old Gold
  getOldGold: async () => {
    try {
      const res = await fetch(`${API_BASE}/old-gold`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, transactions: store.old_gold_transactions };
  },

  createOldGold: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/old-gold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const txn = { id: Date.now(), ...data, created_at: new Date().toISOString() };
    store.old_gold_transactions.unshift(txn);
    saveLocalStore(store);
    return { success: true, transaction: txn };
  },

  // Audit
  getTrayList: async () => {
    try {
      const res = await fetch(`${API_BASE}/audit/trays`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      success: true,
      trays: [
        { tray_name: 'Showcase A - Tray 1', category: 'Necklaces', items_count: 1, expected_gross_weight: 42.5, expected_net_weight: 42.0 },
        { tray_name: 'Showcase B - Tray 2', category: 'Bangles', items_count: 1, expected_gross_weight: 38.2, expected_net_weight: 38.2 },
        { tray_name: 'Showcase C - Tray 1', category: 'Rings', items_count: 1, expected_gross_weight: 4.85, expected_net_weight: 4.7 }
      ]
    };
  },

  submitTrayAudit: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/audit/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      success: true,
      audit: {
        id: Date.now(),
        status: 'VERIFIED_MATCH',
        variance_weight: 0,
        ...data,
        timestamp: new Date().toISOString()
      }
    };
  },

  // Dashboard & Ledger
  getDashboard: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/dashboard`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return {
      success: true,
      metrics: {
        total_inventory_items: store.products.length,
        total_stock_value: 3850000,
        physical_gold_grams: 148.5,
        physical_silver_grams: 850.0,
        total_sales_month: 2276987,
        total_gold_grams_sold: 308.5
      },
      leaderboard: store.employees,
      sales_trend: [
        { date: 'Aug 24', revenue: 240000, grams: 35.2 },
        { date: 'Aug 25', revenue: 420000, grams: 61.8 },
        { date: 'Aug 26', revenue: 310000, grams: 44.5 },
        { date: 'Aug 27', revenue: 580000, grams: 82.0 },
        { date: 'Aug 28', revenue: 490000, grams: 71.4 },
        { date: 'Aug 29', revenue: 650000, grams: 95.0 },
        { date: 'Aug 30', revenue: 379303, grams: 56.4 }
      ],
      category_breakdown: [
        { name: 'Necklaces', count: 5, weight: 145.2, value: 980000 },
        { name: 'Rings', count: 6, weight: 32.4, value: 650000 },
        { name: 'Bangles', count: 3, weight: 88.0, value: 594000 },
        { name: 'Wholesale Lots', count: 2, weight: 140.0, value: 945000 }
      ]
    };
  },

  getStockLedger: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/stock-ledger`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, ledger: store.stock_ledger };
  }
};
