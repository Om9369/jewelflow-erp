import { createClient } from '@libsql/client/web';

const TURSO_URL = 'libsql://jewelflow-db-om9369.aws-ap-south-1.turso.io';
const TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MTk4MDgzODksImlhdCI6MTc4ODI3MjM4OSwiaWQiOiIwMWEwNWQ1Ni1hYjAxLTc3M2EtYTlkNS02NjhiMWNiOWM1MmIiLCJraWQiOiJaNzJzNHZtbXg3UnYtaTFpNl9BSDJGdWhCQ2xNbWdiRVFneFUyNldkc2RVIiwicmlkIjoiNGMxYWU5ZDItZmEwYS00NGJiLTlkN2EtYzc1M2FmYjU5NTViIn0.XDSdO98b--JbDq3q-_g1WhlDesur_1g_nifv_FrQHmOi56Tw9iV6BoAXWnedJS_WoLrF5qvA8DCTfrkLU486Bw';

export const tursoClient = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN
});

export const tursoApi = {
  // ─── Metal Rates ────────────────────────────────────────────────────────────
  getRates: async () => {
    const res = await tursoClient.execute('SELECT * FROM metal_rates ORDER BY id ASC');
    return { success: true, rates: res.rows };
  },

  updateRate: async (id, rate_per_gram) => {
    await tursoClient.execute({
      sql: 'UPDATE metal_rates SET rate_per_gram = ?, updated_at = ? WHERE id = ?',
      args: [parseFloat(rate_per_gram), new Date().toISOString(), parseInt(id)]
    });
    return { success: true };
  },

  // ─── Employees ──────────────────────────────────────────────────────────────
  getEmployees: async () => {
    const empRes = await tursoClient.execute('SELECT * FROM employees WHERE active = 1 ORDER BY id ASC');
    const invRes = await tursoClient.execute('SELECT * FROM sales_invoices');
    const invoices = invRes.rows;

    const employees = empRes.rows.map((emp, index) => {
      const empInvoices = invoices.filter(inv => inv.employee_id === emp.id);
      const totalRevenue = empInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
      const targetRev = emp.target_monthly_revenue || 2000000;
      const targetGrams = emp.target_monthly_grams || 300;
      const revPct = targetRev > 0 ? parseFloat(((totalRevenue / targetRev) * 100).toFixed(1)) : 0;
      const commRate = emp.commission_rate_pct || 1.0;
      const commEarned = Math.round((totalRevenue * commRate) / 100);

      return {
        ...emp,
        rank: index + 1,
        targets: {
          monthly_revenue: targetRev,
          monthly_grams: targetGrams
        },
        performance: {
          total_tickets: empInvoices.length,
          total_sales_count: empInvoices.length,
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
  },

  createEmployee: async (data) => {
    const res = await tursoClient.execute({
      sql: 'INSERT INTO employees (name, email, phone, role, target_monthly_revenue, target_monthly_grams, commission_rate_pct, avatar_color, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
      args: [
        data.name,
        data.email || '',
        data.phone,
        data.role || 'SALES_EXECUTIVE',
        parseFloat(data.target_monthly_revenue) || 2000000,
        parseFloat(data.target_monthly_grams) || 300,
        parseFloat(data.commission_rate_pct) || 1.0,
        data.avatar_color || '#D97706',
        new Date().toISOString()
      ]
    });
    return { success: true, id: Number(res.lastInsertRowid) };
  },

  updateEmployee: async (id, data) => {
    await tursoClient.execute({
      sql: 'UPDATE employees SET name = ?, email = ?, phone = ?, role = ?, target_monthly_revenue = ?, target_monthly_grams = ?, commission_rate_pct = ?, avatar_color = ? WHERE id = ?',
      args: [
        data.name,
        data.email || '',
        data.phone,
        data.role || 'SALES_EXECUTIVE',
        parseFloat(data.target_monthly_revenue) || 2000000,
        parseFloat(data.target_monthly_grams) || 300,
        parseFloat(data.commission_rate_pct) || 1.0,
        data.avatar_color || '#D97706',
        parseInt(id)
      ]
    });
    return { success: true };
  },

  // ─── Customers ─────────────────────────────────────────────────────────────
  getCustomers: async () => {
    const custRes = await tursoClient.execute('SELECT * FROM customers ORDER BY id DESC');
    const invRes = await tursoClient.execute('SELECT * FROM sales_invoices');
    const itemsRes = await tursoClient.execute('SELECT * FROM sales_items');

    const customers = custRes.rows.map(cust => {
      const custInvoices = invRes.rows.filter(inv => inv.customer_id === cust.id || (inv.customer_phone && inv.customer_phone === cust.phone));
      const totalPurchases = custInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
      
      const invIds = new Set(custInvoices.map(i => i.id));
      const custItems = itemsRes.rows.filter(item => invIds.has(item.invoice_id));
      const totalGoldGrams = custItems.reduce((sum, it) => sum + (Number(it.gross_weight) || 0), 0);

      let vipTier = 'SILVER';
      if (totalPurchases >= 1000000 || totalGoldGrams >= 100) vipTier = 'DIAMOND_VIP';
      else if (totalPurchases >= 500000 || totalGoldGrams >= 50) vipTier = 'PLATINUM';
      else if (totalPurchases >= 200000 || totalGoldGrams >= 20) vipTier = 'GOLD';

      return {
        ...cust,
        total_purchases: totalPurchases,
        total_gold_grams: parseFloat(totalGoldGrams.toFixed(3)),
        invoices_count: custInvoices.length,
        vip_tier: vipTier,
        is_kyc_verified: Boolean(cust.pan_card && cust.pan_card.length >= 10)
      };
    });

    return { success: true, customers };
  },

  createCustomer: async (data) => {
    const res = await tursoClient.execute({
      sql: 'INSERT INTO customers (name, phone, email, type, gst_number, pan_card, address, fine_gold_balance, cash_balance, loyalty_points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)',
      args: [
        data.name,
        data.phone,
        data.email || '',
        data.type || 'RETAIL_CUSTOMER',
        data.gst_number || '',
        data.pan_card || '',
        data.address || '',
        new Date().toISOString()
      ]
    });
    return { success: true, id: Number(res.lastInsertRowid) };
  },

  updateCustomer: async (id, data) => {
    await tursoClient.execute({
      sql: 'UPDATE customers SET name = ?, phone = ?, email = ?, type = ?, gst_number = ?, pan_card = ?, address = ? WHERE id = ?',
      args: [
        data.name,
        data.phone,
        data.email || '',
        data.type || 'RETAIL_CUSTOMER',
        data.gst_number || '',
        data.pan_card || '',
        data.address || '',
        parseInt(id)
      ]
    });
    return { success: true };
  },

  // ─── Inventory ─────────────────────────────────────────────────────────────
  getInventory: async (params = {}) => {
    let sql = 'SELECT * FROM products WHERE 1=1';
    const args = [];

    if (params.status) {
      sql += ' AND status = ?';
      args.push(params.status);
    }
    if (params.category && params.category !== 'ALL') {
      sql += ' AND category = ?';
      args.push(params.category);
    }
    if (params.metal_type && params.metal_type !== 'ALL') {
      sql += ' AND metal_type = ?';
      args.push(params.metal_type);
    }
    if (params.search) {
      sql += ' AND (title LIKE ? OR sku LIKE ? OR huid LIKE ? OR barcode LIKE ?)';
      const s = `%${params.search}%`;
      args.push(s, s, s, s);
    }

    sql += ' ORDER BY id DESC';
    const res = await tursoClient.execute({ sql, args });
    return { success: true, count: res.rows.length, products: res.rows, items: res.rows };
  },

  createProduct: async (data) => {
    const sku = data.sku || `JW-${(data.metal_type || 'GLD').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const barcode = data.barcode || Math.floor(10000000 + Math.random() * 90000000).toString();
    const grossWt = parseFloat(data.gross_weight) || 0;
    const stoneWt = parseFloat(data.stone_weight) || 0;
    const netWt = Math.max(0, grossWt - stoneWt);
    const now = new Date().toISOString();

    const res = await tursoClient.execute({
      sql: 'INSERT INTO products (sku, barcode, title, category, metal_type, purity, gross_weight, net_weight, stone_weight, stone_type, stone_cents, stone_price, wastage_pct, making_charge_type, making_charge_value, huid, counter_tray, item_type, pieces, touch_pct, fine_metal_weight, status, cost_price, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        sku,
        barcode,
        data.title,
        data.category || 'Necklaces',
        data.metal_type || 'Gold',
        data.purity || '22K (916)',
        grossWt,
        netWt,
        stoneWt,
        data.stone_type || 'None',
        parseFloat(data.stone_cents) || 0,
        parseFloat(data.stone_price) || 0,
        parseFloat(data.wastage_pct) || 0,
        data.making_charge_type || 'PER_GRAM',
        parseFloat(data.making_charge_value) || 0,
        data.huid || '',
        data.counter_tray || '',
        data.item_type || 'RETAIL_SINGLE',
        parseInt(data.pieces) || 1,
        parseFloat(data.touch_pct) || 91.6,
        parseFloat((netWt * (parseFloat(data.touch_pct) || 91.6) / 100).toFixed(3)),
        'IN_STOCK',
        parseFloat(data.cost_price) || 0,
        data.notes || '',
        now
      ]
    });

    const newProd = { id: Number(res.lastInsertRowid), sku, barcode, ...data, gross_weight: grossWt, net_weight: netWt, status: 'IN_STOCK', created_at: now };
    return { success: true, product: newProd };
  },

  updateProduct: async (id, data) => {
    const grossWt = parseFloat(data.gross_weight) || 0;
    const stoneWt = parseFloat(data.stone_weight) || 0;
    const netWt = Math.max(0, grossWt - stoneWt);

    await tursoClient.execute({
      sql: 'UPDATE products SET title = ?, category = ?, metal_type = ?, purity = ?, gross_weight = ?, net_weight = ?, stone_weight = ?, stone_type = ?, stone_price = ?, making_charge_value = ?, huid = ?, counter_tray = ?, status = ? WHERE id = ?',
      args: [
        data.title,
        data.category,
        data.metal_type,
        data.purity,
        grossWt,
        netWt,
        stoneWt,
        data.stone_type || 'None',
        parseFloat(data.stone_price) || 0,
        parseFloat(data.making_charge_value) || 0,
        data.huid || '',
        data.counter_tray || '',
        data.status || 'IN_STOCK',
        parseInt(id)
      ]
    });
    return { success: true };
  },

  deleteProduct: async (id) => {
    await tursoClient.execute({
      sql: 'DELETE FROM products WHERE id = ?',
      args: [parseInt(id)]
    });
    return { success: true };
  },

  // ─── Sales Invoices ─────────────────────────────────────────────────────────
  getInvoices: async () => {
    const res = await tursoClient.execute('SELECT * FROM sales_invoices ORDER BY id DESC');
    return { success: true, invoices: res.rows };
  },

  createInvoice: async (invoiceData) => {
    const now = new Date().toISOString();
    const invNo = invoiceData.invoice_no || `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await tursoClient.execute({
      sql: 'INSERT INTO sales_invoices (invoice_no, type, customer_id, customer_name, customer_phone, employee_id, employee_name, subtotal, making_charges, stone_charges, old_gold_deduction, discount, tax_amount, total_amount, fine_gold_settlement_grams, cash_paid, payment_mode, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        invNo,
        invoiceData.type || 'RETAIL_TAX_INVOICE',
        invoiceData.customer_id || null,
        invoiceData.customer_name,
        invoiceData.customer_phone || '',
        invoiceData.employee_id || 1,
        invoiceData.employee_name || 'Staff',
        invoiceData.subtotal || 0,
        invoiceData.making_charges || 0,
        invoiceData.stone_charges || 0,
        invoiceData.old_gold_deduction || 0,
        invoiceData.discount || 0,
        invoiceData.tax_amount || 0,
        invoiceData.total_amount,
        invoiceData.fine_gold_settlement_grams || 0,
        invoiceData.cash_paid || 0,
        invoiceData.payment_mode || 'CASH',
        'PAID',
        invoiceData.notes || '',
        now
      ]
    });

    const invoiceId = Number(res.lastInsertRowid);

    // Insert sales items and mark products as SOLD
    if (invoiceData.items && invoiceData.items.length > 0) {
      for (const item of invoiceData.items) {
        await tursoClient.execute({
          sql: 'INSERT INTO sales_items (invoice_id, product_id, sku, title, category, metal_type, purity, gross_weight, net_weight, stone_weight, metal_rate_applied, making_charge, stone_price, total_item_price, pieces, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [
            invoiceId,
            item.product_id || item.id || null,
            item.sku || '',
            item.title,
            item.category || '',
            item.metal_type || 'Gold',
            item.purity || '22K (916)',
            item.gross_weight || 0,
            item.net_weight || 0,
            item.stone_weight || 0,
            item.metal_rate_applied || 0,
            item.making_charge || 0,
            item.stone_price || 0,
            item.total_price || item.total_item_price || 0,
            item.pieces || 1,
            now
          ]
        });

        if (item.product_id || item.id) {
          await tursoClient.execute({
            sql: "UPDATE products SET status = 'SOLD' WHERE id = ?",
            args: [item.product_id || item.id]
          });
        }
      }
    }

    const createdInv = { id: invoiceId, invoice_no: invNo, ...invoiceData, created_at: now };
    return { success: true, invoice: createdInv };
  },

  // ─── Dashboard Analytics ───────────────────────────────────────────────────
  getDashboard: async () => {
    const inStockRes = await tursoClient.execute("SELECT * FROM products WHERE status = 'IN_STOCK'");
    const ratesRes = await tursoClient.execute('SELECT metal, purity, rate_per_gram FROM metal_rates');
    const invoicesRes = await tursoClient.execute('SELECT * FROM sales_invoices ORDER BY id DESC');
    const employeesRes = await tursoClient.execute('SELECT * FROM employees WHERE active = 1');
    const salesItemsRes = await tursoClient.execute('SELECT * FROM sales_items');
    const customersRes = await tursoClient.execute('SELECT * FROM customers');
    const oldGoldRes = await tursoClient.execute('SELECT * FROM old_gold_transactions');

    const rateMap = {};
    ratesRes.rows.forEach(r => { rateMap[`${r.metal}_${r.purity}`] = r.rate_per_gram; });

    let totalStockValuation = 0;
    let totalGoldGrams = 0;
    let totalFineGoldGrams = 0;
    let totalSilverGrams = 0;
    let totalDiamondCarats = 0;
    const categoryStockValuation = {};

    inStockRes.rows.forEach(item => {
      const rate = rateMap[`${item.metal_type}_${item.purity}`] || 6750;
      const metalVal = (item.net_weight || 0) * rate;
      const makingVal = item.making_charge_type === 'FIXED'
        ? (item.making_charge_value || 0)
        : ((item.net_weight || 0) * (item.making_charge_value || 0));
      const stoneVal = item.stone_price || 0;
      const itemTotal = metalVal + makingVal + stoneVal;

      totalStockValuation += itemTotal;
      const catName = item.category || 'Other Jewellery';
      categoryStockValuation[catName] = (categoryStockValuation[catName] || 0) + itemTotal;

      if (item.metal_type === 'Gold') {
        totalGoldGrams += (item.gross_weight || 0);
        totalFineGoldGrams += (item.fine_metal_weight || (item.net_weight * 0.916));
      } else if (item.metal_type === 'Silver') {
        totalSilverGrams += (item.gross_weight || 0);
      }
    });

    let totalSalesRevenue = 0;
    let retailSalesRevenue = 0;
    let wholesaleSalesRevenue = 0;
    let totalGramsSold = 0;

    invoicesRes.rows.forEach(inv => {
      const amt = Number(inv.total_amount) || 0;
      totalSalesRevenue += amt;
      if (inv.type === 'WHOLESALE_CHALLAN') wholesaleSalesRevenue += amt;
      else retailSalesRevenue += amt;
    });

    salesItemsRes.rows.forEach(it => {
      if (it.metal_type === 'Gold') totalGramsSold += (it.gross_weight || it.net_weight || 0);
    });

    const categoryBreakdown = Object.entries(categoryStockValuation).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const salesTrendMap = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayLabel = i === 0 ? `${days[d.getDay()]} (Today)` : days[d.getDay()];
      salesTrendMap[dateKey] = {
        date: dateKey,
        day: dayLabel,
        revenue: 0,
        retail: 0,
        wholesale: 0,
        total: 0,
        gold_grams: 0
      };
    }

    invoicesRes.rows.forEach(inv => {
      const invDate = (inv.created_at || '').slice(0, 10);
      if (salesTrendMap[invDate]) {
        const amt = Number(inv.total_amount) || 0;
        salesTrendMap[invDate].total += amt;
        salesTrendMap[invDate].revenue += amt;
      }
    });

    const totalOldGoldScrapGrams = oldGoldRes.rows.reduce((sum, og) => sum + (Number(og.net_weight || og.gross_weight) || 0), 0);

    const metalDistribution = [
      { name: 'Showcase Gold (22K/18K)', weight_grams: parseFloat(totalGoldGrams.toFixed(2)), color: '#F59E0B' },
      { name: 'Silver Articles (999/925)', weight_grams: parseFloat(totalSilverGrams.toFixed(2)), color: '#94A3B8' },
      { name: 'Old Gold Scrap Vault', weight_grams: parseFloat(totalOldGoldScrapGrams.toFixed(2)), color: '#10B981' }
    ];

    return {
      success: true,
      data: {
        stock_summary: {
          total_stock_value_inr: Math.round(totalStockValuation),
          gold_gross_grams: parseFloat(totalGoldGrams.toFixed(2)),
          gold_fine_grams: parseFloat(totalFineGoldGrams.toFixed(2)),
          silver_grams: parseFloat(totalSilverGrams.toFixed(2)),
          diamond_carats: parseFloat(totalDiamondCarats.toFixed(2)),
          in_stock_items: inStockRes.rows.length,
          old_gold_scrap_grams: parseFloat(totalOldGoldScrapGrams.toFixed(2)),
          total_customers_count: customersRes.rows.length
        },
        sales_summary: {
          total_revenue: Math.round(totalSalesRevenue),
          retail_revenue: Math.round(retailSalesRevenue),
          wholesale_revenue: Math.round(wholesaleSalesRevenue),
          total_gold_grams_sold: parseFloat(totalGramsSold.toFixed(2)),
          invoices_count: invoicesRes.rows.length,
          top_employee: {
            name: employeesRes.rows.length > 0 ? employeesRes.rows[0].name : 'Sales Staff',
            revenue: Math.round(totalSalesRevenue)
          }
        },
        category_breakdown: categoryBreakdown.length > 0 ? categoryBreakdown : [
          { name: 'Necklaces', value: 1398500 },
          { name: 'Rings', value: 1034640 },
          { name: 'Bangles', value: 464804 }
        ],
        sales_trend: Object.values(salesTrendMap),
        metal_distribution: metalDistribution
      }
    };
  }
};
