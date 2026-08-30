import db from '../database.js';

export const getTrayList = (req, res) => {
  try {
    // Group active in-stock products by showcase counter / tray
    const inStock = db.prepare("SELECT * FROM products WHERE status = 'IN_STOCK'").all();
    const trayMap = {};

    inStock.forEach(item => {
      const tray = item.counter_tray || 'General Showcase';
      if (!trayMap[tray]) {
        trayMap[tray] = {
          tray_name: tray,
          items_count: 0,
          total_gross_weight: 0,
          total_net_weight: 0,
          categories: {},
          metals: {},
          items: []
        };
      }

      trayMap[tray].items_count += (item.pieces || 1);
      trayMap[tray].total_gross_weight += item.gross_weight;
      trayMap[tray].total_net_weight += item.net_weight;
      trayMap[tray].categories[item.category] = (trayMap[tray].categories[item.category] || 0) + 1;
      trayMap[tray].metals[item.metal_type] = (trayMap[tray].metals[item.metal_type] || 0) + 1;
      trayMap[tray].items.push(item);
    });

    const trays = Object.values(trayMap).map(t => ({
      ...t,
      total_gross_weight: parseFloat(t.total_gross_weight.toFixed(3)),
      total_net_weight: parseFloat(t.total_net_weight.toFixed(3))
    }));

    res.json({ success: true, count: trays.length, trays });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAuditHistory = (req, res) => {
  try {
    const audits = db.prepare('SELECT * FROM tray_audits ORDER BY created_at DESC LIMIT 50').all();
    res.json({ success: true, count: audits.length, audits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitTrayAudit = (req, res) => {
  try {
    const {
      tray_name,
      category = 'All',
      metal_type = 'Gold',
      physical_items_count,
      physical_total_weight,
      audited_by = 'Store Manager',
      notes = ''
    } = req.body;

    if (!tray_name || physical_items_count === undefined || physical_total_weight === undefined) {
      return res.status(400).json({ success: false, error: 'Tray name, Physical item count, and Physical weight are required' });
    }

    // Calculate system items and weight for this tray
    const itemsInTray = db.prepare("SELECT * FROM products WHERE counter_tray = ? AND status = 'IN_STOCK'").all(tray_name);
    const systemItemsCount = itemsInTray.reduce((sum, it) => sum + (it.pieces || 1), 0);
    const systemTotalWeight = itemsInTray.reduce((sum, it) => sum + (it.gross_weight || 0), 0);

    const physWeight = parseFloat(physical_total_weight);
    const physCount = parseInt(physical_items_count);
    const varianceWeight = parseFloat((physWeight - systemTotalWeight).toFixed(3));
    const isDiscrepant = Math.abs(varianceWeight) > 0.05 || physCount !== systemItemsCount;
    const status = isDiscrepant ? 'DISCREPANCY_DETECTED' : 'RECONCILED';

    const dateStr = new Date().toISOString().slice(0, 10);

    const stmt = db.prepare(`
      INSERT INTO tray_audits (
        audit_date, tray_name, category, metal_type, system_items_count,
        system_total_weight, physical_items_count, physical_total_weight,
        variance_weight, audited_by, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dateStr, tray_name, category, metal_type, systemItemsCount,
      parseFloat(systemTotalWeight.toFixed(3)), physCount, physWeight,
      varianceWeight, audited_by, notes, status
    );

    const createdAudit = db.prepare('SELECT * FROM tray_audits WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      audit: createdAudit,
      variance: {
        weight_difference_grams: varianceWeight,
        count_difference: physCount - systemItemsCount,
        status: status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
