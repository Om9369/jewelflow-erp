import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import apiRoutes from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite Schema and initial sample data
initDatabase();

// Mount API routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✨ JewelFlow ERP Backend Server running on http://localhost:${PORT}`);
});
