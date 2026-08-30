import db from '../database.js';

export const getRates = (req, res) => {
  try {
    const rates = db.prepare('SELECT * FROM metal_rates ORDER BY id ASC').all();
    res.json({ success: true, rates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRate = (req, res) => {
  try {
    const { id } = req.params;
    const { rate_per_gram } = req.body;
    if (!rate_per_gram || isNaN(rate_per_gram)) {
      return res.status(400).json({ success: false, error: 'Valid rate_per_gram is required' });
    }

    const stmt = db.prepare(`
      UPDATE metal_rates
      SET rate_per_gram = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(parseFloat(rate_per_gram), id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Rate item not found' });
    }

    const updated = db.prepare('SELECT * FROM metal_rates WHERE id = ?').get(id);
    res.json({ success: true, rate: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkUpdateRates = (req, res) => {
  try {
    const { rates } = req.body; // Array of { id, rate_per_gram }
    if (!Array.isArray(rates)) {
      return res.status(400).json({ success: false, error: 'Rates array expected' });
    }

    const updateStmt = db.prepare(`
      UPDATE metal_rates SET rate_per_gram = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const transaction = db.transaction((rateItems) => {
      for (const item of rateItems) {
        updateStmt.run(parseFloat(item.rate_per_gram), item.id);
      }
    });

    transaction(rates);

    const allRates = db.prepare('SELECT * FROM metal_rates ORDER BY id ASC').all();
    res.json({ success: true, rates: allRates, message: 'All metal rates updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
