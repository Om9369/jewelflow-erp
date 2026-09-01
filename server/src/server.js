import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Initialize in-memory and persistent database
initDatabase();

// Mount API routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve compiled frontend static assets from client/dist
const distPath = path.join(__dirname, '../../client/dist');
app.use(express.static(distPath));

// SPA Fallback for any client-side routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ JewelFlow ERP Server running on:`);
  console.log(`   ➜ http://localhost:${PORT}`);
  console.log(`   ➜ http://127.0.0.1:${PORT}`);
});
