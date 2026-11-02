/**
 * Sincronização do catálogo e dos preços para o banco local.
 *
 * - Catálogo: páginas do changelog do servidor; upsert de alterados, remoção de excluídos e poda
 *   dos que deixaram de ser visíveis ao usuário. O cursor é salvo por página (retomada segura).
 * - Preços: snapshot por cliente, substituído por inteiro. São referências, não garantias.
 */
import type { LocalDb } from '../db/ports.ts';

export type CatalogPage = {
  customers: (Record<string, unknown> & { id: number; name: string })[];
  products: (Record<string, unknown> & { id: number; name: string; reference?: string | null; enabled: boolean })[];
  removed: { customers: number[]; products: number[] };
  visible_ids: { customers: number[]; products: number[] };
  has_more: boolean;
  next_cursor: string;
  server_time: string;
};

export type PriceSnapshot = {
  customer_id: number;
  version: string;
  generated_at: string;
  prices: Record<string, number>;
  condition: Record<string, unknown> | null;
  campaigns: { id: number; name: string; starts_at: string | null; ends_at: string | null; prices: Record<string, number> }[];
};

export interface CatalogApi {
  catalogPage(cursor: string | null): Promise<CatalogPage>;
  priceSnapshot(customerId: number): Promise<PriceSnapshot>;
}

export type CatalogSyncReport = { pages: number; upserted: number; removed: number; pruned: number };

export async function getMeta(db: LocalDb, key: string): Promise<string | null> {
  const row = await db.first<{ value: string }>('SELECT value FROM sync_meta WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setMeta(db: LocalDb, key: string, value: string): Promise<void> {
  await db.run('INSERT INTO sync_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
}

export async function syncCatalog(db: LocalDb, api: CatalogApi, maxPages = 50): Promise<CatalogSyncReport> {
  const report: CatalogSyncReport = { pages: 0, upserted: 0, removed: 0, pruned: 0 };
  let cursor = await getMeta(db, 'catalog_cursor');

  for (let page = 0; page < maxPages; page += 1) {
    const result = await api.catalogPage(cursor);
    report.pages += 1;

    await db.transaction(async () => {
      for (const customer of result.customers) {
        await db.run('INSERT INTO customers (id, name, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, data = excluded.data',
          [customer.id, customer.name, JSON.stringify(customer)]);
        report.upserted += 1;
      }

      for (const product of result.products) {
        await db.run('INSERT INTO products (id, name, reference, enabled, data) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, reference = excluded.reference, enabled = excluded.enabled, data = excluded.data',
          [product.id, product.name, product.reference ?? null, product.enabled ? 1 : 0, JSON.stringify(product)]);
        report.upserted += 1;
      }

      for (const id of result.removed.customers) {
        await db.run('DELETE FROM customers WHERE id = ?', [id]);
        await db.run('DELETE FROM price_snapshots WHERE customer_id = ?', [id]);
        await db.run('DELETE FROM price_snapshot_meta WHERE customer_id = ?', [id]);
        report.removed += 1;
      }

      for (const id of result.removed.products) {
        await db.run('DELETE FROM products WHERE id = ?', [id]);
        report.removed += 1;
      }

      // Poda o que deixou de ser visível (ex.: cliente mudou de região) sem exclusão no servidor.
      report.pruned += await prune(db, 'customers', result.visible_ids.customers);
      report.pruned += await prune(db, 'products', result.visible_ids.products);

      await setMeta(db, 'catalog_cursor', result.next_cursor);
      await setMeta(db, 'catalog_last_sync_at', result.server_time);
    });

    cursor = result.next_cursor;

    if (!result.has_more) {
      return report;
    }
  }

  throw new Error('Sincronização do catálogo excedeu o número máximo de páginas.');
}

async function prune(db: LocalDb, table: 'customers' | 'products', visibleIds: number[]): Promise<number> {
  const keep = new Set(visibleIds);
  const rows = await db.all<{ id: number }>(`SELECT id FROM ${table}`);
  let removed = 0;

  for (const row of rows) {
    if (!keep.has(Number(row.id))) {
      await db.run(`DELETE FROM ${table} WHERE id = ?`, [row.id]);
      removed += 1;
    }
  }

  return removed;
}

/** Substitui o snapshot de preços de um cliente pelo que o servidor informou agora. */
export async function syncPrices(db: LocalDb, api: CatalogApi, customerId: number): Promise<PriceSnapshot> {
  const snapshot = await api.priceSnapshot(customerId);

  await db.transaction(async () => {
    await db.run('DELETE FROM price_snapshots WHERE customer_id = ?', [customerId]);
    for (const [productId, price] of Object.entries(snapshot.prices)) {
      await db.run('INSERT INTO price_snapshots (customer_id, product_id, price) VALUES (?, ?, ?)', [customerId, Number(productId), Number(price)]);
    }
    await db.run(
      `INSERT INTO price_snapshot_meta (customer_id, version, generated_at, condition_json, campaigns_json) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(customer_id) DO UPDATE SET version = excluded.version, generated_at = excluded.generated_at,
         condition_json = excluded.condition_json, campaigns_json = excluded.campaigns_json`,
      [customerId, snapshot.version, snapshot.generated_at, JSON.stringify(snapshot.condition), JSON.stringify(snapshot.campaigns)],
    );
  });

  return snapshot;
}
