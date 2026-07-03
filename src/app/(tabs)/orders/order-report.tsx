import { statusOptions } from '@/components/orders/order-status-modal';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { OrderProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { CalendarDays, ShoppingCart } from 'lucide-react-native';
import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type ReportData = { orders: OrderProps[]; sumFlex: string | number; sumDiscount: string | number; sumSubtotal: string | number; sumAdjustedTotal: string | number; sumTotal: string | number };

export default function OrderReport() {
  const { signOut } = useAuth();
  const [startDate, setStartDate] = useState(() => moment().startOf('month').toDate());
  const [endDate, setEndDate] = useState(new Date());
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData>({ orders: [], sumFlex: 0, sumDiscount: 0, sumSubtotal: 0, sumAdjustedTotal: 0, sumTotal: 0 });

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

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Metric label="Subtotal" value={formatCurrency(report.sumSubtotal)} tone={colors.text} />
        <Metric label="Valor ajustado" value={formatCurrency(report.sumAdjustedTotal)} tone={colors.primary} />
        <Metric label="Flex gerado" value={formatCurrency(report.sumFlex)} tone={colors.primary} />
        <Metric label="Ajustes/descontos" value={formatCurrency(report.sumDiscount)} tone={colors.warning} />
        <Metric label="Total vendido" value={formatCurrency(report.sumTotal)} tone={colors.success} wide />
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir pedido ${order.order_number}`}
      onPress={() => router.push({ pathname: '/orders/view-order', params: { id: String(order.id) } })}
      className="mb-2 min-h-[118px] flex-row flex-nowrap items-center justify-between gap-3 rounded-[10px] border border-white/10 bg-surface-raised p-3.5 active:opacity-70"
    >
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-extrabold text-foreground" numberOfLines={1}>Pedido #{order.order_number}</Text>
        <Text className="mt-1 text-xs text-muted" numberOfLines={1}>{order.customer?.name || 'Cliente não informado'}</Text>
        <Text className="mt-1 text-[10px] capitalize text-muted">{formatDate(order.created_at)}</Text>
        <Text className="mt-2 text-[10px] text-muted" numberOfLines={1}>Subtotal {formatCurrency(order.subtotal ?? order.total)} · Ajustado {formatCurrency(order.adjusted_total ?? order.total)}</Text>
        <Text className="mt-1 text-[10px] text-muted" numberOfLines={1}>Flex +{formatCurrency(order.flex ?? 0)} · Ajustes −{formatCurrency(order.discount ?? 0)}</Text>
      </View>
      <View className="w-[108px] shrink-0 items-end justify-center gap-[7px]">
        <Text className="w-full text-right text-[13px] font-extrabold text-foreground" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{formatCurrency(order.total)}</Text>
        {status ? <View className="max-w-full flex-row flex-nowrap items-center gap-1 rounded-md px-[7px] py-[3px]" style={{ backgroundColor: `${status.color}15` }}><View className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: status.color }} /><Text className="text-[10px] font-extrabold" style={{ color: status.color }} numberOfLines={1}>{status.label}</Text></View> : null}
      </View>
    </Pressable>
  );
}

function Metric({ label, value, tone, wide = false }: { label: string; value: string; tone: string; wide?: boolean }) { return <View className={`${wide ? 'w-full' : 'min-w-[46%] flex-1'} rounded-xl border border-white/10 bg-surface p-3`}><Text className="text-[10px] text-muted">{label}</Text><Text className="mt-1 text-sm font-black" style={{ color: tone }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text></View>; }
function DateButton({ label, date, onPress }: { label: string; date: Date; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${moment(date).format('DD/MM/YYYY')}`}
      onPress={onPress}
      className="h-[62px] min-w-0 flex-1 flex-row flex-nowrap items-center gap-2.5 rounded-xl border border-white/15 bg-surface px-3 active:opacity-65"
    >
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><CalendarDays size={18} color={colors.primary} /></View>
      <View className="min-w-0 flex-1">
        <Text className="text-[9px] font-bold uppercase text-muted">{label}</Text>
        <Text className="mt-0.5 text-xs font-black text-foreground" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{moment(date).format('DD/MM/YYYY')}</Text>
      </View>
    </Pressable>
  );
}
function formatCurrency(value: string | number) { const number = Number(String(value ?? 0).replace(/[^\d,.-]/g, '').replace(',', '.')); return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(number) ? number : 0); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date); }

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
