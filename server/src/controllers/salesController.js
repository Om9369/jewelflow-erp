import { SalesInvoice, Product, StockLedger, Customer } from '../models/index.js';

export const createRetailInvoice = async (req, res) => {
  try {
    const data = req.body;
    const invNo = data.invoice_no || `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice = await SalesInvoice.create({
      ...data,
      invoice_no: invNo,
      type: 'RETAIL_TAX_INVOICE',
      status: 'PAID'
    });

    // Mark products as SOLD and update stock ledger
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (item.product_id || item.id || item.sku) {
          await Product.updateOne(
            { $or: [{ _id: item.product_id || item.id }, { sku: item.sku }] },
            { status: 'SOLD' }
          );
        }

        await StockLedger.create({
          product_id: item.product_id || item.id,
          sku: item.sku || '',
          title: item.title,
          category: item.category || '',
          movement_type: 'OUT_SALE',
          gross_weight: item.gross_weight || 0,
          net_weight: item.net_weight || 0,
          reference_id: invNo,
          reference_type: 'RETAIL_TAX_INVOICE',
          notes: `Billed to ${data.customer_name}`
        });
      }
    }

    // Update customer total purchases
    if (data.customer_id || data.customer_phone) {
      await Customer.updateOne(
        { $or: [{ _id: data.customer_id }, { phone: data.customer_phone }] },
        { $inc: { loyalty_points: Math.round(data.total_amount / 1000) } }
      );
    }

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createWholesaleChallan = async (req, res) => {
  try {
    const data = req.body;
    const challanNo = data.invoice_no || `WS-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice = await SalesInvoice.create({
      ...data,
      invoice_no: challanNo,
      type: 'WHOLESALE_CHALLAN',
      status: 'PAID'
    });

    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (item.product_id || item.id || item.sku) {
          await Product.updateOne(
            { $or: [{ _id: item.product_id || item.id }, { sku: item.sku }] },
            { status: 'SOLD' }
          );
        }

        await StockLedger.create({
          product_id: item.product_id || item.id,
          sku: item.sku || '',
          title: item.title,
          category: item.category || '',
          movement_type: 'OUT_WHOLESALE',
          gross_weight: item.gross_weight || 0,
          net_weight: item.net_weight || 0,
          reference_id: challanNo,
          reference_type: 'WHOLESALE_CHALLAN',
          notes: `Wholesale issue to ${data.customer_name}`
        });
      }
    }

    res.status(201).json({ success: true, invoice });
  } catch (error) {
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
    const invoice = await SalesInvoice.findOne({
      $or: [{ _id: id }, { invoice_no: id }]
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
