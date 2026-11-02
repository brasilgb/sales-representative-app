/**
 * Adaptador de API para a camada offline: traduz respostas do axios em falhas normalizadas
 * (ApiFailure) e em formatos esperados pelo motor. Usa o cliente HTTP do aplicativo (token incluso).
 */
import megbapi from '@/utils/megbapi';
import type { CreatedOrder, OrderApi } from '../queue/engine';
import type { CatalogApi, CatalogPage, PriceSnapshot } from '../catalog/catalog-sync';
import type { Preview } from '../queue/conflicts';
import { toApiFailure } from '../queue/failures';

export { toApiFailure };

async function call<T>(work: () => Promise<{ data: T }>): Promise<T> {
  try {
    const response = await work();
    return response.data;
  } catch (error) {
    throw toApiFailure(error);
  }
}

export const offlineApi: OrderApi & CatalogApi = {
  preview: (input) => call(async () => {
    const response = await megbapi.post('/orders/preview', input);
    return { data: response.data.data as Preview };
  }),

  createOrder: (input) => call(async (): Promise<{ data: CreatedOrder }> => {
    const response = await megbapi.post('/orders', input);
    const order = response.data?.order ?? null;

    if (response.status === 201) {
      return { data: { kind: 'created', orderId: Number(order?.id), orderNumber: order?.order_number ?? null } };
    }

    return { data: { kind: 'duplicate', orderId: order?.id ?? null, orderNumber: order?.order_number ?? null } };
  }),

  catalogPage: (cursor) => call(async () => {
    const response = await megbapi.get('/sync/catalog', { params: cursor ? { cursor, limit: 500 } : { limit: 500 } });
    return { data: response.data.data as CatalogPage };
  }),

  priceSnapshot: (customerId) => call(async () => {
    const response = await megbapi.get('/sync/prices', { params: { customer_id: customerId } });
    const data = response.data.data;
    return {
      data: {
        customer_id: Number(data.customer_id),
        version: String(data.version),
        generated_at: String(data.generated_at),
        prices: data.prices as Record<string, number>,
        condition: data.condition ?? null,
        campaigns: data.campaigns,
      } as PriceSnapshot,
    };
  }),
};
