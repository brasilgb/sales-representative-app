import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ACTIVE_STATES, canTransition, isActive, transition, type OrderState } from '../queue/state-machine.ts';

test('the normal path goes pending, syncing and synced', () => {
  let state: OrderState = 'pending';
  state = transition(state, 'start');
  state = transition(state, 'synced');
  assert.equal(state, 'synced');
});

test('conflicts stop at review and only an explicit acceptance returns the order to the queue', () => {
  let state: OrderState = transition('pending', 'start');
  state = transition(state, 'conflict');
  assert.equal(state, 'needs_review');
  assert.equal(canTransition(state, 'synced'), false, 'revisão não pode virar sincronizado sem envio');
  assert.equal(transition(state, 'accept'), 'pending');
});

test('recoverable errors can be retried, and definitive errors and synced orders are terminal', () => {
  assert.equal(transition('recoverable_error', 'retry'), 'syncing');
  assert.equal(canTransition('definitive_error', 'start'), false);
  assert.equal(canTransition('definitive_error', 'retry'), false);
  assert.equal(canTransition('synced', 'start'), false);
});

test('invalid transitions are rejected instead of silently applied', () => {
  assert.throws(() => transition('pending', 'synced'), /Transição inválida/);
  assert.throws(() => transition('synced', 'discard'), /Transição inválida/);
});

test('active states are the ones the representative still has to act on or wait for', () => {
  assert.deepEqual([...ACTIVE_STATES].sort(), ['needs_review', 'pending', 'recoverable_error', 'syncing']);
  assert.equal(isActive('synced'), false);
  assert.equal(isActive('definitive_error'), false);
});
