import { ProductProps } from '@/types/app-types';

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

export function buildCatalogPdfHtml(products: ProductProps[]) {
  const cards = products.map((product) => `
    <article class="product">
      <div class="image-wrap">
        ${product.image_url
          ? `<img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">`
          : '<div class="placeholder">SEM FOTO</div>'}
      </div>
      <div class="content">
        ${product.brand ? `<div class="brand">${escapeHtml(product.brand)}</div>` : ''}
        <h2>${escapeHtml(product.name)}</h2>
        <div class="reference">Ref. ${escapeHtml(product.reference)}</div>
        ${product.description ? `<p>${escapeHtml(product.description)}</p>` : ''}
        <div class="bottom">
          <strong>${currency(product.price)}</strong>
          ${product.package_size ? `<span>${escapeHtml(product.package_size)}</span>` : ''}
        </div>
      </div>
    </article>`).join('');

  return `<!doctype html>
  <html lang="pt-BR"><head><meta charset="utf-8"><style>
    @page { margin: 28px; }
    * { box-sizing: border-box; }
    body { color: #172033; font-family: Helvetica, Arial, sans-serif; margin: 0; }
    header { border-bottom: 3px solid #22b8f0; margin-bottom: 22px; padding-bottom: 15px; }
    h1 { color: #07111f; font-size: 26px; margin: 0 0 6px; }
    .subtitle { color: #657085; font-size: 11px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .product { border: 1px solid #dce2ea; border-radius: 9px; break-inside: avoid; display: flex; min-height: 154px; overflow: hidden; page-break-inside: avoid; }
    .image-wrap { align-items: center; background: #f2f6fa; display: flex; flex: 0 0 128px; justify-content: center; overflow: hidden; }
    .image-wrap img { height: 128px; object-fit: contain; width: 128px; }
    .placeholder { color: #a0a8b5; font-size: 9px; font-weight: bold; }
    .content { display: flex; flex: 1; flex-direction: column; min-width: 0; padding: 12px; }
    .brand { color: #05855f; font-size: 9px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
    h2 { font-size: 14px; line-height: 18px; margin: 0; }
    .reference { color: #657085; font-size: 9px; margin-top: 4px; }
    p { color: #657085; font-size: 9px; line-height: 13px; margin: 8px 0; max-height: 39px; overflow: hidden; }
    .bottom { align-items: flex-end; display: flex; justify-content: space-between; margin-top: auto; padding-top: 8px; }
    .bottom strong { color: #05855f; font-size: 16px; }
    .bottom span { color: #657085; font-size: 9px; }
    footer { color: #8992a3; font-size: 9px; margin-top: 24px; text-align: center; }
  </style></head><body>
    <header><h1>Catálogo de produtos</h1><div class="subtitle">${products.length} ${products.length === 1 ? 'produto disponível' : 'produtos disponíveis'} • Atualizado em ${new Intl.DateTimeFormat('pt-BR').format(new Date())}</div></header>
    <main class="grid">${cards}</main>
    <footer>Catálogo gerado pelo VetorPet • Preços sujeitos a alteração</footer>
  </body></html>`;
}
