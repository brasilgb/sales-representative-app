/**
 * Identificador de envio. Um formulário usa o mesmo valor em todas as tentativas do mesmo pedido,
 * e a API recusa a segunda gravação. Não é segredo; só precisa ser único por formulário.
 */
export function newSubmissionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
