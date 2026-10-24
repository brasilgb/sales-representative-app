import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeApiError } from '../api-errors.ts';

test('request without response is reported as offline and retryable', () => {
  const info = describeApiError({ message: 'Network Error' });
  assert.equal(info.kind, 'offline');
  assert.equal(info.retryable, true);
  assert.match(info.message, /Sem conexão/);
});

test('aborted request is reported as timeout', () => {
  assert.equal(describeApiError({ code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' }).kind, 'timeout');
});

test('401 asks the user to sign in again and is not retryable', () => {
  const info = describeApiError({ response: { status: 401, data: {} } });
  assert.equal(info.kind, 'unauthorized');
  assert.equal(info.retryable, false);
});

test('validation errors keep the server message', () => {
  const info = describeApiError({ response: { status: 400, data: { message: 'Preço divergente.' } } });
  assert.equal(info.kind, 'validation');
  assert.equal(info.message, 'Preço divergente.');
});

test('server errors are retryable and do not expose the server body', () => {
  const info = describeApiError({ response: { status: 500, data: { message: 'SQLSTATE[23000] Duplicate entry' } } });
  assert.equal(info.kind, 'server');
  assert.equal(info.retryable, true);
  assert.doesNotMatch(info.message, /SQLSTATE/);
});

test('conflict keeps the message and is not retryable', () => {
  const info = describeApiError({ response: { status: 409, data: { message: 'Este pedido já está sendo enviado.' } } });
  assert.equal(info.kind, 'conflict');
  assert.equal(info.retryable, false);
});
