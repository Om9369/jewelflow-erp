import dns from 'node:dns';
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch(e) {}

import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI;

let client = null;
let db = null;

export async function connectMongo() {
  if (db) return db;
  if (!MONGO_URI) {
    console.warn('⚠️ MONGODB_URI not set in environment variables.');
    return null;
  }
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db('jewelflow');
    console.log('🍃 Connected to MongoDB Atlas Cloud Cluster successfully.');
    return db;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return null;
  }
}

export function getMongoDb() {
  return db;
}
