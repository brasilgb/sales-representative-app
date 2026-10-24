import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newSubmissionId } from '../submission.ts';

test('submission identifiers are unique and not empty', () => {
  const ids = new Set(Array.from({ length: 500 }, () => newSubmissionId()));
  assert.equal(ids.size, 500);
  for (const id of ids) {
    assert.ok(id.length >= 10 && id.length <= 64, `tamanho fora do limite: ${id}`);
  }
});

test('submission identifiers only use characters accepted by the API', () => {
  assert.match(newSubmissionId(), /^[a-z0-9-]+$/);
});
