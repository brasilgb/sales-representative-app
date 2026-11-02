/**
 * Estados de uma operação da fila de pedidos. Transições são explícitas: qualquer evento fora da
 * tabela é rejeitado, para que nenhum pedido pule uma etapa de revisão ou de confirmação.
 */
export const ORDER_STATES = ['pending', 'syncing', 'needs_review', 'synced', 'recoverable_error', 'definitive_error'] as const;

export type OrderState = (typeof ORDER_STATES)[number];

export type OrderEvent = 'start' | 'synced' | 'conflict' | 'recoverable' | 'definitive' | 'retry' | 'accept' | 'discard';

export const STATE_LABELS: Record<OrderState, string> = {
  pending: 'Pendente de sincronização',
  syncing: 'Sincronizando',
  needs_review: 'Precisa de revisão',
  synced: 'Sincronizado',
  recoverable_error: 'Erro recuperável',
  definitive_error: 'Erro definitivo',
};

const TRANSITIONS: Record<OrderState, Partial<Record<OrderEvent, OrderState>>> = {
  pending: { start: 'syncing', discard: 'definitive_error' },
  syncing: { synced: 'synced', conflict: 'needs_review', recoverable: 'recoverable_error', definitive: 'definitive_error', start: 'syncing' },
  needs_review: { accept: 'pending', discard: 'definitive_error' },
  recoverable_error: { retry: 'syncing', start: 'syncing', definitive: 'definitive_error', discard: 'definitive_error' },
  definitive_error: {},
  synced: {},
};

export function canTransition(from: OrderState, event: OrderEvent): boolean {
  return TRANSITIONS[from][event] !== undefined;
}

export function transition(from: OrderState, event: OrderEvent): OrderState {
  const to = TRANSITIONS[from][event];

  if (to === undefined) {
    throw new Error(`Transição inválida: ${from} --${event}-->`);
  }

  return to;
}

/** Operações que ainda precisam de atenção ou de envio (exibidas como pendentes). */
export const ACTIVE_STATES: readonly OrderState[] = ['pending', 'syncing', 'needs_review', 'recoverable_error'];

export function isActive(state: OrderState): boolean {
  return ACTIVE_STATES.includes(state);
}
