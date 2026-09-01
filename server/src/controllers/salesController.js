import db from '../database.js';

export const createRetailInvoice = (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_id,
      employee_id,
      items, // array of { product_id, sku, title, category, metal_type, purity, gross_weight, net_weight, stone_weight, metal_rate, making_charge, stone_price, total_item_price, pieces }
      old_gold, // optional { gross_weight, stone_dust_deduction, net_weight, purity_touch_pct, fine_gold_weight, valuation_rate, total_valuation }
      discount = 0,
      payment_mode = 'CASH',
      tax_rate = 3, // standard 3% GST on jewellery
      notes = ''
    } = req.body;

    if (!customer_name || !employee_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Customer name, Sales Employee, and at least one item are required' });
    }

    const employee = db.prepare('SELECT id, name FROM employees WHERE id = ?').get(employee_id);
    if (!employee) {
      return res.status(400).json({ success: false, error: 'Valid employee is required for sales attribution' });
    }

    // Generate unique invoice number
    const now = new Date().toISOString();
    const dateStr = now.slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = `INV-${dateStr}-${randCode}`;

    let subtotalMetal = 0;
    let totalMaking = 0;
    let totalStones = 0;

    items.forEach(item => {
      const metalVal = (item.net_weight || 0) * (item.metal_rate || item.metal_rate_applied || item.rate || 0);
      subtotalMetal += metalVal;
      totalMaking += (item.making_charge || 0);
      totalStones += (item.stone_price || 0);
    });

    const subtotal = subtotalMetal + totalMaking + totalStones;
    const oldGoldDeduction = old_gold ? (parseFloat(old_gold.total_valuation) || 0) : 0;
    const discountVal = parseFloat(discount) || 0;
    const taxableAmount = Math.max(0, subtotal - discountVal);
    const taxAmount = payment_mode === 'CASH' ? 0 : parseFloat(((taxableAmount * tax_rate) / 100).toFixed(2));
    const totalAmount = Math.max(0, parseFloat((taxableAmount + taxAmount - oldGoldDeduction).toFixed(2)));

    // Auto-resolve or register customer in database directory
    let effectiveCustomerId = customer_id || null;
    const cleanPhone = (customer_phone || '').trim();
    const cleanCustomerName = (customer_name || '').trim();

    if (!effectiveCustomerId && cleanPhone) {
      const foundCust = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleanPhone);
      if (foundCust) {
        effectiveCustomerId = foundCust.id;
      } else if (cleanCustomerName && cleanCustomerName !== 'Walk-in Customer') {
        const insCust = db.prepare(`
          INSERT INTO customers (name, phone, email, type, gst_number, pan_card, address, fine_gold_balance, cash_balance, loyalty_points, created_at)
          VALUES (?, ?, '', 'RETAIL_CUSTOMER', '', '', '', 0, 0, 0, ?)
        `).run(cleanCustomerName, cleanPhone, now);
        effectiveCustomerId = insCust.lastInsertRowid;
      }
    } else if (!effectiveCustomerId && cleanCustomerName && cleanCustomerName !== 'Walk-in Customer') {
      const foundCust = db.prepare('SELECT id FROM customers WHERE name = ?').get(cleanCustomerName);
      if (foundCust) {
        effectiveCustomerId = foundCust.id;
      }
    }

    const createTransaction = db.transaction(() => {
      // 1. Create Sales Invoice
      const invStmt = db.prepare(`
        INSERT INTO sales_invoices (
          invoice_no, type, customer_id, customer_name, customer_phone, employee_id, employee_name,
          subtotal, making_charges, stone_charges, old_gold_deduction, discount, tax_amount, total_amount,
          fine_gold_settlement_grams, cash_paid, payment_mode, status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const invResult = invStmt.run(
        invoiceNo, 'RETAIL_SALE', effectiveCustomerId, cleanCustomerName, cleanPhone,
        employee.id, employee.name, subtotal, totalMaking, totalStones, oldGoldDeduction,
        discountVal, taxAmount, totalAmount, 0, totalAmount, payment_mode, 'PAID', notes, now
      );

      const invoiceId = invResult.lastInsertRowid;

      // Update customer loyalty points (1 point per Rs.1000 spent)
      if (effectiveCustomerId) {
        const pointsEarned = Math.max(1, Math.floor(totalAmount / 1000));
        db.prepare('UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?').run(pointsEarned, effectiveCustomerId);
      }

      // 2. Insert Sales Items & Update Products
      const itemStmt = db.prepare(`
        INSERT INTO sales_items (
          invoice_id, product_id, sku, title, category, metal_type, purity,
          gross_weight, net_weight, stone_weight, metal_rate_applied, making_charge,
          stone_price, total_item_price, pieces, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateProdStmt = db.prepare(`
        UPDATE products SET status = 'SOLD' WHERE id = ?
      `);

      const ledgerStmt = db.prepare(`
        INSERT INTO stock_ledger (product_id, sku, title, movement_type, gross_weight, net_weight, reference_id, reference_type, notes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const it of items) {
        const itemPrice = it.total_item_price || it.price || ((it.net_weight || 0) * (it.metal_rate || 0) + (it.making_charge || 0) + (it.stone_price || 0));
        itemStmt.run(
          invoiceId, it.product_id || it.id || null, it.sku || 'SKU-CUSTOM', it.title,
          it.category || 'General', it.metal_type || 'Gold', it.purity || '22K (916)',
          it.gross_weight || it.net_weight || 0, it.net_weight || 0,
          it.stone_weight || 0, it.metal_rate || it.metal_rate_applied || it.rate || 0,
          it.making_charge || 0, it.stone_price || 0, itemPrice, it.pieces || 1, now
        );

        const prodId = it.product_id || it.id;
        if (prodId) {
          updateProdStmt.run(prodId);
          ledgerStmt.run(
            prodId, it.sku || '', it.title, 'OUT_RETAIL_SALE',
            it.gross_weight || 0, it.net_weight || 0, invoiceNo, 'RETAIL_INVOICE',
            `Sold by ${employee.name} to ${customer_name}`, now
          );
        }
      }

      // 3. Record Old Gold if provided
      if (old_gold && oldGoldDeduction > 0) {
        const ogReceiptNo = `OG-${dateStr}-${randCode}`;
        db.prepare(`
          INSERT INTO old_gold_transactions (
            receipt_no, customer_name, customer_phone, gross_weight, stone_dust_deduction,
            net_weight, purity_touch_pct, fine_gold_weight, valuation_rate_per_gram, total_valuation,
            settlement_mode, linked_invoice_no, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          ogReceiptNo, customer_name, customer_phone || '', old_gold.gross_weight,
          old_gold.stone_dust_deduction || 0, old_gold.net_weight, old_gold.purity_touch_pct,
          old_gold.fine_gold_weight, old_gold.valuation_rate, oldGoldDeduction,
          'INVOICE_CREDIT', invoiceNo, `Exchanged against invoice ${invoiceNo}`, now
        );

        // Record old gold stock inward
        ledgerStmt.run(
          null, ogReceiptNo, 'Customer Old Gold Scrap', 'IN_OLD_GOLD',
          old_gold.gross_weight, old_gold.net_weight, invoiceNo, 'OLD_GOLD_EXCHANGE',
          `Received ${old_gold.net_weight}g (${old_gold.purity_touch_pct}% touch) from ${customer_name}`, now
        );
      }

      return invoiceId;
    });

    const invoiceId = createTransaction();
    const invoice = getFullInvoice(invoiceId);

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error('createRetailInvoice error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createWholesaleChallan = (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      customer_phone,
      employee_id,
      items, // array of lots / items
      fine_gold_settled = 0,
      cash_paid = 0,
      payment_mode = 'FINE_GOLD_PLUS_MAKING',
      notes = ''
    } = req.body;

    if (!customer_name || !employee_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Party Name, Wholesale Agent, and items are required' });
    }

    const employee = db.prepare('SELECT id, name FROM employees WHERE id = ?').get(employee_id);
    const now = new Date().toISOString();
    const dateStr = now.slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const challanNo = `WS-${dateStr}-${randCode}`;

    let subtotal = 0;
    let totalMaking = 0;
    let totalFineGoldGrams = 0;

    items.forEach(it => {
      const metalVal = (it.net_weight || 0) * (it.metal_rate || it.metal_rate_applied || it.rate || 0);
      subtotal += metalVal;
      totalMaking += (it.making_charge || 0);
      const touch = it.touch_pct || 91.6;
      totalFineGoldGrams += ((it.net_weight || 0) * touch) / 100;
    });

    const totalAmount = subtotal + totalMaking;

    const createTransaction = db.transaction(() => {
      const invResult = db.prepare(`
        INSERT INTO sales_invoices (
          invoice_no, type, customer_id, customer_name, customer_phone, employee_id, employee_name,
          subtotal, making_charges, stone_charges, old_gold_deduction, discount, tax_amount, total_amount,
          fine_gold_settlement_grams, cash_paid, payment_mode, status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        challanNo, 'WHOLESALE_CHALLAN', customer_id || null, customer_name, customer_phone || '',
        employee.id, employee.name, subtotal, totalMaking, 0, 0,
        0, 0, totalAmount, parseFloat(fine_gold_settled) || 0,
        parseFloat(cash_paid) || 0, payment_mode, 'PAID', notes, now
      );

      const invoiceId = invResult.lastInsertRowid;

      const itemStmt = db.prepare(`
        INSERT INTO sales_items (
          invoice_id, product_id, sku, title, category, metal_type, purity,
          gross_weight, net_weight, stone_weight, metal_rate_applied, making_charge,
          stone_price, total_item_price, pieces, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateProdStmt = db.prepare("UPDATE products SET status = 'SOLD' WHERE id = ?");
      const ledgerStmt = db.prepare(`
        INSERT INTO stock_ledger (product_id, sku, title, movement_type, gross_weight, net_weight, reference_id, reference_type, notes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const it of items) {
        itemStmt.run(
          invoiceId, it.product_id || it.id || null, it.sku || 'WS-SKU', it.title,
          it.category || 'Wholesale', it.metal_type || 'Gold', it.purity || '22K (916)',
          it.gross_weight || 0, it.net_weight || 0,
          it.stone_weight || 0, it.metal_rate || 0, it.making_charge || 0,
          0, it.total_item_price || (it.net_weight * (it.metal_rate || 0) + (it.making_charge || 0)), it.pieces || 1, now
        );

        const prodId = it.product_id || it.id;
        if (prodId) {
          updateProdStmt.run(prodId);
          ledgerStmt.run(
            prodId, it.sku || '', it.title, 'OUT_WHOLESALE',
            it.gross_weight || 0, it.net_weight || 0, challanNo, 'WHOLESALE_CHALLAN',
            `Dispatched by ${employee.name} to ${customer_name}`, now
          );
        }
      }

      // If B2B Dealer exists, update fine gold balance or cash balance
      if (customer_id) {
        const dealer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
        if (dealer) {
          const fineGoldDiff = totalFineGoldGrams - (parseFloat(fine_gold_settled) || 0);
          const cashDiff = totalMaking - (parseFloat(cash_paid) || 0);
          db.prepare(`
            UPDATE customers SET
              fine_gold_balance = fine_gold_balance + ?,
              cash_balance = cash_balance + ?
            WHERE id = ?
          `).run(fineGoldDiff, cashDiff, customer_id);
        }
      }

      return invoiceId;
    });

    const invoiceId = createTransaction();
    const challan = getFullInvoice(invoiceId);

    res.status(201).json({ success: true, invoice: challan });
  } catch (error) {
    console.error('createWholesaleChallan error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInvoices = (req, res) => {
  try {
    const { type, employee_id, limit = 100, search } = req.query;
    let query = 'SELECT * FROM sales_invoices WHERE 1=1';
    const params = [];

    if (type && type !== 'ALL') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (employee_id && employee_id !== 'ALL') {
      query += ' AND employee_id = ?';
      params.push(employee_id);
    }

    if (search) {
      query += ' AND (invoice_no LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)}`;

    const invoices = db.prepare(query).all(...params);

    // Attach items count and total grams to each invoice header
    const enriched = invoices.map(inv => {
      const items = db.prepare('SELECT * FROM sales_items WHERE invoice_id = ?').all(inv.id);
      const totalGrossGrams = items.reduce((acc, it) => acc + (it.gross_weight || 0), 0);
      const totalNetGrams = items.reduce((acc, it) => acc + (it.net_weight || 0), 0);
      return {
        ...inv,
        item_count: items.length,
        total_gross_grams: parseFloat(totalGrossGrams.toFixed(3)),
        total_net_grams: parseFloat(totalNetGrams.toFixed(3)),
        items: items
      };
    });

    res.json({ success: true, count: enriched.length, invoices: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInvoiceById = (req, res) => {
  try {
    const { id } = req.params;
    const invoice = getFullInvoice(id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

function getFullInvoice(idOrNo) {
  const inv = db.prepare('SELECT * FROM sales_invoices WHERE id = ? OR invoice_no = ?').get(idOrNo, idOrNo);
  if (!inv) return null;

  const items = db.prepare('SELECT * FROM sales_items WHERE invoice_id = ?').all(inv.id);
  const oldGold = db.prepare('SELECT * FROM old_gold_transactions WHERE linked_invoice_no = ?').get(inv.invoice_no);
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(inv.employee_id);

  const totalGrossWeight = items.reduce((acc, it) => acc + (it.gross_weight || 0), 0);
  const totalNetWeight = items.reduce((acc, it) => acc + (it.net_weight || 0), 0);

  return {
    ...inv,
    total_gross_weight: parseFloat(totalGrossWeight.toFixed(3)),
    total_net_weight: parseFloat(totalNetWeight.toFixed(3)),
    items,
    old_gold: oldGold || null,
    employee: employee || null
  };
}
