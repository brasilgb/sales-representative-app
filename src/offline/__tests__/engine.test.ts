import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openNodeDatabase } from '../db/node-sqlite.ts';
import { migrate } from '../db/migrations.ts';
import { OrderQueue, type OrderPayload } from '../queue/order-queue.ts';
import { runOrderQueue, acceptCurrentValues, discardOperation } from '../queue/engine.ts';
import { FakeRandom, FakeServer } from './fakes.ts';

const payload: OrderPayload = { notes: null, payment_condition: null, items: [{ product_id: 10, quantity: 2, discount_amount: 0 }] };
const reference = { customer_id: 1, campaign_id: null, total: 40, items: [{ product_id: 10, name: 'Ração', quantity: 2, discount_amount: 0, price: 20, total: 40 }] };

async function setup(start = 1_000_000) {
  const db = openNodeDatabase();
  await migrate(db);
  let now = start;
  const clock = () => now;
  const queue = new OrderQueue(db, new FakeRandom(), clock);
  const server = new FakeServer();
  const run = () => runOrderQueue({ queue, api: server, now: clock });
  return { db, queue, server, run, advance: (ms: number) => { now += ms; }, now: () => now };
}

test('an offline order has no official number until the server confirms it', async () => {
  const { queue, server, run } = await setup();
  const op = await queue.enqueue({ customerId: 1, customerName: 'Cliente', payload, reference });
  assert.equal(op.state, 'pending');
  assert.equal(op.serverOrderNumber, null);

  const report = await run();
  assert.equal(report.synced, 1);
  const synced = await queue.get(op.localId);
  assert.equal(synced?.state, 'synced');
  assert.equal(synced?.serverOrderNumber, 5000);
  assert.equal(server.createCalls.length, 1);
});

test('a price change blocks automatic confirmation and nothing is sent to the server', async () => {
  const { queue, server, run } = await setup();
  server.prices = { 10: 25 };
  const op = await queue.enqueue({ customerId: 1, customerName: 'Cliente', payload, reference });

  const report = await run();
  assert.equal(report.needsReview, 1);
  assert.equal(server.createCalls.length, 0, 'não pode confirmar pedido com condição alterada');
  const review = await queue.get(op.localId);
  assert.equal(review?.state, 'needs_review');
  assert.ok(review?.conflicts.some((c) => c.code === 'price_changed'));
});

test('accepting the current values returns the order to the queue and the same submission id is used', async () => {
  const { queue, server, run } = await setup();
  server.prices = { 10: 25 };
  const op = await queue.enqueue({ customerId: 1, customerName: 'Cliente', payload, reference });
  await run();

  const accepted = await acceptCurrentValues(queue, op.localId);
  assert.equal(accepted.state, 'pending');
  assert.equal(accepted.reference.items[0].price, 25);

  await run();
  assert.equal((await queue.get(op.localId))?.state, 'synced');
  assert.deepEqual(server.createCalls, [op.submissionId]);
});

test('customer without permission on the server needs review and is never sent', async () => {
  const { queue, server, run } = await setup();
  server.customerVisible = false;
  const op = await queue.enqueue({ customerId: 1, customerName: 'Cliente', payload, reference });
  await run();
  const current = await queue.get(op.localId);
  assert.equal(current?.state, 'needs_review');
  assert.ok(current?.conflicts.some((c) => c.code === 'customer_unavailable'));
  assert.equal(server.createCalls.length, 0);
});

test('a timeout after the server saved the order is resolved by resending with the same id, without a second sale', async () => {
  const { queue, server, run, advance } = await setup();
  server.injectCreate = { once: true, afterWrite: true, failure: { timeout: true, message: 'timeout' } };
  const op = await queue.enqueue({ customerId: 1, customerName: 'Cliente', payload, reference });

  const first = await run();
  assert.equal(first.recoverable, 1);
  assert.equal(server.orders.size, 1, 'o servidor já gravou');

  advance(60_000);
  const second = await run();
  assert.equal(second.synced, 1);
  assert.equal(server.orders.size, 1, 'nenhuma venda duplicada');
  assert.equal((await queue.get(op.localId))?.serverOrderNumber, 5000);
  assert.equal(server.createCalls.filter((id) => id === op.submissionId).length, 2);
});

test('network and server errors are retried with backoff and stop after the attempt limit', async () => {
  const { queue, server, run, advance } = await setup();
  server.injectCreate = { failure: { status: 503, message: 'indisponível' } };
  const op = await queue.enqueue({ customerId: 1, customerName: 'Cliente', payload, reference });

  await run();
  const afterFirst = await queue.get(op.localId);
  assert.equal(afterFirst?.state, 'recoverable_error');
  assert.equal(afterFirst?.attempts, 1);
  assert.ok((afterFirst?.nextAttemptAt ?? 0) > 1_000_000);

  // Antes do horário previsto não há nova tentativa (sem laço de requisições).
  const early = await run();
  assert.equal(early.processed, 0);

  for (let i = 0; i < 10; i += 1) {
    advance(10 * 60_000);
    await run();
  }
  const exhausted = await queue.get(op.localId);
  assert.equal(exhausted?.state, 'definitive_error');
  assert.equal(exhausted?.lastErrorKind, 'exhausted');
});

test('409 in progress is recoverable and a validation refusal without commercial reason is definitive', async () => {
  const { queue, server, run } = await setup();
  server.injectCreate = { failure: { status: 409, message: 'já está sendo enviado' } };
  const a = await queue.enqueue({ customerId: 1, customerName: 'A', payload, reference });
  await run();
  assert.equal((await queue.get(a.localId))?.state, 'recoverable_error');

  server.injectCreate = { failure: { status: 422, message: 'Nome do cliente inválido.' } };
  const b = await queue.enqueue({ customerId: 1, customerName: 'B', payload, reference });
  await run();
  assert.equal((await queue.get(b.localId))?.state, 'definitive_error');
});

test('a commercial rejection from the server (price message) goes to review, not to a retry loop', async () => {
  const { queue, server, run } = await setup();
  server.injectCreate = { failure: { status: 400, message: 'Preço divergente da condição comercial para o produto: Ração' } };
  const op = await queue.enqueue({ customerId: 1, customerName: 'Cliente', payload, reference });
  await run();
  assert.equal((await queue.get(op.localId))?.state, 'needs_review');
});

test('session expiry stops the queue and keeps every local operation', async () => {
  const { queue, server, run } = await setup();
  server.injectPreview = { failure: { status: 401, message: 'Unauthenticated.' } };
  const a = await queue.enqueue({ customerId: 1, customerName: 'A', payload, reference });
  const b = await queue.enqueue({ customerId: 1, customerName: 'B', payload, reference });

  const report = await run();
  assert.equal(report.halted, true);
  assert.equal(report.processed, 1, 'a segunda operação não é tentada');
  assert.equal(server.createCalls.length, 0);
  assert.equal((await queue.get(a.localId))?.lastErrorKind, 'session');
  assert.equal((await queue.get(b.localId))?.state, 'pending', 'nada foi descartado');
});

test('discard is explicit and removes the order from the active queue', async () => {
  const { queue } = await setup();
  const op = await queue.enqueue({ customerId: 1, customerName: 'A', payload, reference });
  const discarded = await discardOperation(queue, op.localId);
  assert.equal(discarded.state, 'definitive_error');
  assert.equal(await queue.countActive(), 0);
});

test('pending orders survive closing and reopening the local database', async () => {
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { openNodeDatabase: openFile } = await import('../db/node-sqlite.ts');
  const dir = mkdtempSync(join(tmpdir(), 'vetorpet-queue-'));
  const file = join(dir, 'queue.db');
  try {
    const first = openFile(file);
    await migrate(first);
    const queueA = new OrderQueue(first, new FakeRandom(), () => 1_000_000);
    const op = await queueA.enqueue({ customerId: 1, customerName: 'Cliente', payload, reference });
    first.close();

    const second = openFile(file);
    await migrate(second);
    const queueB = new OrderQueue(second, new FakeRandom(), () => 2_000_000);
    const recovered = await queueB.get(op.localId);
    assert.equal(recovered?.state, 'pending');
    assert.equal(recovered?.submissionId, op.submissionId, 'a identidade do envio sobrevive à reabertura');
    second.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an order interrupted while syncing is recovered on reopen and sent once with the same id', async () => {
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { openNodeDatabase: openFile } = await import('../db/node-sqlite.ts');
  const dir = mkdtempSync(join(tmpdir(), 'vetorpet-interrupt-'));
  const file = join(dir, 'queue.db');
  const server = new FakeServer();
  try {
    const first = openFile(file);
    await migrate(first);
    const queueA = new OrderQueue(first, new FakeRandom(), () => 1_000_000);
    const op = await queueA.enqueue({ customerId: 1, customerName: 'Cliente', payload, reference });
    // Simula o app sendo encerrado no meio do envio: o estado "syncing" fica gravado.
    await queueA.apply(op.localId, 'start', { note: 'envio iniciado' });
    first.close();

    const second = openFile(file);
    await migrate(second);
    const queueB = new OrderQueue(second, new FakeRandom(), () => 2_000_000);
    assert.equal(await queueB.recoverInterrupted(), 1);
    assert.equal((await queueB.get(op.localId))?.state, 'pending');

    const report = await runOrderQueue({ queue: queueB, api: server, now: () => 2_000_000 });
    assert.equal(report.synced, 1);
    assert.equal(server.orders.size, 1);
    assert.equal(server.createCalls.filter((id) => id === op.submissionId).length, 1);
    second.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
