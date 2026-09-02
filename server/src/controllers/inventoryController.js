import mongoose from 'mongoose';
import { Product, MetalRate, StockLedger } from '../models/index.js';

export const getInventory = async (req, res) => {
  try {
    const { category, metal_type, purity, status, search, item_type } = req.query;
    const filter = {};

    if (category && category !== 'ALL') filter.category = category;
    if (metal_type && metal_type !== 'ALL') filter.metal_type = metal_type;
    if (purity && purity !== 'ALL') filter.purity = purity;
    if (item_type && item_type !== 'ALL') filter.item_type = item_type;
    if (status && status !== 'ALL') filter.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { title: regex },
        { sku: regex },
        { barcode: regex },
        { huid: regex }
      ];
    }

    const products = await Product.find(filter).sort({ created_at: -1 });
    res.json({
      success: true,
      count: products.length,
      products,
      items: products
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInventoryStats = async (req, res) => {
  try {
    const inStock = await Product.find({ status: 'IN_STOCK' });
    const rates = await MetalRate.find();
    const rateMap = {};
    rates.forEach(r => { rateMap[`${r.metal}_${r.purity}`] = r.rate_per_gram; });

    let totalVal = 0;
    let totalGross = 0;
    let totalNet = 0;
    let totalGold = 0;
    let totalSilver = 0;
    let totalFine = 0;

    inStock.forEach(p => {
      const r = rateMap[`${p.metal_type}_${p.purity}`] || 6750;
      const metal = (p.net_weight || 0) * r;
      const making = p.making_charge_type === 'FIXED' ? (p.making_charge_value || 0) : ((p.net_weight || 0) * (p.making_charge_value || 0));
      totalVal += (metal + making + (p.stone_price || 0));
      totalGross += (p.gross_weight || 0);
      totalNet += (p.net_weight || 0);
      if (p.metal_type === 'Gold') {
        totalGold += (p.gross_weight || 0);
        totalFine += (p.fine_metal_weight || ((p.net_weight || 0) * 0.916));
      } else if (p.metal_type === 'Silver') {
        totalSilver += (p.gross_weight || 0);
      }
    });

    res.json({
      success: true,
      stats: {
        total_items: inStock.length,
        total_gross_weight: parseFloat(totalGross.toFixed(3)),
        total_net_weight: parseFloat(totalNet.toFixed(3)),
        total_valuation: Math.round(totalVal),
        gold_gross_weight: parseFloat(totalGold.toFixed(3)),
        gold_fine_weight: parseFloat(totalFine.toFixed(3)),
        silver_gross_weight: parseFloat(totalSilver.toFixed(3)),
        in_stock_count: inStock.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { $or: [{ sku: id }, { barcode: id }] };
    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const data = req.body;
    const sku = data.sku || `JW-${(data.metal_type || 'GLD').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const barcode = data.barcode || Math.floor(10000000 + Math.random() * 90000000).toString();
    const grossWt = parseFloat(data.gross_weight) || 0;
    const stoneWt = parseFloat(data.stone_weight) || 0;
    const netWt = Math.max(0, grossWt - stoneWt);
    const touch = parseFloat(data.touch_pct) || 91.6;
    const fineWt = parseFloat(((netWt * touch) / 100).toFixed(3));

    const product = await Product.create({
      ...data,
      sku,
      barcode,
      gross_weight: grossWt,
      net_weight: netWt,
      stone_weight: stoneWt,
      touch_pct: touch,
      fine_metal_weight: fineWt,
      status: 'IN_STOCK'
    });

    // Ledger entry
    await StockLedger.create({
      product_id: product._id,
      sku,
      title: product.title,
      category: product.category,
      movement_type: 'IN_PURCHASE',
      gross_weight: grossWt,
      net_weight: netWt,
      reference_id: sku,
      reference_type: 'INWARD_BARCODE_TAG',
      notes: `Tagged new jewellery item: ${product.title}`
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.gross_weight || data.stone_weight) {
      const grossWt = parseFloat(data.gross_weight) || 0;
      const stoneWt = parseFloat(data.stone_weight) || 0;
      data.net_weight = Math.max(0, grossWt - stoneWt);
    }

    const query = mongoose.isValidObjectId(id) ? { _id: id } : { sku: id };
    const updated = await Product.findOneAndUpdate(query, data, { new: true });

    res.json({ success: true, product: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { sku: id };
    await Product.findOneAndDelete(query);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
