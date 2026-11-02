import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CatalogRepo } from '../catalog/catalog-repo.ts';
import { setMeta } from '../catalog/catalog-sync.ts';
import { OrderQueue, type OrderPayload } from '../queue/order-queue.ts';
import { ScopeMismatchError, openScopedDatabase, purgeScope, scopeDbName, scopeKeyName } from '../session/scope.ts';
import { FakeFiles, FakeKeys, FakeRandom } from './fakes.ts';

const payload: OrderPayload = { notes: null, payment_condition: null, items: [{ product_id: 10, quantity: 1, discount_amount: 0 }] };
const reference = { customer_id: 1, campaign_id: null, total: 20, items: [{ product_id: 10, name: 'Ração', quantity: 1, discount_amount: 0, price: 20, total: 20 }] };

function ports() {
  return { files: new FakeFiles(), keys: new FakeKeys(), random: new FakeRandom() };
}

test('each tenant and user gets a separate database file and key', async () => {
  const p = ports();
  const a = { tenantId: 1, userId: 10 };
  const b = { tenantId: 1, userId: 11 };
  const c = { tenantId: 2, userId: 10 };
  assert.notEqual(scopeDbName(a), scopeDbName(b));
  assert.notEqual(scopeDbName(a), scopeDbName(c));
  assert.notEqual(scopeKeyName(a), scopeKeyName(b));

  await openScopedDatabase(a, p);
  await openScopedDatabase(b, p);
  await openScopedDatabase(c, p);
  assert.equal(p.files.files.size, 3);
  assert.equal(p.keys.values.size, 3);
});

test('one user cannot read the pending orders or catalog of another user on the same device', async () => {
  const p = ports();
  const alice = { tenantId: 1, userId: 10 };
  const bob = { tenantId: 1, userId: 11 };

  const dbAlice = await openScopedDatabase(alice, p);
  await new OrderQueue(dbAlice, new FakeRandom(), () => 1).enqueue({ customerId: 1, customerName: 'Cliente da Ana', payload, reference });
  await dbAlice.run("INSERT INTO customers (id, name, data) VALUES (1, 'Cliente da Ana', '{}')");

  const dbBob = await openScopedDatabase(bob, p);
  assert.equal(await new OrderQueue(dbBob, new FakeRandom(), () => 1).countActive(), 0);
  assert.deepEqual(await new CatalogRepo(dbBob).customers(), []);
});

test('a database refuses to open with the wrong key', async () => {
  const p = ports();
  const scope = { tenantId: 3, userId: 30 };
  await openScopedDatabase(scope, p);
  p.keys.values.set(scopeKeyName(scope), 'chave-errada');
  await assert.rejects(openScopedDatabase(scope, p), /chave incorreta/);
});

test('an existing database that belongs to another scope is refused', async () => {
  const p = ports();
  const scope = { tenantId: 4, userId: 40 };
  const db = await openScopedDatabase(scope, p);
  await setMeta(db, 'owner_scope', '9:99');
  await assert.rejects(openScopedDatabase(scope, p), ScopeMismatchError);
});

test('logout purge removes the database file and its key completely', async () => {
  const p = ports();
  const scope = { tenantId: 5, userId: 50 };
  const db = await openScopedDatabase(scope, p);
  await new OrderQueue(db, new FakeRandom(), () => 1).enqueue({ customerId: 1, customerName: 'X', payload, reference });

  await purgeScope(scope, p);
  assert.equal(p.files.files.has(scopeDbName(scope)), false);
  assert.equal(p.keys.values.has(scopeKeyName(scope)), false);

  // Após a limpeza, reabrir cria um banco vazio: nada do usuário anterior sobrevive.
  const reopened = await openScopedDatabase(scope, p);
  assert.equal(await new OrderQueue(reopened, new FakeRandom(), () => 1).countActive(), 0);
});
