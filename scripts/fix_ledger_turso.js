import { createClient } from '@libsql/client';
import { DatabaseSync } from 'node:sqlite';

const localDb = new DatabaseSync('server/jewelflow.db');
const cols = localDb.prepare('PRAGMA table_info(stock_ledger)').all();
console.log('Local stock_ledger cols:', cols.map(c => c.name));

const TURSO_URL = process.env.TURSO_DATABASE_URL || process.argv[2];
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || process.argv[3];

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
  process.exit(1);
}

const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN
});

async function run() {
  await turso.execute('DROP TABLE IF EXISTS stock_ledger');
  await turso.execute(`
    CREATE TABLE stock_ledger (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id    INTEGER,
      sku           TEXT    DEFAULT '',
      title         TEXT    DEFAULT '',
      category      TEXT    DEFAULT '',
      movement_type TEXT    NOT NULL,
      gross_weight  REAL    DEFAULT 0,
      net_weight    REAL    DEFAULT 0,
      reference_id  TEXT    DEFAULT '',
      reference_type TEXT   DEFAULT '',
      notes         TEXT    DEFAULT '',
      timestamp     TEXT    NOT NULL
    )
  `);
  console.log('✅ stock_ledger table recreated in Turso with exact local schema.');
}
run();
