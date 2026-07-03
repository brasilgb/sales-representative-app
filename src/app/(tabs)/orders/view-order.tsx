import { AppShell } from '@/components/app-shell';
import { statusOptions } from '@/components/orders/order-status-modal';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import megbapi from '@/utils/megbapi';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Box, ReceiptText, RefreshCw } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type OrderItem = { id: number; product_id: number; name?: string; quantity: number; price: string | number; total?: string | number };

export default function ViewOrder() {
  const params = useLocalSearchParams<{ id: string }>();
  const { signOut } = useAuth();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await megbapi.get(`/orders/${params.id}`);
      setDetails(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) return void signOut();
      setMessage('Não foi possível carregar os detalhes do pedido.');
    } finally {
      setLoading(false);
    }
  }, [params.id, signOut]);

  useFocusEffect(useCallback(() => { void loadOrder(); }, [loadOrder]));

  const order = details?.order;
  const items: OrderItem[] = order?.order_items ?? details?.orderitems ?? [];
  const status = statusOptions.find((option) => option.value === String(order?.status));

  return (
    <AppShell>
      {loading && !order ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Carregando pedido...</Text></View> : message ? <View style={styles.center}><Text style={styles.error}>{message}</Text><Pressable onPress={loadOrder} style={styles.retry}><RefreshCw size={18} color={colors.primary} /><Text style={styles.retryText}>Tentar novamente</Text></Pressable></View> : order ? (
        <>
          <View style={styles.hero}>
            <View style={styles.heroTop}><Text style={styles.eyebrow}>Pedido #{order.order_number}</Text>{status ? <View style={[styles.status, { backgroundColor: `${status.color}16`, borderColor: `${status.color}55` }]}><View style={[styles.dot, { backgroundColor: status.color }]} /><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View> : null}</View>
            <Text style={styles.customer}>{order.customer?.name || 'Cliente não informado'}</Text>
          </View>

          <View style={styles.metrics}>
            <Metric label="Total" value={formatCurrency(order.total)} emphasis />
            <Metric label="Flex" value={formatCurrency(order.flex)} />
            <Metric label="Desconto" value={formatCurrency(order.discount)} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}><ReceiptText size={20} color={colors.primary} /><View style={styles.sectionHeaderCopy}><Text style={styles.sectionTitle}>Itens do pedido</Text><Text style={styles.muted}>{items.length} {items.length === 1 ? 'item' : 'itens'}</Text></View></View>
            {items.map((item) => {
              const product = details?.products?.find((candidate: any) => candidate.id === item.product_id);
              return <View key={item.id} style={styles.itemRow}><View style={styles.itemIcon}><Box size={18} color={colors.warning} /></View><View style={styles.itemMain}><Text style={styles.itemName} numberOfLines={2}>{item.name || product?.name || 'Produto'}</Text><Text style={styles.muted}>Ref. {product?.reference || 'Sem referência'}  •  {item.quantity} un.</Text></View><View style={styles.itemPrice}><Text style={styles.price}>{formatCurrency(item.total ?? Number(item.price) * item.quantity)}</Text><Text style={styles.unitPrice}>{formatCurrency(item.price)} cada</Text></View></View>;
            })}
          </View>
        </>
      ) : null}
    </AppShell>
  );
}

function Metric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) { return <View style={[styles.metric, emphasis && styles.metricEmphasis]}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, emphasis && styles.metricValueEmphasis]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text></View>; }
function formatCurrency(value: string | number | undefined) { const number = Number(String(value ?? 0).replace(/[^\d,.-]/g, '').replace(',', '.')); return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(number) ? number : 0); }

const styles = StyleSheet.create({
  center: { minHeight: 320, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.mutedText, fontSize: 12, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  retry: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 7, marginTop: 5 },
  retryText: { minWidth: 0, flexShrink: 1, color: colors.primary, fontSize: 13, fontWeight: '800' },
  hero: { minHeight: 132, justifyContent: 'center', borderRadius: 16, backgroundColor: colors.header, padding: 20 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  customer: { color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: '900', marginTop: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { minWidth: 100, flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, padding: 14 },
  metricEmphasis: { backgroundColor: colors.surfaceRaised },
  metricLabel: { color: colors.mutedText, fontSize: 11 },
  metricValue: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 5 },
  metricValueEmphasis: { color: colors.success },
  section: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden' },
  sectionHeader: { minHeight: 70, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 11, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionHeaderCopy: { minWidth: 0, flex: 1 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  itemRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemIcon: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,189,102,0.1)' },
  itemMain: { minWidth: 0, flex: 1 },
  itemName: { color: colors.text, fontSize: 14, fontWeight: '800' },
  itemPrice: { alignItems: 'flex-end' },
  price: { color: colors.text, fontSize: 13, fontWeight: '900' },
  unitPrice: { color: colors.mutedText, fontSize: 10, marginTop: 4 },
});
