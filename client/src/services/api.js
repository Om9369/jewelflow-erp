import { getLocalStore, saveLocalStore } from './mockData';

const API_BASE = '/api';

// Fast fetch with 3s timeout; seamlessly falls back if offline or serverless cold start
async function fetchOrFallback(url, options, fallbackFn) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return fallbackFn();
}

export const api = {
  // ─── Metal Rates ────────────────────────────────────────────────────────────
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

  // ─── Inventory & Stock ──────────────────────────────────────────────────────
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
      return { success: true, products: prods, items: prods, count: prods.length, total: prods.length };
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
      let totalGross = 0;
      let totalNet = 0;
      let totalGold = 0;
      let totalSilver = 0;

      prods.forEach(p => {
        const r = rateMap[`${p.metal_type}_${p.purity}`] || 6750;
        const metal = (p.net_weight || 0) * r;
        const making = p.making_charge_type === 'FIXED' ? (p.making_charge_value || 0) : ((p.net_weight || 0) * (p.making_charge_value || 0));
        totalVal += (metal + making + (p.stone_price || 0));
        totalGross += (p.gross_weight || 0);
        totalNet += (p.net_weight || 0);
        if (p.metal_type === 'Gold') totalGold += (p.gross_weight || 0);
        else if (p.metal_type === 'Silver') totalSilver += (p.gross_weight || 0);
      });

      return {
        success: true,
        stats: {
          total_items: prods.length,
          total_gross_weight: parseFloat(totalGross.toFixed(3)),
          total_net_weight: parseFloat(totalNet.toFixed(3)),
          total_valuation: Math.round(totalVal),
          gold_grams: parseFloat(totalGold.toFixed(3)),
          silver_grams: parseFloat(totalSilver.toFixed(3)),
          in_stock_count: prods.length
        }
      };
    });
  },

  getProductById: async (id) => {
    return fetchOrFallback(`${API_BASE}/inventory/${id}`, {}, () => {
      const store = getLocalStore();
      const product = (store.products || []).find(p => p.id === parseInt(id) || p.sku === id);
      return { success: !!product, product };
    });
  },

  createProduct: async (productData) => {
    return fetchOrFallback(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    }, () => {
      const store = getLocalStore();
      const newProduct = {
        id: Date.now(),
        sku: productData.sku || `JW-${productData.metal_type ? productData.metal_type.substring(0, 3).toUpperCase() : 'GLD'}-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: productData.barcode || Math.floor(10000000 + Math.random() * 90000000).toString(),
        status: 'IN_STOCK',
        created_at: new Date().toISOString(),
        ...productData
      };
      if (!store.products) store.products = [];
      store.products.unshift(newProduct);
      saveLocalStore(store);
      return { success: true, product: newProduct };
    });
  },

  updateProduct: async (id, productData) => {
    return fetchOrFallback(`${API_BASE}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    }, () => {
      const store = getLocalStore();
      const index = (store.products || []).findIndex(p => p.id === parseInt(id));
      if (index !== -1) {
        store.products[index] = { ...store.products[index], ...productData };
        saveLocalStore(store);
      }
      return { success: true };
    });
  },

  deleteProduct: async (id) => {
    return fetchOrFallback(`${API_BASE}/inventory/${id}`, {
      method: 'DELETE'
    }, () => {
      const store = getLocalStore();
      store.products = (store.products || []).filter(p => p.id !== parseInt(id));
      saveLocalStore(store);
      return { success: true };
    });
  },

  // ─── Sales Invoices & Orders ───────────────────────────────────────────────
  createInvoice: async (invoiceData) => {
    const isWholesale = invoiceData.type === 'WHOLESALE_CHALLAN';
    const endpoint = isWholesale ? `${API_BASE}/sales/wholesale` : `${API_BASE}/sales/retail`;

    return fetchOrFallback(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    }, () => {
      const store = getLocalStore();
      const now = new Date().toISOString();
      const invNo = invoiceData.invoice_no || `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      const emp = (store.employees || []).find(e => e.id === parseInt(invoiceData.employee_id));

      const newInvoice = {
        id: Date.now(),
        invoice_no: invNo,
        type: invoiceData.type || 'RETAIL_TAX_INVOICE',
        customer_id: invoiceData.customer_id,
        customer_name: invoiceData.customer_name,
        customer_phone: invoiceData.customer_phone,
        employee_id: invoiceData.employee_id,
        employee_name: emp ? emp.name : 'Store Staff',
        subtotal: invoiceData.subtotal || 0,
        making_charges: invoiceData.making_charges || 0,
        stone_charges: invoiceData.stone_charges || 0,
        old_gold_deduction: invoiceData.old_gold_deduction || 0,
        discount: invoiceData.discount || 0,
        tax_amount: invoiceData.tax_amount || 0,
        total_amount: invoiceData.total_amount,
        fine_gold_settlement_grams: invoiceData.fine_gold_settlement_grams || 0,
        cash_paid: invoiceData.cash_paid || 0,
        payment_mode: invoiceData.payment_mode || 'CASH',
        status: 'PAID',
        notes: invoiceData.notes || '',
        items: invoiceData.items || [],
        item_count: invoiceData.items?.length || 1,
        total_net_grams: invoiceData.items?.reduce((s, i) => s + (i.net_weight || 0), 0) || 0,
        created_at: now
      };

      if (!store.sales_invoices) store.sales_invoices = [];
      store.sales_invoices.unshift(newInvoice);

      if (invoiceData.items && store.products) {
        invoiceData.items.forEach(item => {
          const p = store.products.find(prod => prod.id === (item.product_id || item.id));
          if (p) p.status = 'SOLD';
        });
      }

      saveLocalStore(store);
      return { success: true, invoice: newInvoice };
    });
  },

  createRetailInvoice: async (payload) => {
    return api.createInvoice({ ...payload, type: 'RETAIL_TAX_INVOICE' });
  },

  createWholesaleChallan: async (payload) => {
    return api.createInvoice({ ...payload, type: 'WHOLESALE_CHALLAN' });
  },

  getInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchOrFallback(`${API_BASE}/sales/invoices?${query}`, {}, () => {
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

  // ─── Employees & Analytics ──────────────────────────────────────────────────
  getEmployees: async () => {
    return fetchOrFallback(`${API_BASE}/employees`, {}, () => {
      const store = getLocalStore();
      const rawEmployees = store.employees || [];
      const invoices = store.sales_invoices || [];
      const employees = rawEmployees.map(emp => {
        const empInvoices = invoices.filter(inv => inv.employee_id === emp.id);
        const totalRevenue = empInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
        const targetRev = emp.target_monthly_revenue || 2000000;
        const targetGrams = emp.target_monthly_grams || 300;
        const revPct = targetRev > 0 ? parseFloat(((totalRevenue / targetRev) * 100).toFixed(1)) : 0;
        const commRate = emp.commission_rate_pct || 1.2;
        const commEarned = Math.round((totalRevenue * commRate) / 100);

        return {
          ...emp,
          targets: {
            monthly_revenue: targetRev,
            monthly_grams: targetGrams
          },
          performance: {
            total_sales_count: empInvoices.length,
            total_tickets: empInvoices.length,
            total_revenue: totalRevenue,
            total_gold_grams: 0,
            commission_rate_pct: commRate,
            commission_earned: commEarned,
            revenue_achievement_pct: revPct,
            grams_achievement_pct: 0,
            performance_grade: revPct >= 100 ? 'A+' : revPct >= 75 ? 'A' : 'B',
            average_ticket_size: empInvoices.length > 0 ? Math.round(totalRevenue / empInvoices.length) : 0,
            top_category: 'Necklaces & Bangles'
          }
        };
      });
      return { success: true, employees };
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
        name: data.name,
        email: data.email || '',
        phone: data.phone,
        role: data.role || 'SALES_EXECUTIVE',
        target_monthly_revenue: parseFloat(data.target_monthly_revenue) || 2000000,
        target_monthly_grams: parseFloat(data.target_monthly_grams) || 300,
        commission_rate_pct: parseFloat(data.commission_rate_pct) || 1.2,
        avatar_color: data.avatar_color || '#D97706',
        active: 1,
        created_at: new Date().toISOString()
      };
      if (!store.employees) store.employees = [];
      store.employees.push(newEmp);
      saveLocalStore(store);
      return { success: true, employee: newEmp };
    });
  },

  updateEmployee: async (id, data) => {
    return fetchOrFallback(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const index = (store.employees || []).findIndex(e => e.id === parseInt(id));
      if (index !== -1) {
        store.employees[index] = { ...store.employees[index], ...data };
        saveLocalStore(store);
      }
      return { success: true };
    });
  },

  // ─── Customers & VIP KYC ───────────────────────────────────────────────────
  getCustomers: async (search = '') => {
    return fetchOrFallback(`${API_BASE}/customers?search=${encodeURIComponent(search)}`, {}, () => {
      const store = getLocalStore();
      let custs = store.customers || [];
      if (search) {
        const q = search.toLowerCase();
        custs = custs.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.pan_card && c.pan_card.toLowerCase().includes(q))
        );
      }
      return { success: true, customers: custs };
    });
  },

  createCustomer: async (data) => {
    return fetchOrFallback(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newCust = {
        id: Date.now(),
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        type: data.type || 'RETAIL_CUSTOMER',
        gst_number: data.gst_number || '',
        pan_card: data.pan_card || '',
        address: data.address || '',
        fine_gold_balance: 0,
        cash_balance: 0,
        loyalty_points: 0,
        created_at: new Date().toISOString()
      };
      if (!store.customers) store.customers = [];
      store.customers.push(newCust);
      saveLocalStore(store);
      return { success: true, customer: newCust };
    });
  },

  updateCustomer: async (id, data) => {
    return fetchOrFallback(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const index = (store.customers || []).findIndex(c => c.id === parseInt(id));
      if (index !== -1) {
        store.customers[index] = { ...store.customers[index], ...data };
        saveLocalStore(store);
      }
      return { success: true };
    });
  },

  // ─── Old Gold Scrap Buyback ─────────────────────────────────────────────────
  getOldGold: async () => {
    return fetchOrFallback(`${API_BASE}/old-gold`, {}, () => {
      const store = getLocalStore();
      const txs = store.old_gold_transactions || [];
      const totalNet = txs.reduce((sum, t) => sum + (Number(t.net_weight || t.gross_weight) || 0), 0);
      const totalFine = txs.reduce((sum, t) => sum + (Number(t.fine_gold_weight) || 0), 0);
      const totalPayout = txs.reduce((sum, t) => sum + (Number(t.total_valuation) || 0), 0);

      return {
        success: true,
        transactions: txs,
        summary: {
          total_transactions: txs.length,
          total_net_grams: parseFloat(totalNet.toFixed(3)),
          total_fine_gold_grams: parseFloat(totalFine.toFixed(3)),
          total_valuation_payout: Math.round(totalPayout)
        }
      };
    });
  },

  createOldGold: async (data) => {
    return fetchOrFallback(`${API_BASE}/old-gold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newTx = {
        id: Date.now(),
        receipt_no: `OG-${Date.now().toString().slice(-6)}`,
        created_at: new Date().toISOString(),
        ...data
      };
      if (!store.old_gold_transactions) store.old_gold_transactions = [];
      store.old_gold_transactions.unshift(newTx);
      saveLocalStore(store);
      return { success: true, transaction: newTx };
    });
  },

  getOldGoldTransactions: async () => {
    return api.getOldGold();
  },

  createOldGoldTransaction: async (data) => {
    return api.createOldGold(data);
  },

  // ─── Showcase Tray & Stock Audit ───────────────────────────────────────────
  getTrayList: async () => {
    return fetchOrFallback(`${API_BASE}/audit/trays`, {}, () => {
      const store = getLocalStore();
      const prods = (store.products || []).filter(p => p.status === 'IN_STOCK');
      
      const trayMap = {};
      prods.forEach(p => {
        const trayKey = p.counter_tray || 'Showcase Main Tray';
        if (!trayMap[trayKey]) {
          trayMap[trayKey] = {
            tray_name: trayKey,
            counter_tray: trayKey,
            category: p.category || 'All Categories',
            metal_type: p.metal_type || 'Gold',
            items_count: 0,
            total_gross_weight: 0,
            total_net_weight: 0,
            items: []
          };
        }
        trayMap[trayKey].items_count += 1;
        trayMap[trayKey].total_gross_weight += (p.gross_weight || 0);
        trayMap[trayKey].total_net_weight += (p.net_weight || 0);
        trayMap[trayKey].items.push(p);
      });

      const trays = Object.values(trayMap).map(t => ({
        ...t,
        total_gross_weight: parseFloat(t.total_gross_weight.toFixed(3)),
        total_net_weight: parseFloat(t.total_net_weight.toFixed(3))
      }));

      return {
        success: true,
        trays: trays.length > 0 ? trays : [
          {
            tray_name: 'Showcase A - Tray 1 (Necklaces)',
            counter_tray: 'Showcase A - Tray 1',
            category: 'Necklaces',
            metal_type: 'Gold',
            items_count: 6,
            total_gross_weight: 185.4,
            total_net_weight: 178.2
          },
          {
            tray_name: 'Showcase B - Tray 2 (Bangles)',
            counter_tray: 'Showcase B - Tray 2',
            category: 'Bangles',
            metal_type: 'Gold',
            items_count: 8,
            total_gross_weight: 142.5,
            total_net_weight: 142.5
          }
        ]
      };
    });
  },

  getAuditHistory: async () => {
    return fetchOrFallback(`${API_BASE}/audit/history`, {}, () => {
      const store = getLocalStore();
      return { success: true, audits: store.tray_audits || [] };
    });
  },

  submitAudit: async (auditData) => {
    return fetchOrFallback(`${API_BASE}/audit/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditData)
    }, () => {
      const store = getLocalStore();
      const newAudit = {
        id: Date.now(),
        audit_date: new Date().toISOString().slice(0, 10),
        status: auditData.status || 'RECONCILED',
        created_at: new Date().toISOString(),
        ...auditData
      };
      if (!store.tray_audits) store.tray_audits = [];
      store.tray_audits.unshift(newAudit);
      saveLocalStore(store);
      return { success: true, audit: newAudit };
    });
  },

  // ─── Stock Ledger & B2B Purchases ──────────────────────────────────────────
  getStockLedger: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchOrFallback(`${API_BASE}/analytics/stock-ledger?${query}`, {}, () => {
      const store = getLocalStore();
      const rawLedger = store.stock_ledger || [];
      return { success: true, ledger: rawLedger };
    });
  },

  getPurchases: async () => {
    return fetchOrFallback(`${API_BASE}/purchases`, {}, () => {
      const store = getLocalStore();
      return { success: true, purchases: store.purchases || [] };
    });
  },

  createPurchase: async (data) => {
    return fetchOrFallback(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newPur = {
        id: Date.now(),
        purchase_no: `PUR-${Math.floor(1000 + Math.random() * 9000)}`,
        created_at: new Date().toISOString(),
        ...data
      };
      if (!store.purchases) store.purchases = [];
      store.purchases.unshift(newPur);
      saveLocalStore(store);
      return { success: true, purchase: newPur };
    });
  },

  // ─── Karigar / Artisan Ledger ──────────────────────────────────────────────
  getKarigarOrders: async () => {
    return fetchOrFallback(`${API_BASE}/karigar`, {}, () => {
      const store = getLocalStore();
      return { success: true, orders: store.karigar_orders || [] };
    });
  },

  createKarigarOrder: async (data) => {
    return fetchOrFallback(`${API_BASE}/karigar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newOrder = {
        id: Date.now(),
        order_no: `KG-2026-${Math.floor(100 + Math.random() * 900)}`,
        status: 'IN_PROGRESS',
        created_at: new Date().toISOString(),
        ...data
      };
      if (!store.karigar_orders) store.karigar_orders = [];
      store.karigar_orders.unshift(newOrder);
      saveLocalStore(store);
      return { success: true, order: newOrder };
    });
  },

  // ─── Monthly Gold Savings Scheme ────────────────────────────────────────────
  getSchemes: async () => {
    return fetchOrFallback(`${API_BASE}/schemes`, {}, () => {
      const store = getLocalStore();
      return { success: true, schemes: store.gold_schemes || [] };
    });
  },

  createScheme: async (data) => {
    return fetchOrFallback(`${API_BASE}/schemes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const store = getLocalStore();
      const newSch = {
        id: Date.now(),
        scheme_account_no: `SCH-${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        ...data
      };
      if (!store.gold_schemes) store.gold_schemes = [];
      store.gold_schemes.unshift(newSch);
      saveLocalStore(store);
      return { success: true, scheme: newSch };
    });
  },

  // ─── Dashboard Overview ────────────────────────────────────────────────────
  getDashboard: async () => {
    return fetchOrFallback(`${API_BASE}/analytics/dashboard`, {}, () => {
      const store = getLocalStore();
      const prods = (store.products || []).filter(p => p.status === 'IN_STOCK');
      const invoices = store.sales_invoices || [];

      let totalGold = 0;
      let totalFine = 0;
      let totalSilver = 0;
      prods.forEach(p => {
        if (p.metal_type === 'Gold') {
          totalGold += (p.gross_weight || 0);
          totalFine += (p.fine_metal_weight || ((p.net_weight || 0) * 0.916));
        } else if (p.metal_type === 'Silver') {
          totalSilver += (p.gross_weight || 0);
        }
      });

      const totalRev = invoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);

      return {
        success: true,
        data: {
          stock_summary: {
            total_stock_value_inr: 3577985,
            gold_gross_grams: parseFloat(totalGold.toFixed(2)),
            gold_fine_grams: parseFloat(totalFine.toFixed(2)),
            silver_grams: parseFloat(totalSilver.toFixed(2)),
            diamond_carats: 6.75,
            in_stock_items: prods.length,
            old_gold_scrap_grams: 11.5,
            total_customers_count: (store.customers || []).length
          },
          sales_summary: {
            total_revenue: totalRev,
            retail_revenue: totalRev,
            wholesale_revenue: 0,
            total_gold_grams_sold: 555.8,
            invoices_count: invoices.length,
            top_employee: { name: 'Rohan Mehta', revenue: totalRev }
          },
          category_breakdown: [
            { name: 'Bridal Necklaces', value: 1398500 },
            { name: 'Gold Bangles & Kadas', value: 1034640 },
            { name: 'Diamond Rings', value: 464804 }
          ],
          sales_trend: [
            { day: 'Mon', revenue: 220000, retail: 220000, wholesale: 0, total: 220000, gold_grams: 32 },
            { day: 'Tue', revenue: 285000, retail: 285000, wholesale: 0, total: 285000, gold_grams: 41 },
            { day: 'Wed', revenue: 310000, retail: 310000, wholesale: 0, total: 310000, gold_grams: 45 },
            { day: 'Thu', revenue: 295000, retail: 295000, wholesale: 0, total: 295000, gold_grams: 43 },
            { day: 'Fri', revenue: 387074, retail: 387074, wholesale: 0, total: 387074, gold_grams: 56 },
            { day: 'Sat', revenue: 420000, retail: 420000, wholesale: 0, total: 420000, gold_grams: 62 },
            { day: 'Sun (Today)', revenue: 462703, retail: 462703, wholesale: 0, total: 462703, gold_grams: 68.5 }
          ],
          metal_distribution: [
            { name: 'Showcase Gold (22K/18K)', weight_grams: parseFloat(totalGold.toFixed(2)), color: '#F59E0B' },
            { name: 'Silver Articles (999/925)', weight_grams: parseFloat(totalSilver.toFixed(2)), color: '#94A3B8' },
            { name: 'Old Gold Scrap Vault', weight_grams: 11.5, color: '#10B981' }
          ]
        }
      };
    });
  }
};
