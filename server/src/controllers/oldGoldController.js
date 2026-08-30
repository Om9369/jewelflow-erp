import db from '../database.js';

export const getOldGoldTransactions = (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM old_gold_transactions ORDER BY created_at DESC').all();
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

export const createOldGoldEntry = (req, res) => {
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

    const stmt = db.prepare(`
      INSERT INTO old_gold_transactions (
        receipt_no, customer_name, customer_phone, gross_weight, stone_dust_deduction,
        net_weight, purity_touch_pct, fine_gold_weight, valuation_rate_per_gram, total_valuation,
        settlement_mode, linked_invoice_no, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      receiptNo, customer_name, customer_phone || '', gWeight, dustDed,
      nWeight, touch, fineGold, rate, totalValuation, settlement_mode, linked_invoice_no, notes
    );

    // Stock ledger entry
    db.prepare(`
      INSERT INTO stock_ledger (sku, title, movement_type, gross_weight, net_weight, reference_id, reference_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      receiptNo, `Old Gold Scrap from ${customer_name}`, 'IN_OLD_GOLD',
      gWeight, nWeight, receiptNo, 'OLD_GOLD_BUYBACK',
      `Purchased ${nWeight}g (${touch}% touch) scrap gold @ ₹${rate}/g`
    );

    const transaction = db.prepare('SELECT * FROM old_gold_transactions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
