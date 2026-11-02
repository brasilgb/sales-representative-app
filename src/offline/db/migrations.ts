/**
 * Migrações do banco local, versionadas por PRAGMA user_version. Cada versão é aplicada uma única
 * vez, dentro de transação. Nunca editar uma migração já publicada: criar uma nova versão.
 */
import type { LocalDb } from './ports';

export type Migration = { version: number; name: string; statements: string[] };

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'base offline',
    statements: [
      `CREATE TABLE IF NOT EXISTS sync_meta (
         key TEXT PRIMARY KEY,
         value TEXT NOT NULL
       )`,
      `CREATE TABLE IF NOT EXISTS customers (
         id INTEGER PRIMARY KEY,
         name TEXT NOT NULL,
         data TEXT NOT NULL
       )`,
      `CREATE TABLE IF NOT EXISTS products (
         id INTEGER PRIMARY KEY,
         name TEXT NOT NULL,
         reference TEXT,
         enabled INTEGER NOT NULL,
         data TEXT NOT NULL
       )`,
      `CREATE TABLE IF NOT EXISTS price_snapshots (
         customer_id INTEGER NOT NULL,
         product_id INTEGER NOT NULL,
         price REAL NOT NULL,
         PRIMARY KEY (customer_id, product_id)
       )`,
      `CREATE TABLE IF NOT EXISTS price_snapshot_meta (
         customer_id INTEGER PRIMARY KEY,
         version TEXT NOT NULL,
         generated_at TEXT NOT NULL,
         condition_json TEXT,
         campaigns_json TEXT NOT NULL
       )`,
      `CREATE TABLE IF NOT EXISTS order_queue (
         local_id TEXT PRIMARY KEY,
         submission_id TEXT NOT NULL UNIQUE,
         state TEXT NOT NULL,
         customer_id INTEGER NOT NULL,
         customer_name TEXT,
         payload_json TEXT NOT NULL,
         reference_json TEXT NOT NULL,
         conflicts_json TEXT,
         attempts INTEGER NOT NULL DEFAULT 0,
         next_attempt_at INTEGER,
         last_error_kind TEXT,
         last_error_message TEXT,
         server_order_id INTEGER,
         server_order_number INTEGER,
         created_at TEXT NOT NULL,
         updated_at TEXT NOT NULL,
         history_json TEXT NOT NULL DEFAULT '[]'
       )`,
      `CREATE INDEX IF NOT EXISTS order_queue_state ON order_queue (state, next_attempt_at)`,
    ],
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Aplica as migrações pendentes, na ordem de versão. Retorna a versão final. */
export async function migrate(db: LocalDb, migrations: Migration[] = MIGRATIONS): Promise<number> {
  const current = (await db.first<{ user_version: number }>('PRAGMA user_version')) ?? { user_version: 0 };
  let version = Number(current.user_version ?? 0);

  const pending = migrations.filter((migration) => migration.version > version).sort((a, b) => a.version - b.version);
  for (const migration of pending) {
    await db.transaction(async () => {
      for (const statement of migration.statements) {
        await db.run(statement);
      }
      await db.run(`PRAGMA user_version = ${Number(migration.version)}`);
    });
    version = migration.version;
  }

  return version;
}
