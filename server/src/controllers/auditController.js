import { Product, TrayAudit } from '../models/index.js';

export const getTrayList = async (req, res) => {
  try {
    const inStock = await Product.find({ status: 'IN_STOCK' });
    const trayMap = {};

    inStock.forEach(item => {
      const tray = item.counter_tray || 'Showcase Main Tray';
      if (!trayMap[tray]) {
        trayMap[tray] = {
          tray_name: tray,
          counter_tray: tray,
          category: item.category || 'All',
          metal_type: item.metal_type || 'Gold',
          items_count: 0,
          total_gross_weight: 0,
          total_net_weight: 0,
          categories: {},
          metals: {},
          items: []
        };
      }
      trayMap[tray].items_count += 1;
      trayMap[tray].total_gross_weight += (item.gross_weight || 0);
      trayMap[tray].total_net_weight += (item.net_weight || 0);
      trayMap[tray].categories[item.category] = (trayMap[tray].categories[item.category] || 0) + 1;
      trayMap[tray].metals[item.metal_type] = (trayMap[tray].metals[item.metal_type] || 0) + 1;
      trayMap[tray].items.push(item);
    });

    const trays = Object.values(trayMap).map(t => ({
      ...t,
      total_gross_weight: parseFloat(t.total_gross_weight.toFixed(3)),
      total_net_weight: parseFloat(t.total_net_weight.toFixed(3))
    }));

    res.json({
      success: true,
      count: trays.length,
      trays: trays
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAuditHistory = async (req, res) => {
  try {
    const audits = await TrayAudit.find().sort({ created_at: -1 });
    res.json({ success: true, count: audits.length, audits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitTrayAudit = async (req, res) => {
  try {
    const {
      tray_name,
      category = 'All',
      metal_type = 'Gold',
      physical_items_count,
      physical_total_weight,
      audited_by = 'Store Auditor',
      notes = ''
    } = req.body;

    const inStock = await Product.find({
      status: 'IN_STOCK',
      counter_tray: tray_name
    });

    const systemItemsCount = inStock.length;
    const systemTotalWeight = inStock.reduce((sum, item) => sum + (item.gross_weight || 0), 0);

    const pCount = parseInt(physical_items_count) || 0;
    const pWeight = parseFloat(physical_total_weight) || 0;

    const diffPieces = pCount - systemItemsCount;
    const diffWeight = parseFloat((pWeight - systemTotalWeight).toFixed(3));
    const status = (diffPieces === 0 && Math.abs(diffWeight) < 0.05) ? 'RECONCILED' : 'DISCREPANCY_DETECTED';

    const audit = await TrayAudit.create({
      tray_name,
      category,
      metal_type,
      system_items_count: systemItemsCount,
      system_total_weight: parseFloat(systemTotalWeight.toFixed(3)),
      physical_items_count: pCount,
      physical_total_weight: pWeight,
      variance_pieces: diffPieces,
      variance_weight: diffWeight,
      audited_by,
      notes,
      status
    });

    res.status(201).json({
      success: true,
      audit,
      variance: {
        system_pieces: systemItemsCount,
        physical_pieces: pCount,
        variance_pieces: diffPieces,
        system_weight_grams: parseFloat(systemTotalWeight.toFixed(3)),
        physical_weight_grams: pWeight,
        variance_weight: diffWeight,
        status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
