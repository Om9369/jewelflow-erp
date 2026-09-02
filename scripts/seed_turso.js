import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TURSO_URL = process.env.TURSO_DATABASE_URL || process.argv[2];
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || process.argv[3];

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
  process.exit(1);
}

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN
});

async function seedTurso() {
  console.log('🚀 Connecting to Turso Cloud SQLite at:', TURSO_URL);

  const schemas = [
    `CREATE TABLE IF NOT EXISTS metal_rates (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      metal         TEXT    NOT NULL,
      purity        TEXT    NOT NULL,
      rate_per_gram REAL    NOT NULL,
      currency      TEXT    NOT NULL DEFAULT 'INR',
      updated_at    TEXT    NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS employees (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      name                    TEXT    NOT NULL,
      email                   TEXT    DEFAULT '',
      phone                   TEXT    NOT NULL,
      role                    TEXT    NOT NULL DEFAULT 'SALES_EXECUTIVE',
      target_monthly_revenue  REAL    DEFAULT 2000000,
      target_monthly_grams    REAL    DEFAULT 300,
      commission_rate_pct     REAL    DEFAULT 1.0,
      avatar_color            TEXT    DEFAULT '#D97706',
      active                  INTEGER DEFAULT 1,
      created_at              TEXT    NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS customers (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT    NOT NULL,
      phone             TEXT    NOT NULL,
      email             TEXT    DEFAULT '',
      type              TEXT    NOT NULL DEFAULT 'RETAIL_CUSTOMER',
      gst_number        TEXT    DEFAULT '',
      pan_card          TEXT    DEFAULT '',
      address           TEXT    DEFAULT '',
      fine_gold_balance REAL    DEFAULT 0,
      cash_balance      REAL    DEFAULT 0,
      loyalty_points    INTEGER DEFAULT 0,
      created_at        TEXT    NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS products (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      sku                 TEXT    NOT NULL UNIQUE,
      barcode             TEXT    DEFAULT '',
      title               TEXT    NOT NULL,
      category            TEXT    NOT NULL,
      metal_type          TEXT    NOT NULL,
      purity              TEXT    NOT NULL,
      gross_weight        REAL    NOT NULL,
      net_weight          REAL    NOT NULL,
      stone_weight        REAL    DEFAULT 0,
      stone_type          TEXT    DEFAULT 'None',
      stone_cents         REAL    DEFAULT 0,
      stone_price         REAL    DEFAULT 0,
      wastage_pct         REAL    DEFAULT 0,
      making_charge_type  TEXT    DEFAULT 'PER_GRAM',
      making_charge_value REAL    DEFAULT 0,
      huid                TEXT    DEFAULT '',
      counter_tray        TEXT    DEFAULT '',
      item_type           TEXT    DEFAULT 'RETAIL_SINGLE',
      pieces              INTEGER DEFAULT 1,
      touch_pct           REAL    DEFAULT 91.6,
      fine_metal_weight   REAL    DEFAULT 0,
      status              TEXT    DEFAULT 'IN_STOCK',
      cost_price          REAL    DEFAULT 0,
      notes               TEXT    DEFAULT '',
      created_at          TEXT    NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS sales_invoices (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no                  TEXT    NOT NULL UNIQUE,
      type                        TEXT    NOT NULL DEFAULT 'RETAIL_TAX_INVOICE',
      customer_id                 INTEGER,
      customer_name               TEXT    NOT NULL,
      customer_phone              TEXT    DEFAULT '',
      employee_id                 INTEGER NOT NULL,
      employee_name               TEXT    NOT NULL,
      subtotal                    REAL    NOT NULL,
      making_charges              REAL    DEFAULT 0,
      stone_charges               REAL    DEFAULT 0,
      old_gold_deduction          REAL    DEFAULT 0,
      discount                    REAL    DEFAULT 0,
      tax_amount                  REAL    DEFAULT 0,
      total_amount                REAL    NOT NULL,
      fine_gold_settlement_grams  REAL    DEFAULT 0,
      cash_paid                   REAL    DEFAULT 0,
      payment_mode                TEXT    DEFAULT 'CASH',
      status                      TEXT    DEFAULT 'PAID',
      notes                       TEXT    DEFAULT '',
      created_at                  TEXT    NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS sales_items (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id          INTEGER NOT NULL,
      product_id          INTEGER,
      sku                 TEXT    DEFAULT '',
      title               TEXT    NOT NULL,
      category            TEXT    DEFAULT '',
      metal_type          TEXT    DEFAULT 'Gold',
      purity              TEXT    DEFAULT '22K (916)',
      gross_weight        REAL    DEFAULT 0,
      net_weight          REAL    DEFAULT 0,
      stone_weight        REAL    DEFAULT 0,
      metal_rate_applied  REAL    DEFAULT 0,
      making_charge       REAL    DEFAULT 0,
      stone_price         REAL    DEFAULT 0,
      total_item_price    REAL    NOT NULL,
      pieces              INTEGER DEFAULT 1,
      created_at          TEXT    NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS stock_ledger (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id          INTEGER,
      sku                 TEXT    DEFAULT '',
      movement_type       TEXT    NOT NULL,
      gross_weight_delta  REAL    NOT NULL,
      net_weight_delta    REAL    NOT NULL,
      reference_doc       TEXT    DEFAULT '',
      notes               TEXT    DEFAULT '',
      timestamp           TEXT    NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS karigar_orders (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no          TEXT    NOT NULL UNIQUE,
      karigar_name      TEXT    NOT NULL,
      karigar_phone     TEXT    DEFAULT '',
      item_description  TEXT    NOT NULL,
      raw_metal_type    TEXT    NOT NULL DEFAULT 'Gold',
      raw_metal_weight  REAL    NOT NULL,
      issued_purity     TEXT    NOT NULL DEFAULT '24K (999)',
      expected_purity   TEXT    NOT NULL DEFAULT '22K (916)',
      status            TEXT    DEFAULT 'ISSUED',
      due_date          TEXT    DEFAULT '',
      created_at        TEXT    NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS old_gold_transactions (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no                TEXT    NOT NULL UNIQUE,
      customer_name             TEXT    NOT NULL,
      customer_phone            TEXT    DEFAULT '',
      gross_weight              REAL    NOT NULL,
      stone_dust_deduction      REAL    DEFAULT 0,
      net_weight                REAL    NOT NULL,
      purity_touch_pct          REAL    NOT NULL,
      fine_gold_weight          REAL    NOT NULL,
      valuation_rate_per_gram   REAL    NOT NULL,
      total_valuation           REAL    NOT NULL,
      settlement_mode           TEXT    DEFAULT 'INVOICE_CREDIT',
      linked_invoice_no         TEXT    DEFAULT '',
      notes                     TEXT    DEFAULT '',
      created_at                TEXT    NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS tray_audits (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      tray_name     TEXT    NOT NULL,
      expected_pcs  INTEGER NOT NULL,
      scanned_pcs   INTEGER NOT NULL,
      difference    INTEGER NOT NULL,
      status        TEXT    NOT NULL,
      audited_by    TEXT    NOT NULL,
      created_at    TEXT    NOT NULL
    );`
  ];

  for (const sql of schemas) {
    await client.execute(sql);
  }
  console.log('✅ Schemas created in Turso.');

  // Load JSON seeds if table is empty
  const ratesCheck = await client.execute('SELECT COUNT(*) as cnt FROM metal_rates');
  if (ratesCheck.rows[0].cnt === 0) {
    const jsonPath = path.join(__dirname, '../server/jewelflow-data.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      // Seed metal rates
      for (const r of (data.metal_rates || [])) {
        await client.execute({
          sql: 'INSERT INTO metal_rates (metal, purity, rate_per_gram, currency, updated_at) VALUES (?, ?, ?, ?, ?)',
          args: [r.metal, r.purity, r.rate_per_gram, r.currency || 'INR', r.updated_at || new Date().toISOString()]
        });
      }

      // Seed employees
      for (const e of (data.employees || [])) {
        await client.execute({
          sql: 'INSERT INTO employees (name, email, phone, role, target_monthly_revenue, target_monthly_grams, commission_rate_pct, avatar_color, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [e.name, e.email || '', e.phone || '', e.role || 'SALES_EXECUTIVE', e.target_monthly_revenue || 2000000, e.target_monthly_grams || 300, e.commission_rate_pct || 1.0, e.avatar_color || '#D97706', e.active ?? 1, e.created_at || new Date().toISOString()]
        });
      }

      // Seed customers
      for (const c of (data.customers || [])) {
        await client.execute({
          sql: 'INSERT INTO customers (name, phone, email, type, gst_number, pan_card, address, fine_gold_balance, cash_balance, loyalty_points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [c.name, c.phone, c.email || '', c.type || 'RETAIL_CUSTOMER', c.gst_number || '', c.pan_card || '', c.address || '', c.fine_gold_balance || 0, c.cash_balance || 0, c.loyalty_points || 0, c.created_at || new Date().toISOString()]
        });
      }

      // Seed products
      for (const p of (data.products || [])) {
        await client.execute({
          sql: 'INSERT INTO products (sku, barcode, title, category, metal_type, purity, gross_weight, net_weight, stone_weight, stone_type, stone_cents, stone_price, wastage_pct, making_charge_type, making_charge_value, huid, counter_tray, item_type, pieces, touch_pct, fine_metal_weight, status, cost_price, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [p.sku, p.barcode || '', p.title, p.category, p.metal_type, p.purity, p.gross_weight, p.net_weight, p.stone_weight || 0, p.stone_type || 'None', p.stone_cents || 0, p.stone_price || 0, p.wastage_pct || 0, p.making_charge_type || 'PER_GRAM', p.making_charge_value || 0, p.huid || '', p.counter_tray || '', p.item_type || 'RETAIL_SINGLE', p.pieces || 1, p.touch_pct || 91.6, p.fine_metal_weight || 0, p.status || 'IN_STOCK', p.cost_price || 0, p.notes || '', p.created_at || new Date().toISOString()]
        });
      }

      // Seed sales invoices
      for (const inv of (data.sales_invoices || [])) {
        const invRes = await client.execute({
          sql: 'INSERT INTO sales_invoices (invoice_no, type, customer_id, customer_name, customer_phone, employee_id, employee_name, subtotal, making_charges, stone_charges, old_gold_deduction, discount, tax_amount, total_amount, fine_gold_settlement_grams, cash_paid, payment_mode, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [inv.invoice_no, inv.type || 'RETAIL_TAX_INVOICE', inv.customer_id || null, inv.customer_name, inv.customer_phone || '', inv.employee_id, inv.employee_name, inv.subtotal || 0, inv.making_charges || 0, inv.stone_charges || 0, inv.old_gold_deduction || 0, inv.discount || 0, inv.tax_amount || 0, inv.total_amount, inv.fine_gold_settlement_grams || 0, inv.cash_paid || 0, inv.payment_mode || 'CASH', inv.status || 'PAID', inv.notes || '', inv.created_at || new Date().toISOString()]
        });

        const invoiceId = Number(invRes.lastInsertRowid);
        for (const it of (data.sales_items || []).filter(i => i.invoice_id === inv.id)) {
          await client.execute({
            sql: 'INSERT INTO sales_items (invoice_id, product_id, sku, title, category, metal_type, purity, gross_weight, net_weight, stone_weight, metal_rate_applied, making_charge, stone_price, total_item_price, pieces, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            args: [invoiceId, it.product_id || null, it.sku || '', it.title, it.category || '', it.metal_type || '', it.purity || '', it.gross_weight || 0, it.net_weight || 0, it.stone_weight || 0, it.metal_rate_applied || 0, it.making_charge || 0, it.stone_price || 0, it.total_item_price || 0, it.pieces || 1, it.created_at || new Date().toISOString()]
          });
        }
      }

      console.log('✅ Initial Seed Data Migrated to Turso Cloud SQLite successfully!');
    }
  }

  const counts = await client.batch([
    'SELECT COUNT(*) as count FROM metal_rates',
    'SELECT COUNT(*) as count FROM employees',
    'SELECT COUNT(*) as count FROM customers',
    'SELECT COUNT(*) as count FROM products',
    'SELECT COUNT(*) as count FROM sales_invoices'
  ]);

  console.log('📊 Turso Cloud Live Records:');
  console.log(` - Rates: ${counts[0].rows[0].count}`);
  console.log(` - Employees: ${counts[1].rows[0].count}`);
  console.log(` - Customers: ${counts[2].rows[0].count}`);
  console.log(` - Inventory: ${counts[3].rows[0].count}`);
  console.log(` - Invoices: ${counts[4].rows[0].count}`);
}

seedTurso().catch(console.error);
