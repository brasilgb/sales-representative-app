/**
 * Motor de sincronização da fila de pedidos. Fluxo por operação:
 *   1. consulta a prévia atual no servidor;
 *   2. compara com a referência do registro; divergência comercial bloqueante vai para revisão;
 *   3. envia o pedido com o mesmo submission_id (o servidor grava uma única vez);
 *   4. classifica a resposta: sucesso, resposta de pedido já existente, erro recuperável,
 *      erro definitivo, sessão expirada (interrompe a fila sem descartar nada).
 * O aplicativo nunca substitui cálculos oficiais: as regras definitivas continuam no servidor.
 */
import { attemptsExhausted, nextAttemptAt } from './backoff.ts';
import { type Conflict, type Preview, detectConflicts, hasBlockingConflict, conflictMessage } from './conflicts.ts';
import type { OrderQueue, QueuedOrder } from './order-queue.ts';

export type CreatedOrder = { kind: 'created'; orderId: number; orderNumber: number | null } | { kind: 'duplicate'; orderId: number | null; orderNumber: number | null };

/** Falha de comunicação já normalizada pelo adaptador de API. */
export type ApiFailure = { status?: number; network?: boolean; timeout?: boolean; message?: string };

export interface OrderApi {
  preview(input: { customer_id: number; items: { product_id: number; quantity: number; discount_amount: number }[] }): Promise<Preview>;
  createOrder(input: { submission_id: string; customer_id: number; notes: string | null; payment_condition: string | null; items: { product_id: number; quantity: number; discount_amount: number }[] }): Promise<CreatedOrder>;
}

export type RunReport = { processed: number; synced: number; needsReview: number; recoverable: number; definitive: number; halted: boolean };

type Outcome = 'synced' | 'needs_review' | 'recoverable' | 'definitive' | 'halt';

export async function runOrderQueue(deps: { queue: OrderQueue; api: OrderApi; now: () => number; limit?: number }): Promise<RunReport> {
  const report: RunReport = { processed: 0, synced: 0, needsReview: 0, recoverable: 0, definitive: 0, halted: false };
  const operations = await deps.queue.due(deps.now(), deps.limit ?? 20);

  for (const operation of operations) {
    const outcome = await processOperation(operation, deps);
    report.processed += 1;

    if (outcome === 'halt') {
      report.halted = true;
      break;
    }

    if (outcome === 'synced') report.synced += 1;
    if (outcome === 'needs_review') report.needsReview += 1;
    if (outcome === 'recoverable') report.recoverable += 1;
    if (outcome === 'definitive') report.definitive += 1;
  }

  return report;
}

async function processOperation(operation: QueuedOrder, deps: { queue: OrderQueue; api: OrderApi; now: () => number }): Promise<Outcome> {
  const { queue, api } = deps;
  const started = await queue.apply(operation.localId, 'start', { note: 'Envio iniciado' });

  let preview: Preview;
  try {
    preview = await api.preview({ customer_id: started.customerId, items: started.payload.items });
  } catch (error) {
    return failure(started, error, 'preview', deps);
  }

  const conflicts = detectConflicts(started.reference, preview);
  if (hasBlockingConflict(conflicts)) {
    await queue.apply(started.localId, 'conflict', { conflicts, preview, note: summarize(conflicts) });
    return 'needs_review';
  }

  try {
    const created = await api.createOrder({
      submission_id: started.submissionId,
      customer_id: started.customerId,
      notes: started.payload.notes,
      payment_condition: started.payload.payment_condition,
      items: started.payload.items,
    });

    await queue.apply(started.localId, 'synced', {
      serverOrderId: created.orderId,
      serverOrderNumber: created.orderNumber,
      lastErrorKind: null,
      lastErrorMessage: null,
      note: created.kind === 'duplicate' ? 'Resposta de pedido já registrado: confirmado sem nova gravação' : 'Pedido confirmado pelo servidor',
    });

    return 'synced';
  } catch (error) {
    return failure(started, error, 'create', deps);
  }
}

async function failure(operation: QueuedOrder, error: unknown, stage: 'preview' | 'create', deps: { queue: OrderQueue; now: () => number }): Promise<Outcome> {
  const failure = toFailure(error);
  const { queue } = deps;

  // Sessão expirada: nada é descartado; a operação volta a pendente e a fila para até novo login.
  if (failure.status === 401) {
    await queue.apply(operation.localId, 'recoverable', { attempts: operation.attempts, lastErrorKind: 'session', lastErrorMessage: 'Sessão expirada. Entre novamente para continuar.', note: 'Sessão expirada' });
    return 'halt';
  }

  // Cliente inativo ou fora da permissão: revisão, nunca envio.
  if (failure.status === 404 && stage === 'preview') {
    const conflicts: Conflict[] = [{ code: 'customer_unavailable', blocking: true, message: conflictMessage('customer_unavailable') }];
    await queue.apply(operation.localId, 'conflict', { conflicts, preview: null, note: 'Cliente indisponível' });
    return 'needs_review';
  }

  // Resposta recusada com regra comercial (preço, desconto, campanha): revisão.
  if ((failure.status === 400 || failure.status === 422) && isCommercialRejection(failure.message)) {
    const conflicts: Conflict[] = [{ code: 'server_rejected', blocking: true, message: failure.message ?? conflictMessage('server_rejected') }];
    await queue.apply(operation.localId, 'conflict', { conflicts, note: 'Servidor recusou por regra comercial' });
    return 'needs_review';
  }

  // Recusa definitiva (validação sem relação comercial, ex.: dados inválidos): não se repete.
  if (failure.status !== undefined && failure.status >= 400 && failure.status < 500 && failure.status !== 409 && failure.status !== 408 && failure.status !== 429) {
    await queue.apply(operation.localId, 'definitive', { lastErrorKind: 'validation', lastErrorMessage: failure.message ?? 'Pedido recusado pelo servidor.', note: `Recusado (${failure.status})` });
    return 'definitive';
  }

  // Erro recuperável: rede, tempo esgotado (pode ter gravado no servidor), 409 em andamento, 5xx.
  const kind = failure.timeout ? 'timeout' : failure.network ? 'network' : failure.status === 409 ? 'in_progress' : 'server';
  const attempts = operation.attempts + 1;

  if (attemptsExhausted(attempts)) {
    await queue.apply(operation.localId, 'definitive', { attempts, lastErrorKind: 'exhausted', lastErrorMessage: 'Não foi possível sincronizar após várias tentativas.', note: 'Tentativas esgotadas' });
    return 'definitive';
  }

  // Reenvio usa o mesmo submission_id: se o servidor já gravou, a resposta será "já registrado".
  await queue.apply(operation.localId, 'recoverable', {
    attempts,
    nextAttemptAt: nextAttemptAt(deps.now(), attempts),
    lastErrorKind: kind,
    lastErrorMessage: kind === 'timeout' ? 'Tempo esgotado. O envio será conferido na próxima tentativa.' : kind === 'network' ? 'Sem conexão. Tentaremos de novo.' : 'Servidor indisponível. Tentaremos de novo.',
    note: `Erro recuperável (${kind})`,
  });
  return 'recoverable';
}

const COMMERCIAL_PATTERN = /pre[çc]o|desconto|campanha|quantidade m[ií]nima|pedido m[ií]nimo|condi[çc][aã]o|limite/i;

function isCommercialRejection(message?: string): boolean {
  return message !== undefined && COMMERCIAL_PATTERN.test(message);
}

function summarize(conflicts: Conflict[]): string {
  return conflicts.filter((conflict) => conflict.blocking).map((conflict) => conflict.code).join(', ');
}

function toFailure(error: unknown): ApiFailure {
  if (error && typeof error === 'object') {
    return error as ApiFailure;
  }
  return { network: true, message: String(error) };
}

/**
 * Ação explícita do representante: aceita os valores atuais do servidor (prévia) e devolve a
 * operação à fila. Nada é enviado automaticamente a partir daqui; o próximo ciclo usa a mesma
 * submission_id e revalida novamente.
 */
export async function acceptCurrentValues(queue: OrderQueue, localId: string): Promise<QueuedOrder> {
  const current = await queue.get(localId);
  if (!current?.preview) {
    throw new Error('Não há valores atuais do servidor para aceitar. Consulte novamente.');
  }
  const preview = current.preview;
  const priced = new Map(preview.items.map((line) => [line.product_id, line]));
  const reference = {
    customer_id: current.reference.customer_id,
    campaign_id: preview.campaign_id,
    total: preview.subtotal,
    items: current.reference.items.map((item) => {
      const line = priced.get(item.product_id);
      return line && line.status === 'ok' && line.price !== null && line.total !== null
        ? { ...item, price: line.price, total: line.total, discount_amount: line.discount_amount ?? item.discount_amount }
        : item;
    }),
  };
  return queue.apply(localId, 'accept', { reference, note: 'Valores atuais aceitos pelo representante' });
}

/** Descarte pelo representante: a operação sai da fila e fica registrada como encerrada. */
export async function discardOperation(queue: OrderQueue, localId: string): Promise<QueuedOrder> {
  return queue.apply(localId, 'discard', { lastErrorKind: 'discarded', lastErrorMessage: 'Descartado pelo representante antes do envio.', note: 'Descartado pelo representante' });
}
