import express from 'express';
import cors from 'cors';
import { initDatabase } from '../server/src/database.js';
import apiRoutes from '../server/src/routes/api.js';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize in-memory and persistent database
initDatabase();

// Mount all ERP modules
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default app;
