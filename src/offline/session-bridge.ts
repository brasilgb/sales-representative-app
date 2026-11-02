/**
 * Ponte entre o provedor offline e a autenticação. Permite que o logout consulte pendências e
 * limpe o escopo local sem depender de ordem de provedores no React.
 */
export type OfflineSessionHandle = {
  pendingCount(): Promise<number>;
  purgeCurrent(): Promise<void>;
  closeCurrent(): void;
};

let current: OfflineSessionHandle | null = null;

export function registerOfflineSession(handle: OfflineSessionHandle): () => void {
  current = handle;
  return () => {
    if (current === handle) {
      current = null;
    }
  };
}

export function getOfflineSession(): OfflineSessionHandle | null {
  return current;
}
