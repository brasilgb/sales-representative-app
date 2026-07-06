type PdfOrderItem = {
  name?: string;
  product_id: number;
  quantity: number;
  price: string | number;
  total?: string | number;
};

type PdfOrder = {
  order_number: string | number;
  created_at?: string;
  customer?: { name?: string };
  payment_condition?: string;
  subtotal?: string | number;
  flex?: string | number;
  discount?: string | number;
  total?: string | number;
};

type CustomerPdfItem = PdfOrderItem & {
  adjustedPrice: number;
  adjustedTotal: number;
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const currency = (value: unknown) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(Number(value) || 0);

const date = (value?: string) => value
  ? new Intl.DateTimeFormat('pt-BR').format(new Date(value))
  : new Intl.DateTimeFormat('pt-BR').format(new Date());

export function distributeFlexAcrossItems(items: PdfOrderItem[], flex: string | number | undefined): CustomerPdfItem[] {
  const flexCents = Math.max(Math.round(Number(flex) * 100) || 0, 0);
  const baseTotals = items.map((item) => Math.max(
    Math.round(Number(item.total ?? Number(item.price) * item.quantity) * 100) || 0,
    0,
  ));
  const baseTotalCents = baseTotals.reduce((sum, total) => sum + total, 0);
  const totalQuantity = items.reduce((sum, item) => sum + Math.max(item.quantity, 0), 0);
  let distributedCents = 0;

  return items.map((item, index) => {
    const isLastItem = index === items.length - 1;
    const weight = baseTotalCents > 0
      ? baseTotals[index] / baseTotalCents
      : Math.max(item.quantity, 0) / (totalQuantity || 1);
    const allocatedFlexCents = isLastItem
      ? flexCents - distributedCents
      : Math.min(Math.round(flexCents * weight), flexCents - distributedCents);
    distributedCents += allocatedFlexCents;

    const adjustedTotal = (baseTotals[index] + allocatedFlexCents) / 100;

    return {
      ...item,
      adjustedPrice: item.quantity > 0 ? adjustedTotal / item.quantity : 0,
      adjustedTotal,
    };
  });
}

export function buildOrderPdfHtml(order: PdfOrder, items: PdfOrderItem[], products: any[] = []) {
  const customerItems = distributeFlexAcrossItems(items, order.flex);
  const customerSubtotal = customerItems.reduce(
    (sum, item) => sum + item.adjustedTotal,
    0,
  );
  const rows = customerItems.map((item) => {
    const product = products.find((candidate) => candidate.id === item.product_id);

    return `<tr>
      <td><strong>${escapeHtml(item.name || product?.name || 'Produto')}</strong><small>Ref. ${escapeHtml(product?.reference || '—')}</small></td>
      <td class="center">${item.quantity}</td>
      <td class="right">${currency(item.adjustedPrice)}</td>
      <td class="right"><strong>${currency(item.adjustedTotal)}</strong></td>
    </tr>`;
  }).join('');

  return `<!doctype html>
  <html lang="pt-BR"><head><meta charset="utf-8"><style>
    @page { margin: 32px; }
    * { box-sizing: border-box; }
    body { color: #172033; font-family: Helvetica, Arial, sans-serif; font-size: 12px; margin: 0; }
    header { border-bottom: 3px solid #22b8f0; margin-bottom: 24px; padding-bottom: 16px; }
    h1 { color: #07111f; font-size: 25px; margin: 0 0 7px; }
    .meta { color: #657085; }
    .customer { background: #f2f6fa; border-radius: 8px; margin-bottom: 22px; padding: 14px; }
    .customer strong { display: block; font-size: 16px; margin-top: 4px; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #172033; color: white; font-size: 10px; padding: 9px; text-align: left; text-transform: uppercase; }
    td { border-bottom: 1px solid #dce2ea; padding: 11px 9px; }
    td small { color: #657085; display: block; margin-top: 4px; }
    .center { text-align: center; }.right { text-align: right; }
    .summary { margin: 18px 0 0 auto; width: 280px; }
    .summary div { display: flex; justify-content: space-between; padding: 5px 0; }
    .summary .total { border-top: 2px solid #172033; color: #05855f; font-size: 17px; margin-top: 6px; padding-top: 10px; }
    footer { color: #8992a3; font-size: 9px; margin-top: 34px; text-align: center; }
  </style></head><body>
    <header><h1>Pedido #${escapeHtml(order.order_number)}</h1><div class="meta">Emitido em ${date(order.created_at)}</div></header>
    <section class="customer"><span class="meta">CLIENTE</span><strong>${escapeHtml(order.customer?.name || 'Cliente não informado')}</strong>${order.payment_condition ? `<div class="meta" style="margin-top:6px">Condição de pagamento: ${escapeHtml(order.payment_condition)}</div>` : ''}</section>
    <table><thead><tr><th>Produto</th><th class="center">Qtd.</th><th class="right">Unitário</th><th class="right">Total</th></tr></thead><tbody>${rows}</tbody></table>
    <section class="summary">
      <div><span>Subtotal</span><strong>${currency(customerSubtotal)}</strong></div>
      ${Number(order.discount) ? `<div><span>Desconto</span><strong>− ${currency(order.discount)}</strong></div>` : ''}
      <div class="total"><span>Total</span><strong>${currency(order.total)}</strong></div>
    </section>
    <footer>Documento gerado pelo VetorPet</footer>
  </body></html>`;
}
