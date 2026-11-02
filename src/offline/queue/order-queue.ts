/**
 * Fila persistente de pedidos registrados sem conexão. Cada operação tem identificador local,
 * submission_id estável, valores de referência do momento do registro e histórico técnico mínimo.
 * Nenhum número oficial de pedido é atribuído aqui: ele só existe após a confirmação do servidor.
 */
import type { LocalDb, RandomSource } from '../db/ports.ts';
import { type Conflict, type Preview, type Reference } from './conflicts.ts';
import { ACTIVE_STATES, type OrderEvent, type OrderState, transition } from './state-machine.ts';

export type OrderPayload = {
  notes: string | null;
  payment_condition: string | null;
  items: { product_id: number; quantity: number; discount_amount: number }[];
};

export type HistoryEntry = { at: string; from: OrderState; to: OrderState; event: OrderEvent; note: string | null };

export type QueuedOrder = {
  localId: string;
  submissionId: string;
  state: OrderState;
  customerId: number;
  customerName: string | null;
  payload: OrderPayload;
  reference: Reference;
  conflicts: Conflict[];
  preview: Preview | null;
  attempts: number;
  nextAttemptAt: number | null;
  lastErrorKind: string | null;
  lastErrorMessage: string | null;
  serverOrderId: number | null;
  serverOrderNumber: number | null;
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
};

type Row = {
  local_id: string;
  submission_id: string;
  state: OrderState;
  customer_id: number;
  customer_name: string | null;
  payload_json: string;
  reference_json: string;
  conflicts_json: string | null;
  attempts: number;
  next_attempt_at: number | null;
  last_error_kind: string | null;
  last_error_message: string | null;
  server_order_id: number | null;
  server_order_number: number | null;
  created_at: string;
  updated_at: string;
  history_json: string;
};

type Patch = Partial<Pick<QueuedOrder, 'attempts' | 'nextAttemptAt' | 'lastErrorKind' | 'lastErrorMessage' | 'serverOrderId' | 'serverOrderNumber' | 'reference' | 'payload'>> & {
  conflicts?: Conflict[];
  preview?: Preview | null;
  note?: string | null;
};

export class OrderQueue {
  private readonly db: LocalDb;
  private readonly random: RandomSource;
  private readonly clock: () => number;

  constructor(db: LocalDb, random: RandomSource, clock: () => number) {
    this.db = db;
    this.random = random;
    this.clock = clock;
  }

  /**
   * Registra o pedido localmente. Quando o envio falhou no meio (resposta perdida), a fila recebe o
   * MESMO submissionId já usado, para que o reenvio não crie uma segunda venda.
   */
  async enqueue(input: { customerId: number; customerName: string | null; payload: OrderPayload; reference: Reference; submissionId?: string }): Promise<QueuedOrder> {
    const localId = `local-${this.random.randomHex(8)}`;
    const submissionId = input.submissionId ?? `sub-${this.random.randomHex(16)}`;
    const now = this.iso();

    await this.db.run(
      `INSERT INTO order_queue (local_id, submission_id, state, customer_id, customer_name, payload_json, reference_json,
         conflicts_json, attempts, next_attempt_at, created_at, updated_at, history_json)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, NULL, 0, NULL, ?, ?, '[]')`,
      [localId, submissionId, input.customerId, input.customerName, JSON.stringify(input.payload), JSON.stringify(input.reference), now, now],
    );

    return (await this.get(localId))!;
  }

  async get(localId: string): Promise<QueuedOrder | null> {
    const row = await this.db.first<Row>('SELECT * FROM order_queue WHERE local_id = ?', [localId]);
    return row ? this.hydrate(row) : null;
  }

  async listActive(): Promise<QueuedOrder[]> {
    const placeholders = ACTIVE_STATES.map(() => '?').join(', ');
    const rows = await this.db.all<Row>(`SELECT * FROM order_queue WHERE state IN (${placeholders}) ORDER BY created_at, local_id`, [...ACTIVE_STATES]);
    return rows.map((row) => this.hydrate(row));
  }

  async listSynced(limit = 20): Promise<QueuedOrder[]> {
    const rows = await this.db.all<Row>(`SELECT * FROM order_queue WHERE state = 'synced' ORDER BY updated_at DESC, local_id LIMIT ?`, [limit]);
    return rows.map((row) => this.hydrate(row));
  }

  async countActive(): Promise<number> {
    const placeholders = ACTIVE_STATES.map(() => '?').join(', ');
    const row = await this.db.first<{ total: number }>(`SELECT COUNT(*) AS total FROM order_queue WHERE state IN (${placeholders})`, [...ACTIVE_STATES]);
    return Number(row?.total ?? 0);
  }

  /**
   * Recuperação após interrupção: operações que estavam "syncing" quando o app foi encerrado voltam
   * a "pending". É seguro reenviá-las: o submission_id faz o servidor responder "já registrado" se
   * o pedido já tiver sido gravado. Retorna quantas foram recuperadas.
   */
  async recoverInterrupted(): Promise<number> {
    return this.db.transaction(async () => {
      const rows = await this.db.all<{ local_id: string }>("SELECT local_id FROM order_queue WHERE state = 'syncing'");
      for (const row of rows) {
        const current = await this.get(row.local_id);
        if (!current) continue;
        const history = [...current.history, { at: this.iso(), from: 'syncing' as OrderState, to: 'pending' as OrderState, event: 'start' as OrderEvent, note: 'Recuperado após interrupção do aplicativo' }].slice(-50);
        await this.db.run("UPDATE order_queue SET state = 'pending', updated_at = ?, history_json = ? WHERE local_id = ?", [this.iso(), JSON.stringify(history), row.local_id]);
      }
      return rows.length;
    });
  }

  /** Pedido explícito do representante para tentar agora um erro recuperável (sem mudar o estado). */
  async scheduleNow(localId: string): Promise<void> {
    await this.db.run("UPDATE order_queue SET next_attempt_at = NULL, updated_at = ? WHERE local_id = ? AND state = 'recoverable_error'", [this.iso(), localId]);
  }

  /** Operações prontas para tentativa: pendentes ou com erro recuperável já vencido. */
  async due(nowMs: number, limit = 20): Promise<QueuedOrder[]> {
    const rows = await this.db.all<Row>(
      `SELECT * FROM order_queue
        WHERE state IN ('pending', 'recoverable_error')
          AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
        ORDER BY created_at, local_id
        LIMIT ?`,
      [nowMs, limit],
    );
    return rows.map((row) => this.hydrate(row));
  }

  /** Aplica um evento válido pela máquina de estados e grava o histórico técnico, em transação. */
  async apply(localId: string, event: OrderEvent, patch: Patch = {}): Promise<QueuedOrder> {
    return this.db.transaction(async () => {
      const current = await this.get(localId);

      if (!current) {
        throw new Error(`Operação local não encontrada: ${localId}`);
      }

      const to = transition(current.state, event);
      const next: QueuedOrder = {
        ...current,
        state: to,
        attempts: patch.attempts ?? current.attempts,
        nextAttemptAt: patch.nextAttemptAt !== undefined ? patch.nextAttemptAt : current.nextAttemptAt,
        lastErrorKind: patch.lastErrorKind !== undefined ? patch.lastErrorKind : current.lastErrorKind,
        lastErrorMessage: patch.lastErrorMessage !== undefined ? patch.lastErrorMessage : current.lastErrorMessage,
        serverOrderId: patch.serverOrderId !== undefined ? patch.serverOrderId : current.serverOrderId,
        serverOrderNumber: patch.serverOrderNumber !== undefined ? patch.serverOrderNumber : current.serverOrderNumber,
        reference: patch.reference ?? current.reference,
        payload: patch.payload ?? current.payload,
        conflicts: patch.conflicts ?? (to === 'pending' || to === 'synced' ? [] : current.conflicts),
        preview: patch.preview !== undefined ? patch.preview : current.preview,
        updatedAt: this.iso(),
        history: [...current.history, { at: this.iso(), from: current.state, to, event, note: patch.note ?? null }].slice(-50),
      };

      await this.db.run(
        `UPDATE order_queue SET state = ?, attempts = ?, next_attempt_at = ?, last_error_kind = ?, last_error_message = ?,
           server_order_id = ?, server_order_number = ?, reference_json = ?, payload_json = ?, conflicts_json = ?, updated_at = ?, history_json = ?
         WHERE local_id = ?`,
        [
          next.state,
          next.attempts,
          next.nextAttemptAt,
          next.lastErrorKind,
          next.lastErrorMessage,
          next.serverOrderId,
          next.serverOrderNumber,
          JSON.stringify(next.reference),
          JSON.stringify(next.payload),
          JSON.stringify({ conflicts: next.conflicts, preview: next.preview }),
          next.updatedAt,
          JSON.stringify(next.history),
          localId,
        ],
      );

      return next;
    });
  }

  private iso(): string {
    return new Date(this.clock()).toISOString();
  }

  private hydrate(row: Row): QueuedOrder {
    const stored = row.conflicts_json ? (JSON.parse(row.conflicts_json) as { conflicts: Conflict[]; preview: Preview | null }) : { conflicts: [], preview: null };

    return {
      localId: row.local_id,
      submissionId: row.submission_id,
      state: row.state,
      customerId: Number(row.customer_id),
      customerName: row.customer_name,
      payload: JSON.parse(row.payload_json) as OrderPayload,
      reference: JSON.parse(row.reference_json) as Reference,
      conflicts: stored.conflicts,
      preview: stored.preview,
      attempts: Number(row.attempts),
      nextAttemptAt: row.next_attempt_at === null ? null : Number(row.next_attempt_at),
      lastErrorKind: row.last_error_kind,
      lastErrorMessage: row.last_error_message,
      serverOrderId: row.server_order_id === null ? null : Number(row.server_order_id),
      serverOrderNumber: row.server_order_number === null ? null : Number(row.server_order_number),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      history: JSON.parse(row.history_json) as HistoryEntry[],
    };
  }
}
