import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CatalogRepo } from '../catalog/catalog-repo.ts';
import { getMeta, syncCatalog, syncPrices } from '../catalog/catalog-sync.ts';
import { migrate } from '../db/migrations.ts';
import { openNodeDatabase } from '../db/node-sqlite.ts';
import { FakeServer } from './fakes.ts';

const customer = (id: number, name: string) => ({ id, name, cnpj: '', city: 'Campinas', region_id: 1, region: 'Norte', user_id: 1 });
const product = (id: number, name: string, enabled = true) => ({ id, name, reference: `R${id}`, category: 'pet', brand: null, unity: 'UN', price: 20, enabled, quantity: 10 });

async function fresh() {
  const db = openNodeDatabase();
  await migrate(db);
  return db;
}

test('catalog sync stores pages, applies removals and keeps the cursor for resumption', async () => {
  const db = await fresh();
  const server = new FakeServer();
  server.catalogPages = [
    { customers: [customer(1, 'Ana'), customer(2, 'Bruno')], products: [product(10, 'Ração')], removed: { customers: [], products: [] }, visible_ids: { customers: [1, 2], products: [10] }, has_more: true, next_cursor: '', server_time: '2026-10-24T12:00:00Z' },
    { customers: [], products: [], removed: { customers: [2], products: [] }, visible_ids: { customers: [1], products: [10] }, has_more: false, next_cursor: '', server_time: '2026-10-24T12:05:00Z' },
  ];

  const report = await syncCatalog(db, server);
  assert.equal(report.pages, 2);
  const repo = new CatalogRepo(db);
  assert.deepEqual((await repo.customers()).map((c) => c.name), ['Ana']);
  assert.equal((await repo.products()).length, 1);
  assert.equal(await getMeta(db, 'catalog_last_sync_at'), '2026-10-24T12:05:00Z');
  assert.equal(await getMeta(db, 'catalog_cursor'), '2');
});

test('a customer that lost visibility without being deleted is pruned on the device', async () => {
  const db = await fresh();
  const server = new FakeServer();
  server.catalogPages = [
    { customers: [customer(1, 'Ana'), customer(3, 'Carla')], products: [], removed: { customers: [], products: [] }, visible_ids: { customers: [1, 3], products: [] }, has_more: true, next_cursor: '', server_time: 't1' },
    { customers: [], products: [], removed: { customers: [], products: [] }, visible_ids: { customers: [1], products: [] }, has_more: false, next_cursor: '', server_time: 't2' },
  ];
  const report = await syncCatalog(db, server);
  assert.equal(report.pruned, 1, 'a cliente sem visibilidade é podado mesmo sem exclusão no servidor');
  assert.deepEqual((await new CatalogRepo(db).customers()).map((c) => c.id), [1]);
});

test('a failure in the middle of a page keeps the previous cursor and stored data consistent', async () => {
  const db = await fresh();
  const server = new FakeServer();
  server.catalogPages = [
    { customers: [customer(1, 'Ana')], products: [], removed: { customers: [], products: [] }, visible_ids: { customers: [1], products: [] }, has_more: true, next_cursor: '', server_time: 't1' },
  ];
  await syncCatalog(db, server, 1).catch(() => undefined);
  const cursorAfterFirst = await getMeta(db, 'catalog_cursor');

  // Segunda página falha no meio: nada dela é gravado e o cursor não avança.
  server.catalogPage = async () => { throw new Error('queda de conexão'); };
  await assert.rejects(syncCatalog(db, server));
  assert.equal(await getMeta(db, 'catalog_cursor'), cursorAfterFirst);
});

test('price snapshot is replaced as a whole for the customer and is read back with its reference date', async () => {
  const db = await fresh();
  const server = new FakeServer();
  server.priceSnapshotValue = { customer_id: 1, version: 'abc', generated_at: '2026-10-24T12:00:00Z', prices: { '10': 18, '11': 30 }, condition: { payment_terms: '30 dias' }, campaigns: [{ id: 7, name: 'Campanha', starts_at: null, ends_at: '2026-11-01', prices: { '10': 15 } }] };
  await syncPrices(db, server, 1);
  server.priceSnapshotValue = { ...server.priceSnapshotValue, prices: { '10': 19 } };
  await syncPrices(db, server, 1);

  const reference = await new CatalogRepo(db).priceReference(1);
  assert.deepEqual(reference?.prices, { 10: 19 }, 'o snapshot antigo não pode sobrar');
  assert.equal(reference?.generatedAt, '2026-10-24T12:00:00Z');
  assert.equal(reference?.campaigns[0].prices[10], 15);
  assert.equal(reference?.condition?.payment_terms, '30 dias');
});
