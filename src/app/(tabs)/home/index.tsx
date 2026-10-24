import { AppShell } from '@/components/app-shell';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { describeApiError } from '@/utils/api-errors';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import { Boxes, CalendarCheck, ChevronRight, CircleDollarSign, Megaphone, RefreshCw, ShoppingCart, Target, TrendingDown, TrendingUp, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';

/**
 * Painel inicial do aplicativo. Todos os números vêm de GET /app/dashboard, que usa os mesmos
 * serviços do painel web. Valores são de pedidos emitidos, nunca de recebimento.
 */
type Period = 'today' | 'last_7_days' | 'month' | 'previous_month';

const periodOptions: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'last_7_days', label: '7 dias' },
  { value: 'month', label: 'Mês atual' },
  { value: 'previous_month', label: 'Mês anterior' },
];

type DashboardOrder = {
  id: number;
  order_number: number | string;
  customer_name: string | null;
  total: number;
  status: string;
  created_at?: string | null;
};

type DashboardCampaign = {
  id: number;
  name: string;
  audience_type: 'all' | 'region';
  products_count: number;
  ends_at?: string | null;
  public_url: string;
  region?: { name?: string } | null;
};

type Dashboard = {
  period: { label: string; start_date: string; end_date: string };
  emitted_total: number;
  emitted_total_label: string;
  valid_orders_count: number;
  average_ticket: number;
  canceled_count: number;
  comparison: { label: string; previous_total: number; change_percentage: number | null; previous_orders_count: number };
  goal: { amount: number | null; basis: 'full' | 'proportional' | null; scope: 'team' | 'seller'; percentage: number | null };
  customers: { total: number; buying: number; without_purchase: number };
  attendance: { completed: number; pending: number; canceled: number };
  top_products: { id: number; name: string; quantity: number; total: number }[];
  recent_orders: DashboardOrder[];
  campaigns: DashboardCampaign[];
};

const statuses: Record<string, { label: string; color: string }> = {
  '1': { label: 'Processando', color: colors.warning },
  '2': { label: 'Pago', color: colors.success },
  '3': { label: 'Entregue', color: colors.primary },
  '4': { label: 'Cancelado', color: colors.danger },
};

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Dashboard | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await megbapi.get('/app/dashboard', { params: { period } });
      setData(response.data.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        await signOut();
        return;
      }
      setMessage(describeApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [period, signOut]);

  useFocusEffect(useCallback(() => { void loadDashboard(); }, [loadDashboard]));

  return (
    <AppShell bottomInset={20} safeBottom={false}>
      <View className="min-h-[120px] flex-row items-start justify-between gap-4 rounded-2xl bg-header p-5">
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-extrabold uppercase text-white/65">Visão comercial</Text>
          <Text className="mt-1 text-[24px] leading-8 font-black text-foreground" numberOfLines={2}>Olá, {firstName(user?.name)}</Text>
          <Text className="mt-2 text-sm leading-5 text-white/75">{data ? `Resultados de ${data.period.label.toLowerCase()}` : 'Carregando seus resultados'}</Text>
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

      <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup" accessibilityLabel="Período dos resultados">
        {periodOptions.map((option) => {
          const active = option.value === period;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setPeriod(option.value)}
              className={`min-h-[40px] justify-center rounded-full border px-3.5 ${active ? 'border-primary bg-primary' : 'border-white/15 bg-surface'}`}>
              <Text className={`text-[13px] font-extrabold ${active ? 'text-primary-foreground' : 'text-foreground'}`}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {message ? (
        <Pressable onPress={() => void loadDashboard()} className="rounded-xl border border-destructive/35 bg-destructive/10 p-3.5">
          <Text className="text-sm leading-5 text-destructive">{message}</Text>
          <Text className="mt-2 text-[13px] font-extrabold text-foreground">Tentar novamente</Text>
        </Pressable>
      ) : null}

      {data?.campaigns?.length ? (
        <View className="gap-2.5">
          {data.campaigns.map((campaign) => (
            <Pressable
              key={campaign.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir campanha ${campaign.name}`}
              onPress={() => void Linking.openURL(campaign.public_url)}
              className="flex-row items-center gap-3 rounded-2xl border border-primary/35 bg-primary/10 p-4 active:opacity-70">
              <View className="h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                <Megaphone size={23} color={colors.primary} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[10px] font-black tracking-wider text-primary uppercase">Campanha em andamento</Text>
                <Text className="mt-1 text-[15px] font-black text-foreground" numberOfLines={1}>{campaign.name}</Text>
                <Text className="mt-1 text-xs text-muted" numberOfLines={1}>
                  {campaign.audience_type === 'region' ? campaign.region?.name : 'Todos os clientes'} · {campaign.products_count} produto(s)
                  {campaign.ends_at ? ` · até ${formatShortDate(campaign.ends_at)}` : ''}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading && !data ? (
        <View className="min-h-[220px] items-center justify-center gap-2.5"><ActivityIndicator color={colors.primary} /><Text className="text-[13px] text-muted">Carregando resultados...</Text></View>
      ) : data ? (
        <>
          <View className="rounded-2xl border border-white/10 bg-surface p-4">
            <View className="flex-row items-center gap-2"><CircleDollarSign size={20} color={colors.primary} /><Text className="text-xs font-extrabold uppercase text-muted">Valor de pedidos emitidos</Text></View>
            <Text className="mt-2 text-[30px] font-black text-foreground" numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(data.emitted_total)}</Text>
            <Text className="mt-1 text-xs text-muted">{data.emitted_total_label}. Cancelados não entram.</Text>
            <ComparisonLine comparison={data.comparison} />
          </View>

          <View className="flex-row flex-wrap gap-2.5">
            <MetricCard label="Pedidos válidos" value={String(data.valid_orders_count)} icon={ShoppingCart} tint={colors.primary} />
            <MetricCard label="Ticket médio" value={formatCurrency(data.average_ticket)} icon={CircleDollarSign} tint={colors.warning} />
          </View>

          <Section title="Meta do período" icon={Target}>
            {data.goal.amount === null ? (
              <Text className="text-sm text-muted">Sem meta cadastrada para este período.</Text>
            ) : (
              <View className="gap-2">
                <Text className="text-[26px] font-black text-foreground">{data.goal.percentage === null ? '—' : `${data.goal.percentage.toFixed(1).replace('.', ',')}%`}</Text>
                <View className="h-2 overflow-hidden rounded-full bg-white/10">
                  <View className="h-full bg-primary" style={{ width: `${Math.min(data.goal.percentage ?? 0, 100)}%` }} />
                </View>
                <Text className="text-xs text-muted">{formatCurrency(data.emitted_total)} de {formatCurrency(data.goal.amount)} · {data.goal.scope === 'team' ? 'equipe' : 'sua meta'}</Text>
                <View className="self-start rounded-full bg-primary/15 px-2.5 py-1">
                  <Text className="text-[11px] font-extrabold text-primary">{data.goal.basis === 'full' ? 'Meta cheia' : 'Meta proporcional aos dias'}</Text>
                </View>
                {data.goal.basis === 'proportional' ? (
                  <Text className="text-xs leading-[18px] text-muted">Apresentada proporcionalmente aos dias transcorridos; o percentual reflete esse critério.</Text>
                ) : null}
              </View>
            )}
          </Section>

          <Section title="Clientes e atendimentos" icon={Users}>
            <View className="flex-row gap-2.5">
              <Stat label="Compraram" value={`${data.customers.buying}`} hint={`de ${data.customers.total} na carteira`} />
              <Stat label="Sem compra" value={`${data.customers.without_purchase}`} hint="no período" />
            </View>
            <View className="mt-2.5 flex-row gap-2.5">
              <Stat label="Realizados" value={`${data.attendance.completed}`} hint="atendimentos" />
              <Stat label="Pendentes" value={`${data.attendance.pending}`} hint="na agenda" />
            </View>
          </Section>

          <Section title="Produtos mais vendidos" icon={Boxes}>
            {data.top_products.length ? (
              <View className="gap-2">
                {data.top_products.map((product, index) => (
                  <View key={product.id} className="flex-row items-center justify-between gap-3">
                    <Text className="min-w-0 flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>{index + 1}. {product.name}</Text>
                    <Text className="text-xs text-muted">{product.quantity} un.</Text>
                    <Text className="text-sm font-extrabold text-foreground">{formatCurrency(product.total)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-muted">Nenhum produto vendido neste período.</Text>
            )}
          </Section>
        </>
      ) : null}

      {data ? (
        <View className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
          <View className="min-h-[70px] flex-row items-center justify-between gap-3 border-b border-white/10 p-4">
            <View className="min-w-0 flex-1">
              <Text className="text-[17px] font-black text-foreground">Pedidos recentes</Text>
              <Text className="mt-0.5 text-xs text-muted">{data.recent_orders.length ? 'Últimas movimentações registradas' : 'Nenhum pedido registrado'}</Text>
            </View>
            <Pressable onPress={() => router.push('/orders')} className="min-h-[38px] shrink-0 justify-center px-1 active:opacity-65">
              <Text className="text-xs leading-[18px] font-extrabold text-primary" numberOfLines={1}>Ver todos</Text>
            </Pressable>
          </View>

          {data.recent_orders.length ? (
            <View className="gap-2 p-3">
              {data.recent_orders.map((order) => <OrderRow key={order.id} order={order} />)}
            </View>
          ) : (
            <View className="min-h-[160px] items-center justify-center p-6">
              <ShoppingCart size={26} color={colors.mutedText} />
              <Text className="mt-2.5 text-[15px] font-extrabold text-foreground">Sua lista ainda está vazia</Text>
              <Text className="mt-1 text-center text-[13px] leading-[19px] text-muted">Novos pedidos aparecerão aqui para consulta rápida.</Text>
              <Pressable onPress={() => router.push('/(tabs)/orders/manage-order')} className="mt-3.5 min-h-11 max-w-full flex-row flex-nowrap items-center justify-center gap-1 rounded-[10px] bg-primary px-4">
                <Text className="min-w-0 shrink text-[13px] font-black text-primary-foreground">Registrar novo pedido</Text>
                <ChevronRight size={17} color={colors.primaryText} />
              </Pressable>
            </View>
          )}
        </View>
      ) : null}
    </AppShell>
  );
}

function ComparisonLine({ comparison }: { comparison: Dashboard['comparison'] }) {
  const change = comparison.change_percentage;
  const Icon = change !== null && change < 0 ? TrendingDown : TrendingUp;
  const tone = change !== null && change < 0 ? 'text-destructive' : 'text-success';

  return (
    <View className="mt-3 flex-row items-center gap-2">
      {change !== null ? <Icon size={16} color={change < 0 ? colors.danger : colors.success} /> : null}
      <Text className={`text-sm font-bold ${change === null ? 'text-muted' : tone}`}>
        {change === null
          ? `Sem base de comparação com ${comparison.label.toLowerCase()}`
          : `${change > 0 ? '+' : ''}${change.toFixed(1).replace('.', ',')}% em relação a ${comparison.label.toLowerCase()} (${formatCurrency(comparison.previous_total)})`}
      </Text>
    </View>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Target; children: React.ReactNode }) {
  return (
    <View className="gap-3 rounded-2xl border border-white/10 bg-surface p-4">
      <View className="flex-row items-center gap-2"><Icon size={18} color={colors.primary} /><Text className="text-[15px] font-black text-foreground">{title}</Text></View>
      {children}
    </View>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View className="min-w-[140px] flex-1 rounded-xl border border-white/10 bg-surface-raised p-3">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="mt-1 text-xl font-black text-foreground">{value}</Text>
      <Text className="text-[11px] text-muted">{hint}</Text>
    </View>
  );
}

function MetricCard({ label, value, icon: Icon, tint }: { label: string; value: string; icon: typeof ShoppingCart; tint: string }) {
  return (
    <View className="min-w-[140px] flex-1 rounded-xl border border-white/10 bg-surface p-3.5">
      <View className="mb-3 h-[38px] w-[38px] items-center justify-center rounded-lg" style={{ backgroundColor: `${tint}18` }}><Icon size={21} color={tint} /></View>
      <Text className="text-xl font-black text-foreground" numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text className="mt-0.5 text-xs text-muted">{label}</Text>
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
        <Text className="mt-1 text-xs text-muted" numberOfLines={1}>{order.customer_name || 'Cliente não informado'}</Text>
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

function formatCurrency(value?: number | string | null) {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? 0).replace(/[^\d,.-]/g, '').replace(',', '.'));
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(numeric) ? numeric : 0);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}
