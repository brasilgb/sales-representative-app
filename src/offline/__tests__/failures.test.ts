import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toApiFailure } from '../queue/failures.ts';

test('a response with status becomes an HTTP failure with the server message', () => {
  const failure = toApiFailure({ response: { status: 422, data: { message: 'Preço divergente.' } } });
  assert.equal(failure.status, 422);
  assert.equal(failure.message, 'Preço divergente.');
});

test('a request without response is a network failure, not an HTTP one', () => {
  const failure = toApiFailure({ message: 'Network Error' });
  assert.equal(failure.network, true);
  assert.equal(failure.status, undefined);
});

test('an aborted request is a timeout, which may have been saved by the server', () => {
  const failure = toApiFailure({ code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' });
  assert.equal(failure.timeout, true);
  assert.equal(failure.network, undefined);
});
