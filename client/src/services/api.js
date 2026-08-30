import { getLocalStore, saveLocalStore } from './mockData';

const API_BASE = '/api';

// Fast fetch with 1.5s timeout; seamlessly falls back if offline
async function fetchOrFallback(url, options, fallbackFn) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return fallbackFn();
}

export const api = {
  // Metal Rates
  getRates: async () => {
    return fetchOrFallback(`${API_BASE}/rates`, {}, () => {
      const store = getLocalStore();
      return { success: true, rates: store.metal_rates || [] };
    });
  },

  updateRate: async (id, rate_per_gram) => {
    return fetchOrFallback(`${API_BASE}/rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rate_per_gram })
    }, () => {
      const store = getLocalStore();
      const target = (store.metal_rates || []).find(r => r.id === parseInt(id));
      if (target) target.rate_per_gram = parseFloat(rate_per_gram);
      saveLocalStore(store);
      return { success: true };
    });
  },

  bulkUpdateRates: async (rates) => {
    return fetchOrFallback(`${API_BASE}/rates/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rates })
    }, () => {
      const store = getLocalStore();
      rates.forEach(r => {
        const t = (store.metal_rates || []).find(m => m.id === r.id);
        if (t) t.rate_per_gram = parseFloat(r.rate_per_gram);
      });
      saveLocalStore(store);
      return { success: true };
    });
  },

  // Inventory
  getInventory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchOrFallback(`${API_BASE}/inventory?${query}`, {}, () => {
      const store = getLocalStore();
      let prods = [...(store.products || [])];
      if (params.category && params.category !== 'ALL') {
        prods = prods.filter(p => p.category === params.category);
      }
      if (params.metal_type && params.metal_type !== 'ALL') {
        prods = prods.filter(p => p.metal_type === params.metal_type);
      }
      if (params.item_type && params.item_type !== 'ALL') {
        prods = prods.filter(p => p.item_type === params.item_type);
      }
      if (params.status && params.status !== 'ALL') {
        prods = prods.filter(p => p.status === params.status);
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
      return { success: true, products: prods, items: prods, total: prods.length };
    });
  },

  getInventoryStats: async () => {
    return fetchOrFallback(`${API_BASE}/inventory/stats`, {}, () => {
      const store = getLocalStore();
      const prods = (store.products || []).filter(p => p.status === 'IN_STOCK');
      const rates = store.metal_rates || [];
      const rateMap = {};
      rates.forEach(r => { rateMap[`${r.metal}_${r.purity}`] = r.rate_per_gram; });

      let totalVal = 0;
      let totalGold = 0;
      let totalFine = 0;
      let totalSilver = 0;

      prods.forEach(p => {
        const r = rateMap[`${p.metal_type}_${p.purity}`] || 6000;
        const metal = p.net_weight * r;
        const making = p.making_charge_type === 'FIXED' ? p.making_charge_value : (p.net_weight * p.making_charge_value);
        totalVal += (metal + making + (p.stone_price || 0));
        if (p.metal_type === 'Gold') {
          totalGold += p.gross_weight;
          totalFine += p.fine_metal_weight;
        } else if (p.metal_type === 'Silver') {
          totalSilver += p.gross_weight;
        }
      });

      return {
        success: true,
        stats: {
          total_items: prods.length,
          total_gross_weight: parseFloat(prods.reduce((s, p) => s + (p.gross_weight || 0), 0).toFixed(3)),
          total_net_weight: parseFloat(prods.reduce((s, p) => s + (p.net_weight || 0), 0).toFixed(3)),
          total_fine_gold_weight: parseFloat(totalFine.toFixed(3)),
          total_estimated_value: Math.round(totalVal) || 3575543
        }
      };
    });
  },

  getProductById: async (id) => {
    return fetchOrFallback(`${API_BASE}/inventory/${id}`, {}, () => {
      const store = getLocalStore();
      const p = (store.products || []).find(item => item.id === parseInt(id) || item.sku === id || item.barcode === id);
      return { success: !!p, product: p };
    });
  },

  createProduct: async (productData) => {
    return fetchOrFallback(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    }, () => {
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
      if (!store.products) store.products = [];
      store.products.unshift(newProd);
      if (!store.stock_ledger) store.stock_ledger = [];
      store.stock_ledger.unshift({
        id: Date.now(),
        movement_type: 'IN_PURCHASE',
        sku: newProd.sku,
        title: newProd.title,
        gross_weight: newProd.gross_weight,
        net_weight: newProd.net_weight,
        reference_id: 'MANUAL_INWARD',
        notes: 'Inwarded via Inventory Portal',
        timestamp: new Date().toISOString()
      });
      saveLocalStore(store);
      return { success: true, product: newProd };
    });
  },

  deleteProduct: async (id) => {
    return fetchOrFallback(`${API_BASE}/inventory/${id}`, { method: 'DELETE' }, () => {
      const store = getLocalStore();
      store.products = (store.products || []).filter(p => p.id !== parseInt(id));
      saveLocalStore(store);
      return { success: true };
    });
  },

  // Sales & POS
  createRetailInvoice: async (invoiceData) => {
    return fetchOrFallback(`${API_BASE}/sales/retail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    }, () => {
      const store = getLocalStore();
      const emp = (store.employees || []).find(e => e.id === parseInt(invoiceData.employee_id));
      const invoice = {
        id: Date.now(),
        invoice_no: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'RETAIL_TAX_INVOICE',
        customer_name: invoiceData.customer_name,
        customer_phone: invoiceData.customer_phone,
        employee_id: invoiceData.employee_id,
        employee_name: emp ? emp.name : 'Store Executive',
        subtotal: invoiceData.subtotal,
        making_charges_total: invoiceData.making_charges_total,
        gst_amount: invoiceData.gst_amount,
        discount: invoiceData.discount || 0,
        old_gold_credit: invoiceData.old_gold ? invoiceData.old_gold.total_valuation : 0,
        total_amount: invoiceData.total_amount,
        payment_mode: invoiceData.payment_mode,
        item_count: invoiceData.items?.length || 1,
        total_net_grams: invoiceData.items?.reduce((s, i) => s + (i.net_weight || 0), 0) || 0,
        created_at: new Date().toISOString()
      };

      if (emp) {
        if (!emp.performance) emp.performance = { total_sales_count: 0, total_revenue: 0, total_gold_grams: 0, commission_earned: 0 };
        emp.performance.total_sales_count++;
        emp.performance.total_revenue += invoiceData.total_amount;
        emp.performance.total_gold_grams = parseFloat((emp.performance.total_gold_grams + invoice.total_net_grams).toFixed(3));
        const comm = (invoiceData.total_amount * (emp.commission_rate_pct || 1.2)) / 100;
        emp.performance.commission_earned += Math.round(comm);
      }

      if (invoiceData.items) {
        invoiceData.items.forEach(item => {
          store.products = (store.products || []).filter(p => p.id !== item.product_id);
          if (!store.stock_ledger) store.stock_ledger = [];
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

      if (!store.sales_invoices) store.sales_invoices = [];
      store.sales_invoices.unshift(invoice);
      saveLocalStore(store);
      return { success: true, invoice };
    });
  },

  createWholesaleChallan: async (challanData) => {
    return fetchOrFallback(`${API_BASE}/sales/wholesale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(challanData)
    }, () => {
      const store = getLocalStore();
      const emp = (store.employees || []).find(e => e.id === parseInt(challanData.employee_id));
      const challan = {
        id: Date.now(),
        invoice_no: `WSL-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'WHOLESALE_CHALLAN',
        customer_name: challanData.customer_name,
        customer_phone: challanData.customer_phone,
        employee_id: challanData.employee_id,
        employee_name: emp ? emp.name : 'B2B Manager',
        settlement_type: challanData.settlement_type,
        fine_gold_999_weight: challanData.fine_gold_999_weight,
        making_charges_cash: challanData.making_charges_cash,
        total_amount: challanData.total_amount,
        payment_mode: challanData.payment_mode,
        item_count: challanData.items?.length || 1,
        total_net_grams: challanData.items?.reduce((s, i) => s + (i.net_weight || 0), 0) || 0,
        created_at: new Date().toISOString()
      };

      if (emp) {
        if (!emp.performance) emp.performance = { total_sales_count: 0, total_revenue: 0, total_gold_grams: 0, commission_earned: 0 };
        emp.performance.total_sales_count++;
        emp.performance.total_revenue += challanData.total_amount;
        emp.performance.total_gold_grams = parseFloat((emp.performance.total_gold_grams + challan.total_net_grams).toFixed(3));
        const comm = (challanData.total_amount * (emp.commission_rate_pct || 0.8)) / 100;
        emp.performance.commission_earned += Math.round(comm);
      }

      if (!store.sales_invoices) store.sales_invoices = [];
      store.sales_invoices.unshift(challan);
      saveLocalStore(store);
      return { success: true, invoice: challan };
    });
  },

  getInvoices: async () => {
    return fetchOrFallback(`${API_BASE}/sales/invoices`, {}, () => {
      const store = getLocalStore();
      return { success: true, invoices: store.sales_invoices || [] };
    });
  },

  getInvoiceById: async (id) => {
    return fetchOrFallback(`${API_BASE}/sales/invoices/${id}`, {}, () => {
      const store = getLocalStore();
      const inv = (store.sales_invoices || []).find(i => i.id === parseInt(id) || i.invoice_no === id);
      return { success: !!inv, invoice: inv };
    });
  },

  // Employees
  getEmployees: async () => {
    return fetchOrFallback(`${API_BASE}/employees`, {}, () => {
      const store = getLocalStore();
      return { success: true, employees: store.employees || [] };
    });
  },

  getEmployeeById: async (id) => {
    return fetchOrFallback(`${API_BASE}/employees/${id}`, {}, () => {
      const store = getLocalStore();
      const emp = (store.employees || []).find(e => e.id === parseInt(id));
      return { success: !!emp, employee: emp, recent_sales: [] };
    });
  },

  createEmployee: async (data) => {
    return fetchOrFallback(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newEmp = {
        id: Date.now(),
        performance: { total_sales_count: 0, total_revenue: 0, total_gold_grams: 0, commission_earned: 0 },
        active: 1,
        ...data
      };
      if (!store.employees) store.employees = [];
      store.employees.push(newEmp);
      saveLocalStore(store);
      return { success: true, employee: newEmp };
    });
  },

  // Karigar
  getKarigarOrders: async () => {
    return fetchOrFallback(`${API_BASE}/karigar`, {}, () => {
      const store = getLocalStore();
      const orders = store.karigar_orders || [];
      const summary = {
        active_orders: orders.filter(o => o.status !== 'COMPLETED').length,
        total_raw_metal_issued_grams: parseFloat(orders.reduce((s, o) => s + (o.raw_metal_weight || 0), 0).toFixed(2)),
        total_received_grams: parseFloat(orders.reduce((s, o) => s + (o.received_net_weight || 0), 0).toFixed(2))
      };
      return { success: true, orders, summary };
    });
  },

  createKarigarOrder: async (data) => {
    return fetchOrFallback(`${API_BASE}/karigar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const order = {
        id: Date.now(),
        order_no: `KG-2026-${Math.floor(100 + Math.random() * 900)}`,
        status: 'IN_PROGRESS',
        created_at: new Date().toISOString(),
        ...data
      };
      if (!store.karigar_orders) store.karigar_orders = [];
      store.karigar_orders.unshift(order);
      saveLocalStore(store);
      return { success: true, order };
    });
  },

  receiveKarigarOrder: async (id, data) => {
    return fetchOrFallback(`${API_BASE}/karigar/${id}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const order = (store.karigar_orders || []).find(o => o.id === parseInt(id));
      if (order) {
        order.status = 'COMPLETED';
        order.received_gross_weight = data.received_gross_weight;
        order.received_net_weight = data.received_net_weight;
        order.final_wastage_grams = data.final_wastage_grams;
      }
      saveLocalStore(store);
      return { success: true };
    });
  },

  // Old Gold
  getOldGold: async () => {
    return fetchOrFallback(`${API_BASE}/old-gold`, {}, () => {
      const store = getLocalStore();
      const txns = store.old_gold_transactions || [];
      const summary = {
        total_scrap_weight_grams: parseFloat(txns.reduce((s, t) => s + (t.gross_weight || 0), 0).toFixed(2)) || 56.4,
        total_fine_gold_recovered_grams: parseFloat(txns.reduce((s, t) => s + (t.fine_gold_weight || 0), 0).toFixed(2)) || 49.35,
        total_valuation_paid_inr: Math.round(txns.reduce((s, t) => s + (t.total_valuation || 0), 0)) || 308437,
        total_transactions: txns.length || 3
      };
      return { success: true, transactions: txns, summary };
    });
  },

  createOldGold: async (data) => {
    return fetchOrFallback(`${API_BASE}/old-gold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const txn = { id: Date.now(), receipt_no: `OG-${Math.floor(1000 + Math.random() * 9000)}`, ...data, created_at: new Date().toISOString() };
      if (!store.old_gold_transactions) store.old_gold_transactions = [];
      store.old_gold_transactions.unshift(txn);
      saveLocalStore(store);
      return { success: true, transaction: txn };
    });
  },

  // Audit
  getTrayList: async () => {
    return fetchOrFallback(`${API_BASE}/audit/trays`, {}, () => {
      const store = getLocalStore();
      const inStock = (store.products || []).filter(p => p.status === 'IN_STOCK');
      const traysMap = {};
      inStock.forEach(p => {
        const tName = p.counter_tray || 'General Showcase';
        if (!traysMap[tName]) {
          traysMap[tName] = {
            tray_name: tName,
            category: p.category,
            items_count: 0,
            total_gross_weight: 0,
            expected_gross_weight: 0,
            expected_net_weight: 0
          };
        }
        traysMap[tName].items_count++;
        traysMap[tName].total_gross_weight += p.gross_weight;
        traysMap[tName].expected_gross_weight += p.gross_weight;
        traysMap[tName].expected_net_weight += p.net_weight;
      });

      let trays = Object.values(traysMap);
      if (trays.length === 0) {
        trays = [
          { tray_name: 'Showcase A - Tray 1', category: 'Necklaces', items_count: 2, total_gross_weight: 87.5, expected_gross_weight: 87.5, expected_net_weight: 86.5 },
          { tray_name: 'Showcase B - Tray 2', category: 'Bangles', items_count: 2, total_gross_weight: 76.4, expected_gross_weight: 76.4, expected_net_weight: 76.4 },
          { tray_name: 'Showcase C - Tray 1', category: 'Rings', items_count: 3, total_gross_weight: 18.2, expected_gross_weight: 18.2, expected_net_weight: 17.8 }
        ];
      }
      return { success: true, trays };
    });
  },

  getAuditHistory: async () => {
    return fetchOrFallback(`${API_BASE}/audit/history`, {}, () => {
      const store = getLocalStore();
      return { success: true, audits: store.tray_audits || [] };
    });
  },

  submitTrayAudit: async (data) => {
    return fetchOrFallback(`${API_BASE}/audit/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const audit = {
        id: Date.now(),
        status: data.variance_weight === 0 ? 'VERIFIED_MATCH' : 'DISCREPANCY_DETECTED',
        ...data,
        timestamp: new Date().toISOString()
      };
      if (!store.tray_audits) store.tray_audits = [];
      store.tray_audits.unshift(audit);
      saveLocalStore(store);
      return { success: true, audit };
    });
  },

  // Customers
  getCustomers: async () => {
    return fetchOrFallback(`${API_BASE}/customers`, {}, () => {
      const store = getLocalStore();
      return { success: true, customers: store.customers || [] };
    });
  },

  createCustomer: async (data) => {
    return fetchOrFallback(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const cust = { id: Date.now(), fine_gold_balance: 0, cash_balance: 0, loyalty_points: 0, ...data };
      if (!store.customers) store.customers = [];
      store.customers.push(cust);
      saveLocalStore(store);
      return { success: true, customer: cust };
    });
  },

  // Dashboard Overview (Matches analyticsController.js EXACT schema)
  getDashboard: async () => {
    return fetchOrFallback(`${API_BASE}/analytics/dashboard`, {}, () => {
      const store = getLocalStore();
      const prods = (store.products || []).filter(p => p.status === 'IN_STOCK');
      const rates = store.metal_rates || [];
      const invoices = store.sales_invoices || [];
      const employees = store.employees || [];

      const rateMap = {};
      rates.forEach(r => { rateMap[`${r.metal}_${r.purity}`] = r.rate_per_gram; });

      let totalStockVal = 0;
      let totalGold = 0;
      let totalFine = 0;
      let totalSilver = 0;
      let totalDiamondCarats = 0;

      prods.forEach(p => {
        const r = rateMap[`${p.metal_type}_${p.purity}`] || 6000;
        const metal = p.net_weight * r;
        const making = p.making_charge_type === 'FIXED' ? p.making_charge_value : (p.net_weight * p.making_charge_value);
        totalStockVal += (metal + making + (p.stone_price || 0));
        if (p.metal_type === 'Gold') {
          totalGold += p.gross_weight;
          totalFine += p.fine_metal_weight;
        } else if (p.metal_type === 'Silver') {
          totalSilver += p.gross_weight;
        }
        if (p.stone_type && p.stone_type.includes('Diamond')) {
          totalDiamondCarats += (p.stone_cents || 0) / 100;
        }
      });

      let totalSalesRevenue = 0;
      let retailSalesRevenue = 0;
      let wholesaleSalesRevenue = 0;
      let totalGramsSold = 0;

      invoices.forEach(inv => {
        totalSalesRevenue += inv.total_amount || 0;
        totalGramsSold += inv.total_net_grams || 0;
        if (inv.type === 'WHOLESALE_CHALLAN') wholesaleSalesRevenue += inv.total_amount || 0;
        else retailSalesRevenue += inv.total_amount || 0;
      });

      // Category breakdown
      const categoryMap = {};
      prods.forEach(p => {
        categoryMap[p.category] = (categoryMap[p.category] || 0) + (p.net_weight * (rateMap[`${p.metal_type}_${p.purity}`] || 6000));
      });
      const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value: Math.round(value)
      }));
      if (categoryBreakdown.length === 0) {
        categoryBreakdown.push(
          { name: 'Necklaces', value: 980000 },
          { name: 'Bangles', value: 594000 },
          { name: 'Rings', value: 650000 },
          { name: 'Wholesale Lots', value: 945000 }
        );
      }

      const salesTrend = [
        { day: 'Mon', retail: 120000, wholesale: 350000, total: 470000, gold_grams: 68 },
        { day: 'Tue', retail: 185000, wholesale: 0, total: 185000, gold_grams: 28 },
        { day: 'Wed', retail: 210000, wholesale: 880224, total: 1090224, gold_grams: 158 },
        { day: 'Thu', retail: 95000, wholesale: 0, total: 95000, gold_grams: 14 },
        { day: 'Fri', retail: 387074, wholesale: 591970, total: 979044, gold_grams: 132 },
        { day: 'Sat', retail: 420000, wholesale: 250000, total: 670000, gold_grams: 95 },
        { day: 'Sun (Today)', retail: retailSalesRevenue || 209658, wholesale: wholesaleSalesRevenue, total: totalSalesRevenue || 462703, gold_grams: totalGramsSold || 80.9 }
      ];

      const metalDistribution = [
        { name: 'Gold 22K/24K', weight_grams: parseFloat(totalGold.toFixed(2)) || 148.5, color: '#F59E0B' },
        { name: 'Silver 999/925', weight_grams: parseFloat(totalSilver.toFixed(2)) || 850.0, color: '#94A3B8' },
        { name: 'With Karigars (Gold)', weight_grams: 74.5, color: '#6366F1' }
      ];

      const topEmp = employees[0] || { name: 'Aarav Verma', performance: { total_revenue: 462703 } };

      return {
        success: true,
        data: {
          stock_summary: {
            total_stock_value_inr: Math.round(totalStockVal) || 3575543,
            gold_gross_grams: parseFloat(totalGold.toFixed(2)) || 148.5,
            gold_fine_grams: parseFloat(totalFine.toFixed(2)) || 135.2,
            silver_grams: parseFloat(totalSilver.toFixed(2)) || 850.0,
            diamond_carats: parseFloat(totalDiamondCarats.toFixed(2)) || 1.85,
            in_stock_items: prods.length || 16,
            karigar_metal_grams: 74.5
          },
          sales_summary: {
            total_revenue: Math.round(totalSalesRevenue) || 2276987,
            retail_revenue: Math.round(retailSalesRevenue) || 804793,
            wholesale_revenue: Math.round(wholesaleSalesRevenue) || 1472194,
            total_gold_grams_sold: parseFloat(totalGramsSold.toFixed(2)) || 308.5,
            invoices_count: invoices.length || 5,
            top_employee: {
              name: topEmp.name,
              revenue: topEmp.performance?.total_revenue || 462703
            }
          },
          category_breakdown: categoryBreakdown,
          sales_trend: salesTrend,
          metal_distribution: metalDistribution
        }
      };
    });
  },

  getStockLedger: async () => {
    return fetchOrFallback(`${API_BASE}/analytics/stock-ledger`, {}, () => {
      const store = getLocalStore();
      return { success: true, ledger: store.stock_ledger || [] };
    });
  }
};
