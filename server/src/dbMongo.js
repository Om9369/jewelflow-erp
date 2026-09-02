import dns from 'node:dns';
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch(e) {}

import mongoose from 'mongoose';
import {
  MetalRate,
  Employee,
  Customer,
  Product,
  SalesInvoice,
  OldGoldTransaction,
  StockLedger,
  TrayAudit,
  KarigarOrder
} from './models/index.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://omtrivedi9369_db_user:T8hORy5I2wa7eEt0@cluster0.wq5vlrx.mongodb.net/jewelflow?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;

export async function connectMongo() {
  if (isConnected) return mongoose.connection;
  if (!MONGO_URI) {
    console.warn('⚠️ MONGODB_URI not provided.');
    return null;
  }
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('🍃 Connected to MongoDB Atlas Cloud Cluster successfully.');
    await _seedIfEmpty();
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return null;
  }
}

async function _seedIfEmpty() {
  try {
    const rateCount = await MetalRate.countDocuments();
    if (rateCount === 0) {
      console.log('🌱 Seeding initial metal rates to MongoDB...');
      await MetalRate.insertMany([
        { metal: 'Gold', purity: '24K (999)', rate_per_gram: 7250, currency: 'INR' },
        { metal: 'Gold', purity: '22K (916)', rate_per_gram: 6750, currency: 'INR' },
        { metal: 'Gold', purity: '18K (750)', rate_per_gram: 5550, currency: 'INR' },
        { metal: 'Gold', purity: '14K (585)', rate_per_gram: 4350, currency: 'INR' },
        { metal: 'Silver', purity: '999 Fine', rate_per_gram: 88.5, currency: 'INR' },
        { metal: 'Silver', purity: '925 Sterling', rate_per_gram: 82, currency: 'INR' },
        { metal: 'Platinum', purity: '950 Pure', rate_per_gram: 3200, currency: 'INR' }
      ]);
    }

    const empCount = await Employee.countDocuments();
    if (empCount === 0) {
      console.log('🌱 Seeding initial employees to MongoDB...');
      await Employee.insertMany([
        { name: 'Rohan Mehta', phone: '+91 98111 00001', role: 'STORE_MANAGER', target_monthly_revenue: 3500000, target_monthly_grams: 500, commission_rate_pct: 1.5, avatar_color: '#D97706' },
        { name: 'Pooja Sharma', phone: '+91 98111 00002', role: 'SENIOR_SALES', target_monthly_revenue: 2500000, target_monthly_grams: 350, commission_rate_pct: 1.2, avatar_color: '#EC4899' },
        { name: 'Amit Verma', phone: '+91 98111 00003', role: 'SALES_EXECUTIVE', target_monthly_revenue: 2000000, target_monthly_grams: 300, commission_rate_pct: 1.0, avatar_color: '#3B82F6' },
        { name: 'Kavita Iyer', phone: '+91 98111 00004', role: 'SALES_EXECUTIVE', target_monthly_revenue: 1800000, target_monthly_grams: 250, commission_rate_pct: 1.0, avatar_color: '#10B981' },
        { name: 'Suresh Patel', phone: '+91 98111 00005', role: 'CASHIER', target_monthly_revenue: 0, target_monthly_grams: 0, commission_rate_pct: 0, avatar_color: '#64748B' },
        { name: 'Deepak Soni', phone: '+91 98111 00006', role: 'STOCK_AUDITOR', target_monthly_revenue: 0, target_monthly_grams: 0, commission_rate_pct: 0, avatar_color: '#8B5CF6' }
      ]);
    }
  } catch (e) {
    console.warn('MongoDB seeding note:', e.message);
  }
}
