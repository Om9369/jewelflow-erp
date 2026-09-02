import mongoose from 'mongoose';
import { SalesInvoice, Product, StockLedger, Customer, Employee, OldGoldTransaction } from '../models/index.js';

export const createRetailInvoice = async (req, res) => {
  try {
    const data = req.body;
    const invNo = data.invoice_no || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Resolve employee name
    let empName = data.employee_name;
    if (!empName && data.employee_id) {
      const empQuery = mongoose.isValidObjectId(data.employee_id) ? { _id: data.employee_id } : { id: data.employee_id };
      const emp = await Employee.findOne(empQuery);
      if (emp) empName = emp.name;
    }
    if (!empName) empName = 'Showroom Sales Staff';

    // Calculate totals if not provided
    const items = data.items || [];
    let subtotal = data.subtotal;
    let makingCharges = data.making_charges || 0;
    let stoneCharges = data.stone_charges || 0;

    if (subtotal === undefined || subtotal === null) {
      subtotal = 0;
      items.forEach(it => {
        const metal = (Number(it.net_weight || it.gross_weight) || 0) * (Number(it.metal_rate || it.metal_rate_applied) || 6750);
        const making = Number(it.making_charge) || 0;
        const stone = Number(it.stone_price) || 0;
        subtotal += (metal + making + stone);
        makingCharges += making;
        stoneCharges += stone;
      });
    }

    const discount = Number(data.discount) || 0;
    const taxRate = data.tax_rate !== undefined ? Number(data.tax_rate) : (data.payment_mode === 'CASH' ? 0 : 3);
    const taxable = Math.max(0, subtotal - discount);
    const taxAmount = data.tax_amount !== undefined ? Number(data.tax_amount) : parseFloat(((taxable * taxRate) / 100).toFixed(2));
    const oldGoldDed = data.old_gold?.total_valuation || Number(data.old_gold_deduction) || 0;
    const totalAmount = data.total_amount !== undefined ? Number(data.total_amount) : Math.max(0, Math.round(taxable + taxAmount - oldGoldDed));

    const invoice = await SalesInvoice.create({
      invoice_no: invNo,
      type: 'RETAIL_TAX_INVOICE',
      customer_id: data.customer_id,
      customer_name: data.customer_name || 'Walk-in Customer',
      customer_phone: data.customer_phone || '',
      employee_id: data.employee_id,
      employee_name: empName,
      subtotal: Math.round(subtotal),
      making_charges: Math.round(makingCharges),
      stone_charges: Math.round(stoneCharges),
      old_gold_deduction: Math.round(oldGoldDed),
      discount: Math.round(discount),
      tax_amount: Math.round(taxAmount),
      total_amount: Math.round(totalAmount),
      payment_mode: data.payment_mode || 'CASH',
      status: 'PAID',
      items: items.map(it => ({
        product_id: it.product_id || it._id || it.id,
        sku: it.sku || '',
        title: it.title || 'Gold Jewellery Item',
        category: it.category || 'Jewellery',
        metal_type: it.metal_type || 'Gold',
        purity: it.purity || '22K (916)',
        gross_weight: Number(it.gross_weight) || 0,
        net_weight: Number(it.net_weight) || 0,
        stone_weight: Number(it.stone_weight) || 0,
        metal_rate_applied: Number(it.metal_rate || it.metal_rate_applied) || 6750,
        making_charge: Number(it.making_charge) || 0,
        stone_price: Number(it.stone_price) || 0,
        total_item_price: Number(it.total_item_price) || 0,
        pieces: Number(it.pieces) || 1
      })),
      notes: data.notes || '',
      created_at: new Date()
    });

    // Mark products as SOLD & record stock ledger
    for (const item of items) {
      const prodKey = item.product_id || item._id || item.id;
      const sku = item.sku;
      if (prodKey && mongoose.isValidObjectId(prodKey)) {
        await Product.updateOne({ _id: prodKey }, { status: 'SOLD' });
      } else if (sku) {
        await Product.updateOne({ sku: sku }, { status: 'SOLD' });
      }

      await StockLedger.create({
        product_id: prodKey,
        sku: item.sku || '',
        title: item.title || 'Sold Jewellery Item',
        category: item.category || 'Jewellery',
        movement_type: 'OUT_SALE',
        gross_weight: Number(item.gross_weight) || 0,
        net_weight: Number(item.net_weight) || 0,
        reference_id: invNo,
        reference_type: 'RETAIL_TAX_INVOICE',
        notes: `Billed to ${data.customer_name || 'Customer'}`
      });
    }

    // If Old Gold was part of transaction, record it
    if (data.old_gold && oldGoldDed > 0) {
      const og = data.old_gold;
      const ogReceipt = `OG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      await OldGoldTransaction.create({
        receipt_no: ogReceipt,
        customer_name: data.customer_name || 'Walk-in Customer',
        customer_phone: data.customer_phone || '',
        gross_weight: Number(og.gross_weight) || 0,
        stone_dust_deduction: Number(og.stone_dust_deduction) || 0,
        net_weight: Number(og.net_weight) || 0,
        purity_touch_pct: Number(og.purity_touch_pct) || 87.5,
        fine_gold_weight: Number(og.fine_gold_weight) || 0,
        valuation_rate_per_gram: Number(og.valuation_rate || og.valuation_rate_per_gram) || 6250,
        total_valuation: Math.round(oldGoldDed),
        settlement_mode: 'INVOICE_CREDIT',
        linked_invoice_no: invNo,
        notes: `Old gold adjusted against invoice ${invNo}`
      });
    }

    // Update customer loyalty points
    if (data.customer_id && mongoose.isValidObjectId(data.customer_id)) {
      await Customer.updateOne({ _id: data.customer_id }, { $inc: { loyalty_points: Math.round(totalAmount / 1000) } });
    } else if (data.customer_phone) {
      await Customer.updateOne({ phone: data.customer_phone }, { $inc: { loyalty_points: Math.round(totalAmount / 1000) } });
    }

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error('Error creating retail invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createWholesaleChallan = async (req, res) => {
  try {
    const data = req.body;
    const challanNo = data.invoice_no || `WS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    let empName = data.employee_name;
    if (!empName && data.employee_id) {
      const empQuery = mongoose.isValidObjectId(data.employee_id) ? { _id: data.employee_id } : { id: data.employee_id };
      const emp = await Employee.findOne(empQuery);
      if (emp) empName = emp.name;
    }
    if (!empName) empName = 'Wholesale Agent';

    const items = data.items || [];
    let subtotal = data.subtotal || 0;
    if (!subtotal) {
      items.forEach(it => {
        subtotal += ((Number(it.net_weight) || 0) * (Number(it.metal_rate) || 6750) + (Number(it.making_charge) || 0));
      });
    }
    const totalAmount = data.total_amount || data.cash_paid || subtotal;

    const invoice = await SalesInvoice.create({
      invoice_no: challanNo,
      type: 'WHOLESALE_CHALLAN',
      customer_id: data.customer_id,
      customer_name: data.customer_name || 'B2B Client',
      customer_phone: data.customer_phone || '',
      employee_id: data.employee_id,
      employee_name: empName,
      subtotal: Math.round(subtotal),
      making_charges: Math.round(data.making_charges || 0),
      stone_charges: 0,
      old_gold_deduction: 0,
      discount: 0,
      tax_amount: 0,
      total_amount: Math.round(totalAmount),
      fine_gold_settlement_grams: Number(data.fine_gold_settled) || 0,
      cash_paid: Number(data.cash_paid) || 0,
      payment_mode: data.payment_mode || 'FINE_GOLD_PLUS_MAKING',
      status: 'PAID',
      items: items.map(it => ({
        product_id: it.product_id || it._id || it.id,
        sku: it.sku || '',
        title: it.title || 'Wholesale Lot',
        category: it.category || 'Wholesale Lot',
        metal_type: it.metal_type || 'Gold',
        purity: it.purity || '22K (916)',
        gross_weight: Number(it.gross_weight) || 0,
        net_weight: Number(it.net_weight) || 0,
        stone_weight: 0,
        metal_rate_applied: Number(it.metal_rate) || 6750,
        making_charge: Number(it.making_charge) || 0,
        stone_price: 0,
        total_item_price: Math.round((Number(it.net_weight) || 0) * (Number(it.metal_rate) || 6750) + (Number(it.making_charge) || 0)),
        pieces: Number(it.pieces) || 1
      })),
      notes: data.notes || '',
      created_at: new Date()
    });

    for (const item of items) {
      const prodKey = item.product_id || item._id || item.id;
      const sku = item.sku;
      if (prodKey && mongoose.isValidObjectId(prodKey)) {
        await Product.updateOne({ _id: prodKey }, { status: 'SOLD' });
      } else if (sku) {
        await Product.updateOne({ sku: sku }, { status: 'SOLD' });
      }

      await StockLedger.create({
        product_id: prodKey,
        sku: item.sku || '',
        title: item.title || 'Wholesale Lot',
        category: item.category || 'Wholesale',
        movement_type: 'OUT_WHOLESALE',
        gross_weight: Number(item.gross_weight) || 0,
        net_weight: Number(item.net_weight) || 0,
        reference_id: challanNo,
        reference_type: 'WHOLESALE_CHALLAN',
        notes: `Wholesale issue to ${data.customer_name || 'Party'}`
      });
    }

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error('Error creating wholesale challan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const { type, search } = req.query;
    const filter = {};
    if (type && type !== 'ALL') filter.type = type;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { invoice_no: regex },
        { customer_name: regex },
        { customer_phone: regex }
      ];
    }

    const invoices = await SalesInvoice.find(filter).sort({ created_at: -1 });
    res.json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { invoice_no: id };
    const invoice = await SalesInvoice.findOne(query);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
