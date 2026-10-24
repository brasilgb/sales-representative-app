/**
 * Classifica falhas de comunicação com a API em mensagens claras para o representante.
 * Módulo puro (sem Expo nem React Native), para que possa ser testado isoladamente.
 */
export type ApiErrorKind = 'offline' | 'timeout' | 'unauthorized' | 'conflict' | 'validation' | 'server' | 'unknown';

export type ApiErrorInfo = {
  kind: ApiErrorKind;
  message: string;
  retryable: boolean;
};

export function describeApiError(error: any): ApiErrorInfo {
  const raw = String(error?.message ?? '');

  if (error?.code === 'ECONNABORTED' || /timeout/i.test(raw)) {
    return {
      kind: 'timeout',
      message: 'A resposta demorou demais. Verifique sua conexão e tente novamente.',
      retryable: true,
    };
  }

  if (!error?.response) {
    return {
      kind: 'offline',
      message: 'Sem conexão com o servidor. Verifique a internet e tente novamente.',
      retryable: true,
    };
  }

  const status = Number(error.response.status);
  const serverMessage = typeof error.response.data?.message === 'string' ? error.response.data.message : null;

  if (status === 401) {
    return { kind: 'unauthorized', message: 'Sua sessão expirou. Entre novamente.', retryable: false };
  }

  if (status === 409) {
    return { kind: 'conflict', message: serverMessage ?? 'Esta operação não pode ser concluída agora.', retryable: false };
  }

  if (status === 400 || status === 402 || status === 403 || status === 422) {
    return { kind: 'validation', message: serverMessage ?? 'Revise os dados informados.', retryable: false };
  }

  if (status >= 500) {
    return {
      kind: 'server',
      message: 'O servidor não respondeu corretamente. Tente novamente em instantes.',
      retryable: true,
    };
  }

  return { kind: 'unknown', message: serverMessage ?? 'Não foi possível concluir a operação.', retryable: false };
}
