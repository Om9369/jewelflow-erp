import db from '../database.js';

export const getCustomers = (req, res) => {
  try {
    const { type, search } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (type && type !== 'ALL') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR gst_number LIKE ? OR pan_card LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY id DESC';
    const customers = db.prepare(query).all(...params);

    // Enrich customers with their live lifetime purchases, gold bought, and VIP tiers from sales_invoices
    const enriched = customers.map(c => {
      const cleanPhone = (c.phone || '').trim();
      const cleanName = (c.name || '').trim();

      const invs = db.prepare(`
        SELECT * FROM sales_invoices
        WHERE customer_id = ? OR (customer_phone = ? AND customer_phone != '') OR customer_name = ?
        ORDER BY created_at DESC
      `).all(c.id, cleanPhone, cleanName);

      const totalPurchases = invs.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

      // Find total gold bought in grams
      const invIds = invs.map(i => i.id);
      let totalGrams = 0;
      if (invIds.length > 0) {
        const placeholders = invIds.map(() => '?').join(',');
        const items = db.prepare(`SELECT * FROM sales_items WHERE invoice_id IN (${placeholders})`).all(...invIds);
        totalGrams = items.reduce((sum, it) => sum + (Number(it.net_weight || it.gross_weight) || 0), 0);
      }

      // VIP tier calculation: DIAMOND_VIP (>= 10L or >= 100g), PLATINUM (>= 5L), GOLD (>= 2L), SILVER
      let calculatedTier = c.loyalty_tier || 'SILVER';
      if (totalPurchases >= 1000000 || totalGrams >= 100) {
        calculatedTier = 'DIAMOND_VIP';
      } else if (totalPurchases >= 500000 || totalGrams >= 50) {
        calculatedTier = 'PLATINUM';
      } else if (totalPurchases >= 200000 || totalGrams >= 20) {
        calculatedTier = 'GOLD';
      }

      const kycVerified = Boolean((c.pan_card && c.pan_card.length >= 10) || (c.gst_number && c.gst_number.length >= 15));

      return {
        ...c,
        total_purchases_inr: Math.round(totalPurchases),
        total_gold_bought_grams: parseFloat(totalGrams.toFixed(3)),
        loyalty_tier: calculatedTier,
        kyc_verified: kycVerified,
        invoice_count: invs.length,
        invoices: invs
      };
    });

    res.json({ success: true, count: enriched.length, customers: enriched });
  } catch (error) {
    console.error('getCustomers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerById = (req, res) => {
  try {
    const { id } = req.params;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const invs = db.prepare('SELECT * FROM sales_invoices WHERE customer_id = ? OR customer_phone = ? ORDER BY created_at DESC').all(customer.id, customer.phone || '');
    const totalPurchases = invs.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

    res.json({
      success: true,
      customer: {
        ...customer,
        total_purchases_inr: Math.round(totalPurchases),
        invoices: invs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCustomer = (req, res) => {
  try {
    const {
      name,
      phone,
      email = '',
      type = 'RETAIL_CUSTOMER',
      gst_number = '',
      pan_card = '',
      address = '',
      city = 'Mumbai'
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Customer Name and Phone are required' });
    }

    const cleanPhone = phone.trim();
    const cleanName = name.trim();

    // Check if customer with this phone already exists
    const existing = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone);
    if (existing) {
      // Update details if needed
      db.prepare(`
        UPDATE customers SET
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          pan_card = COALESCE(?, pan_card),
          gst_number = COALESCE(?, gst_number),
          address = COALESCE(?, address)
        WHERE id = ?
      `).run(cleanName, email, pan_card, gst_number, address || city, existing.id);

      const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(existing.id);
      return res.status(200).json({ success: true, customer: updated, message: 'Existing customer updated' });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO customers (
        name, phone, email, type, gst_number, pan_card, address,
        fine_gold_balance, cash_balance, loyalty_points, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
    `);

    const result = stmt.run(cleanName, cleanPhone, email, type, gst_number, pan_card, address || city, now);
    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, customer: created });
  } catch (error) {
    console.error('createCustomer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDealerLedger = (req, res) => {
  try {
    const { id } = req.params;
    const { fine_gold_adjustment, cash_adjustment, notes } = req.body;

    const stmt = db.prepare(`
      UPDATE customers SET
        fine_gold_balance = fine_gold_balance + COALESCE(?, 0),
        cash_balance = cash_balance + COALESCE(?, 0)
      WHERE id = ?
    `);

    stmt.run(
      fine_gold_adjustment !== undefined ? parseFloat(fine_gold_adjustment) : 0,
      cash_adjustment !== undefined ? parseFloat(cash_adjustment) : 0,
      id
    );

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.json({ success: true, customer: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
