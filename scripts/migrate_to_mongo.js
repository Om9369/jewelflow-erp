import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import { MongoClient } from 'mongodb';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_DB_PATH = path.join(__dirname, '../server/jewelflow.db');
const MONGO_URI = process.env.MONGODB_URI || process.argv[2];

if (!MONGO_URI) {
  console.log('❌ Please provide your MongoDB connection string:');
  console.log('Usage: node scripts/migrate_to_mongo.js "mongodb+srv://..."');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Connecting to MongoDB Atlas with MongoClient...');
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log('✅ Connected to MongoDB Atlas successfully.\n');

  const db = client.db('jewelflow');
  const localDb = new DatabaseSync(LOCAL_DB_PATH);

  // 1. Metal Rates
  const rates = localDb.prepare('SELECT * FROM metal_rates').all();
  const ratesCol = db.collection('metal_rates');
  await ratesCol.deleteMany({});
  if (rates.length > 0) {
    await ratesCol.insertMany(rates.map(r => ({
      metal: r.metal,
      purity: r.purity,
      rate_per_gram: r.rate_per_gram,
      currency: r.currency || 'INR',
      updated_at: r.updated_at ? new Date(r.updated_at) : new Date()
    })));
  }
  console.log(`✅ Migrated ${rates.length} Metal Rates to MongoDB.`);

  // 2. Employees
  const employees = localDb.prepare('SELECT * FROM employees').all();
  const empCol = db.collection('employees');
  await empCol.deleteMany({});
  if (employees.length > 0) {
    await empCol.insertMany(employees.map(e => ({
      name: e.name,
      email: e.email || '',
      phone: e.phone,
      role: e.role || 'SALES_EXECUTIVE',
      target_monthly_revenue: e.target_monthly_revenue || 2000000,
      target_monthly_grams: e.target_monthly_grams || 300,
      commission_rate_pct: e.commission_rate_pct || 1.0,
      avatar_color: e.avatar_color || '#D97706',
      active: e.active ?? 1,
      created_at: e.created_at ? new Date(e.created_at) : new Date()
    })));
  }
  console.log(`✅ Migrated ${employees.length} Employees to MongoDB.`);

  // 3. Customers
  const customers = localDb.prepare('SELECT * FROM customers').all();
  const custCol = db.collection('customers');
  await custCol.deleteMany({});
  if (customers.length > 0) {
    await custCol.insertMany(customers.map(c => ({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      type: c.type || 'RETAIL_CUSTOMER',
      gst_number: c.gst_number || '',
      pan_card: c.pan_card || '',
      address: c.address || '',
      fine_gold_balance: c.fine_gold_balance || 0,
      cash_balance: c.cash_balance || 0,
      loyalty_points: c.loyalty_points || 0,
      created_at: c.created_at ? new Date(c.created_at) : new Date()
    })));
  }
  console.log(`✅ Migrated ${customers.length} Customers to MongoDB.`);

  // 4. Products
  const products = localDb.prepare('SELECT * FROM products').all();
  const prodCol = db.collection('products');
  await prodCol.deleteMany({});
  if (products.length > 0) {
    await prodCol.insertMany(products.map(p => ({
      sku: p.sku,
      barcode: p.barcode || '',
      title: p.title,
      category: p.category,
      metal_type: p.metal_type,
      purity: p.purity,
      gross_weight: p.gross_weight,
      net_weight: p.net_weight,
      stone_weight: p.stone_weight || 0,
      stone_type: p.stone_type || 'None',
      stone_cents: p.stone_cents || 0,
      stone_price: p.stone_price || 0,
      wastage_pct: p.wastage_pct || 0,
      making_charge_type: p.making_charge_type || 'PER_GRAM',
      making_charge_value: p.making_charge_value || 0,
      huid: p.huid || '',
      counter_tray: p.counter_tray || '',
      item_type: p.item_type || 'RETAIL_SINGLE',
      pieces: p.pieces || 1,
      touch_pct: p.touch_pct || 91.6,
      fine_metal_weight: p.fine_metal_weight || 0,
      status: p.status || 'IN_STOCK',
      cost_price: p.cost_price || 0,
      notes: p.notes || '',
      created_at: p.created_at ? new Date(p.created_at) : new Date()
    })));
  }
  console.log(`✅ Migrated ${products.length} Products to MongoDB.`);

  // 5. Sales Invoices & Items
  const invoices = localDb.prepare('SELECT * FROM sales_invoices').all();
  const items = localDb.prepare('SELECT * FROM sales_items').all();
  const invCol = db.collection('sales_invoices');
  await invCol.deleteMany({});

  if (invoices.length > 0) {
    const formattedInvoices = invoices.map(inv => {
      const invItems = items.filter(i => i.invoice_id === inv.id);
      return {
        invoice_no: inv.invoice_no,
        type: inv.type || 'RETAIL_TAX_INVOICE',
        customer_name: inv.customer_name,
        customer_phone: inv.customer_phone || '',
        employee_name: inv.employee_name || 'Staff',
        subtotal: inv.subtotal || 0,
        making_charges: inv.making_charges || 0,
        stone_charges: inv.stone_charges || 0,
        old_gold_deduction: inv.old_gold_deduction || 0,
        discount: inv.discount || 0,
        tax_amount: inv.tax_amount || 0,
        total_amount: inv.total_amount,
        fine_gold_settlement_grams: inv.fine_gold_settlement_grams || 0,
        cash_paid: inv.cash_paid || 0,
        payment_mode: inv.payment_mode || 'CASH',
        status: inv.status || 'PAID',
        notes: inv.notes || '',
        items: invItems.map(it => ({
          sku: it.sku || '',
          title: it.title,
          category: it.category || '',
          metal_type: it.metal_type || 'Gold',
          purity: it.purity || '22K (916)',
          gross_weight: it.gross_weight || 0,
          net_weight: it.net_weight || 0,
          stone_weight: it.stone_weight || 0,
          metal_rate_applied: it.metal_rate_applied || 0,
          making_charge: it.making_charge || 0,
          stone_price: it.stone_price || 0,
          total_item_price: it.total_item_price || 0,
          pieces: it.pieces || 1,
          created_at: it.created_at ? new Date(it.created_at) : new Date()
        })),
        created_at: inv.created_at ? new Date(inv.created_at) : new Date()
      };
    });
    await invCol.insertMany(formattedInvoices);
  }
  console.log(`✅ Migrated ${invoices.length} Sales Invoices to MongoDB.`);

  // 6. Old Gold
  const oldGold = localDb.prepare('SELECT * FROM old_gold_transactions').all();
  const ogCol = db.collection('old_gold_transactions');
  await ogCol.deleteMany({});
  if (oldGold.length > 0) {
    await ogCol.insertMany(oldGold.map(og => ({
      receipt_no: og.receipt_no,
      customer_name: og.customer_name,
      customer_phone: og.customer_phone || '',
      gross_weight: og.gross_weight,
      stone_dust_deduction: og.stone_dust_deduction || 0,
      net_weight: og.net_weight,
      purity_touch_pct: og.purity_touch_pct,
      fine_gold_weight: og.fine_gold_weight,
      valuation_rate_per_gram: og.valuation_rate_per_gram,
      total_valuation: og.total_valuation,
      settlement_mode: og.settlement_mode || 'INVOICE_CREDIT',
      linked_invoice_no: og.linked_invoice_no || '',
      notes: og.notes || '',
      created_at: og.created_at ? new Date(og.created_at) : new Date()
    })));
  }
  console.log(`✅ Migrated ${oldGold.length} Old Gold Transactions to MongoDB.`);

  console.log('\n🎉 ALL SQLITE DATA SUCCESSFULLY MIGRATED TO MONGODB ATLAS!');
  await client.close();
}

migrate().catch(console.error);
