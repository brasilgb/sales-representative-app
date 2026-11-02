/**
 * Portas de teste: servidor simulado com a mesma regra de idempotência da API (uma gravação por
 * submission_id) e falhas injetáveis, além de armazenamento seguro e aleatoriedade determinísticos.
 */
import type { SecureKeyStore, RandomSource, DatabaseFiles, LocalDb } from '../db/ports.ts';
import { openNodeDatabase, type NodeDatabase } from '../db/node-sqlite.ts';
import type { CreatedOrder, OrderApi, ApiFailure } from '../queue/engine.ts';
import type { Preview } from '../queue/conflicts.ts';
import type { CatalogApi, CatalogPage, PriceSnapshot } from '../catalog/catalog-sync.ts';

export class FakeKeys implements SecureKeyStore {
  readonly values = new Map<string, string>();
  async get(name: string) { return this.values.get(name) ?? null; }
  async set(name: string, value: string) { this.values.set(name, value); }
  async remove(name: string) { this.values.delete(name); }
}

export class FakeRandom implements RandomSource {
  private counter = 0;
  randomHex(bytes: number): string {
    this.counter += 1;
    return this.counter.toString(16).padStart(2, '0').repeat(bytes).slice(0, bytes * 2);
  }
}

/** Arquivos de banco em memória, com chave obrigatória e remoção completa. */
export class FakeFiles implements DatabaseFiles {
  readonly files = new Map<string, { key: string; db: NodeDatabase }>();
  async open(name: string, keyHex: string): Promise<LocalDb> {
    const existing = this.files.get(name);
    if (existing) {
      if (existing.key !== keyHex) throw new Error('chave incorreta para o banco');
      return existing.db;
    }
    const db = openNodeDatabase();
    this.files.set(name, { key: keyHex, db });
    return db;
  }
  async remove(name: string) {
    this.files.get(name)?.db.close();
    this.files.delete(name);
  }
}

export type Injected = { once?: boolean; failure: ApiFailure; afterWrite?: boolean };

/** Servidor simulado: grava pedidos uma única vez por submission_id e aceita falhas injetadas. */
export class FakeServer implements OrderApi, CatalogApi {
  readonly orders = new Map<string, { id: number; number: number }>();
  readonly createCalls: string[] = [];
  previewCalls = 0;
  prices: Record<number, number> = { 10: 20 };
  customerVisible = true;
  productStatus: 'ok' | 'disabled' = 'ok';
  private nextId = 100;
  private nextNumber = 5000;
  injectPreview: Injected | null = null;
  injectCreate: Injected | null = null;

  private fail(injected: Injected | null, clear: () => void): void {
    if (!injected) return;
    if (injected.once) clear();
    throw injected.failure;
  }

  async preview(input: { customer_id: number; items: { product_id: number; quantity: number; discount_amount: number }[] }): Promise<Preview> {
    this.previewCalls += 1;
    this.fail(this.injectPreview, () => (this.injectPreview = null));
    if (!this.customerVisible) throw { status: 404, message: 'não encontrado' } satisfies ApiFailure;
    const items = input.items.map((item) => {
      const price = this.prices[item.product_id] ?? 0;
      return { product_id: item.product_id, name: 'Ração', quantity: item.quantity, price, discount_amount: item.discount_amount, total: price * item.quantity, status: this.productStatus, stock_available: 100, reason: null, warning: null };
    });
    return { customer_id: input.customer_id, campaign_id: null, items, subtotal: items.reduce((sum, line) => sum + (line.total ?? 0), 0) };
  }

  async createOrder(input: { submission_id: string; customer_id: number; items: { product_id: number; quantity: number; discount_amount: number }[]; notes: string | null; payment_condition: string | null }): Promise<CreatedOrder> {
    this.createCalls.push(input.submission_id);
    const existing = this.orders.get(input.submission_id);
    if (existing) return { kind: 'duplicate', orderId: existing.id, orderNumber: existing.number };
    if (this.injectCreate?.afterWrite) {
      // Grava e perde a resposta (timeout após gravação no servidor).
      this.orders.set(input.submission_id, { id: this.nextId++, number: this.nextNumber++ });
      this.fail(this.injectCreate, () => (this.injectCreate = null));
    }
    this.fail(this.injectCreate, () => (this.injectCreate = null));
    const order = { id: this.nextId++, number: this.nextNumber++ };
    this.orders.set(input.submission_id, order);
    return { kind: 'created', orderId: order.id, orderNumber: order.number };
  }

  // --- catálogo ---
  catalogPages: CatalogPage[] = [];
  priceSnapshotValue: PriceSnapshot | null = null;
  async catalogPage(cursor: string | null): Promise<CatalogPage> {
    const index = cursor === null ? 0 : Number(cursor);
    const page = this.catalogPages[index];
    if (!page) throw new Error(`página inexistente: ${index}`);
    return { ...page, next_cursor: String(index + 1), has_more: index + 1 < this.catalogPages.length };
  }
  async priceSnapshot(customerId: number): Promise<PriceSnapshot> {
    return this.priceSnapshotValue ?? { customer_id: customerId, version: 'v1', generated_at: '2026-10-24T12:00:00Z', prices: { '10': 20 }, condition: null, campaigns: [] };
  }
}
