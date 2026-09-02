import { getLocalStore, saveLocalStore } from './mockData';
import { tursoApi } from './tursoDirect';

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
    try {
      const res = await tursoApi.getRates();
      if (res && res.success && res.rates && res.rates.length > 0) return res;
    } catch (e) {}
    return fetchOrFallback(`${API_BASE}/rates`, {}, () => {
      const store = getLocalStore();
      return { success: true, rates: store.metal_rates || [] };
    });
  },

  updateRate: async (id, rate_per_gram) => {
    try {
      await tursoApi.updateRate(id, rate_per_gram);
    } catch (e) {}
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
    try {
      const res = await tursoApi.getInventory(params);
      if (res && res.success && res.products) return res;
    } catch (e) {}

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

  getProductById: async (id) => {
    return fetchOrFallback(`${API_BASE}/inventory/${id}`, {}, () => {
      const store = getLocalStore();
      const product = (store.products || []).find(p => p.id === parseInt(id) || p.sku === id);
      return { success: !!product, product };
    });
  },

  createProduct: async (productData) => {
    try {
      const res = await tursoApi.createProduct(productData);
      if (res && res.success) return res;
    } catch (e) {}

    return fetchOrFallback(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    }, () => {
      const store = getLocalStore();
      const newProduct = {
        id: Date.now(),
        sku: `JW-${productData.metal_type ? productData.metal_type.substring(0, 3).toUpperCase() : 'GLD'}-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: Math.floor(10000000 + Math.random() * 90000000).toString(),
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
    try {
      await tursoApi.updateProduct(id, productData);
    } catch (e) {}

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
    try {
      await tursoApi.deleteProduct(id);
    } catch (e) {}

    return fetchOrFallback(`${API_BASE}/inventory/${id}`, {
      method: 'DELETE'
    }, () => {
      const store = getLocalStore();
      store.products = (store.products || []).filter(p => p.id !== parseInt(id));
      saveLocalStore(store);
      return { success: true };
    });
  },

  // Sales
  createInvoice: async (invoiceData) => {
    try {
      const res = await tursoApi.createInvoice(invoiceData);
      if (res && res.success) return res;
    } catch (e) {}

    return fetchOrFallback(`${API_BASE}/sales/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    }, () => {
      const store = getLocalStore();
      const now = new Date().toISOString();
      const invNo = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
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
        item_count: invoiceData.items?.length || 1,
        total_net_grams: invoiceData.items?.reduce((s, i) => s + (i.net_weight || 0), 0) || 0,
        created_at: now
      };

      if (!store.sales_invoices) store.sales_invoices = [];
      store.sales_invoices.unshift(newInvoice);

      if (invoiceData.items && store.products) {
        invoiceData.items.forEach(item => {
          const p = store.products.find(prod => prod.id === item.product_id);
          if (p) p.status = 'SOLD';
        });
      }

      saveLocalStore(store);
      return { success: true, invoice: newInvoice };
    });
  },

  getInvoices: async () => {
    try {
      const res = await tursoApi.getInvoices();
      if (res && res.success && res.invoices) return res;
    } catch (e) {}

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
    try {
      const res = await tursoApi.getEmployees();
      if (res && res.success && res.employees && res.employees.length > 0) return res;
    } catch (e) {}

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
    try {
      const res = await tursoApi.createEmployee(data);
      if (res && res.success) return res;
    } catch (e) {}

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
    try {
      await tursoApi.updateEmployee(id, data);
    } catch (e) {}

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

  // Customers
  getCustomers: async (search = '') => {
    try {
      const res = await tursoApi.getCustomers();
      if (res && res.success && res.customers) {
        if (search) {
          const q = search.toLowerCase();
          const filtered = res.customers.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            (c.pan_card && c.pan_card.toLowerCase().includes(q))
          );
          return { success: true, customers: filtered };
        }
        return res;
      }
    } catch (e) {}

    return fetchOrFallback(`${API_BASE}/customers?search=${search}`, {}, () => {
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
    try {
      const res = await tursoApi.createCustomer(data);
      if (res && res.success) return res;
    } catch (e) {}

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
    try {
      await tursoApi.updateCustomer(id, data);
    } catch (e) {}

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

  // Dashboard Analytics
  getDashboard: async () => {
    try {
      const res = await tursoApi.getDashboard();
      if (res && res.success && res.data) return res;
    } catch (e) {}

    return fetchOrFallback(`${API_BASE}/analytics/dashboard`, {}, () => {
      const store = getLocalStore();
      const prods = (store.products || []).filter(p => p.status === 'IN_STOCK');
      const invoices = store.sales_invoices || [];

      let totalGold = 0;
      let totalFine = 0;
      let totalSilver = 0;
      prods.forEach(p => {
        if (p.metal_type === 'Gold') {
          totalGold += p.gross_weight;
          totalFine += (p.fine_metal_weight || (p.net_weight * 0.916));
        } else if (p.metal_type === 'Silver') {
          totalSilver += p.gross_weight;
        }
      });

      const totalRev = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);

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
