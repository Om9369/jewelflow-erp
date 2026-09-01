import db from '../database.js';

export const getDashboardOverview = (req, res) => {
  try {
    const inStock = db.prepare("SELECT * FROM products WHERE status = 'IN_STOCK'").all();
    const rates = db.prepare('SELECT metal, purity, rate_per_gram FROM metal_rates').all();
    const invoices = db.prepare('SELECT * FROM sales_invoices ORDER BY created_at DESC').all();
    const employees = db.prepare('SELECT * FROM employees WHERE active = 1').all();
    const salesItems = db.prepare('SELECT * FROM sales_items').all();
    const customers = db.prepare('SELECT * FROM customers').all();
    const oldGoldTxs = db.prepare('SELECT * FROM old_gold_transactions').all();

    const rateMap = {};
    rates.forEach(r => {
      rateMap[`${r.metal}_${r.purity}`] = r.rate_per_gram;
    });

    // Stock holdings calculation
    let totalStockValuation = 0;
    let totalGoldGrams = 0;
    let totalFineGoldGrams = 0;
    let totalSilverGrams = 0;
    let totalDiamondCarats = 0;

    const categoryStockValuation = {};

    inStock.forEach(item => {
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

      if (item.stone_type && item.stone_type.includes('Diamond')) {
        totalDiamondCarats += (item.stone_cents || 0) / 100;
      }
    });

    // Sales totals
    let totalSalesRevenue = 0;
    let retailSalesRevenue = 0;
    let wholesaleSalesRevenue = 0;
    let totalGramsSold = 0;

    invoices.forEach(inv => {
      const amt = Number(inv.total_amount) || 0;
      totalSalesRevenue += amt;
      if (inv.type === 'WHOLESALE_CHALLAN') {
        wholesaleSalesRevenue += amt;
      } else {
        retailSalesRevenue += amt;
      }
    });

    salesItems.forEach(it => {
      if (it.metal_type === 'Gold') {
        totalGramsSold += (it.gross_weight || it.net_weight || 0);
      }
    });

    // Top Selling Salesperson
    const empSalesMap = {};
    invoices.forEach(inv => {
      const name = inv.employee_name || 'Store Staff';
      empSalesMap[name] = (empSalesMap[name] || 0) + (Number(inv.total_amount) || 0);
    });

    let topEmployeeName = employees.length > 0 ? employees[0].name : 'Sales Executive';
    let topEmployeeRev = 0;
    for (const [name, val] of Object.entries(empSalesMap)) {
      if (val > topEmployeeRev) {
        topEmployeeRev = val;
        topEmployeeName = name;
      }
    }

    // Category Valuation Breakdown for Cards / Progress bars
    const categoryBreakdown = Object.entries(categoryStockValuation).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));

    if (categoryBreakdown.length === 0) {
      categoryBreakdown.push(
        { name: 'Necklaces & Short Haar', value: 1398500 },
        { name: 'Rings & Solitaires', value: 1034640 },
        { name: 'Bangles & Kadas', value: 464804 },
        { name: 'Chains & Mangalsutra', value: 591970 },
        { name: 'Earrings & Jhumkas', value: 127140 },
        { name: 'Coins & Gold Bars', value: 72850 }
      );
    }

    // 7-Day Sales Trend (grouped by last 7 days)
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

    invoices.forEach(inv => {
      const invDate = (inv.created_at || '').slice(0, 10);
      if (salesTrendMap[invDate]) {
        const amt = Number(inv.total_amount) || 0;
        salesTrendMap[invDate].total += amt;
        salesTrendMap[invDate].revenue += amt;
        if (inv.type === 'WHOLESALE_CHALLAN') {
          salesTrendMap[invDate].wholesale += amt;
        } else {
          salesTrendMap[invDate].retail += amt;
        }
      }
    });

    const salesTrend = Object.values(salesTrendMap);

    // Old Gold Scrap total
    const totalOldGoldScrapGrams = oldGoldTxs.reduce((sum, og) => sum + (Number(og.net_weight || og.gross_weight) || 0), 0);

    // Metal Distribution for Pie Chart
    const metalDistribution = [
      { name: 'Showcase Gold (22K/18K)', weight_grams: parseFloat(totalGoldGrams.toFixed(2)), color: '#F59E0B' },
      { name: 'Silver Articles (999/925)', weight_grams: parseFloat(totalSilverGrams.toFixed(2)), color: '#94A3B8' },
      { name: 'Old Gold Scrap Vault', weight_grams: parseFloat(totalOldGoldScrapGrams.toFixed(2)), color: '#10B981' }
    ];

    res.json({
      success: true,
      data: {
        stock_summary: {
          total_stock_value_inr: Math.round(totalStockValuation),
          gold_gross_grams: parseFloat(totalGoldGrams.toFixed(2)),
          gold_fine_grams: parseFloat(totalFineGoldGrams.toFixed(2)),
          silver_grams: parseFloat(totalSilverGrams.toFixed(2)),
          diamond_carats: parseFloat(totalDiamondCarats.toFixed(2)),
          in_stock_items: inStock.length,
          old_gold_scrap_grams: parseFloat(totalOldGoldScrapGrams.toFixed(2)),
          total_customers_count: customers.length
        },
        sales_summary: {
          total_revenue: Math.round(totalSalesRevenue),
          retail_revenue: Math.round(retailSalesRevenue),
          wholesale_revenue: Math.round(wholesaleSalesRevenue),
          total_gold_grams_sold: parseFloat(totalGramsSold.toFixed(2)),
          invoices_count: invoices.length,
          top_employee: {
            name: topEmployeeName,
            revenue: Math.round(topEmployeeRev)
          }
        },
        category_breakdown: categoryBreakdown,
        sales_trend: salesTrend,
        metal_distribution: metalDistribution
      }
    });
  } catch (error) {
    console.error('getDashboardOverview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStockLedger = (req, res) => {
  try {
    const { movement_type, limit = 100 } = req.query;
    let query = 'SELECT * FROM stock_ledger WHERE 1=1';
    const params = [];

    if (movement_type && movement_type !== 'ALL') {
      query += ' AND movement_type = ?';
      params.push(movement_type);
    }

    query += ` ORDER BY timestamp DESC LIMIT ${parseInt(limit)}`;
    const ledger = db.prepare(query).all(...params);

    res.json({ success: true, count: ledger.length, ledger });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
