import db from '../database.js';

export const getInventory = (req, res) => {
  try {
    const {
      item_type,
      category,
      metal_type,
      purity,
      status = 'IN_STOCK',
      counter_tray,
      search,
      sort_by = 'created_at',
      sort_dir = 'DESC'
    } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (item_type && item_type !== 'ALL') {
      query += ' AND item_type = ?';
      params.push(item_type);
    }

    if (category && category !== 'ALL') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (metal_type && metal_type !== 'ALL') {
      query += ' AND metal_type = ?';
      params.push(metal_type);
    }

    if (purity && purity !== 'ALL') {
      query += ' AND purity = ?';
      params.push(purity);
    }

    if (counter_tray && counter_tray !== 'ALL') {
      query += ' AND counter_tray = ?';
      params.push(counter_tray);
    }

    if (search) {
      query += ' AND (sku LIKE ? OR title LIKE ? OR barcode LIKE ? OR huid LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const validSorts = ['created_at', 'gross_weight', 'net_weight', 'title', 'sku'];
    const validDir = sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const orderCol = validSorts.includes(sort_by) ? sort_by : 'created_at';

    query += ` ORDER BY ${orderCol} ${validDir}`;

    const items = db.prepare(query).all(...params);

    // Fetch current rates to attach dynamic valuation to each item
    const rates = db.prepare('SELECT metal, purity, rate_per_gram FROM metal_rates').all();
    const rateMap = {};
    rates.forEach(r => {
      rateMap[`${r.metal}_${r.purity}`] = r.rate_per_gram;
    });

    const enrichedItems = items.map(item => {
      const rate = rateMap[`${item.metal_type}_${item.purity}`] || 6000;
      let metalValue = item.net_weight * rate;
      let makingCharge = item.making_charge_type === 'FIXED'
        ? item.making_charge_value
        : (item.net_weight * item.making_charge_value);
      let stoneValue = item.stone_price || 0;
      let estimatedRetailPrice = Math.round(metalValue + makingCharge + stoneValue);

      return {
        ...item,
        current_metal_rate: rate,
        estimated_retail_price: estimatedRetailPrice
      };
    });

    res.json({ success: true, count: enrichedItems.length, items: enrichedItems });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductById = (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM products WHERE id = ? OR sku = ? OR barcode = ?').get(id, id, id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createProduct = (req, res) => {
  try {
    const {
      title,
      category,
      metal_type,
      purity,
      gross_weight,
      stone_weight = 0,
      stone_type = 'None',
      stone_cents = 0,
      stone_price = 0,
      wastage_pct = 0,
      making_charge_type = 'PER_GRAM',
      making_charge_value = 450,
      huid,
      counter_tray = 'Showcase A - Tray 1',
      item_type = 'RETAIL_SINGLE',
      pieces = 1,
      cost_price = 0,
      notes = ''
    } = req.body;

    if (!title || !category || !metal_type || !purity || !gross_weight) {
      return res.status(400).json({ success: false, error: 'Title, Category, Metal, Purity, and Gross Weight are required' });
    }

    const gWeight = parseFloat(gross_weight);
    const sWeight = parseFloat(stone_weight) || 0;
    const nWeight = Math.max(0, parseFloat((gWeight - sWeight).toFixed(3)));

    // Derive Touch %
    let touchPct = 91.6;
    if (purity.includes('24K')) touchPct = 99.9;
    else if (purity.includes('22K')) touchPct = 91.6;
    else if (purity.includes('18K')) touchPct = 75.0;
    else if (purity.includes('14K')) touchPct = 58.5;
    else if (purity.includes('999')) touchPct = 99.9;
    else if (purity.includes('925')) touchPct = 92.5;

    const fineMetalWeight = parseFloat(((nWeight * touchPct) / 100).toFixed(3));

    // Generate unique SKU & Barcode
    const prefix = item_type === 'WHOLESALE_LOT' ? 'WS-LOT' : (metal_type === 'Gold' ? 'JW-GLD' : (metal_type === 'Silver' ? 'JW-SLV' : 'JW-DIA'));
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sku = req.body.sku || `${prefix}-${Date.now().toString().slice(-4)}${randomSuffix}`;
    const barcode = req.body.barcode || `${Math.floor(1000000 + Math.random() * 9000000)}`;
    const finalHuid = huid || (item_type === 'RETAIL_SINGLE' ? `HUID${touchPct.toString().replace('.', '')}${Math.random().toString(36).substring(2, 6).toUpperCase()}` : '');

    const insertStmt = db.prepare(`
      INSERT INTO products (
        sku, barcode, title, category, metal_type, purity, gross_weight, net_weight,
        stone_weight, stone_type, stone_cents, stone_price, wastage_pct, making_charge_type,
        making_charge_value, huid, counter_tray, item_type, pieces, touch_pct, fine_metal_weight,
        status, cost_price, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      sku, barcode, title, category, metal_type, purity, gWeight, nWeight,
      sWeight, stone_type, parseFloat(stone_cents) || 0, parseFloat(stone_price) || 0,
      parseFloat(wastage_pct) || 0, making_charge_type, parseFloat(making_charge_value) || 0,
      finalHuid, counter_tray, item_type, parseInt(pieces) || 1, touchPct, fineMetalWeight,
      'IN_STOCK', parseFloat(cost_price) || 0, notes
    );

    // Record Inward in Stock Ledger
    db.prepare(`
      INSERT INTO stock_ledger (product_id, sku, title, movement_type, gross_weight, net_weight, reference_id, reference_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      result.lastInsertRowid,
      sku,
      title,
      'IN_PURCHASE',
      gWeight,
      nWeight,
      `ADD-${result.lastInsertRowid}`,
      'MANUAL_INWARD',
      `Added ${item_type === 'WHOLESALE_LOT' ? 'Wholesale Lot' : 'Retail Piece'} to ${counter_tray}`
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, product: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      counter_tray,
      making_charge_type,
      making_charge_value,
      stone_price,
      status,
      notes
    } = req.body;

    const stmt = db.prepare(`
      UPDATE products SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        counter_tray = COALESCE(?, counter_tray),
        making_charge_type = COALESCE(?, making_charge_type),
        making_charge_value = COALESCE(?, making_charge_value),
        stone_price = COALESCE(?, stone_price),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `);

    const result = stmt.run(
      title, category, counter_tray, making_charge_type,
      making_charge_value !== undefined ? parseFloat(making_charge_value) : null,
      stone_price !== undefined ? parseFloat(stone_price) : null,
      status, notes, id
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ success: true, product: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProduct = (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    db.prepare(`
      INSERT INTO stock_ledger (product_id, sku, title, movement_type, gross_weight, net_weight, reference_id, reference_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, item.sku, item.title, 'OUT_RETURN', item.gross_weight, item.net_weight, `DEL-${id}`, 'STOCK_DELETE', 'Removed from stock catalog');

    res.json({ success: true, message: 'Product removed from stock' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInventoryStats = (req, res) => {
  try {
    const inStock = db.prepare("SELECT * FROM products WHERE status = 'IN_STOCK'").all();
    const rates = db.prepare('SELECT metal, purity, rate_per_gram FROM metal_rates').all();

    const rateMap = {};
    rates.forEach(r => {
      rateMap[`${r.metal}_${r.purity}`] = r.rate_per_gram;
    });

    let totalGoldGrams = 0;
    let totalFineGoldGrams = 0;
    let totalSilverGrams = 0;
    let totalDiamondCarats = 0;
    let totalStockValuation = 0;
    let retailItemsCount = 0;
    let wholesaleLotsCount = 0;

    const categoryBreakdown = {};
    const metalBreakdown = { Gold: 0, Silver: 0, Diamond: 0, Platinum: 0 };

    inStock.forEach(item => {
      const rate = rateMap[`${item.metal_type}_${item.purity}`] || 6000;
      const metalVal = item.net_weight * rate;
      const makingVal = item.making_charge_type === 'FIXED' ? item.making_charge_value : (item.net_weight * item.making_charge_value);
      const stoneVal = item.stone_price || 0;
      const itemEstVal = metalVal + makingVal + stoneVal;

      totalStockValuation += itemEstVal;

      if (item.metal_type === 'Gold') {
        totalGoldGrams += item.gross_weight;
        totalFineGoldGrams += item.fine_metal_weight;
        metalBreakdown.Gold += item.gross_weight;
      } else if (item.metal_type === 'Silver') {
        totalSilverGrams += item.gross_weight;
        metalBreakdown.Silver += item.gross_weight;
      }

      if (item.stone_type && item.stone_type.includes('Diamond')) {
        totalDiamondCarats += (item.stone_cents || 0) / 100;
      }

      if (item.item_type === 'WHOLESALE_LOT') {
        wholesaleLotsCount++;
      } else {
        retailItemsCount++;
      }

      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        total_items: inStock.length,
        retail_pieces: retailItemsCount,
        wholesale_lots: wholesaleLotsCount,
        gold_gross_weight_grams: parseFloat(totalGoldGrams.toFixed(2)),
        gold_fine_weight_grams: parseFloat(totalFineGoldGrams.toFixed(2)),
        silver_weight_grams: parseFloat(totalSilverGrams.toFixed(2)),
        diamond_carats: parseFloat(totalDiamondCarats.toFixed(2)),
        total_stock_valuation_inr: Math.round(totalStockValuation),
        category_breakdown: categoryBreakdown,
        metal_breakdown: metalBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
