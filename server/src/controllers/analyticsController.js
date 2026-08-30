import db from '../database.js';

export const getDashboardOverview = (req, res) => {
  try {
    const inStock = db.prepare("SELECT * FROM products WHERE status = 'IN_STOCK'").all();
    const rates = db.prepare('SELECT metal, purity, rate_per_gram FROM metal_rates').all();
    const invoices = db.prepare('SELECT * FROM sales_invoices').all();
    const employees = db.prepare('SELECT * FROM employees').all();
    const salesItems = db.prepare('SELECT * FROM sales_items').all();
    const karigarOrders = db.prepare("SELECT * FROM karigar_orders WHERE status = 'IN_PROGRESS'").all();

    const rateMap = {};
    rates.forEach(r => {
      rateMap[`${r.metal}_${r.purity}`] = r.rate_per_gram;
    });

    // Stock holdings
    let totalStockValuation = 0;
    let totalGoldGrams = 0;
    let totalFineGoldGrams = 0;
    let totalSilverGrams = 0;
    let totalDiamondCarats = 0;

    inStock.forEach(item => {
      const rate = rateMap[`${item.metal_type}_${item.purity}`] || 6000;
      const metalVal = item.net_weight * rate;
      const makingVal = item.making_charge_type === 'FIXED' ? item.making_charge_value : (item.net_weight * item.making_charge_value);
      const stoneVal = item.stone_price || 0;
      totalStockValuation += (metalVal + makingVal + stoneVal);

      if (item.metal_type === 'Gold') {
        totalGoldGrams += item.gross_weight;
        totalFineGoldGrams += item.fine_metal_weight;
      } else if (item.metal_type === 'Silver') {
        totalSilverGrams += item.gross_weight;
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
      totalSalesRevenue += inv.total_amount || 0;
      if (inv.type === 'WHOLESALE_CHALLAN') {
        wholesaleSalesRevenue += inv.total_amount || 0;
      } else {
        retailSalesRevenue += inv.total_amount || 0;
      }
    });

    salesItems.forEach(it => {
      if (it.metal_type === 'Gold') {
        totalGramsSold += (it.gross_weight || 0);
      }
    });

    // Top Selling Salesperson
    const empSalesMap = {};
    invoices.forEach(inv => {
      empSalesMap[inv.employee_name] = (empSalesMap[inv.employee_name] || 0) + (inv.total_amount || 0);
    });

    let topEmployeeName = 'None';
    let topEmployeeRev = 0;
    for (const [name, val] of Object.entries(empSalesMap)) {
      if (val > topEmployeeRev) {
        topEmployeeRev = val;
        topEmployeeName = name;
      }
    }

    // Category Sales breakdown
    const categoryRevMap = {};
    salesItems.forEach(it => {
      categoryRevMap[it.category] = (categoryRevMap[it.category] || 0) + (it.total_item_price || 0);
    });

    const categoryBreakdown = Object.entries(categoryRevMap).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));

    // Daily Sales Trend (last 7 days or mock series)
    const salesTrend = [
      { day: 'Mon', retail: 120000, wholesale: 350000, total: 470000, gold_grams: 68 },
      { day: 'Tue', retail: 185000, wholesale: 0, total: 185000, gold_grams: 28 },
      { day: 'Wed', retail: 210000, wholesale: 880224, total: 1090224, gold_grams: 158 },
      { day: 'Thu', retail: 95000, wholesale: 0, total: 95000, gold_grams: 14 },
      { day: 'Fri', retail: 387074, wholesale: 591970, total: 979044, gold_grams: 132 },
      { day: 'Sat', retail: 420000, wholesale: 250000, total: 670000, gold_grams: 95 },
      { day: 'Sun (Today)', retail: 209658, wholesale: 0, total: 209658, gold_grams: 32 }
    ];

    // Karigar pending metal
    const karigarMetalWeight = karigarOrders.reduce((sum, o) => sum + (o.raw_metal_weight || 0), 0);

    // Metal Distribution for Pie Chart
    const metalDistribution = [
      { name: 'Gold 22K/24K', weight_grams: parseFloat(totalGoldGrams.toFixed(2)), color: '#F59E0B' },
      { name: 'Silver 999/925', weight_grams: parseFloat(totalSilverGrams.toFixed(2)), color: '#94A3B8' },
      { name: 'With Karigars (Gold)', weight_grams: parseFloat(karigarMetalWeight.toFixed(2)), color: '#6366F1' }
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
          karigar_metal_grams: parseFloat(karigarMetalWeight.toFixed(2))
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

    const entries = db.prepare(query).all(...params);
    res.json({ success: true, count: entries.length, ledger: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
