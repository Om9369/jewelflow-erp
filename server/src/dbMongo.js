import dns from 'node:dns';
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch(e) {}

import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://omtrivedi9369_db_user:T8hORy5I2wa7eEt0@cluster0.wq5vlrx.mongodb.net/jewelflow?retryWrites=true&w=majority&appName=Cluster0';

let client = null;
let db = null;

export async function connectMongo() {
  if (db) return db;
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
