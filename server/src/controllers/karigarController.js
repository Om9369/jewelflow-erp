import db from '../database.js';

export const getKarigarOrders = (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM karigar_orders';
    const params = [];

    if (status && status !== 'ALL') {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params);

    // Summary of total raw gold with karigars
    const pendingOrders = db.prepare("SELECT * FROM karigar_orders WHERE status = 'IN_PROGRESS'").all();
    const totalGoldWithKarigars = pendingOrders.reduce((sum, o) => sum + (o.raw_metal_weight || 0), 0);

    res.json({
      success: true,
      count: orders.length,
      orders,
      summary: {
        active_orders: pendingOrders.length,
        total_metal_weight_issued: parseFloat(totalGoldWithKarigars.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createKarigarOrder = (req, res) => {
  try {
    const {
      karigar_name,
      karigar_phone,
      due_date,
      raw_metal_type = 'Gold Bullion',
      raw_metal_purity = '24K (999)',
      raw_metal_weight,
      expected_item_type,
      expected_pieces = 1,
      agreed_wastage_pct = 1.2,
      notes = ''
    } = req.body;

    if (!karigar_name || !raw_metal_weight || !expected_item_type) {
      return res.status(400).json({ success: false, error: 'Karigar name, Raw metal weight, and Expected item type are required' });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const orderNo = `KG-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

    const stmt = db.prepare(`
      INSERT INTO karigar_orders (
        order_no, karigar_name, karigar_phone, issue_date, due_date,
        raw_metal_type, raw_metal_purity, raw_metal_weight, expected_item_type,
        expected_pieces, agreed_wastage_pct, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      orderNo, karigar_name, karigar_phone || '', dateStr, due_date || '',
      raw_metal_type, raw_metal_purity, parseFloat(raw_metal_weight), expected_item_type,
      parseInt(expected_pieces) || 1, parseFloat(agreed_wastage_pct) || 1.2, 'IN_PROGRESS', notes
    );

    // Record stock ledger outward (raw metal issued)
    db.prepare(`
      INSERT INTO stock_ledger (sku, title, movement_type, gross_weight, net_weight, reference_id, reference_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNo, `Raw Metal issued to ${karigar_name}`, 'OUT_KARIGAR_ISSUE',
      parseFloat(raw_metal_weight), parseFloat(raw_metal_weight), orderNo, 'KARIGAR_WORK_ORDER',
      `Issued ${raw_metal_weight}g for manufacturing ${expected_pieces} pcs ${expected_item_type}`
    );

    const order = db.prepare('SELECT * FROM karigar_orders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const receiveKarigarOrder = (req, res) => {
  try {
    const { id } = req.params;
    const {
      received_weight,
      received_pieces,
      notes,
      auto_add_inventory = true,
      category = 'Necklaces',
      purity = '22K (916)',
      making_charge_value = 500,
      counter_tray = 'Showcase A - Tray 1'
    } = req.body;

    const order = db.prepare('SELECT * FROM karigar_orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const recWeight = parseFloat(received_weight);
    const recPieces = parseInt(received_pieces) || order.expected_pieces;
    const issuedWeight = order.raw_metal_weight;
    const wastageAllowed = (issuedWeight * order.agreed_wastage_pct) / 100;
    const expectedReturn = issuedWeight - wastageAllowed;
    const balanceDiff = parseFloat((recWeight - expectedReturn).toFixed(3));

    db.prepare(`
      UPDATE karigar_orders SET
        received_weight = ?,
        received_pieces = ?,
        status = 'COMPLETED',
        fine_gold_balance_diff = ?,
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(recWeight, recPieces, balanceDiff, notes || order.notes, id);

    // Record Inward in Stock Ledger
    db.prepare(`
      INSERT INTO stock_ledger (sku, title, movement_type, gross_weight, net_weight, reference_id, reference_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order.order_no, `Finished ${order.expected_item_type} from ${order.karigar_name}`, 'IN_KARIGAR',
      recWeight, recWeight, order.order_no, 'KARIGAR_RECEIPT',
      `Received ${recPieces} pcs (${recWeight}g), Wastage accounted ${wastageAllowed.toFixed(2)}g`
    );

    // Optionally auto-create inventory product ready for tagging
    if (auto_add_inventory) {
      const sku = `JW-KG-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
      const barcode = `${Math.floor(1000000 + Math.random() * 9000000)}`;
      const huid = `HUID916K${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      db.prepare(`
        INSERT INTO products (
          sku, barcode, title, category, metal_type, purity, gross_weight, net_weight,
          stone_weight, stone_type, stone_cents, stone_price, wastage_pct, making_charge_type,
          making_charge_value, huid, counter_tray, item_type, pieces, touch_pct, fine_metal_weight,
          status, cost_price, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sku, barcode, `${order.expected_item_type} (Karigar: ${order.karigar_name})`,
        category, 'Gold', purity, recWeight, recWeight, 0, 'None', 0, 0,
        order.agreed_wastage_pct, 'PER_GRAM', making_charge_value, huid, counter_tray,
        'RETAIL_SINGLE', recPieces, 91.6, parseFloat(((recWeight * 0.916).toFixed(3))),
        'IN_STOCK', Math.round(recWeight * 6200), `Crafted by ${order.karigar_name}, Job Order ${order.order_no}`
      );
    }

    const updated = db.prepare('SELECT * FROM karigar_orders WHERE id = ?').get(id);
    res.json({ success: true, order: updated, message: 'Finished goods received and accounted in stock successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
