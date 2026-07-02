import InputSearch from '@/components/input-search';
import { OrderStatusModal } from '@/components/orders/order-status-modal';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { OrderProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { CalendarDays, ChevronRight, Plus, ShoppingCart } from 'lucide-react-native';
import moment from 'moment';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrdersScreen() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await megbapi.get('/orders');
      setOrders(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) return void signOut();
      setMessage('Não foi possível carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useFocusEffect(useCallback(() => { void loadOrders(); }, [loadOrders]));

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return orders;
    return orders.filter((order) => String(order.order_number).includes(term) || order.customer?.name?.toLocaleLowerCase('pt-BR').includes(term));
  }, [orders, search]);

  function updateStatus(id: string, status: string) {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
  }

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.titleRow}>
          <View><Text style={styles.title}>Pedidos</Text><Text style={styles.count}>{orders.length} registrados</Text></View>
          <View style={styles.actions}>
            <Pressable accessibilityLabel="Abrir relatório de pedidos" onPress={() => router.push('/orders/order-report')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><CalendarDays size={18} color={colors.text} /><Text style={styles.secondaryButtonText}>Relatório</Text></Pressable>
          </View>
        </View>
        <InputSearch handleChangeText={setSearch} placeholder="Buscar por pedido ou cliente" />
        <TouchableOpacity accessibilityLabel="Adicionar pedido" accessibilityRole="button" activeOpacity={0.75} onPress={() => router.push('/(tabs)/orders/manage-order')} style={styles.addButton}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Adicionar pedido</Text>
        </TouchableOpacity>
      </View>

      {message ? <View style={styles.centerState}><Text style={styles.errorText}>{message}</Text><Pressable onPress={loadOrders}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View> : loading && !orders.length ? <View style={styles.centerState}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Carregando pedidos...</Text></View> : (
        <FlashList
          data={filtered}
          renderItem={({ item }) => <OrderRow order={item} onStatusChange={(status) => updateStatus(item.id, status)} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onRefresh={loadOrders}
          refreshing={loading}
          ListEmptyComponent={<View style={styles.centerState}><ShoppingCart size={28} color={colors.mutedText} /><Text style={styles.emptyTitle}>{search ? 'Nenhum pedido encontrado' : 'Nenhum pedido registrado'}</Text><Text style={styles.stateText}>{search ? 'Revise o termo da busca.' : 'Os pedidos registrados no sistema aparecerão aqui.'}</Text></View>}
        />
      )}
    </View>
  );
}

function OrderRow({ order, onStatusChange }: { order: OrderProps; onStatusChange: (status: string) => void }) {
  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.push({ pathname: '/orders/view-order', params: { id: String(order.id) } })} style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
        <View style={styles.orderIcon}><ShoppingCart size={19} color={colors.primary} /></View>
        <View style={styles.orderCopy}>
          <Text style={styles.rowTitle} numberOfLines={1}>Pedido #{order.order_number}</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>{order.customer?.name || 'Cliente não informado'}  •  {moment(order.created_at).format('DD/MM/YYYY')}</Text>
        </View>
      </Pressable>
      <View style={styles.rowRight}>
        <Text style={styles.total}>{formatCurrency(order.total)}</Text>
        <OrderStatusModal id={order.id} status={order.status} onStatusChange={onStatusChange} />
      </View>
      <Pressable accessibilityLabel="Ver pedido" onPress={() => router.push({ pathname: '/orders/view-order', params: { id: String(order.id) } })} style={styles.chevron}><ChevronRight size={18} color={colors.mutedText} /></Pressable>
    </View>
  );
}

function formatCurrency(value: string) {
  const numeric = Number(String(value || 0).replace(/[^\d,.-]/g, '').replace(',', '.'));
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(numeric) ? numeric : 0);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: { gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  count: { color: colors.mutedText, fontSize: 12, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 8 },
  secondaryButton: { minHeight: 44, flexDirection: 'row', borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surfaceRaised, paddingHorizontal: 11 },
  secondaryButtonText: { color: colors.text, fontSize: 11, fontWeight: '900' },
  addButton: { width: '100%', height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#67d3fa', borderRadius: 10, backgroundColor: '#0b8fc5', paddingHorizontal: 16, elevation: 4, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
  addButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.62 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowMain: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  orderIcon: { width: 40, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34,184,240,0.1)' },
  orderCopy: { minWidth: 0, flex: 1 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  rowMeta: { color: colors.mutedText, fontSize: 11, marginTop: 5 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  total: { color: colors.text, fontSize: 13, fontWeight: '900' },
  chevron: { width: 24, height: 42, alignItems: 'center', justifyContent: 'center' },
  centerState: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 24 },
  stateText: { color: colors.mutedText, fontSize: 13, textAlign: 'center' },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  retry: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
});
