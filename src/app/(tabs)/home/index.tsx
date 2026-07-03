import { AppShell } from '@/components/app-shell';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import { Boxes, ChevronRight, CircleDollarSign, RefreshCw, ShoppingCart, Tags } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

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
      <View className="min-h-[148px] flex-row items-start justify-between gap-4 rounded-2xl bg-header p-5">
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-extrabold uppercase text-white/65">Visão comercial</Text>
          <Text className="mt-1 text-[26px] leading-8 font-black text-foreground" numberOfLines={2}>Olá, {firstName(user?.name)}</Text>
          <Text className="mt-2 text-sm leading-5 text-white/75">Acompanhe o movimento da sua operação.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atualizar indicadores"
          disabled={loading}
          onPress={() => void loadDashboard()}
          className="h-[42px] w-[42px] items-center justify-center rounded-lg bg-white/10 active:opacity-65 disabled:opacity-65">
          {loading ? <ActivityIndicator size="small" color={colors.text} /> : <RefreshCw size={21} color={colors.text} />}
        </Pressable>
      </View>

      {message ? (
        <Pressable onPress={() => void loadDashboard()} className="rounded-xl border border-destructive/35 bg-destructive/10 p-3.5">
          <Text className="text-sm leading-5 text-destructive">{message}</Text>
          <Text className="mt-2 text-[13px] font-extrabold text-foreground">Tentar novamente</Text>
        </Pressable>
      ) : null}

      <View className="flex-row flex-wrap gap-2.5">
        <MetricCard label="Pedidos" value={data?.orders?.length ?? 0} icon={ShoppingCart} tint={colors.primary} />
        <MetricCard label="Produtos" value={data?.products?.length ?? 0} icon={Boxes} tint={colors.warning} />
      </View>

      <View className="flex-row flex-wrap gap-2.5">
        <FinancialMetric label="Flex acumulado" value={formatCurrency(data?.flex)} icon={CircleDollarSign} />
        <FinancialMetric label="Descontos" value={formatCurrency(data?.discount)} icon={Tags} />
      </View>

      <View className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
        <View className="min-h-[76px] flex-row items-center justify-between gap-3 border-b border-white/10 p-4">
          <View className="min-w-0 flex-1">
            <Text className="text-[17px] font-black text-foreground">Pedidos recentes</Text>
            <Text className="mt-0.5 text-xs text-muted">{recentOrders.length ? 'Últimas movimentações registradas' : 'Nenhum pedido registrado'}</Text>
          </View>
          <Pressable onPress={() => router.push('/orders')} className="min-h-[38px] shrink-0 justify-center px-1 active:opacity-65">
            <Text className="text-xs leading-[18px] font-extrabold text-primary" numberOfLines={1}>Ver todos</Text>
          </Pressable>
        </View>

        {loading && !data ? (
          <View className="min-h-[150px] items-center justify-center gap-2.5"><ActivityIndicator color={colors.primary} /><Text className="text-[13px] text-muted">Carregando pedidos...</Text></View>
        ) : recentOrders.length ? (
          <View className="gap-2 p-3">
            {recentOrders.map((order) => <OrderRow key={order.id} order={order} />)}
          </View>
        ) : (
          <View className="min-h-[180px] items-center justify-center p-6">
            <ShoppingCart size={26} color={colors.mutedText} />
            <Text className="mt-2.5 text-[15px] font-extrabold text-foreground">Sua lista ainda está vazia</Text>
            <Text className="mt-1 text-center text-[13px] leading-[19px] text-muted">Novos pedidos aparecerão aqui para consulta rápida.</Text>
            <Pressable onPress={() => router.push('/(tabs)/orders/manage-order')} className="mt-3.5 min-h-11 max-w-full flex-row flex-nowrap items-center justify-center gap-1 rounded-[10px] bg-primary px-4 active:opacity-65">
              <Text className="min-w-0 shrink text-[13px] font-black text-primary-foreground">Registrar novo pedido</Text>
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
    <View className="min-w-[104px] flex-1 rounded-xl border border-white/10 bg-surface p-3.5">
      <View className="mb-3.5 h-[38px] w-[38px] items-center justify-center rounded-lg" style={{ backgroundColor: `${tint}18` }}><Icon size={21} color={tint} /></View>
      <Text className="text-2xl font-black text-foreground">{value}</Text>
      <Text className="mt-0.5 text-xs text-muted">{label}</Text>
    </View>
  );
}

function FinancialMetric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Tags }) {
  return (
    <View className="min-w-[156px] min-h-[78px] flex-1 flex-row flex-nowrap items-center gap-[11px] rounded-xl border border-white/10 bg-surface-raised p-3.5">
      <Icon size={20} color={colors.primary} />
      <View className="min-w-0 flex-1">
        <Text className="text-xs text-muted">{label}</Text>
        <Text className="mt-1 text-[17px] font-extrabold text-foreground" numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      </View>
    </View>
  );
}

function OrderRow({ order }: { order: DashboardOrder }) {
  const status = statuses[String(order.status)] ?? { label: 'Em análise', color: colors.mutedText };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir pedido ${order.order_number}`}
      onPress={() => router.push({ pathname: '/orders/view-order', params: { id: String(order.id) } })}
      className="min-h-[82px] flex-row flex-nowrap items-center justify-between gap-3 rounded-[10px] border border-white/10 bg-surface-raised p-3.5 active:opacity-70">
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-extrabold text-foreground">Pedido #{order.order_number}</Text>
        <Text className="mt-1 text-xs text-muted" numberOfLines={1}>{order.customer?.name || 'Cliente não informado'}</Text>
        {order.created_at ? <Text className="mt-1 text-[10px] capitalize text-muted">{formatDate(order.created_at)}</Text> : null}
      </View>
      <View className="w-[100px] shrink-0 items-end justify-center gap-[7px]">
        <Text className="w-full text-right text-[13px] font-extrabold text-foreground" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{formatCurrency(order.total)}</Text>
        <View className="max-w-full flex-row flex-nowrap items-center gap-1 rounded-md px-[7px] py-[3px]" style={{ backgroundColor: `${status.color}15` }}>
          <View className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: status.color }} />
          <Text className="text-[10px] font-extrabold" style={{ color: status.color }} numberOfLines={1}>{status.label}</Text>
        </View>
      </View>
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

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}
