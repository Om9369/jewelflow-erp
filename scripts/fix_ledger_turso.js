import { createClient } from '@libsql/client';
import { DatabaseSync } from 'node:sqlite';

const localDb = new DatabaseSync('server/jewelflow.db');
const cols = localDb.prepare('PRAGMA table_info(stock_ledger)').all();
console.log('Local stock_ledger cols:', cols.map(c => c.name));

const turso = createClient({
  url: 'libsql://jewelflow-db-om9369.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MTk4MDgzODksImlhdCI6MTc4ODI3MjM4OSwiaWQiOiIwMWEwNWQ1Ni1hYjAxLTc3M2EtYTlkNS02NjhiMWNiOWM1MmIiLCJraWQiOiJaNzJzNHZtbXg3UnYtaTFpNl9BSDJGdWhCQ2xNbWdiRVFneFUyNldkc2RVIiwicmlkIjoiNGMxYWU5ZDItZmEwYS00NGJiLTlkN2EtYzc1M2FmYjU5NTViIn0.XDSdO98b--JbDq3q-_g1WhlDesur_1g_nifv_FrQHmOi56Tw9iV6BoAXWnedJS_WoLrF5qvA8DCTfrkLU486Bw'
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
