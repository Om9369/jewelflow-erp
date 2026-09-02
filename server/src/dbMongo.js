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
    await _seedDefaultRatesIfEmpty();
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return null;
  }
}

async function _seedDefaultRatesIfEmpty() {
  try {
    const rateCount = await MetalRate.countDocuments();
    if (rateCount === 0) {
      console.log('🌱 Setting default metal rates in MongoDB...');
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
  } catch (e) {
    console.warn('MongoDB rates note:', e.message);
  }
}
