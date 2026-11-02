/**
 * Estado offline da sessão: conexão, banco local do usuário, pendências e sincronização.
 * - Troca de conta: abre o banco do novo usuário. O banco do anterior é apagado quando não tem
 *   pedidos pendentes; se tem, permanece cifrado e inacessível até o mesmo usuário voltar.
 * - Sincronização automática ao reconectar e ao voltar ao primeiro plano (com intervalo mínimo).
 */
import { useAuth } from '@/contexts/AuthContext';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { offlineApi } from './adapters/api';
import { acceptCurrentValues, discardOperation, runOrderQueue } from './queue/engine';
import { syncCatalog, syncPrices, getMeta } from './catalog/catalog-sync';
import { type OfflineRuntime, openOfflineRuntime, purgeOfflineScope } from './runtime';
import { registerOfflineSession } from './session-bridge';
import type { OrderPayload, QueuedOrder } from './queue/order-queue';
import type { Reference } from './queue/conflicts';
import { scopeId, type Scope } from './session/scope';

const MIN_SYNC_INTERVAL_MS = 60_000;

type OfflineContextValue = {
  online: boolean;
  runtime: OfflineRuntime | null;
  pendingCount: number;
  lastSyncAt: string | null;
  syncing: boolean;
  lastMessage: string | null;
  refreshCounts: () => Promise<void>;
  syncNow: () => Promise<void>;
  enqueueOrder: (input: { customerId: number; customerName: string | null; payload: OrderPayload; reference: Reference; submissionId?: string }) => Promise<QueuedOrder | null>;
  acceptRevision: (localId: string) => Promise<void>;
  discard: (localId: string) => Promise<void>;
  retry: (localId: string) => Promise<void>;
  loadPrices: (customerId: number) => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function useOffline(): OfflineContextValue {
  const value = useContext(OfflineContext);
  if (!value) {
    throw new Error('useOffline deve ser usado dentro de OfflineProvider');
  }
  return value;
}

export function OfflineProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [online, setOnline] = useState(true);
  const [runtime, setRuntime] = useState<OfflineRuntime | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const lastSyncStarted = useRef(0);
  const syncingRef = useRef(false);
  const onlineRef = useRef(true);
  const runtimeRef = useRef<OfflineRuntime | null>(null);

  const scope: Scope | null = user?.tenant_id && user?.id ? { tenantId: Number(user.tenant_id), userId: Number(user.id) } : null;
  const scopeKey = scope ? scopeId(scope) : null;

  const refreshCounts = useCallback(async () => {
    const current = runtimeRef.current;
    if (!current) return;
    setPendingCount(await current.queue.countActive());
    setLastSyncAt(await current.catalog.lastSyncAt());
  }, []);

  // Abre o banco do usuário atual e registra a ponte usada pelo logout.
  useEffect(() => {
    if (!scope || !scopeKey) {
      runtimeRef.current = null;
      setRuntime(null);
      return;
    }

    let cancelled = false;
    let unregister: (() => void) | null = null;

    (async () => {
      try {
        // Troca de conta: o banco do usuário anterior é apagado, salvo se ainda tem pedidos pendentes.
        const previous = runtimeRef.current;
        if (previous && scopeId(previous.scope) !== scopeKey && (await previous.queue.countActive()) === 0) {
          runtimeRef.current = null;
          await purgeOfflineScope(previous.scope);
        }

        const opened = await openOfflineRuntime(scope);
        if (cancelled) return;
        runtimeRef.current = opened;
        setRuntime(opened);
        unregister = registerOfflineSession({
          pendingCount: () => opened.queue.countActive(),
          purgeCurrent: async () => {
            runtimeRef.current = null;
            setRuntime(null);
            await purgeOfflineScope(scope);
          },
          closeCurrent: () => {
            runtimeRef.current = null;
            setRuntime(null);
          },
        });
        await refreshCounts();
      } catch {
        if (!cancelled) setLastMessage('Não foi possível abrir os dados offline deste aparelho.');
      }
    })();

    return () => {
      cancelled = true;
      unregister?.();
    };
    // O escopo é derivado de scopeKey; reabrir só muda quando a chave muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, refreshCounts]);

  // Conectividade: indicador e sincronização ao reconectar.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected) && state.isInternetReachable !== false;
      const wasOnline = onlineRef.current;
      onlineRef.current = isOnline;
      setOnline(isOnline);
      if (isOnline && !wasOnline) {
        void syncNow();
      }
    });
    return () => unsubscribe();
    // syncNow é estável pelas refs; o efeito só depende do ciclo de vida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Primeiro plano: sincroniza com intervalo mínimo.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNow();
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncNow = useCallback(async () => {
    const current = runtimeRef.current;
    if (!current || !onlineRef.current || syncingRef.current) return;
    if (Date.now() - lastSyncStarted.current < MIN_SYNC_INTERVAL_MS && lastSyncStarted.current !== 0) return;

    lastSyncStarted.current = Date.now();
    syncingRef.current = true;
    setSyncing(true);
    setLastMessage(null);
    try {
      await syncCatalog(current.db, offlineApi);
      const report = await runOrderQueue({ queue: current.queue, api: offlineApi, now: () => Date.now() });
      if (report.needsReview > 0) setLastMessage(`${report.needsReview} pedido(s) precisam de revisão.`);
      if (report.halted) setLastMessage('Sessão expirada. Entre novamente para enviar os pedidos pendentes.');
    } catch (error: any) {
      if (error?.network || error?.timeout) {
        setLastMessage('Sem conexão estável. Os dados locais continuam disponíveis.');
      } else if (error?.status !== 401) {
        setLastMessage('Não foi possível concluir a sincronização agora.');
      }
    } finally {
      await refreshCounts();
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refreshCounts]);

  const enqueueOrder = useCallback(async (input: { customerId: number; customerName: string | null; payload: OrderPayload; reference: Reference; submissionId?: string }) => {
    const current = runtimeRef.current;
    if (!current) return null;
    const queued = await current.queue.enqueue(input);
    await refreshCounts();
    return queued;
  }, [refreshCounts]);

  const acceptRevision = useCallback(async (localId: string) => {
    const current = runtimeRef.current;
    if (!current) return;
    await acceptCurrentValues(current.queue, localId);
    await refreshCounts();
  }, [refreshCounts]);

  const discard = useCallback(async (localId: string) => {
    const current = runtimeRef.current;
    if (!current) return;
    await discardOperation(current.queue, localId);
    await refreshCounts();
  }, [refreshCounts]);

  const retry = useCallback(async (localId: string) => {
    const current = runtimeRef.current;
    if (!current) return;
    await current.queue.scheduleNow(localId);
    lastSyncStarted.current = 0;
    await syncNow();
  }, [syncNow]);

  const loadPrices = useCallback(async (customerId: number) => {
    const current = runtimeRef.current;
    if (!current || !onlineRef.current) return;
    try {
      await syncPrices(current.db, offlineApi, customerId);
    } catch {
      // Sem preços novos, a última sincronização continua como referência.
    }
  }, []);

  return (
    <OfflineContext.Provider value={{ online, runtime, pendingCount, lastSyncAt, syncing, lastMessage, refreshCounts, syncNow, enqueueOrder, acceptRevision, discard, retry, loadPrices }}>
      {children}
    </OfflineContext.Provider>
  );
}

export { getMeta };
