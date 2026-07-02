import { AppShell } from '@/components/app-shell';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import { Boxes, ChevronRight, CircleDollarSign, RefreshCw, ShoppingCart, Tags } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type DashboardOrder = {
  id: number;
  order_number: number | string;
  total: number | string;
  status: number | string;
  created_at?: string;
  customer?: { name?: string };
};

type DashboardData = {
  orders: DashboardOrder[];
  products: unknown[];
  flex: number | string;
  discount: number | string;
};

const statuses: Record<string, { label: string; color: string }> = {
  '1': { label: 'Processando', color: colors.warning },
  '2': { label: 'Pago', color: colors.success },
  '3': { label: 'Entregue', color: colors.primary },
  '4': { label: 'Cancelado', color: colors.danger },
};

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await megbapi.get('/alldata');
      setData(response.data.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        await signOut();
        return;
      }
      setMessage('Não foi possível atualizar seus indicadores. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useFocusEffect(useCallback(() => { void loadDashboard(); }, [loadDashboard]));

  const recentOrders = [...(data?.orders ?? [])]
    .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
    .slice(0, 5);

  return (
    <AppShell bottomInset={20} safeBottom={false}>
      <View style={styles.workspaceHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Visão comercial</Text>
          <Text style={styles.title} numberOfLines={2}>Olá, {firstName(user?.name)}</Text>
          <Text style={styles.subtitle}>Acompanhe o movimento da sua operação.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atualizar indicadores"
          disabled={loading}
          onPress={() => void loadDashboard()}
          style={({ pressed }) => [styles.refreshButton, (pressed || loading) && styles.pressed]}>
          {loading ? <ActivityIndicator size="small" color={colors.text} /> : <RefreshCw size={21} color={colors.text} />}
        </Pressable>
      </View>

      {message ? (
        <Pressable onPress={() => void loadDashboard()} style={styles.errorBox}>
          <Text style={styles.errorText}>{message}</Text>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      ) : null}

      <View style={styles.metricsGrid}>
        <MetricCard label="Pedidos" value={data?.orders?.length ?? 0} icon={ShoppingCart} tint={colors.primary} />
        <MetricCard label="Produtos" value={data?.products?.length ?? 0} icon={Boxes} tint={colors.warning} />
      </View>

      <View style={styles.financialRow}>
        <FinancialMetric label="Flex acumulado" value={formatCurrency(data?.flex)} icon={CircleDollarSign} />
        <FinancialMetric label="Descontos" value={formatCurrency(data?.discount)} icon={Tags} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Pedidos recentes</Text>
            <Text style={styles.sectionDescription}>{recentOrders.length ? 'Últimas movimentações registradas' : 'Nenhum pedido registrado'}</Text>
          </View>
          <Pressable onPress={() => router.push('/orders')} style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}>
            <Text style={styles.seeAllText}>Ver todos</Text>
            <ChevronRight size={17} color={colors.primary} />
          </Pressable>
        </View>

        {loading && !data ? (
          <View style={styles.loadingState}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Carregando pedidos...</Text></View>
        ) : recentOrders.length ? (
          <View style={styles.orderList}>
            {recentOrders.map((order) => <OrderRow key={order.id} order={order} />)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ShoppingCart size={26} color={colors.mutedText} />
            <Text style={styles.emptyTitle}>Sua lista ainda está vazia</Text>
            <Text style={styles.emptyText}>Novos pedidos aparecerão aqui para consulta rápida.</Text>
            <Pressable onPress={() => router.push('/(tabs)/orders/manage-order')} style={({ pressed }) => [styles.newOrderButton, pressed && styles.pressed]}>
              <Text style={styles.newOrderButtonText}>Registrar novo pedido</Text>
              <ChevronRight size={17} color={colors.primaryText} />
            </Pressable>
          </View>
        )}
      </View>
    </AppShell>
  );
}

function MetricCard({ label, value, icon: Icon, tint }: { label: string; value: number; icon: typeof ShoppingCart; tint: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${tint}18` }]}><Icon size={21} color={tint} /></View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function FinancialMetric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Tags }) {
  return (
    <View style={styles.financialMetric}>
      <Icon size={20} color={colors.primary} />
      <View style={styles.financialCopy}>
        <Text style={styles.financialLabel}>{label}</Text>
        <Text style={styles.financialValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      </View>
    </View>
  );
}

function OrderRow({ order }: { order: DashboardOrder }) {
  const status = statuses[String(order.status)] ?? { label: 'Em análise', color: colors.mutedText };
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/orders/view-order', params: { id: String(order.id) } })}
      style={({ pressed }) => [styles.orderRow, pressed && styles.rowPressed]}>
      <View style={styles.orderIdentity}>
        <Text style={styles.orderNumber}>Pedido #{order.order_number}</Text>
        <Text style={styles.customerName} numberOfLines={1}>{order.customer?.name || 'Cliente não informado'}</Text>
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
        <View style={[styles.status, { borderColor: `${status.color}55`, backgroundColor: `${status.color}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.mutedText} />
    </Pressable>
  );
}

function firstName(name?: string) {
  return name?.trim().split(/\s+/)[0] || 'vendedor';
}

function formatCurrency(value?: number | string) {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? 0).replace(/[^\d,.-]/g, '').replace(',', '.'));
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(numeric) ? numeric : 0);
}

const styles = StyleSheet.create({
  workspaceHeader: { minHeight: 148, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, borderRadius: 16, padding: 20, backgroundColor: colors.header },
  headerCopy: { flex: 1 },
  eyebrow: { color: 'rgba(255,255,255,0.66)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 26, lineHeight: 32, fontWeight: '900', marginTop: 4 },
  subtitle: { color: 'rgba(255,255,255,0.76)', fontSize: 14, lineHeight: 20, marginTop: 8 },
  refreshButton: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.11)' },
  pressed: { opacity: 0.65 },
  errorBox: { borderWidth: 1, borderColor: 'rgba(249,112,102,0.35)', borderRadius: 12, backgroundColor: 'rgba(249,112,102,0.1)', padding: 14 },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  retryText: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { minWidth: 104, flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, padding: 14 },
  metricIcon: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  metricValue: { color: colors.text, fontSize: 24, fontWeight: '900' },
  metricLabel: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  financialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  financialMetric: { minWidth: 156, flex: 1, minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surfaceRaised, padding: 14 },
  financialCopy: { minWidth: 0, flex: 1 },
  financialLabel: { color: colors.mutedText, fontSize: 12 },
  financialValue: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 4 },
  section: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden' },
  sectionHeader: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  sectionDescription: { color: colors.mutedText, fontSize: 12, marginTop: 3 },
  seeAll: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  loadingState: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: colors.mutedText, fontSize: 13 },
  orderList: { paddingHorizontal: 16 },
  orderRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { opacity: 0.65 },
  orderIdentity: { minWidth: 0, flex: 1 },
  orderNumber: { color: colors.text, fontSize: 14, fontWeight: '800' },
  customerName: { color: colors.mutedText, fontSize: 12, marginTop: 4 },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  orderTotal: { color: colors.text, fontSize: 13, fontWeight: '800' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  emptyState: { minHeight: 180, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 10 },
  emptyText: { color: colors.mutedText, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 4 },
  newOrderButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, backgroundColor: colors.primary, paddingHorizontal: 16, marginTop: 14 },
  newOrderButtonText: { color: colors.primaryText, fontSize: 13, fontWeight: '900' },
});
