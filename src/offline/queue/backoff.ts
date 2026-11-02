/**
 * Tentativas controladas: atraso exponencial limitado e número máximo de tentativas recuperáveis.
 * Determinístico (sem aleatoriedade), para que o comportamento seja verificável em testes.
 */
export const BASE_DELAY_MS = 5_000;
export const MAX_DELAY_MS = 5 * 60_000;
export const MAX_RECOVERABLE_ATTEMPTS = 6;

/** Atraso antes da próxima tentativa, após a tentativa de número `attempts` (1 = primeira). */
export function retryDelayMs(attempts: number): number {
  const exponent = Math.max(0, attempts - 1);
  return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** exponent);
}

export function nextAttemptAt(nowMs: number, attempts: number): number {
  return nowMs + retryDelayMs(attempts);
}

export function attemptsExhausted(attempts: number): boolean {
  return attempts >= MAX_RECOVERABLE_ATTEMPTS;
}
