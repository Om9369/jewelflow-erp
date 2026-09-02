import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_PATH   = isVercel ? path.join('/tmp', 'jewelflow.db') : path.join(__dirname, '../jewelflow.db');
const JSON_PATH = path.join(__dirname, '../jewelflow-data.json');
const BACKUP_DIR = isVercel ? path.join('/tmp', 'backups') : path.join(__dirname, '../backups');

// ─── Open / create database ─────────────────────────────────────────────────
export const db = new DatabaseSync(DB_PATH);

// WAL mode: crash-safe writes, fast concurrent reads
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// ─── Schema ─────────────────────────────────────────────────────────────────
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS metal_rates (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      metal         TEXT    NOT NULL,
      purity        TEXT    NOT NULL,
      rate_per_gram REAL    NOT NULL,
      currency      TEXT    NOT NULL DEFAULT 'INR',
      updated_at    TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
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
    );

    CREATE TABLE IF NOT EXISTS customers (
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
    );

    CREATE TABLE IF NOT EXISTS products (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      sku                 TEXT    NOT NULL,
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
      status              TEXT    NOT NULL DEFAULT 'IN_STOCK',
      cost_price          REAL    DEFAULT 0,
      notes               TEXT    DEFAULT '',
      created_at          TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales_invoices (
      id                         INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no                 TEXT    NOT NULL UNIQUE,
      type                       TEXT    NOT NULL,
      customer_id                INTEGER,
      customer_name              TEXT    NOT NULL,
      customer_phone             TEXT    DEFAULT '',
      employee_id                INTEGER NOT NULL,
      employee_name              TEXT    NOT NULL,
      subtotal                   REAL    NOT NULL,
      making_charges             REAL    DEFAULT 0,
      stone_charges              REAL    DEFAULT 0,
      old_gold_deduction         REAL    DEFAULT 0,
      discount                   REAL    DEFAULT 0,
      tax_amount                 REAL    DEFAULT 0,
      total_amount               REAL    NOT NULL,
      fine_gold_settlement_grams REAL    DEFAULT 0,
      cash_paid                  REAL    DEFAULT 0,
      payment_mode               TEXT    DEFAULT 'CASH',
      status                     TEXT    DEFAULT 'PAID',
      notes                      TEXT    DEFAULT '',
      created_at                 TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales_items (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id         INTEGER NOT NULL,
      product_id         INTEGER,
      sku                TEXT    DEFAULT '',
      title              TEXT    NOT NULL,
      category           TEXT    DEFAULT '',
      metal_type         TEXT    DEFAULT '',
      purity             TEXT    DEFAULT '',
      gross_weight       REAL    DEFAULT 0,
      net_weight         REAL    DEFAULT 0,
      stone_weight       REAL    DEFAULT 0,
      metal_rate_applied REAL    DEFAULT 0,
      making_charge      REAL    DEFAULT 0,
      stone_price        REAL    DEFAULT 0,
      total_item_price   REAL    NOT NULL,
      pieces             INTEGER DEFAULT 1,
      created_at         TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_ledger (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id     INTEGER,
      sku            TEXT    DEFAULT '',
      title          TEXT    DEFAULT '',
      movement_type  TEXT    NOT NULL,
      gross_weight   REAL    DEFAULT 0,
      net_weight     REAL    DEFAULT 0,
      reference_id   TEXT    DEFAULT '',
      reference_type TEXT    DEFAULT '',
      notes          TEXT    DEFAULT '',
      timestamp      TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS karigar_orders (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no             TEXT    NOT NULL UNIQUE,
      karigar_name         TEXT    NOT NULL,
      karigar_phone        TEXT    DEFAULT '',
      issue_date           TEXT    NOT NULL,
      due_date             TEXT    DEFAULT '',
      raw_metal_type       TEXT    NOT NULL,
      raw_metal_purity     TEXT    NOT NULL,
      raw_metal_weight     REAL    NOT NULL,
      expected_item_type   TEXT    DEFAULT '',
      expected_pieces      INTEGER DEFAULT 1,
      agreed_wastage_pct   REAL    DEFAULT 1.2,
      received_weight      REAL    DEFAULT 0,
      received_pieces      INTEGER DEFAULT 0,
      status               TEXT    DEFAULT 'IN_PROGRESS',
      fine_gold_balance_diff REAL  DEFAULT 0,
      notes                TEXT    DEFAULT '',
      created_at           TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS old_gold_transactions (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no              TEXT    NOT NULL UNIQUE,
      customer_name           TEXT    NOT NULL,
      customer_phone          TEXT    DEFAULT '',
      gross_weight            REAL    NOT NULL,
      stone_dust_deduction    REAL    DEFAULT 0,
      net_weight              REAL    NOT NULL,
      purity_touch_pct        REAL    NOT NULL,
      fine_gold_weight        REAL    NOT NULL,
      valuation_rate_per_gram REAL    NOT NULL,
      total_valuation         REAL    NOT NULL,
      settlement_mode         TEXT    DEFAULT 'INVOICE_CREDIT',
      linked_invoice_no       TEXT    DEFAULT '',
      notes                   TEXT    DEFAULT '',
      created_at              TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tray_audits (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_date            TEXT    NOT NULL,
      tray_name             TEXT    NOT NULL,
      category              TEXT    DEFAULT '',
      metal_type            TEXT    DEFAULT '',
      system_items_count    INTEGER DEFAULT 0,
      system_total_weight   REAL    DEFAULT 0,
      physical_items_count  INTEGER DEFAULT 0,
      physical_total_weight REAL    DEFAULT 0,
      variance_weight       REAL    DEFAULT 0,
      audited_by            TEXT    DEFAULT '',
      notes                 TEXT    DEFAULT '',
      status                TEXT    DEFAULT 'RECONCILED',
      created_at            TEXT    NOT NULL
    );
  `);

  _seedIfEmpty();
  _migrateFromJSON();
  _createBackup();

  console.log('✅ JewelFlow SQLite database ready:', DB_PATH);
}

// ─── Transaction helper (wraps BEGIN/COMMIT/ROLLBACK) ───────────────────────
// Provides db.transaction(fn) compatibility so controllers work unchanged
db.transaction = function(fn) {
  return function(...args) {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
};

// ─── Seed defaults only if tables are empty ──────────────────────────────────
function _seedIfEmpty() {
  const now = new Date().toISOString();

  const rateCount = db.prepare('SELECT COUNT(*) as c FROM metal_rates').get();
  if (rateCount.c === 0) {
    const ins = db.prepare(`INSERT INTO metal_rates (metal, purity, rate_per_gram, currency, updated_at) VALUES (?, ?, ?, 'INR', ?)`);
    db.exec('BEGIN');
    ins.run('Gold',     '24K (999)',   7250.0, now);
    ins.run('Gold',     '22K (916)',   6750.0, now);
    ins.run('Gold',     '18K (750)',   5550.0, now);
    ins.run('Gold',     '14K (585)',   4350.0, now);
    ins.run('Silver',   '999 Fine',     88.5,  now);
    ins.run('Silver',   '925 Sterling', 82.0,  now);
    ins.run('Platinum', '950 Pure',   3200.0,  now);
    db.exec('COMMIT');
  }

  const empCount = db.prepare('SELECT COUNT(*) as c FROM employees').get();
  if (empCount.c === 0) {
    const ins = db.prepare(`
      INSERT INTO employees (name, email, phone, role, target_monthly_revenue, target_monthly_grams, commission_rate_pct, avatar_color, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    db.exec('BEGIN');
    ins.run('Aarav Verma',     'aarav.v@jewelflow.com',  '+91 98201 12345', 'SALES_EXECUTIVE',  2000000, 300, 1.2, '#E11D48', now);
    ins.run('Pooja Patel',     'pooja.p@jewelflow.com',  '+91 98202 23456', 'SALES_EXECUTIVE',  2500000, 380, 1.5, '#7C3AED', now);
    ins.run('Rohan Mehta',     'rohan.m@jewelflow.com',  '+91 98203 34567', 'WHOLESALE_AGENT',  4500000, 700, 0.8, '#059669', now);
    ins.run('Neha Sharma',     'neha.s@jewelflow.com',   '+91 98204 45678', 'SALES_EXECUTIVE',  1800000, 260, 1.0, '#D97706', now);
    ins.run('Vikram Sen',      'vikram.s@jewelflow.com', '+91 98205 56789', 'WHOLESALE_AGENT',  5000000, 800, 0.75,'#2563EB', now);
    ins.run('Kavita Deshmukh', 'kavita.d@jewelflow.com', '+91 98206 67890', 'CASHIER',          1000000, 150, 0.5, '#0D9488', now);
    db.exec('COMMIT');
  }

  const custCount = db.prepare('SELECT COUNT(*) as c FROM customers').get();
  if (custCount.c === 0) {
    const ins = db.prepare(`
      INSERT INTO customers (name, phone, email, type, gst_number, pan_card, address, fine_gold_balance, cash_balance, loyalty_points, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    db.exec('BEGIN');
    ins.run('Meera Singhania',              '+91 98765 43210', 'meera@singhania.com',  'RETAIL_CUSTOMER', '',                 'ABCPS1234F', 'Bandra West, Mumbai',  0,      0,      450, now);
    ins.run('Rajesh Gupta',                 '+91 98111 22233', 'rajesh@gupta.com',     'RETAIL_CUSTOMER', '',                 'BRRPG9876L', 'Juhu, Mumbai',         0,      0,      120, now);
    ins.run('Shree Laxmi Jewellers (Pune)', '+91 98222 33344', 'orders@shreelaxmi.com','B2B_DEALER',      '27AAACS1234M1Z5',  'AAACS1234M', 'Laxmi Road, Pune',     48.50,  240000, 0,   now);
    ins.run('Mahalaxmi Ornaments (Surat)',  '+91 98333 44455', 'b2b@mahalaxmi.com',    'B2B_DEALER',      '24AABCM5678N1Z8',  'AABCM5678N', 'Varachha, Surat',      -12.20, 0,      0,   now);
    ins.run('Ananya Roy',                   '+91 98444 55566', 'ananya.roy@gmail.com', 'RETAIL_CUSTOMER', '',                 'CPRYA5544K', 'Andheri East, Mumbai', 0,      0,      80,  now);
    db.exec('COMMIT');
  }

  const prodCount = db.prepare('SELECT COUNT(*) as c FROM products').get();
  if (prodCount.c === 0) {
    const ins = db.prepare(`
      INSERT INTO products (sku,barcode,title,category,metal_type,purity,gross_weight,net_weight,stone_weight,stone_type,stone_cents,stone_price,wastage_pct,making_charge_type,making_charge_value,huid,counter_tray,item_type,pieces,touch_pct,fine_metal_weight,status,cost_price,notes,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    db.exec('BEGIN');
    ins.run('JW-GLD-001','8901001','Kundan Heritage Bridal Choker','Necklaces','Gold','22K (916)',48.5,42.0,6.5,'Ruby & Emerald CZ',32.5,18500,2.0,'PER_GRAM',650,'HUID916A8721','Showcase A - Tray 1','RETAIL_SINGLE',1,91.6,38.47,'IN_STOCK',280000,'Handcrafted antique royal collection',now);
    ins.run('JW-GLD-002','8901002','Classic Calcutta Filigree Bangle (Pair)','Bangles','Gold','22K (916)',32.4,32.4,0,'None',0,0,1.5,'PER_GRAM',480,'HUID916B1934','Showcase A - Tray 2','RETAIL_SINGLE',2,91.6,29.68,'IN_STOCK',215000,'Seamless hollow laser finished',now);
    ins.run('JW-GLD-003','8901003','Temple Lakshmi Peacock Jhumka','Earrings','Gold','22K (916)',18.2,16.8,1.4,'Synthetic Pearls & Garnet',7.0,4500,2.5,'PER_GRAM',550,'HUID916C4491','Showcase A - Tray 3','RETAIL_SINGLE',2,91.6,15.39,'IN_STOCK',115000,'South Indian traditional motif',now);
    ins.run('JW-GLD-004','8901004','Men Solid Rope Chain (24 inch)','Chains','Gold','22K (916)',24.6,24.6,0,'None',0,0,1.0,'PER_GRAM',380,'HUID916D5820','Showcase B - Tray 1','RETAIL_SINGLE',1,91.6,22.53,'IN_STOCK',165000,'Machine made heavy lock',now);
    ins.run('JW-GLD-005','8901005','Traditional Black Beaded Mangalsutra','Mangalsutra','Gold','22K (916)',15.8,13.5,2.3,'Black Beads & CZ',11.5,3200,1.5,'PER_GRAM',520,'HUID916E7712','Showcase B - Tray 2','RETAIL_SINGLE',1,91.6,12.37,'IN_STOCK',95000,'Dual line stringing with gold pendant',now);
    ins.run('JW-GLD-006','8901006','Floral Daily Wear Ring','Rings','Gold','22K (916)',4.8,4.8,0,'None',0,0,1.0,'PER_GRAM',420,'HUID916F8831','Showcase B - Tray 3','RETAIL_SINGLE',1,91.6,4.40,'IN_STOCK',32000,'Die stamped high polish',now);
    ins.run('JW-GLD-007','8901007','Lord Ganesha 24K Pure Gold Coin 10g','Coins & Bars','Gold','24K (999)',10.0,10.0,0,'None',0,0,0,'FIXED',350,'HUID999G1010','Vault Safe - Coin Box','RETAIL_SINGLE',1,99.9,9.99,'IN_STOCK',72000,'Tamper-proof blister packed with cert',now);
    ins.run('JW-GLD-008','8901008','Lakshmi 24K Pure Gold Bar 20g','Coins & Bars','Gold','24K (999)',20.0,20.0,0,'None',0,0,0,'FIXED',500,'HUID999H2020','Vault Safe - Coin Box','RETAIL_SINGLE',1,99.9,19.98,'IN_STOCK',144000,'NABL accredited lab certified bar',now);
    ins.run('JW-DIA-001','8902001','Solitaire Princess Cut Engagement Ring','Rings','Gold','18K (750)',5.2,5.0,0.2,'Natural Diamond VVS1-F',100,85000,0,'FIXED',7500,'HUID750D1122','Diamond Vault - Tray 1','RETAIL_SINGLE',1,75.0,3.75,'IN_STOCK',98000,'IGI Certified 1.00ct centre stone',now);
    ins.run('JW-DIA-002','8902002','Eternity Tennis Bracelet (3.5ct)','Bangles','Gold','18K (750)',16.5,15.8,0.7,'Natural Diamonds VS-GH',350,165000,0,'FIXED',14000,'HUID750D2233','Diamond Vault - Tray 2','RETAIL_SINGLE',1,75.0,11.85,'IN_STOCK',210000,'Four-prong setting, 52 round brilliants',now);
    ins.run('JW-DIA-003','8902003','Rose Gold Pear Halo Pendant with Chain','Pendants','Gold','18K (750)',6.8,6.45,0.35,'Natural Diamonds SI-IJ',175,42000,0,'FIXED',4500,'HUID750D3344','Diamond Vault - Tray 3','RETAIL_SINGLE',1,75.0,4.84,'IN_STOCK',68000,'Includes 18k 16-inch rose gold chain',now);
    ins.run('JW-SLV-001','8903001','Antique Temple Silver Pooja Thali Set','Pooja Items','Silver','999 Fine',450.0,450.0,0,'None',0,0,0.5,'PER_GRAM',18,'HUIDSLV001','Silver Showcase - Section A','RETAIL_SINGLE',1,99.9,449.55,'IN_STOCK',36000,'Includes thali, diya, agarbatti stand, bell',now);
    ins.run('JW-SLV-002','8903002','Bridal Ghungroo Payal Pair','Payal','Silver','925 Sterling',125.0,125.0,0,'None',0,0,2.0,'PER_GRAM',22,'HUIDSLV002','Silver Showcase - Section B','RETAIL_SINGLE',2,92.5,115.62,'IN_STOCK',10500,'Heavy ghungroo melody bells',now);
    ins.run('WS-LOT-22K-01','8904001','Wholesale Lot: 22K Casting Rings (25 pcs)','Rings','Gold','22K (916)',125.8,125.8,0,'None',0,0,0,'PER_GRAM',280,'LOT-22K-RNG25','Wholesale Vault - Drawer 1','WHOLESALE_LOT',25,91.6,115.23,'IN_STOCK',820000,'Assorted sizes #12 to #22',now);
    ins.run('WS-LOT-22K-02','8904002','Wholesale Lot: 22K Lightweight Chains (10 pcs)','Chains','Gold','22K (916)',84.5,84.5,0,'None',0,0,0,'PER_GRAM',260,'LOT-22K-CHN10','Wholesale Vault - Drawer 2','WHOLESALE_LOT',10,91.6,77.40,'IN_STOCK',555000,'Box chains and Singapore link mixed pack',now);
    ins.run('WS-LOT-18K-01','8904003','Wholesale Lot: 18K CZ Designer Studs (20 pairs)','Earrings','Gold','18K (750)',62.0,58.0,4.0,'Swiss CZ Grade AAA',20.0,8000,0,'PER_GRAM',320,'LOT-18K-STD20','Wholesale Vault - Drawer 3','WHOLESALE_LOT',20,75.0,43.50,'IN_STOCK',315000,'Screw-back micro pave setting',now);
    db.exec('COMMIT');
  }

  const invCount = db.prepare('SELECT COUNT(*) as c FROM sales_invoices').get();
  if (invCount.c === 0) {
    _seedSalesData();
  }
}

function _seedSalesData() {
  const now = new Date().toISOString();
  const ins = db.prepare(`
    INSERT INTO sales_invoices
      (invoice_no,type,customer_id,customer_name,customer_phone,employee_id,employee_name,
       subtotal,making_charges,stone_charges,old_gold_deduction,discount,tax_amount,
       total_amount,fine_gold_settlement_grams,cash_paid,payment_mode,status,notes,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insItem = db.prepare(`
    INSERT INTO sales_items
      (invoice_id,product_id,sku,title,category,metal_type,purity,gross_weight,net_weight,
       stone_weight,metal_rate_applied,making_charge,stone_price,total_item_price,pieces,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insOG = db.prepare(`
    INSERT INTO old_gold_transactions
      (receipt_no,customer_name,customer_phone,gross_weight,stone_dust_deduction,net_weight,
       purity_touch_pct,fine_gold_weight,valuation_rate_per_gram,total_valuation,
       settlement_mode,linked_invoice_no,notes,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  db.exec('BEGIN');
  const i1 = ins.run('INV-20260825-1001','RETAIL_SALE',1,'Meera Singhania','+91 98765 43210',1,'Aarav Verma',215000,15552,0,25000,2000,6106.56,209658.56,0,209658.56,'CARD','PAID','Retail Wedding purchase','2026-08-25T14:20:00.000Z');
  insItem.run(i1.lastInsertRowid,2,'JW-GLD-002-S1','Classic Calcutta Filigree Bangle','Bangles','Gold','22K (916)',32.4,32.4,0,6650,15552,0,230552,2,'2026-08-25T14:20:00.000Z');

  const i2 = ins.run('INV-20260826-1002','RETAIL_SALE',2,'Rajesh Gupta','+91 98111 22233',2,'Pooja Patel',335000,27300,18500,0,5000,11274,387074,0,387074,'UPI','PAID','Bridal Set purchase','2026-08-26T17:45:00.000Z');
  insItem.run(i2.lastInsertRowid,1,'JW-GLD-001-S2','Kundan Heritage Bridal Choker','Necklaces','Gold','22K (916)',48.5,42.0,6.5,6700,27300,18500,327200,1,'2026-08-26T17:45:00.000Z');

  const i3 = ins.run('WS-20260827-1003','WHOLESALE_CHALLAN',3,'Shree Laxmi Jewellers (Pune)','+91 98222 33344',3,'Rohan Mehta',845000,35224,0,0,0,0,880224,115.23,35224,'FINE_GOLD_PLUS_MAKING','PAID','Settled 115.23g Fine Gold + making charges','2026-08-27T11:30:00.000Z');
  insItem.run(i3.lastInsertRowid,14,'WS-LOT-22K-01-S3','Wholesale Lot: 22K Casting Rings','Rings','Gold','22K (916)',125.8,125.8,0,6720,35224,0,880224,25,'2026-08-27T11:30:00.000Z');

  const i4 = ins.run('INV-20260828-1004','RETAIL_SALE',5,'Ananya Roy','+91 98444 55566',4,'Neha Sharma',112000,7500,85000,0,2500,6060,208060,0,208060,'CARD','PAID','Solitaire engagement purchase','2026-08-28T16:10:00.000Z');
  insItem.run(i4.lastInsertRowid,9,'JW-DIA-001-S4','Solitaire Princess Cut Engagement Ring','Rings','Gold','18K (750)',5.2,5.0,0.2,5500,7500,85000,120000,1,'2026-08-28T16:10:00.000Z');

  const i5 = ins.run('WS-20260829-1005','WHOLESALE_CHALLAN',4,'Mahalaxmi Ornaments (Surat)','+91 98333 44455',5,'Vikram Sen',570000,21970,0,0,0,0,591970,77.40,21970,'FINE_GOLD_PLUS_MAKING','PAID','Dispatched via armored logistics','2026-08-29T12:00:00.000Z');
  insItem.run(i5.lastInsertRowid,15,'WS-LOT-22K-02-S5','Wholesale Lot: 22K Lightweight Chains','Chains','Gold','22K (916)',84.5,84.5,0,6745,21970,0,591970,10,'2026-08-29T12:00:00.000Z');

  insOG.run('OG-20260825-1001','Meera Singhania','+91 98765 43210',4.2,0.2,4.0,87.5,3.5,6250,25000,'INVOICE_CREDIT','INV-20260825-1001','Exchanged 22k old broken ring','2026-08-25T14:15:00.000Z');
  db.exec('COMMIT');
}

// ─── Migrate legacy JSON data ───────────────────────────────────────────────
function _migrateFromJSON() {
  if (!fs.existsSync(JSON_PATH)) return;

  let legacy;
  try {
    legacy = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  } catch {
    console.warn('⚠️  Could not parse legacy JSON — skipping migration');
    return;
  }

  const legacyInvCount  = (legacy.sales_invoices || []).length;
  const currentInvCount = db.prepare('SELECT COUNT(*) as c FROM sales_invoices').get().c;
  if (legacyInvCount <= currentInvCount) return;

  console.log(`🔄  Migrating ${legacyInvCount} legacy invoices from JSON → SQLite...`);

  // Customers
  const existingCusts = new Set(db.prepare('SELECT name FROM customers').all().map(r => r.name));
  const insCust = db.prepare(`INSERT OR IGNORE INTO customers (name,phone,email,type,gst_number,pan_card,address,fine_gold_balance,cash_balance,loyalty_points,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  for (const c of (legacy.customers || [])) {
    if (!existingCusts.has(c.name)) insCust.run(c.name,c.phone||'',c.email||'',c.type||'RETAIL_CUSTOMER',c.gst_number||'',c.pan_card||'',c.address||'',c.fine_gold_balance||0,c.cash_balance||0,c.loyalty_points||0,c.created_at||new Date().toISOString());
  }

  // Products
  const existingSkus = new Set(db.prepare('SELECT sku FROM products').all().map(r => r.sku));
  const insProd = db.prepare(`INSERT OR IGNORE INTO products (sku,barcode,title,category,metal_type,purity,gross_weight,net_weight,stone_weight,stone_type,stone_cents,stone_price,wastage_pct,making_charge_type,making_charge_value,huid,counter_tray,item_type,pieces,touch_pct,fine_metal_weight,status,cost_price,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const p of (legacy.products || [])) {
    if (!existingSkus.has(p.sku)) insProd.run(p.sku,p.barcode||'',p.title,p.category,p.metal_type,p.purity,p.gross_weight,p.net_weight,p.stone_weight||0,p.stone_type||'None',p.stone_cents||0,p.stone_price||0,p.wastage_pct||0,p.making_charge_type||'PER_GRAM',p.making_charge_value||0,p.huid||'',p.counter_tray||'',p.item_type||'RETAIL_SINGLE',p.pieces||1,p.touch_pct||91.6,p.fine_metal_weight||0,p.status||'IN_STOCK',p.cost_price||0,p.notes||'',p.created_at||new Date().toISOString());
  }

  // Invoices + Items
  const existingInvNos = new Set(db.prepare('SELECT invoice_no FROM sales_invoices').all().map(r => r.invoice_no));
  const insInv  = db.prepare(`INSERT OR IGNORE INTO sales_invoices (invoice_no,type,customer_id,customer_name,customer_phone,employee_id,employee_name,subtotal,making_charges,stone_charges,old_gold_deduction,discount,tax_amount,total_amount,fine_gold_settlement_grams,cash_paid,payment_mode,status,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insItm  = db.prepare(`INSERT INTO sales_items (invoice_id,product_id,sku,title,category,metal_type,purity,gross_weight,net_weight,stone_weight,metal_rate_applied,making_charge,stone_price,total_item_price,pieces,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  db.exec('BEGIN');
  for (const inv of (legacy.sales_invoices || [])) {
    if (existingInvNos.has(inv.invoice_no)) continue;
    const res = insInv.run(inv.invoice_no,inv.type,inv.customer_id||null,inv.customer_name,inv.customer_phone||'',inv.employee_id,inv.employee_name,inv.subtotal||0,inv.making_charges||0,inv.stone_charges||0,inv.old_gold_deduction||0,inv.discount||0,inv.tax_amount||0,inv.total_amount,inv.fine_gold_settlement_grams||0,inv.cash_paid||0,inv.payment_mode||'CASH',inv.status||'PAID',inv.notes||'',inv.created_at||new Date().toISOString());
    for (const item of (legacy.sales_items||[]).filter(i=>i.invoice_id===inv.id)) {
      insItm.run(res.lastInsertRowid,item.product_id||null,item.sku||'',item.title,item.category||'',item.metal_type||'',item.purity||'',item.gross_weight||0,item.net_weight||0,item.stone_weight||0,item.metal_rate_applied||0,item.making_charge||0,item.stone_price||0,item.total_item_price||0,item.pieces||1,item.created_at||new Date().toISOString());
    }
  }
  db.exec('COMMIT');

  // Old Gold
  const existingReceipts = new Set(db.prepare('SELECT receipt_no FROM old_gold_transactions').all().map(r=>r.receipt_no));
  const insOG = db.prepare(`INSERT OR IGNORE INTO old_gold_transactions (receipt_no,customer_name,customer_phone,gross_weight,stone_dust_deduction,net_weight,purity_touch_pct,fine_gold_weight,valuation_rate_per_gram,total_valuation,settlement_mode,linked_invoice_no,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const og of (legacy.old_gold_transactions||[])) {
    if (!existingReceipts.has(og.receipt_no)) insOG.run(og.receipt_no,og.customer_name,og.customer_phone||'',og.gross_weight,og.stone_dust_deduction||0,og.net_weight,og.purity_touch_pct,og.fine_gold_weight,og.valuation_rate_per_gram,og.total_valuation,og.settlement_mode||'INVOICE_CREDIT',og.linked_invoice_no||'',og.notes||'',og.created_at||new Date().toISOString());
  }

  console.log('✅  Legacy JSON migration complete.');
}

// ─── Daily rotating backup (copy file) ─────────────────────────────────────
function _createBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const dateStr    = new Date().toISOString().slice(0, 10);
    const backupPath = path.join(BACKUP_DIR, `jewelflow-${dateStr}.db`);
    if (!fs.existsSync(backupPath) && fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`💾  Daily backup saved: ${backupPath}`);
    }
  } catch (err) {
    console.warn('⚠️  Backup skipped:', err.message);
  }
}

export default db;
