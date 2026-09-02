import { OldGoldTransaction, StockLedger } from '../models/index.js';

export const getOldGoldTransactions = async (req, res) => {
  try {
    const list = await OldGoldTransaction.find().sort({ created_at: -1 });
    const totalOldGoldWeight = list.reduce((sum, item) => sum + (item.net_weight || 0), 0);
    const totalValuation = list.reduce((sum, item) => sum + (item.total_valuation || 0), 0);

    res.json({
      success: true,
      count: list.length,
      transactions: list,
      summary: {
        total_scrap_weight_grams: parseFloat(totalOldGoldWeight.toFixed(2)),
        total_valuation_paid_or_credited: Math.round(totalValuation)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createOldGoldEntry = async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      gross_weight,
      stone_dust_deduction = 0,
      purity_touch_pct,
      valuation_rate_per_gram,
      settlement_mode = 'CASH_PAYOUT',
      linked_invoice_no = '',
      notes = ''
    } = req.body;

    if (!customer_name || !gross_weight || !purity_touch_pct || !valuation_rate_per_gram) {
      return res.status(400).json({ success: false, error: 'Customer name, Gross weight, Touch %, and Valuation rate are required' });
    }

    const gWeight = parseFloat(gross_weight);
    const dustDed = parseFloat(stone_dust_deduction) || 0;
    const nWeight = Math.max(0, parseFloat((gWeight - dustDed).toFixed(3)));
    const touch = parseFloat(purity_touch_pct);
    const fineGold = parseFloat(((nWeight * touch) / 100).toFixed(3));
    const rate = parseFloat(valuation_rate_per_gram);
    const totalValuation = Math.round(fineGold * rate);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `OG-${dateStr}-${rand}`;

    const transaction = await OldGoldTransaction.create({
      receipt_no: receiptNo,
      customer_name,
      customer_phone: customer_phone || '',
      gross_weight: gWeight,
      stone_dust_deduction: dustDed,
      net_weight: nWeight,
      purity_touch_pct: touch,
      fine_gold_weight: fineGold,
      valuation_rate_per_gram: rate,
      total_valuation: totalValuation,
      settlement_mode,
      linked_invoice_no,
      notes
    });

    // Stock ledger entry
    await StockLedger.create({
      sku: receiptNo,
      title: `Old Gold Scrap from ${customer_name}`,
      movement_type: 'IN_OLD_GOLD',
      gross_weight: gWeight,
      net_weight: nWeight,
      reference_id: receiptNo,
      reference_type: 'OLD_GOLD_BUYBACK',
      notes: `Purchased ${nWeight}g (${touch}% touch) scrap gold @ ₹${rate}/g`
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
