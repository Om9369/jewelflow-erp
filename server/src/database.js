import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, '../jewelflow-data.json');

// In-Memory state with Auto-Persistence
let dataStore = {
  metal_rates: [],
  employees: [],
  customers: [],
  products: [],
  sales_invoices: [],
  sales_items: [],
  stock_ledger: [],
  karigar_orders: [],
  old_gold_transactions: [],
  tray_audits: [],
  auto_ids: {
    metal_rates: 0,
    employees: 0,
    customers: 0,
    products: 0,
    sales_invoices: 0,
    sales_items: 0,
    stock_ledger: 0,
    karigar_orders: 0,
    old_gold_transactions: 0,
    tray_audits: 0
  }
};

function saveToFile() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(dataStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data to file:', err);
  }
}

function loadFromFile() {
  if (fs.existsSync(dbFilePath)) {
    try {
      const raw = fs.readFileSync(dbFilePath, 'utf-8');
      dataStore = JSON.parse(raw);
    } catch (e) {
      console.warn('Could not parse existing data file, initializing fresh store.');
    }
  }
}

// Database helper object mimicking synchronous query interfaces
export const db = {
  data: dataStore,
  save: saveToFile,
  prepare(sql) {
    return {
      all(...params) {
        return executeQuery(sql, params, 'ALL');
      },
      get(...params) {
        return executeQuery(sql, params, 'GET');
      },
      run(...params) {
        return executeQuery(sql, params, 'RUN');
      }
    };
  },
  exec(sql) {
    // No-op for CREATE TABLE, handled natively by store structure
  },
  transaction(fn) {
    return (...args) => {
      const result = fn(...args);
      saveToFile();
      return result;
    };
  }
};

function executeQuery(sql, params, mode) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT metal_rates
  if (cleanSql.includes('SELECT') && cleanSql.includes('metal_rates')) {
    if (cleanSql.includes('COUNT(*)')) {
      return { count: dataStore.metal_rates.length };
    }
    if (cleanSql.includes('WHERE id = ?')) {
      const item = dataStore.metal_rates.find(r => r.id === parseInt(params[0]));
      return item || null;
    }
    let res = [...dataStore.metal_rates];
    res.sort((a, b) => a.id - b.id);
    return mode === 'GET' ? res[0] : res;
  }

  // 2. UPDATE metal_rates
  if (cleanSql.includes('UPDATE metal_rates')) {
    const rate = parseFloat(params[0]);
    const id = parseInt(params[1]);
    const target = dataStore.metal_rates.find(r => r.id === id);
    if (target) {
      target.rate_per_gram = rate;
      target.updated_at = new Date().toISOString();
      saveToFile();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  // 3. SELECT employees
  if (cleanSql.includes('SELECT') && cleanSql.includes('employees')) {
    if (cleanSql.includes('COUNT(*)')) {
      return { count: dataStore.employees.length };
    }
    if (cleanSql.includes('WHERE id = ?')) {
      const emp = dataStore.employees.find(e => e.id === parseInt(params[0]));
      return emp || null;
    }
    return mode === 'GET' ? dataStore.employees[0] : [...dataStore.employees];
  }

  // 4. INSERT INTO employees
  if (cleanSql.includes('INSERT INTO employees')) {
    dataStore.auto_ids.employees++;
    const newEmp = {
      id: dataStore.auto_ids.employees,
      name: params[0],
      email: params[1] || '',
      phone: params[2],
      role: params[3] || 'SALES_EXECUTIVE',
      target_monthly_revenue: parseFloat(params[4]) || 2000000,
      target_monthly_grams: parseFloat(params[5]) || 300,
      commission_rate_pct: parseFloat(params[6]) || 1.0,
      avatar_color: params[7] || '#D97706',
      active: 1,
      created_at: new Date().toISOString()
    };
    dataStore.employees.push(newEmp);
    saveToFile();
    return { lastInsertRowid: newEmp.id, changes: 1 };
  }

  // 5. UPDATE employees
  if (cleanSql.includes('UPDATE employees')) {
    const id = parseInt(params[params.length - 1]);
    const emp = dataStore.employees.find(e => e.id === id);
    if (emp) {
      if (params[0] !== null && params[0] !== undefined) emp.name = params[0];
      if (params[1] !== null && params[1] !== undefined) emp.email = params[1];
      if (params[2] !== null && params[2] !== undefined) emp.phone = params[2];
      if (params[3] !== null && params[3] !== undefined) emp.role = params[3];
      if (params[4] !== null && params[4] !== undefined) emp.target_monthly_revenue = parseFloat(params[4]);
      if (params[5] !== null && params[5] !== undefined) emp.target_monthly_grams = parseFloat(params[5]);
      if (params[6] !== null && params[6] !== undefined) emp.commission_rate_pct = parseFloat(params[6]);
      if (params[7] !== null && params[7] !== undefined) emp.avatar_color = params[7];
      if (params[8] !== null && params[8] !== undefined) emp.active = params[8];
      saveToFile();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  // 6. SELECT customers
  if (cleanSql.includes('SELECT') && cleanSql.includes('customers')) {
    if (cleanSql.includes('COUNT(*)')) {
      return { count: dataStore.customers.length };
    }
    if (cleanSql.includes('WHERE id = ?')) {
      const cust = dataStore.customers.find(c => c.id === parseInt(params[0]));
      return cust || null;
    }
    let res = [...dataStore.customers];
    return mode === 'GET' ? res[0] : res;
  }

  // 7. INSERT INTO customers
  if (cleanSql.includes('INSERT INTO customers')) {
    dataStore.auto_ids.customers++;
    const newCust = {
      id: dataStore.auto_ids.customers,
      name: params[0],
      phone: params[1],
      email: params[2] || '',
      type: params[3] || 'RETAIL_CUSTOMER',
      gst_number: params[4] || '',
      pan_card: params[5] || '',
      address: params[6] || '',
      fine_gold_balance: parseFloat(params[7]) || 0,
      cash_balance: parseFloat(params[8]) || 0,
      loyalty_points: parseInt(params[9]) || 0,
      created_at: new Date().toISOString()
    };
    dataStore.customers.push(newCust);
    saveToFile();
    return { lastInsertRowid: newCust.id, changes: 1 };
  }

  // 8. UPDATE customers (ledger)
  if (cleanSql.includes('UPDATE customers')) {
    const id = parseInt(params[params.length - 1]);
    const cust = dataStore.customers.find(c => c.id === id);
    if (cust) {
      const fineAdj = parseFloat(params[0]) || 0;
      const cashAdj = parseFloat(params[1]) || 0;
      cust.fine_gold_balance = parseFloat((cust.fine_gold_balance + fineAdj).toFixed(3));
      cust.cash_balance = parseFloat((cust.cash_balance + cashAdj).toFixed(2));
      saveToFile();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  // 9. SELECT products
  if (cleanSql.includes('SELECT') && cleanSql.includes('products')) {
    if (cleanSql.includes('COUNT(*)')) {
      return { count: dataStore.products.length };
    }
    if (cleanSql.includes('WHERE id = ? OR sku = ? OR barcode = ?')) {
      const key = params[0];
      const prod = dataStore.products.find(p => p.id === parseInt(key) || p.sku === key || p.barcode === key);
      return prod || null;
    }
    if (cleanSql.includes("WHERE counter_tray = ? AND status = 'IN_STOCK'")) {
      const tray = params[0];
      return dataStore.products.filter(p => p.counter_tray === tray && p.status === 'IN_STOCK');
    }
    if (cleanSql.includes("WHERE status = 'IN_STOCK'")) {
      return dataStore.products.filter(p => p.status === 'IN_STOCK');
    }
    return mode === 'GET' ? dataStore.products[0] : [...dataStore.products];
  }

  // 10. INSERT INTO products
  if (cleanSql.includes('INSERT INTO products')) {
    dataStore.auto_ids.products++;
    const newProd = {
      id: dataStore.auto_ids.products,
      sku: params[0],
      barcode: params[1],
      title: params[2],
      category: params[3],
      metal_type: params[4],
      purity: params[5],
      gross_weight: parseFloat(params[6]),
      net_weight: parseFloat(params[7]),
      stone_weight: parseFloat(params[8]) || 0,
      stone_type: params[9] || 'None',
      stone_cents: parseFloat(params[10]) || 0,
      stone_price: parseFloat(params[11]) || 0,
      wastage_pct: parseFloat(params[12]) || 0,
      making_charge_type: params[13] || 'PER_GRAM',
      making_charge_value: parseFloat(params[14]) || 0,
      huid: params[15] || '',
      counter_tray: params[16] || 'Showcase A - Tray 1',
      item_type: params[17] || 'RETAIL_SINGLE',
      pieces: parseInt(params[18]) || 1,
      touch_pct: parseFloat(params[19]) || 91.6,
      fine_metal_weight: parseFloat(params[20]) || 0,
      status: params[21] || 'IN_STOCK',
      cost_price: parseFloat(params[22]) || 0,
      notes: params[23] || '',
      created_at: new Date().toISOString()
    };
    dataStore.products.push(newProd);
    saveToFile();
    return { lastInsertRowid: newProd.id, changes: 1 };
  }

  // 11. UPDATE products
  if (cleanSql.includes('UPDATE products')) {
    if (cleanSql.includes("status = 'SOLD' WHERE id = ?")) {
      const id = parseInt(params[0]);
      const prod = dataStore.products.find(p => p.id === id);
      if (prod) {
        prod.status = 'SOLD';
        saveToFile();
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    const id = parseInt(params[params.length - 1]);
    const prod = dataStore.products.find(p => p.id === id);
    if (prod) {
      if (params[0] !== null && params[0] !== undefined) prod.title = params[0];
      if (params[1] !== null && params[1] !== undefined) prod.category = params[1];
      if (params[2] !== null && params[2] !== undefined) prod.counter_tray = params[2];
      if (params[3] !== null && params[3] !== undefined) prod.making_charge_type = params[3];
      if (params[4] !== null && params[4] !== undefined) prod.making_charge_value = parseFloat(params[4]);
      if (params[5] !== null && params[5] !== undefined) prod.stone_price = parseFloat(params[5]);
      if (params[6] !== null && params[6] !== undefined) prod.status = params[6];
      if (params[7] !== null && params[7] !== undefined) prod.notes = params[7];
      saveToFile();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  // 12. DELETE products
  if (cleanSql.includes('DELETE FROM products')) {
    const id = parseInt(params[0]);
    const idx = dataStore.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      dataStore.products.splice(idx, 1);
      saveToFile();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  // 13. sales_invoices
  if (cleanSql.includes('SELECT') && cleanSql.includes('sales_invoices')) {
    if (cleanSql.includes('COUNT(*)')) {
      return { count: dataStore.sales_invoices.length };
    }
    if (cleanSql.includes('WHERE id = ? OR invoice_no = ?')) {
      const key = params[0];
      const inv = dataStore.sales_invoices.find(i => i.id === parseInt(key) || i.invoice_no === key);
      return inv || null;
    }
    if (cleanSql.includes('WHERE employee_id = ?')) {
      const empId = parseInt(params[0]);
      return dataStore.sales_invoices.filter(i => i.employee_id === empId);
    }
    return mode === 'GET' ? dataStore.sales_invoices[0] : [...dataStore.sales_invoices];
  }

  if (cleanSql.includes('INSERT INTO sales_invoices')) {
    dataStore.auto_ids.sales_invoices++;
    const newInv = {
      id: dataStore.auto_ids.sales_invoices,
      invoice_no: params[0],
      type: params[1],
      customer_id: params[2] ? parseInt(params[2]) : null,
      customer_name: params[3],
      customer_phone: params[4] || '',
      employee_id: parseInt(params[5]),
      employee_name: params[6],
      subtotal: parseFloat(params[7]),
      making_charges: parseFloat(params[8]) || 0,
      stone_charges: parseFloat(params[9]) || 0,
      old_gold_deduction: parseFloat(params[10]) || 0,
      discount: parseFloat(params[11]) || 0,
      tax_amount: parseFloat(params[12]) || 0,
      total_amount: parseFloat(params[13]),
      fine_gold_settlement_grams: parseFloat(params[14]) || 0,
      cash_paid: parseFloat(params[15]) || 0,
      payment_mode: params[16] || 'CASH',
      status: params[17] || 'PAID',
      notes: params[18] || '',
      created_at: params[19] || new Date().toISOString()
    };
    dataStore.sales_invoices.push(newInv);
    saveToFile();
    return { lastInsertRowid: newInv.id, changes: 1 };
  }

  // 14. sales_items
  if (cleanSql.includes('SELECT') && cleanSql.includes('sales_items')) {
    if (cleanSql.includes('WHERE invoice_id = ?')) {
      const invId = parseInt(params[0]);
      return dataStore.sales_items.filter(item => item.invoice_id === invId);
    }
    return mode === 'GET' ? dataStore.sales_items[0] : [...dataStore.sales_items];
  }

  if (cleanSql.includes('INSERT INTO sales_items')) {
    dataStore.auto_ids.sales_items++;
    const newItem = {
      id: dataStore.auto_ids.sales_items,
      invoice_id: parseInt(params[0]),
      product_id: params[1] ? parseInt(params[1]) : null,
      sku: params[2],
      title: params[3],
      category: params[4],
      metal_type: params[5],
      purity: params[6],
      gross_weight: parseFloat(params[7]),
      net_weight: parseFloat(params[8]),
      stone_weight: parseFloat(params[9]) || 0,
      metal_rate_applied: parseFloat(params[10]),
      making_charge: parseFloat(params[11]) || 0,
      stone_price: parseFloat(params[12]) || 0,
      total_item_price: parseFloat(params[13]),
      pieces: parseInt(params[14]) || 1,
      created_at: params[15] || new Date().toISOString()
    };
    dataStore.sales_items.push(newItem);
    saveToFile();
    return { lastInsertRowid: newItem.id, changes: 1 };
  }

  // 15. stock_ledger
  if (cleanSql.includes('SELECT') && cleanSql.includes('stock_ledger')) {
    return mode === 'GET' ? dataStore.stock_ledger[0] : [...dataStore.stock_ledger];
  }

  if (cleanSql.includes('INSERT INTO stock_ledger')) {
    dataStore.auto_ids.stock_ledger++;
    let newEntry;
    if (params.length === 9) {
      newEntry = {
        id: dataStore.auto_ids.stock_ledger,
        product_id: params[0] ? parseInt(params[0]) : null,
        sku: params[1],
        title: params[2],
        movement_type: params[3],
        gross_weight: parseFloat(params[4]),
        net_weight: parseFloat(params[5]),
        reference_id: params[6],
        reference_type: params[7],
        notes: params[8] || '',
        timestamp: new Date().toISOString()
      };
    } else {
      newEntry = {
        id: dataStore.auto_ids.stock_ledger,
        product_id: null,
        sku: params[0],
        title: params[1],
        movement_type: params[2],
        gross_weight: parseFloat(params[3]),
        net_weight: parseFloat(params[4]),
        reference_id: params[5],
        reference_type: params[6],
        notes: params[7] || '',
        timestamp: new Date().toISOString()
      };
    }
    dataStore.stock_ledger.unshift(newEntry);
    saveToFile();
    return { lastInsertRowid: newEntry.id, changes: 1 };
  }

  // 16. karigar_orders
  if (cleanSql.includes('SELECT') && cleanSql.includes('karigar_orders')) {
    if (cleanSql.includes('COUNT(*)')) {
      return { count: dataStore.karigar_orders.length };
    }
    if (cleanSql.includes('WHERE id = ?')) {
      const ko = dataStore.karigar_orders.find(k => k.id === parseInt(params[0]));
      return ko || null;
    }
    if (cleanSql.includes("WHERE status = 'IN_PROGRESS'")) {
      return dataStore.karigar_orders.filter(k => k.status === 'IN_PROGRESS');
    }
    return mode === 'GET' ? dataStore.karigar_orders[0] : [...dataStore.karigar_orders];
  }

  if (cleanSql.includes('INSERT INTO karigar_orders')) {
    dataStore.auto_ids.karigar_orders++;
    const newKO = {
      id: dataStore.auto_ids.karigar_orders,
      order_no: params[0],
      karigar_name: params[1],
      karigar_phone: params[2] || '',
      issue_date: params[3],
      due_date: params[4] || '',
      raw_metal_type: params[5],
      raw_metal_purity: params[6],
      raw_metal_weight: parseFloat(params[7]),
      expected_item_type: params[8],
      expected_pieces: parseInt(params[9]) || 1,
      agreed_wastage_pct: parseFloat(params[10]) || 1.2,
      received_weight: parseFloat(params[11]) || 0,
      received_pieces: parseInt(params[12]) || 0,
      status: params[13] || 'IN_PROGRESS',
      fine_gold_balance_diff: parseFloat(params[14]) || 0,
      notes: params[15] || '',
      created_at: new Date().toISOString()
    };
    dataStore.karigar_orders.push(newKO);
    saveToFile();
    return { lastInsertRowid: newKO.id, changes: 1 };
  }

  if (cleanSql.includes('UPDATE karigar_orders')) {
    const id = parseInt(params[params.length - 1]);
    const ko = dataStore.karigar_orders.find(k => k.id === id);
    if (ko) {
      ko.received_weight = parseFloat(params[0]);
      ko.received_pieces = parseInt(params[1]);
      ko.status = 'COMPLETED';
      ko.fine_gold_balance_diff = parseFloat(params[2]);
      if (params[3]) ko.notes = params[3];
      saveToFile();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  // 17. old_gold_transactions
  if (cleanSql.includes('SELECT') && cleanSql.includes('old_gold_transactions')) {
    if (cleanSql.includes('WHERE linked_invoice_no = ?')) {
      const invNo = params[0];
      const og = dataStore.old_gold_transactions.find(o => o.linked_invoice_no === invNo);
      return og || null;
    }
    if (cleanSql.includes('WHERE id = ?')) {
      const og = dataStore.old_gold_transactions.find(o => o.id === parseInt(params[0]));
      return og || null;
    }
    return mode === 'GET' ? dataStore.old_gold_transactions[0] : [...dataStore.old_gold_transactions];
  }

  if (cleanSql.includes('INSERT INTO old_gold_transactions')) {
    dataStore.auto_ids.old_gold_transactions++;
    const newOG = {
      id: dataStore.auto_ids.old_gold_transactions,
      receipt_no: params[0],
      customer_name: params[1],
      customer_phone: params[2] || '',
      gross_weight: parseFloat(params[3]),
      stone_dust_deduction: parseFloat(params[4]) || 0,
      net_weight: parseFloat(params[5]),
      purity_touch_pct: parseFloat(params[6]),
      fine_gold_weight: parseFloat(params[7]),
      valuation_rate_per_gram: parseFloat(params[8]),
      total_valuation: parseFloat(params[9]),
      settlement_mode: params[10] || 'INVOICE_CREDIT',
      linked_invoice_no: params[11] || '',
      notes: params[12] || '',
      created_at: params[13] || new Date().toISOString()
    };
    dataStore.old_gold_transactions.push(newOG);
    saveToFile();
    return { lastInsertRowid: newOG.id, changes: 1 };
  }

  // 18. tray_audits
  if (cleanSql.includes('SELECT') && cleanSql.includes('tray_audits')) {
    if (cleanSql.includes('WHERE id = ?')) {
      const audit = dataStore.tray_audits.find(a => a.id === parseInt(params[0]));
      return audit || null;
    }
    return mode === 'GET' ? dataStore.tray_audits[0] : [...dataStore.tray_audits];
  }

  if (cleanSql.includes('INSERT INTO tray_audits')) {
    dataStore.auto_ids.tray_audits++;
    const newAudit = {
      id: dataStore.auto_ids.tray_audits,
      audit_date: params[0],
      tray_name: params[1],
      category: params[2],
      metal_type: params[3],
      system_items_count: parseInt(params[4]),
      system_total_weight: parseFloat(params[5]),
      physical_items_count: parseInt(params[6]),
      physical_total_weight: parseFloat(params[7]),
      variance_weight: parseFloat(params[8]),
      audited_by: params[9],
      notes: params[10] || '',
      status: params[11] || 'RECONCILED',
      created_at: new Date().toISOString()
    };
    dataStore.tray_audits.push(newAudit);
    saveToFile();
    return { lastInsertRowid: newAudit.id, changes: 1 };
  }

  return mode === 'GET' ? null : [];
}

export function initDatabase() {
  loadFromFile();

  if (dataStore.metal_rates.length === 0) {
    const defaultRates = [
      { id: 1, metal: 'Gold', purity: '24K (999)', rate_per_gram: 7250.0, currency: 'INR', updated_at: new Date().toISOString() },
      { id: 2, metal: 'Gold', purity: '22K (916)', rate_per_gram: 6750.0, currency: 'INR', updated_at: new Date().toISOString() },
      { id: 3, metal: 'Gold', purity: '18K (750)', rate_per_gram: 5550.0, currency: 'INR', updated_at: new Date().toISOString() },
      { id: 4, metal: 'Gold', purity: '14K (585)', rate_per_gram: 4350.0, currency: 'INR', updated_at: new Date().toISOString() },
      { id: 5, metal: 'Silver', purity: '999 Fine', rate_per_gram: 88.5, currency: 'INR', updated_at: new Date().toISOString() },
      { id: 6, metal: 'Silver', purity: '925 Sterling', rate_per_gram: 82.0, currency: 'INR', updated_at: new Date().toISOString() },
      { id: 7, metal: 'Platinum', purity: '950 Pure', rate_per_gram: 3200.0, currency: 'INR', updated_at: new Date().toISOString() }
    ];
    dataStore.metal_rates = defaultRates;
    dataStore.auto_ids.metal_rates = 7;
  }

  if (dataStore.employees.length === 0) {
    const staff = [
      { id: 1, name: 'Aarav Verma', email: 'aarav.v@jewelflow.com', phone: '+91 98201 12345', role: 'SALES_EXECUTIVE', target_monthly_revenue: 2000000, target_monthly_grams: 300, commission_rate_pct: 1.2, avatar_color: '#E11D48', active: 1, created_at: new Date().toISOString() },
      { id: 2, name: 'Pooja Patel', email: 'pooja.p@jewelflow.com', phone: '+91 98202 23456', role: 'SALES_EXECUTIVE', target_monthly_revenue: 2500000, target_monthly_grams: 380, commission_rate_pct: 1.5, avatar_color: '#7C3AED', active: 1, created_at: new Date().toISOString() },
      { id: 3, name: 'Rohan Mehta', email: 'rohan.m@jewelflow.com', phone: '+91 98203 34567', role: 'WHOLESALE_AGENT', target_monthly_revenue: 4500000, target_monthly_grams: 700, commission_rate_pct: 0.8, avatar_color: '#059669', active: 1, created_at: new Date().toISOString() },
      { id: 4, name: 'Neha Sharma', email: 'neha.s@jewelflow.com', phone: '+91 98204 45678', role: 'SALES_EXECUTIVE', target_monthly_revenue: 1800000, target_monthly_grams: 260, commission_rate_pct: 1.0, avatar_color: '#D97706', active: 1, created_at: new Date().toISOString() },
      { id: 5, name: 'Vikram Sen', email: 'vikram.s@jewelflow.com', phone: '+91 98205 56789', role: 'WHOLESALE_AGENT', target_monthly_revenue: 5000000, target_monthly_grams: 800, commission_rate_pct: 0.75, avatar_color: '#2563EB', active: 1, created_at: new Date().toISOString() },
      { id: 6, name: 'Kavita Deshmukh', email: 'kavita.d@jewelflow.com', phone: '+91 98206 67890', role: 'CASHIER', target_monthly_revenue: 1000000, target_monthly_grams: 150, commission_rate_pct: 0.5, avatar_color: '#0D9488', active: 1, created_at: new Date().toISOString() }
    ];
    dataStore.employees = staff;
    dataStore.auto_ids.employees = 6;
  }

  if (dataStore.customers.length === 0) {
    const customers = [
      { id: 1, name: 'Meera Singhania', phone: '+91 98765 43210', email: 'meera@singhania.com', type: 'RETAIL_CUSTOMER', gst_number: '', pan_card: 'ABCPS1234F', address: 'Bandra West, Mumbai', fine_gold_balance: 0, cash_balance: 0, loyalty_points: 450, created_at: new Date().toISOString() },
      { id: 2, name: 'Rajesh Gupta', phone: '+91 98111 22233', email: 'rajesh@gupta.com', type: 'RETAIL_CUSTOMER', gst_number: '', pan_card: 'BRRPG9876L', address: 'Juhu, Mumbai', fine_gold_balance: 0, cash_balance: 0, loyalty_points: 120, created_at: new Date().toISOString() },
      { id: 3, name: 'Shree Laxmi Jewellers (Pune)', phone: '+91 98222 33344', email: 'orders@shreelaxmi.com', type: 'B2B_DEALER', gst_number: '27AAACS1234M1Z5', pan_card: 'AAACS1234M', address: 'Laxmi Road, Pune', fine_gold_balance: 48.50, cash_balance: 240000, loyalty_points: 0, created_at: new Date().toISOString() },
      { id: 4, name: 'Mahalaxmi Ornaments (Surat)', phone: '+91 98333 44455', email: 'b2b@mahalaxmi.com', type: 'B2B_DEALER', gst_number: '24AABCM5678N1Z8', pan_card: 'AABCM5678N', address: 'Varachha, Surat', fine_gold_balance: -12.20, cash_balance: 0, loyalty_points: 0, created_at: new Date().toISOString() },
      { id: 5, name: 'Ananya Roy', phone: '+91 98444 55566', email: 'ananya.roy@gmail.com', type: 'RETAIL_CUSTOMER', gst_number: '', pan_card: 'CPRYA5544K', address: 'Andheri East, Mumbai', fine_gold_balance: 0, cash_balance: 0, loyalty_points: 80, created_at: new Date().toISOString() }
    ];
    dataStore.customers = customers;
    dataStore.auto_ids.customers = 5;
  }

  if (dataStore.products.length === 0) {
    const products = [
      { id: 1, sku: 'JW-GLD-001', barcode: '8901001', title: 'Kundan Heritage Bridal Choker', category: 'Necklaces', metal_type: 'Gold', purity: '22K (916)', gross_weight: 48.50, net_weight: 42.00, stone_weight: 6.50, stone_type: 'Ruby & Emerald CZ', stone_cents: 32.5, stone_price: 18500, wastage_pct: 2.0, making_charge_type: 'PER_GRAM', making_charge_value: 650, huid: 'HUID916A8721', counter_tray: 'Showcase A - Tray 1', item_type: 'RETAIL_SINGLE', pieces: 1, touch_pct: 91.6, fine_metal_weight: 38.47, status: 'IN_STOCK', cost_price: 280000, notes: 'Handcrafted antique royal collection', created_at: new Date().toISOString() },
      { id: 2, sku: 'JW-GLD-002', barcode: '8901002', title: 'Classic Calcutta Filigree Bangle (Pair)', category: 'Bangles', metal_type: 'Gold', purity: '22K (916)', gross_weight: 32.40, net_weight: 32.40, stone_weight: 0.0, stone_type: 'None', stone_cents: 0, stone_price: 0, wastage_pct: 1.5, making_charge_type: 'PER_GRAM', making_charge_value: 480, huid: 'HUID916B1934', counter_tray: 'Showcase A - Tray 2', item_type: 'RETAIL_SINGLE', pieces: 2, touch_pct: 91.6, fine_metal_weight: 29.68, status: 'IN_STOCK', cost_price: 215000, notes: 'Seamless hollow laser finished', created_at: new Date().toISOString() },
      { id: 3, sku: 'JW-GLD-003', barcode: '8901003', title: 'Temple Lakshmi Peacock Jhumka', category: 'Earrings', metal_type: 'Gold', purity: '22K (916)', gross_weight: 18.20, net_weight: 16.80, stone_weight: 1.40, stone_type: 'Synthetic Pearls & Garnet', stone_cents: 7.0, stone_price: 4500, wastage_pct: 2.5, making_charge_type: 'PER_GRAM', making_charge_value: 550, huid: 'HUID916C4491', counter_tray: 'Showcase A - Tray 3', item_type: 'RETAIL_SINGLE', pieces: 2, touch_pct: 91.6, fine_metal_weight: 15.39, status: 'IN_STOCK', cost_price: 115000, notes: 'South Indian traditional motif', created_at: new Date().toISOString() },
      { id: 4, sku: 'JW-GLD-004', barcode: '8901004', title: 'Men Solid Rope Chain (24 inch)', category: 'Chains', metal_type: 'Gold', purity: '22K (916)', gross_weight: 24.60, net_weight: 24.60, stone_weight: 0.0, stone_type: 'None', stone_cents: 0, stone_price: 0, wastage_pct: 1.0, making_charge_type: 'PER_GRAM', making_charge_value: 380, huid: 'HUID916D5820', counter_tray: 'Showcase B - Tray 1', item_type: 'RETAIL_SINGLE', pieces: 1, touch_pct: 91.6, fine_metal_weight: 22.53, status: 'IN_STOCK', cost_price: 165000, notes: 'Machine made heavy lock', created_at: new Date().toISOString() },
      { id: 5, sku: 'JW-GLD-005', barcode: '8901005', title: 'Traditional Black Beaded Mangalsutra', category: 'Mangalsutra', metal_type: 'Gold', purity: '22K (916)', gross_weight: 15.80, net_weight: 13.50, stone_weight: 2.30, stone_type: 'Black Beads & CZ', stone_cents: 11.5, stone_price: 3200, wastage_pct: 1.5, making_charge_type: 'PER_GRAM', making_charge_value: 520, huid: 'HUID916E7712', counter_tray: 'Showcase B - Tray 2', item_type: 'RETAIL_SINGLE', pieces: 1, touch_pct: 91.6, fine_metal_weight: 12.37, status: 'IN_STOCK', cost_price: 95000, notes: 'Dual line stringing with gold pendant', created_at: new Date().toISOString() },
      { id: 6, sku: 'JW-GLD-006', barcode: '8901006', title: 'Floral Daily Wear Ring', category: 'Rings', metal_type: 'Gold', purity: '22K (916)', gross_weight: 4.80, net_weight: 4.80, stone_weight: 0.0, stone_type: 'None', stone_cents: 0, stone_price: 0, wastage_pct: 1.0, making_charge_type: 'PER_GRAM', making_charge_value: 420, huid: 'HUID916F8831', counter_tray: 'Showcase B - Tray 3', item_type: 'RETAIL_SINGLE', pieces: 1, touch_pct: 91.6, fine_metal_weight: 4.40, status: 'IN_STOCK', cost_price: 32000, notes: 'Die stamped high polish', created_at: new Date().toISOString() },
      { id: 7, sku: 'JW-GLD-007', barcode: '8901007', title: 'Lord Ganesha 24K Pure Gold Coin 10g', category: 'Coins & Bars', metal_type: 'Gold', purity: '24K (999)', gross_weight: 10.00, net_weight: 10.00, stone_weight: 0.0, stone_type: 'None', stone_cents: 0, stone_price: 0, wastage_pct: 0.0, making_charge_type: 'FIXED', making_charge_value: 350, huid: 'HUID999G1010', counter_tray: 'Vault Safe - Coin Box', item_type: 'RETAIL_SINGLE', pieces: 1, touch_pct: 99.9, fine_metal_weight: 9.99, status: 'IN_STOCK', cost_price: 72000, notes: 'Tamper-proof blister packed with cert', created_at: new Date().toISOString() },
      { id: 8, sku: 'JW-GLD-008', barcode: '8901008', title: 'Lakshmi 24K Pure Gold Bar 20g', category: 'Coins & Bars', metal_type: 'Gold', purity: '24K (999)', gross_weight: 20.00, net_weight: 20.00, stone_weight: 0.0, stone_type: 'None', stone_cents: 0, stone_price: 0, wastage_pct: 0.0, making_charge_type: 'FIXED', making_charge_value: 500, huid: 'HUID999H2020', counter_tray: 'Vault Safe - Coin Box', item_type: 'RETAIL_SINGLE', pieces: 1, touch_pct: 99.9, fine_metal_weight: 19.98, status: 'IN_STOCK', cost_price: 144000, notes: 'NABL accredited lab certified bar', created_at: new Date().toISOString() },

      { id: 9, sku: 'JW-DIA-001', barcode: '8902001', title: 'Solitaire Princess Cut Engagement Ring', category: 'Rings', metal_type: 'Gold', purity: '18K (750)', gross_weight: 5.20, net_weight: 5.00, stone_weight: 0.20, stone_type: 'Natural Diamond VVS1-F', stone_cents: 100, stone_price: 85000, wastage_pct: 0.0, making_charge_type: 'FIXED', making_charge_value: 7500, huid: 'HUID750D1122', counter_tray: 'Diamond Vault - Tray 1', item_type: 'RETAIL_SINGLE', pieces: 1, touch_pct: 75.0, fine_metal_weight: 3.75, status: 'IN_STOCK', cost_price: 98000, notes: 'IGI Certified 1.00ct centre stone', created_at: new Date().toISOString() },
      { id: 10, sku: 'JW-DIA-002', barcode: '8902002', title: 'Eternity Tennis Bracelet (3.5ct)', category: 'Bangles', metal_type: 'Gold', purity: '18K (750)', gross_weight: 16.50, net_weight: 15.80, stone_weight: 0.70, stone_type: 'Natural Diamonds VS-GH', stone_cents: 350, stone_price: 165000, wastage_pct: 0.0, making_charge_type: 'FIXED', making_charge_value: 14000, huid: 'HUID750D2233', counter_tray: 'Diamond Vault - Tray 2', item_type: 'RETAIL_SINGLE', pieces: 1, touch_pct: 75.0, fine_metal_weight: 11.85, status: 'IN_STOCK', cost_price: 210000, notes: 'Four-prong setting, 52 round brilliants', created_at: new Date().toISOString() },
      { id: 11, sku: 'JW-DIA-003', barcode: '8902003', title: 'Rose Gold Pear Halo Pendant with Chain', category: 'Pendants', metal_type: 'Gold', purity: '18K (750)', gross_weight: 6.80, net_weight: 6.45, stone_weight: 0.35, stone_type: 'Natural Diamonds SI-IJ', stone_cents: 175, stone_price: 42000, wastage_pct: 0.0, making_charge_type: 'FIXED', making_charge_value: 4500, huid: 'HUID750D3344', counter_tray: 'Diamond Vault - Tray 3', item_type: 'RETAIL_SINGLE', pieces: 1, touch_pct: 75.0, fine_metal_weight: 4.84, status: 'IN_STOCK', cost_price: 68000, notes: 'Includes 18k 16-inch rose gold chain', created_at: new Date().toISOString() },

      { id: 12, sku: 'JW-SLV-001', barcode: '8903001', title: 'Antique Temple Silver Pooja Thali Set', category: 'Pooja Items', metal_type: 'Silver', purity: '999 Fine', gross_weight: 450.00, net_weight: 450.00, stone_weight: 0.0, stone_type: 'None', stone_cents: 0, stone_price: 0, wastage_pct: 0.5, making_charge_type: 'PER_GRAM', making_charge_value: 18, huid: 'HUIDSLV001', counter_tray: 'Silver Showcase - Section A', item_type: 'RETAIL_SINGLE', pieces: 1, touch_pct: 99.9, fine_metal_weight: 449.55, status: 'IN_STOCK', cost_price: 36000, notes: 'Includes thali, diya, agarbatti stand, bell', created_at: new Date().toISOString() },
      { id: 13, sku: 'JW-SLV-002', barcode: '8903002', title: 'Bridal Ghungroo Payal Pair', category: 'Payal', metal_type: 'Silver', purity: '925 Sterling', gross_weight: 125.00, net_weight: 125.00, stone_weight: 0.0, stone_type: 'None', stone_cents: 0, stone_price: 0, wastage_pct: 2.0, making_charge_type: 'PER_GRAM', making_charge_value: 22, huid: 'HUIDSLV002', counter_tray: 'Silver Showcase - Section B', item_type: 'RETAIL_SINGLE', pieces: 2, touch_pct: 92.5, fine_metal_weight: 115.62, status: 'IN_STOCK', cost_price: 10500, notes: 'Heavy ghungroo melody bells', created_at: new Date().toISOString() },

      { id: 14, sku: 'WS-LOT-22K-01', barcode: '8904001', title: 'Wholesale Lot: 22K Casting Rings (25 pcs)', category: 'Rings', metal_type: 'Gold', purity: '22K (916)', gross_weight: 125.80, net_weight: 125.80, stone_weight: 0.0, stone_type: 'None', stone_cents: 0, stone_price: 0, wastage_pct: 0.0, making_charge_type: 'PER_GRAM', making_charge_value: 280, huid: 'LOT-22K-RNG25', counter_tray: 'Wholesale Vault - Drawer 1', item_type: 'WHOLESALE_LOT', pieces: 25, touch_pct: 91.6, fine_metal_weight: 115.23, status: 'IN_STOCK', cost_price: 820000, notes: 'Assorted sizes #12 to #22, tested touch 91.65%', created_at: new Date().toISOString() },
      { id: 15, sku: 'WS-LOT-22K-02', barcode: '8904002', title: 'Wholesale Lot: 22K Lightweight Chains (10 pcs)', category: 'Chains', metal_type: 'Gold', purity: '22K (916)', gross_weight: 84.50, net_weight: 84.50, stone_weight: 0.0, stone_type: 'None', stone_cents: 0, stone_price: 0, wastage_pct: 0.0, making_charge_type: 'PER_GRAM', making_charge_value: 260, huid: 'LOT-22K-CHN10', counter_tray: 'Wholesale Vault - Drawer 2', item_type: 'WHOLESALE_LOT', pieces: 10, touch_pct: 91.6, fine_metal_weight: 77.40, status: 'IN_STOCK', cost_price: 555000, notes: 'Box chains and Singapore link mixed pack', created_at: new Date().toISOString() },
      { id: 16, sku: 'WS-LOT-18K-01', barcode: '8904003', title: 'Wholesale Lot: 18K CZ Designer Studs (20 pairs)', category: 'Earrings', metal_type: 'Gold', purity: '18K (750)', gross_weight: 62.00, net_weight: 58.00, stone_weight: 4.0, stone_type: 'Swiss CZ Grade AAA', stone_cents: 20.0, stone_price: 8000, wastage_pct: 0.0, making_charge_type: 'PER_GRAM', making_charge_value: 320, huid: 'LOT-18K-STD20', counter_tray: 'Wholesale Vault - Drawer 3', item_type: 'WHOLESALE_LOT', pieces: 20, touch_pct: 75.0, fine_metal_weight: 43.50, status: 'IN_STOCK', cost_price: 315000, notes: 'Screw-back micro pave setting', created_at: new Date().toISOString() }
    ];
    dataStore.products = products;
    dataStore.auto_ids.products = 16;
  }

  if (dataStore.karigar_orders.length === 0) {
    const orders = [
      { id: 1, order_no: 'KG-2026-001', karigar_name: 'Ramesh Sonar & Sons', karigar_phone: '+91 98233 11223', issue_date: '2026-08-20', due_date: '2026-09-02', raw_metal_type: 'Gold Bullion', raw_metal_purity: '24K (999)', raw_metal_weight: 100.00, expected_item_type: '22K Antique Bangles', expected_pieces: 4, agreed_wastage_pct: 1.2, received_weight: 0.0, received_pieces: 0, status: 'IN_PROGRESS', fine_gold_balance_diff: 0, notes: 'Issued 100g 999 gold bar for antique die casting', created_at: new Date().toISOString() },
      { id: 2, order_no: 'KG-2026-002', karigar_name: 'Bengal Fine Gold Art (Bablu Da)', karigar_phone: '+91 98344 55667', issue_date: '2026-08-15', due_date: '2026-08-28', raw_metal_type: 'Gold Bullion', raw_metal_purity: '24K (999)', raw_metal_weight: 65.50, expected_item_type: '22K Filigree Necklace', expected_pieces: 1, agreed_wastage_pct: 1.5, received_weight: 69.80, received_pieces: 1, status: 'COMPLETED', fine_gold_balance_diff: -0.35, notes: 'Completed with superior filigree touch 91.7%', created_at: new Date().toISOString() },
      { id: 3, order_no: 'KG-2026-003', karigar_name: 'Surat Diamond Setters (Deepak)', karigar_phone: '+91 98455 77889', issue_date: '2026-08-25', due_date: '2026-09-05', raw_metal_type: 'Gold Alloy + Solitaires', raw_metal_purity: '18K (750)', raw_metal_weight: 40.00, expected_item_type: '18K Solitaire Rings', expected_pieces: 8, agreed_wastage_pct: 1.0, received_weight: 0.0, received_pieces: 0, status: 'IN_PROGRESS', fine_gold_balance_diff: 0, notes: 'Issued 40g 18k casted mountings with 8 certified diamonds', created_at: new Date().toISOString() }
    ];
    dataStore.karigar_orders = orders;
    dataStore.auto_ids.karigar_orders = 3;
  }

  if (dataStore.sales_invoices.length === 0) {
    seedSales();
  }

  saveToFile();
}

function seedSales() {
  dataStore.sales_invoices = [
    { id: 1, invoice_no: 'INV-20260825-1001', type: 'RETAIL_SALE', customer_id: 1, customer_name: 'Meera Singhania', customer_phone: '+91 98765 43210', employee_id: 1, employee_name: 'Aarav Verma', subtotal: 215000, making_charges: 15552, stone_charges: 0, old_gold_deduction: 25000, discount: 2000, tax_amount: 6106.56, total_amount: 209658.56, fine_gold_settlement_grams: 0, cash_paid: 209658.56, payment_mode: 'CARD', status: 'PAID', notes: 'Retail Wedding purchase', created_at: '2026-08-25T14:20:00.000Z' },
    { id: 2, invoice_no: 'INV-20260826-1002', type: 'RETAIL_SALE', customer_id: 2, customer_name: 'Rajesh Gupta', customer_phone: '+91 98111 22233', employee_id: 2, employee_name: 'Pooja Patel', subtotal: 335000, making_charges: 27300, stone_charges: 18500, old_gold_deduction: 0, discount: 5000, tax_amount: 11274, total_amount: 387074, fine_gold_settlement_grams: 0, cash_paid: 387074, payment_mode: 'UPI', status: 'PAID', notes: 'Bridal Set purchase', created_at: '2026-08-26T17:45:00.000Z' },
    { id: 3, invoice_no: 'WS-20260827-1003', type: 'WHOLESALE_CHALLAN', customer_id: 3, customer_name: 'Shree Laxmi Jewellers (Pune)', customer_phone: '+91 98222 33344', employee_id: 3, employee_name: 'Rohan Mehta', subtotal: 845000, making_charges: 35224, stone_charges: 0, old_gold_deduction: 0, discount: 0, tax_amount: 0, total_amount: 880224, fine_gold_settlement_grams: 115.23, cash_paid: 35224, payment_mode: 'FINE_GOLD_PLUS_MAKING', status: 'PAID', notes: 'Settled 115.23g Fine Gold Bar + ₹35,224 cash making charges', created_at: '2026-08-27T11:30:00.000Z' },
    { id: 4, invoice_no: 'INV-20260828-1004', type: 'RETAIL_SALE', customer_id: 5, customer_name: 'Ananya Roy', customer_phone: '+91 98444 55566', employee_id: 4, employee_name: 'Neha Sharma', subtotal: 112000, making_charges: 7500, stone_charges: 85000, old_gold_deduction: 0, discount: 2500, tax_amount: 6060, total_amount: 208060, fine_gold_settlement_grams: 0, cash_paid: 208060, payment_mode: 'CARD', status: 'PAID', notes: 'Solitaire engagement purchase', created_at: '2026-08-28T16:10:00.000Z' },
    { id: 5, invoice_no: 'WS-20260829-1005', type: 'WHOLESALE_CHALLAN', customer_id: 4, customer_name: 'Mahalaxmi Ornaments (Surat)', customer_phone: '+91 98333 44455', employee_id: 5, employee_name: 'Vikram Sen', subtotal: 570000, making_charges: 21970, stone_charges: 0, old_gold_deduction: 0, discount: 0, tax_amount: 0, total_amount: 591970, fine_gold_settlement_grams: 77.40, cash_paid: 21970, payment_mode: 'FINE_GOLD_PLUS_MAKING', status: 'PAID', notes: 'Dispatched via secure armored logistics with challan', created_at: '2026-08-29T12:00:00.000Z' }
  ];
  dataStore.auto_ids.sales_invoices = 5;

  dataStore.sales_items = [
    { id: 1, invoice_id: 1, product_id: 2, sku: 'JW-GLD-002-S1', title: 'Classic Calcutta Filigree Bangle', category: 'Bangles', metal_type: 'Gold', purity: '22K (916)', gross_weight: 32.40, net_weight: 32.40, stone_weight: 0.0, metal_rate_applied: 6650.0, making_charge: 15552, stone_price: 0, total_item_price: 230552, pieces: 2, created_at: '2026-08-25T14:20:00.000Z' },
    { id: 2, invoice_id: 2, product_id: 1, sku: 'JW-GLD-001-S2', title: 'Kundan Heritage Bridal Choker', category: 'Necklaces', metal_type: 'Gold', purity: '22K (916)', gross_weight: 48.50, net_weight: 42.00, stone_weight: 6.50, metal_rate_applied: 6700.0, making_charge: 27300, stone_price: 18500, total_item_price: 327200, pieces: 1, created_at: '2026-08-26T17:45:00.000Z' },
    { id: 3, invoice_id: 3, product_id: 14, sku: 'WS-LOT-22K-01-S3', title: 'Wholesale Lot: 22K Casting Rings (25 pcs)', category: 'Rings', metal_type: 'Gold', purity: '22K (916)', gross_weight: 125.80, net_weight: 125.80, stone_weight: 0.0, metal_rate_applied: 6720.0, making_charge: 35224, stone_price: 0, total_item_price: 880224, pieces: 25, created_at: '2026-08-27T11:30:00.000Z' },
    { id: 4, invoice_id: 4, product_id: 9, sku: 'JW-DIA-001-S4', title: 'Solitaire Princess Cut Engagement Ring', category: 'Rings', metal_type: 'Gold', purity: '18K (750)', gross_weight: 5.20, net_weight: 5.00, stone_weight: 0.20, metal_rate_applied: 5500.0, making_charge: 7500, stone_price: 85000, total_item_price: 120000, pieces: 1, created_at: '2026-08-28T16:10:00.000Z' },
    { id: 5, invoice_id: 5, product_id: 15, sku: 'WS-LOT-22K-02-S5', title: 'Wholesale Lot: 22K Lightweight Chains (10 pcs)', category: 'Chains', metal_type: 'Gold', purity: '22K (916)', gross_weight: 84.50, net_weight: 84.50, stone_weight: 0.0, metal_rate_applied: 6745.0, making_charge: 21970, stone_price: 0, total_item_price: 591970, pieces: 10, created_at: '2026-08-29T12:00:00.000Z' }
  ];
  dataStore.auto_ids.sales_items = 5;

  dataStore.old_gold_transactions = [
    { id: 1, receipt_no: 'OG-20260825-1001', customer_name: 'Meera Singhania', customer_phone: '+91 98765 43210', gross_weight: 4.2, stone_dust_deduction: 0.2, net_weight: 4.0, purity_touch_pct: 87.5, fine_gold_weight: 3.5, valuation_rate_per_gram: 6250, total_valuation: 25000, settlement_mode: 'INVOICE_CREDIT', linked_invoice_no: 'INV-20260825-1001', notes: 'Exchanged 22k old broken ring', created_at: '2026-08-25T14:15:00.000Z' }
  ];
  dataStore.auto_ids.old_gold_transactions = 1;
}

export default db;
