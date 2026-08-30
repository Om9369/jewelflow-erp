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
      query += ' AND (name LIKE ? OR phone LIKE ? OR gst_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY name ASC';
    const customers = db.prepare(query).all(...params);

    res.json({ success: true, count: customers.length, customers });
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
      address = ''
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Customer Name and Phone are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO customers (name, phone, email, type, gst_number, pan_card, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, phone, email, type, gst_number, pan_card, address);
    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, customer: created });
  } catch (error) {
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
