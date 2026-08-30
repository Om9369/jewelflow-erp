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
    return { success: true, rates: store.metal_rates || [] };
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
    let prods = store.products || [];
    if (params.category && params.category !== 'ALL') {
      prods = prods.filter(p => p.category === params.category);
    }
    if (params.metal_type && params.metal_type !== 'ALL') {
      prods = prods.filter(p => p.metal_type === params.metal_type);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      prods = prods.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.huid && p.huid.toLowerCase().includes(q))
      );
    }
    return { success: true, products: prods, total: prods.length };
  },

  getInventoryStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory/stats`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const prods = store.products || [];
    return {
      success: true,
      stats: {
        total_items: prods.length,
        total_gross_weight: prods.reduce((s, p) => s + (p.gross_weight || 0), 0),
        total_net_weight: prods.reduce((s, p) => s + (p.net_weight || 0), 0),
        total_fine_gold_weight: prods.reduce((s, p) => s + (p.fine_metal_weight || 0), 0),
        total_estimated_value: 3850000
      }
    };
  },

  getProductById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/inventory/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const p = store.products.find(item => item.id === parseInt(id) || item.sku === id || item.barcode === id);
    return { success: !!p, product: p };
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
      status: 'IN_STOCK',
      created_at: new Date().toISOString(),
      ...productData
    };
    store.products.unshift(newProd);
    store.stock_ledger.unshift({
      id: Date.now(),
      movement_type: 'IN_PURCHASE',
      sku: newProd.sku,
      title: newProd.title,
      gross_weight: newProd.gross_weight,
      net_weight: newProd.net_weight,
      reference_id: 'MANUAL_INWARD',
      notes: 'Added via Inventory Inward Modal',
      timestamp: new Date().toISOString()
    });
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
      item_count: invoiceData.items?.length || 1,
      total_net_grams: invoiceData.items?.reduce((s, i) => s + (i.net_weight || 0), 0) || 0,
      created_at: new Date().toISOString()
    };

    // Update attributed employee performance
    if (invoiceData.employee_id) {
      const emp = store.employees.find(e => e.id === parseInt(invoiceData.employee_id));
      if (emp) {
        if (!emp.performance) emp.performance = { total_sales_count: 0, total_revenue: 0, total_gold_grams: 0, commission_earned: 0 };
        emp.performance.total_sales_count++;
        emp.performance.total_revenue += invoiceData.total_amount;
        emp.performance.total_gold_grams = parseFloat((emp.performance.total_gold_grams + invoice.total_net_grams).toFixed(3));
        const commission = (invoiceData.total_amount * (emp.commission_rate_pct || 1.0)) / 100;
        emp.performance.commission_earned += Math.round(commission);
      }
    }

    // Mark sold items as OUT_RETAIL_SALE
    if (invoiceData.items) {
      invoiceData.items.forEach(item => {
        store.products = store.products.filter(p => p.id !== item.product_id);
        store.stock_ledger.unshift({
          id: Date.now() + Math.random(),
          movement_type: 'OUT_RETAIL_SALE',
          sku: item.sku,
          title: item.title,
          gross_weight: item.gross_weight,
          net_weight: item.net_weight,
          reference_id: invoice.invoice_no,
          notes: `Sold to ${invoiceData.customer_name}`,
          timestamp: new Date().toISOString()
        });
      });
    }

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
      item_count: challanData.items?.length || 1,
      total_net_grams: challanData.items?.reduce((s, i) => s + (i.net_weight || 0), 0) || 0,
      created_at: new Date().toISOString()
    };

    if (challanData.employee_id) {
      const emp = store.employees.find(e => e.id === parseInt(challanData.employee_id));
      if (emp) {
        if (!emp.performance) emp.performance = { total_sales_count: 0, total_revenue: 0, total_gold_grams: 0, commission_earned: 0 };
        emp.performance.total_sales_count++;
        emp.performance.total_revenue += challanData.total_amount;
        emp.performance.total_gold_grams = parseFloat((emp.performance.total_gold_grams + challan.total_net_grams).toFixed(3));
        const commission = (challanData.total_amount * (emp.commission_rate_pct || 0.8)) / 100;
        emp.performance.commission_earned += Math.round(commission);
      }
    }

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
    return { success: true, invoices: store.sales_invoices || [] };
  },

  getInvoiceById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/sales/invoices/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const inv = store.sales_invoices.find(i => i.id === parseInt(id) || i.invoice_no === id);
    return { success: !!inv, invoice: inv };
  },

  // Employees
  getEmployees: async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, employees: store.employees || [] };
  },

  getEmployeeById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const emp = store.employees.find(e => e.id === parseInt(id));
    return { success: !!emp, employee: emp, recent_sales: [] };
  },

  createEmployee: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const newEmp = {
      id: Date.now(),
      performance: { total_sales_count: 0, total_revenue: 0, total_gold_grams: 0, commission_earned: 0 },
      active: 1,
      ...data
    };
    store.employees.push(newEmp);
    saveLocalStore(store);
    return { success: true, employee: newEmp };
  },

  // Karigar
  getKarigarOrders: async () => {
    try {
      const res = await fetch(`${API_BASE}/karigar`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, orders: store.karigar_orders || [] };
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
    const order = {
      id: Date.now(),
      order_no: `KG-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'IN_PROGRESS',
      created_at: new Date().toISOString(),
      ...data
    };
    store.karigar_orders.unshift(order);
    saveLocalStore(store);
    return { success: true, order };
  },

  receiveKarigarOrder: async (id, data) => {
    try {
      const res = await fetch(`${API_BASE}/karigar/${id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const order = store.karigar_orders.find(o => o.id === parseInt(id));
    if (order) {
      order.status = 'COMPLETED';
      order.received_gross_weight = data.received_gross_weight;
      order.received_net_weight = data.received_net_weight;
      order.final_wastage_grams = data.final_wastage_grams;
    }
    saveLocalStore(store);
    return { success: true };
  },

  // Old Gold
  getOldGold: async () => {
    try {
      const res = await fetch(`${API_BASE}/old-gold`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, transactions: store.old_gold_transactions || [] };
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
    const txn = { id: Date.now(), receipt_no: `OG-${Math.floor(1000 + Math.random() * 9000)}`, ...data, created_at: new Date().toISOString() };
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
    const store = getLocalStore();
    return {
      success: true,
      trays: [
        { tray_name: 'Showcase A - Tray 1', category: 'Necklaces', items_count: 2, expected_gross_weight: 87.5, expected_net_weight: 86.5 },
        { tray_name: 'Showcase B - Tray 2', category: 'Bangles', items_count: 2, expected_gross_weight: 76.4, expected_net_weight: 76.4 },
        { tray_name: 'Showcase C - Tray 1', category: 'Rings', items_count: 3, expected_gross_weight: 18.2, expected_net_weight: 17.8 },
        { tray_name: 'Showcase D - Tray 3', category: 'Earrings', items_count: 2, expected_gross_weight: 14.5, expected_net_weight: 14.2 },
        { tray_name: 'Vault - Bulk Tray 1', category: 'Wholesale Lots', items_count: 2, expected_gross_weight: 198.4, expected_net_weight: 198.4 }
      ]
    };
  },

  getAuditHistory: async () => {
    try {
      const res = await fetch(`${API_BASE}/audit/history`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, audits: store.tray_audits || [] };
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
    const store = getLocalStore();
    const audit = {
      id: Date.now(),
      status: 'VERIFIED_MATCH',
      variance_weight: 0,
      ...data,
      timestamp: new Date().toISOString()
    };
    store.tray_audits.unshift(audit);
    saveLocalStore(store);
    return { success: true, audit };
  },

  // Customers
  getCustomers: async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    return { success: true, customers: store.customers || [] };
  },

  createCustomer: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const cust = { id: Date.now(), fine_gold_balance: 0, cash_balance: 0, loyalty_points: 0, ...data };
    store.customers.push(cust);
    saveLocalStore(store);
    return { success: true, customer: cust };
  },

  // Dashboard & Ledger
  getDashboard: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/dashboard`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const store = getLocalStore();
    const prods = store.products || [];
    return {
      success: true,
      metrics: {
        total_inventory_items: prods.length,
        total_stock_value: 3850000,
        physical_gold_grams: 148.5,
        physical_silver_grams: 850.0,
        total_sales_month: 2276987,
        total_gold_grams_sold: 308.5
      },
      leaderboard: store.employees || [],
      sales_trend: [
        { date: 'Aug 24', revenue: 240000, grams: 35.2 },
        { date: 'Aug 25', revenue: 420000, grams: 61.8 },
        { date: 'Aug 26', revenue: 310000, grams: 44.5 },
        { date: 'Aug 27', revenue: 580000, grams: 82.0 },
        { date: 'Aug 28', revenue: 490000, grams: 71.4 },
        { date: 'Aug 29', revenue: 650000, grams: 95.0 },
        { date: 'Aug 30', revenue: 462703, grams: 80.9 }
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
    return { success: true, ledger: store.stock_ledger || [] };
  }
};
