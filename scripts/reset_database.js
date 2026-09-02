import dns from 'node:dns';
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch(e) {}

import { connectMongo } from '../server/src/dbMongo.js';
import {
  Product,
  Customer,
  Employee,
  SalesInvoice,
  OldGoldTransaction,
  StockLedger,
  TrayAudit,
  KarigarOrder,
  MetalRate
} from '../server/src/models/index.js';

async function resetAll() {
  console.log('🧹 Connecting to MongoDB Atlas to reset database...\n');
  await connectMongo();

  console.log('🗑️  Deleting all Products...');
  await Product.deleteMany({});

  console.log('🗑️  Deleting all Customers...');
  await Customer.deleteMany({});

  console.log('🗑️  Deleting all Employees...');
  await Employee.deleteMany({});

  console.log('🗑️  Deleting all Sales Invoices...');
  await SalesInvoice.deleteMany({});

  console.log('🗑️  Deleting all Old Gold Transactions...');
  await OldGoldTransaction.deleteMany({});

  console.log('🗑️  Deleting all Stock Ledger entries...');
  await StockLedger.deleteMany({});

  console.log('🗑️  Deleting all Tray Audits...');
  await TrayAudit.deleteMany({});

  console.log('🗑️  Deleting all Karigar Orders...');
  await KarigarOrder.deleteMany({});

  // Reset standard metal rates
  console.log('⚖️  Resetting standard Metal Rates...');
  await MetalRate.deleteMany({});
  await MetalRate.insertMany([
    { metal: 'Gold', purity: '24K (999)', rate_per_gram: 7250, currency: 'INR' },
    { metal: 'Gold', purity: '22K (916)', rate_per_gram: 6750, currency: 'INR' },
    { metal: 'Gold', purity: '18K (750)', rate_per_gram: 5550, currency: 'INR' },
    { metal: 'Gold', purity: '14K (585)', rate_per_gram: 4350, currency: 'INR' },
    { metal: 'Silver', purity: '999 Fine', rate_per_gram: 88.5, currency: 'INR' },
    { metal: 'Silver', purity: '925 Sterling', rate_per_gram: 82, currency: 'INR' },
    { metal: 'Platinum', purity: '950 Pure', rate_per_gram: 3200, currency: 'INR' }
  ]);

  console.log('\n✨ Database is now completely clean and ready for fresh testing!');
  process.exit(0);
}

resetAll().catch(console.error);
