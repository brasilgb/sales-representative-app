/**
 * Evento central de sessão. Disparado pelo cliente HTTP quando uma requisição AUTENTICADA recebe
 * 401 (token revogado ou expirado). Falta de conexão nunca dispara este evento.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSessionExpired(): void {
  listeners.forEach((listener) => listener());
}
