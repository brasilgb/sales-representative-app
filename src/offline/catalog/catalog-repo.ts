/** Leituras do catálogo local para as telas. Não busca nada na rede. */
import type { LocalDb } from '../db/ports.ts';
import { getMeta } from './catalog-sync.ts';

export type LocalCustomer = Record<string, unknown> & { id: number; name: string };
export type LocalProduct = Record<string, unknown> & { id: number; name: string; enabled: boolean };

export type PriceReference = {
  customerId: number;
  version: string;
  generatedAt: string;
  prices: Record<number, number>;
  condition: Record<string, unknown> | null;
  campaigns: { id: number; name: string; ends_at: string | null; prices: Record<number, number> }[];
};

export class CatalogRepo {
  private readonly db: LocalDb;

  constructor(db: LocalDb) {
    this.db = db;
  }

  async customers(search = ''): Promise<LocalCustomer[]> {
    const rows = await this.db.all<{ data: string }>('SELECT data FROM customers WHERE name LIKE ? ORDER BY name LIMIT 500', [`%${search}%`]);
    return rows.map((row) => JSON.parse(row.data) as LocalCustomer);
  }

  async products(search = ''): Promise<LocalProduct[]> {
    const rows = await this.db.all<{ data: string }>(
      `SELECT data FROM products WHERE (name LIKE ? OR reference LIKE ?) ORDER BY name LIMIT 500`,
      [`%${search}%`, `%${search}%`],
    );
    return rows.map((row) => JSON.parse(row.data) as LocalProduct);
  }

  async priceReference(customerId: number): Promise<PriceReference | null> {
    const meta = await this.db.first<{ version: string; generated_at: string; condition_json: string | null; campaigns_json: string }>(
      'SELECT version, generated_at, condition_json, campaigns_json FROM price_snapshot_meta WHERE customer_id = ?',
      [customerId],
    );
    if (!meta) {
      return null;
    }

    const rows = await this.db.all<{ product_id: number; price: number }>('SELECT product_id, price FROM price_snapshots WHERE customer_id = ?', [customerId]);
    const prices: Record<number, number> = {};
    for (const row of rows) {
      prices[Number(row.product_id)] = Number(row.price);
    }

    const campaigns = (JSON.parse(meta.campaigns_json) as { id: number; name: string; ends_at: string | null; prices: Record<string, number> }[]).map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      ends_at: campaign.ends_at,
      prices: Object.fromEntries(Object.entries(campaign.prices).map(([id, price]) => [Number(id), price])),
    }));

    return {
      customerId,
      version: meta.version,
      generatedAt: meta.generated_at,
      prices,
      condition: meta.condition_json ? (JSON.parse(meta.condition_json) as Record<string, unknown>) : null,
      campaigns,
    };
  }

  async lastSyncAt(): Promise<string | null> {
    return getMeta(this.db, 'catalog_last_sync_at');
  }

  async counts(): Promise<{ customers: number; products: number }> {
    const customers = await this.db.first<{ total: number }>('SELECT COUNT(*) AS total FROM customers');
    const products = await this.db.first<{ total: number }>('SELECT COUNT(*) AS total FROM products');
    return { customers: Number(customers?.total ?? 0), products: Number(products?.total ?? 0) };
  }
}
