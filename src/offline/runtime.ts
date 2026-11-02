/** Monta os serviços offline reais (aparelho) para um escopo de tenant e usuário. */
import { CatalogRepo } from './catalog/catalog-repo';
import { expoDatabaseFiles, expoKeyStore, expoRandom } from './adapters/expo';
import { OrderQueue } from './queue/order-queue';
import { openScopedDatabase, purgeScope, type Scope } from './session/scope';
import type { LocalDb } from './db/ports';

export type OfflineRuntime = { scope: Scope; db: LocalDb; queue: OrderQueue; catalog: CatalogRepo };

const ports = { files: expoDatabaseFiles, keys: expoKeyStore, random: expoRandom };

export async function openOfflineRuntime(scope: Scope): Promise<OfflineRuntime> {
  const db = await openScopedDatabase(scope, ports);
  const queue = new OrderQueue(db, expoRandom, () => Date.now());
  // Operações interrompidas durante o envio voltam à fila (o envio é idempotente).
  await queue.recoverInterrupted();
  return { scope, db, queue, catalog: new CatalogRepo(db) };
}

export async function purgeOfflineScope(scope: Scope): Promise<void> {
  await purgeScope(scope, ports);
}
