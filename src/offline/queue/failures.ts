/**
 * Tradução de erros de comunicação em falhas normalizadas para o motor de sincronização.
 * Módulo puro: não depende do cliente HTTP, para que possa ser testado isoladamente.
 */
import type { ApiFailure } from './engine.ts';

export function toApiFailure(error: any): ApiFailure {
  if (error?.response) {
    return { status: Number(error.response.status), message: typeof error.response.data?.message === 'string' ? error.response.data.message : undefined };
  }
  if (error?.code === 'ECONNABORTED' || /timeout/i.test(String(error?.message ?? ''))) {
    return { timeout: true, message: 'Tempo esgotado.' };
  }
  return { network: true, message: 'Sem conexão.' };
}
