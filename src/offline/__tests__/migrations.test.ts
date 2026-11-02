import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LATEST_VERSION, migrate, type Migration } from '../db/migrations.ts';
import { openNodeDatabase } from '../db/node-sqlite.ts';

test('migrations create the local schema once and record the version', async () => {
  const db = openNodeDatabase();
  assert.equal(await migrate(db), LATEST_VERSION);
  assert.equal(await migrate(db), LATEST_VERSION);
  const tables = (await db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")).map((row) => row.name);
  for (const table of ['sync_meta', 'customers', 'products', 'price_snapshots', 'price_snapshot_meta', 'order_queue']) {
    assert.ok(tables.includes(table), `tabela ${table} ausente`);
  }
});

test('a failing migration is rolled back and the version is not advanced', async () => {
  const db = openNodeDatabase();
  const broken: Migration[] = [
    { version: 1, name: 'ok', statements: ['CREATE TABLE a (x INTEGER)'] },
    { version: 2, name: 'quebrada', statements: ['CREATE TABLE b (x INTEGER)', 'CREATE TABLE a (x INTEGER)'] },
  ];
  await assert.rejects(migrate(db, broken));
  const version = await db.first<{ user_version: number }>('PRAGMA user_version');
  assert.equal(version?.user_version, 1);
  assert.equal(await db.first("SELECT name FROM sqlite_master WHERE name = 'b'"), null);
});
