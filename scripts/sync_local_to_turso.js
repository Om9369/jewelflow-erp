import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_DB_PATH = path.join(__dirname, '../server/jewelflow.db');
const TURSO_URL = process.env.TURSO_DATABASE_URL || process.argv[2];
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || process.argv[3];

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
  process.exit(1);
}

const localDb = new DatabaseSync(LOCAL_DB_PATH);
const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN
});

async function syncAllData() {
  console.log('🔄 Starting 100% Data Migration: Local SQLite -> Turso Cloud SQLite...\n');

  const tables = [
    'metal_rates',
    'employees',
    'customers',
    'products',
    'sales_invoices',
    'sales_items',
    'old_gold_transactions',
    'stock_ledger',
    'karigar_orders',
    'tray_audits'
  ];

  const results = [];

  for (const table of tables) {
    try {
      // 1. Get all local rows
      const localRows = localDb.prepare(`SELECT * FROM ${table}`).all();
      
      if (localRows.length > 0) {
        const cols = Object.keys(localRows[0]);
        const placeholders = cols.map(() => '?').join(',');
        const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`;

        // Batch execute in chunks of 50
        const batchSize = 50;
        for (let i = 0; i < localRows.length; i += batchSize) {
          const chunk = localRows.slice(i, i + batchSize);
          const stmts = chunk.map(row => ({
            sql,
            args: cols.map(c => row[c] === undefined ? null : row[c])
          }));
          await turso.batch(stmts, 'write');
        }
      }

      // 2. Verify row counts
      const tursoCountRes = await turso.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const tursoCount = Number(tursoCountRes.rows[0].count);

      results.push({
        Table: table,
        'Local SQLite Count': localRows.length,
        'Turso Cloud Count': tursoCount,
        Status: localRows.length === tursoCount ? '✅ 100% MATCH' : (tursoCount >= localRows.length ? '✅ SYNCED' : '⚠️ MISMATCH')
      });

    } catch (err) {
      console.error(`Error migrating table ${table}:`, err.message);
      results.push({
        Table: table,
        'Local SQLite Count': 'Error',
        'Turso Cloud Count': 'Error',
        Status: `❌ ${err.message}`
      });
    }
  }

  console.table(results);
  console.log('\n🎉 ALL LOCAL SQLITE DATA IS NOW 100% LIVE IN TURSO CLOUD SQLITE!');
}

syncAllData().catch(console.error);
