import { statusOptions } from '@/components/orders/order-status-modal';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { OrderProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { CalendarDays, ChevronRight, ShoppingCart } from 'lucide-react-native';
import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type ReportData = { orders: OrderProps[]; sumFlex: string | number; sumDiscount: string | number; sumTotal: string | number };

export default function OrderReport() {
  const { signOut } = useAuth();
  const [startDate, setStartDate] = useState(() => moment().startOf('month').toDate());
  const [endDate, setEndDate] = useState(new Date());
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData>({ orders: [], sumFlex: 0, sumDiscount: 0, sumTotal: 0 });

  const loadReport = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await megbapi.post('/dateorders', {
        start_date: moment(startDate).format('YYYY-MM-DD'),
        end_date: moment(endDate).format('YYYY-MM-DD'),
      });
      setReport(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) return void signOut();
      setMessage('Não foi possível carregar o relatório deste período.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, signOut]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  return (
    <View style={styles.screen}>
      <View style={styles.reportHeader}>
        <View><Text style={styles.eyebrow}>Relatório de pedidos</Text><Text style={styles.date}>{moment(startDate).format('DD/MM/YYYY')} a {moment(endDate).format('DD/MM/YYYY')}</Text></View>
        <CalendarDays size={24} color={colors.text} />
      </View>

      <View style={styles.filterRow}>
        <DateButton label="Início" date={startDate} onPress={() => { setActivePicker('start'); setShowPicker(true); }} />
        <DateButton label="Fim" date={endDate} onPress={() => { setActivePicker('end'); setShowPicker(true); }} />
      </View>

      {showPicker && activePicker ? <DateTimePicker value={activePicker === 'start' ? startDate : endDate} maximumDate={activePicker === 'start' ? endDate : new Date()} minimumDate={activePicker === 'end' ? startDate : undefined} mode="date" locale="pt-BR" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_, selectedDate) => { setShowPicker(Platform.OS === 'ios'); if (!selectedDate) return; if (activePicker === 'start') setStartDate(selectedDate); else setEndDate(selectedDate); }} /> : null}

      <View style={styles.metrics}>
        <Metric label="Total vendido" value={formatCurrency(report.sumTotal)} tone={colors.success} />
        <Metric label="Flex" value={formatCurrency(report.sumFlex)} tone={colors.primary} />
        <Metric label="Descontos" value={formatCurrency(report.sumDiscount)} tone={colors.warning} />
      </View>

      <View style={styles.listHeader}><Text style={styles.listTitle}>Pedidos</Text><Text style={styles.count}>{report.orders.length} no período</Text></View>

      {message ? <View style={styles.center}><Text style={styles.error}>{message}</Text><Pressable onPress={loadReport}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View> : loading && !report.orders.length ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Carregando relatório...</Text></View> : (
        <FlashList
          data={report.orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ReportRow order={item} />}
          contentContainerStyle={styles.listContent}
          onRefresh={loadReport}
          refreshing={loading}
          ListEmptyComponent={<View style={styles.center}><ShoppingCart size={28} color={colors.mutedText} /><Text style={styles.emptyTitle}>Nenhum pedido no período</Text><Text style={styles.muted}>Escolha outro intervalo para consultar.</Text></View>}
        />
      )}
    </View>
  );
}

function ReportRow({ order }: { order: OrderProps }) {
  const status = statusOptions.find((option) => option.value === String(order.status));
  return <Pressable onPress={() => router.push({ pathname: '/orders/view-order', params: { id: String(order.id) } })} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.orderIcon}><ShoppingCart size={18} color={colors.primary} /></View><View style={styles.rowMain}><Text style={styles.rowTitle}>Pedido #{order.order_number}</Text><Text style={styles.muted} numberOfLines={1}>{order.customer?.name || 'Cliente não informado'}</Text></View><View style={styles.rowRight}><Text style={styles.total}>{formatCurrency(order.total)}</Text>{status ? <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text> : null}</View><ChevronRight size={18} color={colors.mutedText} /></Pressable>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text></View>; }
function DateButton({ label, date, onPress }: { label: string; date: Date; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.dateFilterButton, pressed && styles.pressed]}><CalendarDays size={17} color={colors.primary} /><View style={styles.dateFilterCopy}><Text style={styles.dateFilterLabel}>{label}</Text><Text style={styles.dateFilterValue} numberOfLines={1}>{moment(date).format('DD/MM/YYYY')}</Text></View></Pressable>; }
function formatCurrency(value: string | number) { const number = Number(String(value ?? 0).replace(/[^\d,.-]/g, '').replace(',', '.')); return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(number) ? number : 0); }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 16 },
  reportHeader: { minHeight: 112, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 16, backgroundColor: colors.header, padding: 18 },
  eyebrow: { color: 'rgba(255,255,255,0.66)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  date: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 6, textTransform: 'capitalize' },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  dateFilterButton: { minWidth: 0, flex: 1, minHeight: 54, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface, paddingHorizontal: 12 },
  dateFilterCopy: { minWidth: 0, flex: 1 },
  dateFilterLabel: { color: colors.mutedText, fontSize: 9, textTransform: 'uppercase' },
  dateFilterValue: { flexShrink: 1, color: colors.text, fontSize: 12, fontWeight: '900', marginTop: 2 },
  pressed: { opacity: 0.62 },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metric: { minWidth: 0, flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 11, backgroundColor: colors.surface, padding: 12 },
  metricLabel: { color: colors.mutedText, fontSize: 10 },
  metricValue: { fontSize: 14, fontWeight: '900', marginTop: 5 },
  listHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 20, marginBottom: 6 },
  listTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  count: { color: colors.mutedText, fontSize: 11 },
  listContent: { paddingBottom: 24 },
  row: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  orderIcon: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34,184,240,0.1)' },
  rowMain: { minWidth: 0, flex: 1 },
  rowTitle: { color: colors.text, fontSize: 13, fontWeight: '900', marginBottom: 3 },
  muted: { color: colors.mutedText, fontSize: 11 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  total: { color: colors.text, fontSize: 12, fontWeight: '900' },
  statusText: { fontSize: 9, fontWeight: '800' },
  center: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 9 },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  retry: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
});
