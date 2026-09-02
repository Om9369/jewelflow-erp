import { createClient } from '@libsql/client';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let client = null;

try {
  if (TURSO_URL && TURSO_AUTH_TOKEN) {
    client = createClient({
      url: TURSO_URL,
      authToken: TURSO_AUTH_TOKEN
    });
  }
} catch (e) {
  console.warn('Turso client initialization note:', e.message);
}

export const getTursoClient = () => client;

export async function syncFromTurso(localDb) {
  if (!client) return;
  try {
    const tables = ['metal_rates', 'employees', 'customers', 'products', 'sales_invoices', 'sales_items', 'old_gold_transactions', 'stock_ledger'];
    
    for (const table of tables) {
      try {
        const res = await client.execute(`SELECT * FROM ${table}`);
        if (res && res.rows && res.rows.length > 0) {
          const rows = res.rows;
          const cols = Object.keys(rows[0]);
          const placeholders = cols.map(() => '?').join(',');
          const insertSql = `INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`;
          const stmt = localDb.prepare(insertSql);

          localDb.exec('BEGIN');
          for (const row of rows) {
            const vals = cols.map(c => row[c]);
            stmt.run(...vals);
          }
          localDb.exec('COMMIT');
        }
      } catch (err) {
        // Table might not exist or empty
      }
    }
    console.log('☁️  Synced live data from Turso Cloud SQLite successfully.');
  } catch (err) {
    console.warn('⚠️  Turso pull note:', err.message);
  }
}

export function syncToTurso(sql, args = []) {
  if (!client) return;
  // Non-blocking fire-and-forget sync to Turso cloud
  client.execute({ sql, args }).catch(err => {
    console.warn('Turso push note:', err.message);
  });
}
