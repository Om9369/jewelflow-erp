import dns from 'node:dns';
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch(e) {}

import express from 'express';
import cors from 'cors';
import { connectMongo } from '../server/src/dbMongo.js';
import apiRoutes from '../server/src/routes/api.js';

const app = express();

app.use(cors());
app.use(express.json());

// Ensure MongoDB connection middleware
app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    console.error('MongoDB connection middleware error:', err);
    next();
  }
});

// Mount all ERP modules on /api and / for flexible Vercel routing
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'MongoDB Atlas', time: new Date().toISOString() });
});

export default app;
