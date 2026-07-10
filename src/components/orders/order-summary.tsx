import { colors } from '@/constants/theme';
import { OrderItem } from '@/types/app-types';
import { ShoppingCart, Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

interface Props { items: OrderItem[]; onRemoveItem: (productId: number) => void }

export function OrderSummary({ items, onRemoveItem }: Props) {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  return (
    <View className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-surface">
      <View className="min-h-[62px] flex-row flex-nowrap items-center gap-2.5 border-b border-white/10 px-3.5"><ShoppingCart size={20} color={colors.primary} /><View className="min-w-0 flex-1"><Text className="text-[15px] font-black text-foreground">Resumo do pedido</Text><Text className="mt-0.5 text-[11px] text-muted">{items.length} {items.length === 1 ? 'produto' : 'produtos'}</Text></View></View>
      {items.length ? items.map((item) => (
        <View key={item.product_id} className="min-h-[68px] flex-row items-center gap-[9px] border-b border-white/10 px-3.5">
          <View className="min-w-0 flex-1"><Text className="text-[13px] font-extrabold text-foreground" numberOfLines={2}>{item.name}</Text><Text className="mt-0.5 text-[11px] text-muted">{item.quantity} x {formatCurrency(item.price)}{item.discount_percentage > 0 ? ` • ${formatPercentage(item.discount_percentage)} desc.` : ''}</Text></View>
          <Text className="text-xs font-black text-foreground">{formatCurrency(item.total)}</Text>
          <Pressable accessibilityLabel={`Remover ${item.name}`} onPress={() => onRemoveItem(item.product_id)} className="h-9 w-9 items-center justify-center active:opacity-60"><Trash2 color={colors.danger} size={18} /></Pressable>
        </View>
      )) : <Text className="p-6 text-center text-[13px] text-muted">Adicione produtos para montar o pedido.</Text>}
      <View className="min-h-[54px] flex-row items-center justify-between bg-surface-raised px-3.5"><Text className="text-xs font-extrabold text-muted">Subtotal</Text><Text className="text-base font-black text-success">{formatCurrency(total)}</Text></View>
    </View>
  );
}

function formatCurrency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); }
function formatPercentage(value: number) { return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value) + '%'; }
