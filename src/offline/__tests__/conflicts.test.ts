import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type Preview, type Reference, detectConflicts, hasBlockingConflict } from '../queue/conflicts.ts';

const reference: Reference = {
  customer_id: 1,
  campaign_id: null,
  total: 40,
  items: [
    { product_id: 10, name: 'Ração', quantity: 2, discount_amount: 0, price: 20, total: 40 },
  ],
};

function preview(overrides: Partial<Preview> = {}, line: Partial<Preview['items'][number]> = {}): Preview {
  return {
    customer_id: 1,
    campaign_id: null,
    subtotal: 40,
    items: [{ product_id: 10, name: 'Ração', quantity: 2, price: 20, discount_amount: 0, total: 40, status: 'ok', stock_available: 100, ...line }],
    ...overrides,
  };
}

test('identical values produce no conflict and the order can be sent automatically', () => {
  const conflicts = detectConflicts(reference, preview());
  assert.deepEqual(conflicts, []);
  assert.equal(hasBlockingConflict(conflicts), false);
});

test('a changed regional or special price blocks automatic confirmation', () => {
  const conflicts = detectConflicts(reference, preview({ subtotal: 30 }, { price: 15, total: 30 }));
  assert.ok(conflicts.some((c) => c.code === 'price_changed' && c.blocking));
  assert.equal(hasBlockingConflict(conflicts), true);
});

test('a product that became inactive or disappeared is blocking', () => {
  assert.ok(detectConflicts(reference, preview({}, { status: 'disabled', price: null, total: null })).some((c) => c.code === 'product_inactive'));
  const missing = detectConflicts(reference, { ...preview(), items: [] });
  assert.ok(missing.some((c) => c.code === 'product_missing' && c.blocking));
});

test('a campaign used offline that is no longer active is reported as expired', () => {
  const ref: Reference = { ...reference, campaign_id: 7 };
  const conflicts = detectConflicts(ref, preview({ campaign_id: null }));
  assert.ok(conflicts.some((c) => c.code === 'campaign_expired' && c.blocking));
});

test('a changed discount is blocking', () => {
  const ref: Reference = { ...reference, items: [{ ...reference.items[0], discount_amount: -5, total: 35 }], total: 35 };
  const conflicts = detectConflicts(ref, preview({ subtotal: 35 }, { discount_amount: 0, total: 40 }));
  assert.ok(conflicts.some((c) => c.code === 'discount_changed' && c.blocking));
});

test('insufficient stock is only a warning and does not block the order', () => {
  const conflicts = detectConflicts(reference, preview({}, { stock_available: 1 }));
  assert.ok(conflicts.some((c) => c.code === 'stock_insufficient' && !c.blocking));
  assert.equal(hasBlockingConflict(conflicts), false);
});
