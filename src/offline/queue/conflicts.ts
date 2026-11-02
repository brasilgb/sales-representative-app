/**
 * Compara os valores registrados no aparelho (referência) com a prévia atual do servidor.
 * Qualquer divergência comercial bloqueia o envio automático: o representante revisa antes.
 * O aplicativo nunca recalcula preços oficiais; apenas compara o que o servidor informa.
 */
export type ReferenceItem = { product_id: number; name: string; quantity: number; discount_amount: number; price: number; total: number };

export type Reference = { customer_id: number; campaign_id: number | null; items: ReferenceItem[]; total: number };

export type PreviewLine = {
  product_id: number;
  name?: string | null;
  quantity: number;
  price: number | null;
  discount_amount?: number;
  total: number | null;
  status: 'ok' | 'disabled' | 'unavailable';
  reason?: string | null;
  stock_available?: number | null;
  warning?: string | null;
};

export type Preview = { customer_id: number; campaign_id: number | null; campaign_requested_id?: number | null; items: PreviewLine[]; subtotal: number };

export type ConflictCode =
  | 'price_changed'
  | 'discount_changed'
  | 'total_changed'
  | 'product_inactive'
  | 'product_missing'
  | 'campaign_expired'
  | 'customer_unavailable'
  | 'server_rejected'
  | 'stock_insufficient';

export type Conflict = { code: ConflictCode; blocking: boolean; product_id?: number; message: string };

const TOLERANCE = 0.005;

const MESSAGES: Record<ConflictCode, string> = {
  price_changed: 'O preço mudou desde o registro. Revise antes de confirmar.',
  discount_changed: 'O desconto informado não é mais aceito. Revise antes de confirmar.',
  total_changed: 'O total do pedido mudou desde o registro. Revise antes de confirmar.',
  product_inactive: 'Produto desabilitado: não pode mais ser vendido.',
  product_missing: 'Produto removido do catálogo.',
  campaign_expired: 'A campanha usada no registro não está mais ativa.',
  customer_unavailable: 'Cliente indisponível: inativo ou sem permissão para este usuário.',
  server_rejected: 'O servidor recusou o pedido com as condições atuais. Revise antes de confirmar.',
  stock_insufficient: 'Estoque insuficiente: a venda entra como pré-venda.',
};

export function detectConflicts(reference: Reference, preview: Preview): Conflict[] {
  const conflicts: Conflict[] = [];
  const byProduct = new Map(preview.items.map((line) => [line.product_id, line]));

  if (reference.campaign_id !== null && preview.campaign_id !== reference.campaign_id) {
    conflicts.push({ code: 'campaign_expired', blocking: true, message: MESSAGES.campaign_expired });
  }

  for (const item of reference.items) {
    const line = byProduct.get(item.product_id);

    if (!line) {
      conflicts.push({ code: 'product_missing', blocking: true, product_id: item.product_id, message: MESSAGES.product_missing });
      continue;
    }

    if (line.status === 'disabled') {
      conflicts.push({ code: 'product_inactive', blocking: true, product_id: item.product_id, message: MESSAGES.product_inactive });
      continue;
    }

    if (line.status === 'unavailable') {
      conflicts.push({ code: 'product_missing', blocking: true, product_id: item.product_id, message: MESSAGES.product_missing });
      continue;
    }

    if (line.price === null || Math.abs(line.price - item.price) > TOLERANCE) {
      conflicts.push({ code: 'price_changed', blocking: true, product_id: item.product_id, message: MESSAGES.price_changed });
    }

    if (line.discount_amount !== undefined && Math.abs(line.discount_amount - item.discount_amount) > TOLERANCE) {
      conflicts.push({ code: 'discount_changed', blocking: true, product_id: item.product_id, message: MESSAGES.discount_changed });
    }

    if (line.stock_available !== undefined && line.stock_available !== null && line.stock_available < item.quantity) {
      conflicts.push({ code: 'stock_insufficient', blocking: false, product_id: item.product_id, message: MESSAGES.stock_insufficient });
    }
  }

  if (conflicts.every((conflict) => conflict.code !== 'price_changed') && Math.abs(preview.subtotal - reference.total) > TOLERANCE) {
    conflicts.push({ code: 'total_changed', blocking: true, message: MESSAGES.total_changed });
  }

  return conflicts;
}

export function hasBlockingConflict(conflicts: Conflict[]): boolean {
  return conflicts.some((conflict) => conflict.blocking);
}

export function conflictMessage(code: ConflictCode): string {
  return MESSAGES[code];
}
