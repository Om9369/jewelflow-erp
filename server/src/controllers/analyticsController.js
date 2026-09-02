import {
  Product,
  MetalRate,
  SalesInvoice,
  Employee,
  Customer,
  OldGoldTransaction,
  StockLedger
} from '../models/index.js';

export const getDashboardOverview = async (req, res) => {
  try {
    const inStock = await Product.find({ status: 'IN_STOCK' });
    const rates = await MetalRate.find();
    const invoices = await SalesInvoice.find().sort({ created_at: -1 });
    const employees = await Employee.find({ active: 1 });
    const customers = await Customer.find();
    const oldGold = await OldGoldTransaction.find();

    const rateMap = {};
    rates.forEach(r => { rateMap[`${r.metal}_${r.purity}`] = r.rate_per_gram; });

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
        totalFineGoldGrams += (item.fine_metal_weight || ((item.net_weight || 0) * 0.916));
      } else if (item.metal_type === 'Silver') {
        totalSilverGrams += (item.gross_weight || 0);
      }
    });

    let totalSalesRevenue = 0;
    let retailSalesRevenue = 0;
    let wholesaleSalesRevenue = 0;
    let totalGramsSold = 0;

    invoices.forEach(inv => {
      const amt = Number(inv.total_amount) || 0;
      totalSalesRevenue += amt;
      if (inv.type === 'WHOLESALE_CHALLAN') wholesaleSalesRevenue += amt;
      else retailSalesRevenue += amt;

      (inv.items || []).forEach(it => {
        if (it.metal_type === 'Gold') totalGramsSold += (it.gross_weight || it.net_weight || 0);
      });
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

    invoices.forEach(inv => {
      const invDate = inv.created_at ? new Date(inv.created_at).toISOString().slice(0, 10) : '';
      if (salesTrendMap[invDate]) {
        const amt = Number(inv.total_amount) || 0;
        salesTrendMap[invDate].total += amt;
        salesTrendMap[invDate].revenue += amt;
      }
    });

    const totalOldGoldScrapGrams = oldGold.reduce((sum, og) => sum + (Number(og.net_weight || og.gross_weight) || 0), 0);

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
            name: employees.length > 0 ? employees[0].name : 'Sales Staff',
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
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStockLedger = async (req, res) => {
  try {
    const { movement_type, limit = 50 } = req.query;
    const filter = {};
    if (movement_type && movement_type !== 'ALL') filter.movement_type = movement_type;

    const ledger = await StockLedger.find(filter).sort({ timestamp: -1 }).limit(parseInt(limit));
    res.json({ success: true, count: ledger.length, ledger });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
