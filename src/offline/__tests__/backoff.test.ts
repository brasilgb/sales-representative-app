import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_DELAY_MS, MAX_RECOVERABLE_ATTEMPTS, attemptsExhausted, nextAttemptAt, retryDelayMs } from '../queue/backoff.ts';

test('retry delay grows exponentially and never exceeds the ceiling', () => {
  assert.equal(retryDelayMs(1), 5_000);
  assert.equal(retryDelayMs(2), 10_000);
  assert.equal(retryDelayMs(3), 20_000);
  assert.equal(retryDelayMs(40), MAX_DELAY_MS);
});

test('next attempt is scheduled relative to the given clock', () => {
  assert.equal(nextAttemptAt(1_000_000, 2), 1_010_000);
});

test('recoverable attempts are bounded so no endless request loop can happen', () => {
  assert.equal(attemptsExhausted(MAX_RECOVERABLE_ATTEMPTS - 1), false);
  assert.equal(attemptsExhausted(MAX_RECOVERABLE_ATTEMPTS), true);
});
