import { colors } from '@/constants/theme';
import { ConnectivityBadge, formatWhen } from '@/components/offline/ConnectivityBadge';
import { useOffline } from '@/offline/OfflineProvider';
import { STATE_LABELS, type OrderState } from '@/offline/queue/state-machine';
import type { QueuedOrder } from '@/offline/queue/order-queue';
import { router } from 'expo-router';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

/**
 * Central de sincronização: conexão, última sincronização, pedidos locais e ações explícitas.
 * Pedido local nunca aparece como confirmado: só o servidor atribui número oficial.
 */
export default function SyncCenter() {
  const { runtime, online, pendingCount, lastSyncAt, syncing, lastMessage, syncNow, acceptRevision, discard, retry } = useOffline();
  const [active, setActive] = useState<QueuedOrder[]>([]);
  const [synced, setSynced] = useState<QueuedOrder[]>([]);

  const load = useCallback(async () => {
    if (!runtime) return;
    setActive(await runtime.queue.listActive());
    setSynced(await runtime.queue.listSynced(10));
  }, [runtime]);

  useEffect(() => {
    void load();
  }, [load, pendingCount, syncing]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
      <View className="flex-row items-center gap-3">
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-lg bg-surface">
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text className="text-xl font-black text-foreground">Sincronização</Text>
      </View>

      <View className="gap-3 rounded-2xl border border-[#E2E8F0] bg-surface p-4">
        <ConnectivityBadge />
        <Text className="text-sm text-foreground">
          {pendingCount > 0 ? `${pendingCount} operação(ões) aguardando envio ou revisão.` : 'Nenhuma operação pendente neste aparelho.'}
        </Text>
        <Text className="text-xs text-muted">
          {lastSyncAt ? `Última sincronização: ${formatWhen(lastSyncAt)}` : 'Ainda não houve sincronização com o servidor.'}
        </Text>
        {lastMessage ? <Text className="text-xs text-warning">{lastMessage}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={!online || syncing}
          onPress={() => void syncNow()}
          className={`h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary ${!online || syncing ? 'opacity-50' : ''}`}>
          {syncing ? <ActivityIndicator color={colors.primaryText} /> : <RefreshCw size={18} color={colors.primaryText} />}
          <Text className="text-sm font-black text-primary-foreground">{online ? 'Sincronizar agora' : 'Aguardando conexão'}</Text>
        </Pressable>
        <Text className="text-xs text-muted">Os preços exibidos offline são referências da última sincronização. O servidor valida tudo ao enviar.</Text>
      </View>

      <Text className="text-xs font-extrabold uppercase text-muted">Pedidos locais (ainda não confirmados)</Text>
      {active.length === 0 ? <Text className="text-sm text-muted">Nenhum pedido local pendente.</Text> : null}
      {active.map((order) => (
        <OperationCard
          key={order.localId}
          order={order}
          onAccept={() => acceptRevision(order.localId).then(load)}
          onDiscard={() => confirmDiscard(order, () => discard(order.localId).then(load))}
          onRetry={() => retry(order.localId).then(load)}
        />
      ))}

      <Text className="text-xs font-extrabold uppercase text-muted">Confirmados pelo servidor</Text>
      {synced.length === 0 ? <Text className="text-sm text-muted">Nenhum pedido confirmado a partir deste aparelho.</Text> : null}
      {synced.map((order) => (
        <View key={order.localId} className="gap-1 rounded-xl border border-[#E2E8F0] bg-surface p-3">
          <Text className="text-sm font-extrabold text-foreground">
            {order.serverOrderNumber ? `Pedido #${order.serverOrderNumber}` : 'Pedido confirmado'} · {order.customerName ?? 'Cliente'}
          </Text>
          <Text className="text-xs text-muted">Confirmado pelo servidor</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function OperationCard({ order, onAccept, onDiscard, onRetry }: { order: QueuedOrder; onAccept: () => void; onDiscard: () => void; onRetry: () => void }) {
  const state = order.state as OrderState;
  const messages = order.conflicts.map((conflict) => conflict.message);
  const tone = state === 'needs_review' ? 'border-warning/50' : state === 'recoverable_error' ? 'border-warning/30' : 'border-[#E2E8F0]';

  return (
    <View className={`gap-2 rounded-xl border ${tone} bg-surface-raised p-3.5`}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="min-w-0 flex-1 text-sm font-extrabold text-foreground" numberOfLines={1}>{order.customerName ?? 'Cliente'}</Text>
        <Text className="text-[11px] font-extrabold text-warning">{STATE_LABELS[state]}</Text>
      </View>
      <Text className="text-xs text-muted">Pedido local · criado em {formatWhen(order.createdAt)} · {order.payload.items.length} item(ns)</Text>
      {messages.length > 0 ? messages.map((message) => <Text key={message} className="text-xs text-foreground">• {message}</Text>) : null}
      {order.lastErrorMessage && state !== 'needs_review' ? <Text className="text-xs text-muted">{order.lastErrorMessage}</Text> : null}

      <View className="flex-row flex-wrap gap-2 pt-1">
        {state === 'needs_review' ? (
          <Pressable accessibilityRole="button" onPress={() => Alert.alert('Aceitar valores atuais', 'O pedido passa a usar os valores que o servidor informa agora. Ele só será enviado depois da próxima sincronização.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Aceitar', onPress: onAccept }])} className="min-h-11 flex-1 items-center justify-center rounded-lg bg-primary px-3">
            <Text className="text-xs font-black text-primary-foreground">Aceitar valores atuais</Text>
          </Pressable>
        ) : null}
        {state === 'recoverable_error' ? (
          <Pressable accessibilityRole="button" onPress={onRetry} className="min-h-11 flex-1 items-center justify-center rounded-lg bg-primary px-3">
            <Text className="text-xs font-black text-primary-foreground">Tentar novamente</Text>
          </Pressable>
        ) : null}
        {state !== 'syncing' ? (
          <Pressable accessibilityRole="button" onPress={onDiscard} className="min-h-11 items-center justify-center rounded-lg border border-destructive/50 px-3">
            <Text className="text-xs font-black text-destructive">Descartar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function confirmDiscard(order: QueuedOrder, onConfirm: () => void) {
  Alert.alert('Descartar pedido local', `O pedido de ${order.customerName ?? 'cliente'} será removido deste aparelho e não será enviado.`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Descartar', style: 'destructive', onPress: onConfirm },
  ]);
}
