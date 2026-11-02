import { useOffline } from '@/offline/OfflineProvider';
import { STATE_LABELS, type OrderState } from '@/offline/queue/state-machine';
import type { QueuedOrder } from '@/offline/queue/order-queue';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

/**
 * Pedidos registrados no aparelho que ainda não foram confirmados. Sempre identificados como
 * "Pendente de sincronização" e sem número oficial até a confirmação do servidor.
 */
export function PendingOrdersSection() {
  const { runtime, pendingCount } = useOffline();
  const [orders, setOrders] = useState<QueuedOrder[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const list = runtime ? await runtime.queue.listActive() : [];
      if (active) setOrders(list);
    })();
    return () => {
      active = false;
    };
  }, [runtime, pendingCount]);

  if (orders.length === 0) return null;

  return (
    <View className="mb-3 gap-2">
      <Text className="px-1 text-xs font-extrabold uppercase text-warning">Pendentes de sincronização ({orders.length})</Text>
      {orders.map((order) => (
        <Pressable
          key={order.localId}
          accessibilityRole="button"
          accessibilityLabel={`Pedido local de ${order.customerName ?? 'cliente'}, ${STATE_LABELS[order.state]}`}
          onPress={() => router.push('/sync')}
          className="flex-row items-center justify-between gap-3 rounded-[10px] border border-warning/40 bg-surface-raised p-3.5 active:opacity-70">
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-extrabold text-foreground">Pedido local (sem número oficial)</Text>
            <Text className="mt-1 text-xs text-muted" numberOfLines={1}>{order.customerName ?? 'Cliente'}</Text>
          </View>
          <View className="rounded-md bg-warning/15 px-2 py-1">
            <Text className="text-[10px] font-extrabold text-warning">{STATE_LABELS[order.state as OrderState]}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
