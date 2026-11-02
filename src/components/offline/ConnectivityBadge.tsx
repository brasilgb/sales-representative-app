import { useOffline } from '@/offline/OfflineProvider';
import { router } from 'expo-router';
import { CloudOff, Cloud, RefreshCw } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

/** Indicador discreto de conexão, com pendências e última sincronização. Toque abre a central. */
export function ConnectivityBadge() {
  const { online, pendingCount, lastSyncAt, syncing } = useOffline();
  const Icon = syncing ? RefreshCw : online ? Cloud : CloudOff;
  const tone = online ? 'text-success' : 'text-warning';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conexão ${online ? 'online' : 'offline'}. ${pendingCount} pedido(s) pendente(s). Abrir sincronização.`}
      onPress={() => router.push('/sync')}
      className="flex-row items-center gap-2 rounded-full border border-[#E2E8F0] bg-surface px-3 py-2 active:opacity-70">
      <Icon size={15} color={online ? '#16A34A' : '#B45309'} />
      <Text className={`text-xs font-extrabold ${tone}`}>{online ? 'Online' : 'Offline'}</Text>
      <Text className="text-xs text-muted" numberOfLines={1}>
        {lastSyncAt ? `· sincronizado ${formatWhen(lastSyncAt)}` : '· sem sincronização'}
      </Text>
      {pendingCount > 0 ? (
        <View className="ml-1 rounded-full bg-warning/20 px-2 py-0.5">
          <Text className="text-[11px] font-black text-warning">{pendingCount} pendente(s)</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
