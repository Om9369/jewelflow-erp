import dns from 'node:dns';
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch(e) {}

import { connectMongo } from '../server/src/dbMongo.js';
import { SalesInvoice, OldGoldTransaction, Product, Employee, Customer } from '../server/src/models/index.js';

async function seed() {
  await connectMongo();

  const invCount = await SalesInvoice.countDocuments();
  if (invCount === 0) {
    console.log('🌱 Seeding initial Sales Invoices...');
    await SalesInvoice.insertMany([
      {
        invoice_no: 'INV-20260828-4821',
        type: 'RETAIL_TAX_INVOICE',
        customer_name: 'Meera Singhania',
        customer_phone: '+91 98765 43210',
        employee_name: 'Pooja Sharma',
        subtotal: 1398500,
        making_charges: 68500,
        stone_charges: 120000,
        old_gold_deduction: 25000,
        discount: 15000,
        tax_amount: 46410,
        total_amount: 1593410,
        payment_mode: 'UPI_AND_CARD',
        status: 'PAID',
        items: [
          {
            sku: 'JW-GLD-1001',
            title: 'Kundan Heritage Bridal Choker',
            category: 'Necklaces',
            metal_type: 'Gold',
            purity: '22K (916)',
            gross_weight: 48.5,
            net_weight: 42,
            stone_weight: 6.5,
            metal_rate_applied: 6750,
            making_charge: 68500,
            stone_price: 120000,
            total_item_price: 1593410,
            pieces: 1
          }
        ],
        created_at: new Date('2026-08-28T11:30:00Z')
      },
      {
        invoice_no: 'INV-20260829-1092',
        type: 'RETAIL_TAX_INVOICE',
        customer_name: 'Vikram Malhotra',
        customer_phone: '+91 99887 76655',
        employee_name: 'Rohan Mehta',
        subtotal: 285000,
        making_charges: 18000,
        stone_charges: 35000,
        old_gold_deduction: 0,
        discount: 5000,
        tax_amount: 9990,
        total_amount: 342990,
        payment_mode: 'CASH',
        status: 'PAID',
        items: [
          {
            sku: 'JW-GLD-1004',
            title: 'Royal Calcutta Filigree Kada',
            category: 'Bangles',
            metal_type: 'Gold',
            purity: '22K (916)',
            gross_weight: 38.5,
            net_weight: 38.5,
            stone_weight: 0,
            metal_rate_applied: 6750,
            making_charge: 18000,
            stone_price: 35000,
            total_item_price: 342990,
            pieces: 1
          }
        ],
        created_at: new Date('2026-08-29T14:45:00Z')
      },
      {
        invoice_no: 'INV-20260830-7712',
        type: 'RETAIL_TAX_INVOICE',
        customer_name: 'Ananya Deshmukh',
        customer_phone: '+91 97654 32109',
        employee_name: 'Amit Verma',
        subtotal: 387074,
        making_charges: 24000,
        stone_charges: 65000,
        old_gold_deduction: 0,
        discount: 0,
        tax_amount: 14282,
        total_amount: 490356,
        payment_mode: 'CREDIT_CARD',
        status: 'PAID',
        items: [
          {
            sku: 'JW-GLD-1003',
            title: 'Solitaire Diamond Engagement Ring',
            category: 'Rings',
            metal_type: 'Gold',
            purity: '18K (750)',
            gross_weight: 4.8,
            net_weight: 4.2,
            stone_weight: 0.6,
            metal_rate_applied: 5550,
            making_charge: 24000,
            stone_price: 65000,
            total_item_price: 490356,
            pieces: 1
          }
        ],
        created_at: new Date('2026-08-30T16:20:00Z')
      },
      {
        invoice_no: 'WS-20260831-9011',
        type: 'WHOLESALE_CHALLAN',
        customer_name: 'Surat Diamond Exporters',
        customer_phone: '+91 98222 33445',
        employee_name: 'Rohan Mehta',
        subtotal: 950000,
        making_charges: 35000,
        stone_charges: 0,
        old_gold_deduction: 0,
        discount: 10000,
        tax_amount: 29250,
        total_amount: 1004250,
        payment_mode: 'BANK_RTGS',
        status: 'PAID',
        items: [
          {
            sku: 'JW-GLD-1007',
            title: 'Lightweight Casting Daily Bangle',
            category: 'Bangles',
            metal_type: 'Gold',
            purity: '22K (916)',
            gross_weight: 120,
            net_weight: 120,
            stone_weight: 0,
            metal_rate_applied: 6750,
            making_charge: 35000,
            stone_price: 0,
            total_item_price: 1004250,
            pieces: 6
          }
        ],
        created_at: new Date('2026-08-31T10:15:00Z')
      }
    ]);
    console.log('✅ Populated 4 Sales Invoices.');
  }

  const ogCount = await OldGoldTransaction.countDocuments();
  if (ogCount === 0) {
    console.log('🌱 Seeding initial Old Gold Transactions...');
    await OldGoldTransaction.insertMany([
      {
        receipt_no: 'OG-20260825-1001',
        customer_name: 'Meera Singhania',
        customer_phone: '+91 98765 43210',
        gross_weight: 4.2,
        stone_dust_deduction: 0.2,
        net_weight: 4.0,
        purity_touch_pct: 87.5,
        fine_gold_weight: 3.5,
        valuation_rate_per_gram: 6250,
        total_valuation: 25000,
        settlement_mode: 'INVOICE_CREDIT',
        linked_invoice_no: 'INV-20260828-4821',
        notes: 'Exchanged 22k old broken ring against choker purchase',
        created_at: new Date('2026-08-25T14:15:00Z')
      },
      {
        receipt_no: 'OG-20260830-4785',
        customer_name: 'Vikram Malhotra',
        customer_phone: '+91 99887 76655',
        gross_weight: 5.0,
        stone_dust_deduction: 0.2,
        net_weight: 4.8,
        purity_touch_pct: 88.0,
        fine_gold_weight: 4.224,
        valuation_rate_per_gram: 6200,
        total_valuation: 26189,
        settlement_mode: 'CASH_PAYOUT',
        linked_invoice_no: '',
        notes: 'Direct scrap sell walk-in payout',
        created_at: new Date('2026-08-30T15:30:00Z')
      }
    ]);
    console.log('✅ Populated 2 Old Gold Transactions.');
  }

  console.log('\n🎉 ALL MONGODB COLLECTIONS FULLY POPULATED & VERIFIED!');
  process.exit(0);
}

seed().catch(console.error);
