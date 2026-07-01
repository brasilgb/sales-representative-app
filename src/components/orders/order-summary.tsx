import { colors } from '@/constants/theme';
import { OrderItem } from '@/types/app-types';
import { ShoppingCart, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props { items: OrderItem[]; onRemoveItem: (productId: number) => void }

export function OrderSummary({ items, onRemoveItem }: Props) {
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  return (
    <View style={styles.card}>
      <View style={styles.header}><ShoppingCart size={20} color={colors.primary} /><View><Text style={styles.title}>Resumo do pedido</Text><Text style={styles.muted}>{items.length} {items.length === 1 ? 'produto' : 'produtos'}</Text></View></View>
      {items.length ? items.map((item) => (
        <View key={item.product_id} style={styles.row}>
          <View style={styles.main}><Text style={styles.name} numberOfLines={2}>{item.name}</Text><Text style={styles.muted}>{item.quantity} x {formatCurrency(item.price)}</Text></View>
          <Text style={styles.value}>{formatCurrency(item.quantity * item.price)}</Text>
          <Pressable accessibilityLabel={`Remover ${item.name}`} onPress={() => onRemoveItem(item.product_id)} style={styles.remove}><Trash2 color={colors.danger} size={18} /></Pressable>
        </View>
      )) : <Text style={styles.empty}>Adicione produtos para montar o pedido.</Text>}
      <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCurrency(total)}</Text></View>
    </View>
  );
}

function formatCurrency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); }

const styles = StyleSheet.create({
  card: { marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontSize: 15, fontWeight: '900' },
  muted: { color: colors.mutedText, fontSize: 11, marginTop: 3 },
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  main: { minWidth: 0, flex: 1 },
  name: { color: colors.text, fontSize: 13, fontWeight: '800' },
  value: { color: colors.text, fontSize: 12, fontWeight: '900' },
  remove: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.mutedText, fontSize: 13, textAlign: 'center', padding: 24 },
  totalRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, backgroundColor: colors.surfaceRaised },
  totalLabel: { color: colors.mutedText, fontSize: 12, fontWeight: '800' },
  totalValue: { color: colors.success, fontSize: 16, fontWeight: '900' },
});
