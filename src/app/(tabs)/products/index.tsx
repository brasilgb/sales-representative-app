import InputSearch from '@/components/input-search';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ProductProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import { Box, Boxes } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

function ProductsContent() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await megbapi.get('/products');
      setProducts(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) return void signOut();
      setMessage('Não foi possível carregar os produtos.');
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useFocusEffect(useCallback(() => { void loadProducts(); }, [loadProducts]));

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return products;
    return products.filter((product) => product.name?.toLocaleLowerCase('pt-BR').includes(term) || product.reference?.toLocaleLowerCase('pt-BR').includes(term));
  }, [products, search]);

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.titleRow}>
          <View><Text style={styles.title}>Produtos</Text><Text style={styles.count}>Somente consulta • {products.length} cadastrados</Text></View>
        </View>
        <InputSearch handleChangeText={setSearch} placeholder="Buscar por nome ou referência" />
      </View>

      {message ? <ErrorState message={message} onRetry={loadProducts} /> : loading && !products.length ? <LoadingState /> : (
        <FlashList
          data={filtered}
          renderItem={({ item }) => <ProductRow product={item} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onRefresh={loadProducts}
          refreshing={loading}
          ListEmptyComponent={<EmptyState search={search} />}
        />
      )}
    </View>
  );
}

function ProductRow({ product }: { product: ProductProps }) {
  const stock = Number(product.quantity || 0);
  const minimum = Number(product.min_quantity || 0);
  const lowStock = stock <= minimum;
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Box size={20} color={colors.warning} /></View>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>Ref. {product.reference}  •  {formatCurrency(product.price)}</Text>
      </View>
      <View style={styles.stockWrap}>
        <Text style={[styles.stockValue, lowStock && styles.stockLow]}>{stock}</Text>
        <Text style={styles.stockLabel}>estoque</Text>
      </View>
    </View>
  );
}

function formatCurrency(value: string) {
  const normalized = Number(String(value || 0).replace(/[^\d,.-]/g, '').replace(',', '.'));
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(normalized) ? normalized : 0);
}

function LoadingState() { return <View style={styles.centerState}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Carregando produtos...</Text></View>; }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <View style={styles.centerState}><Text style={styles.errorText}>{message}</Text><Pressable onPress={onRetry}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View>; }
function EmptyState({ search }: { search: string }) { return <View style={styles.centerState}><Boxes size={28} color={colors.mutedText} /><Text style={styles.emptyTitle}>{search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</Text><Text style={styles.stateText}>{search ? 'Revise o termo da busca.' : 'Os produtos cadastrados no sistema aparecerão aqui.'}</Text></View>; }

export default function Products() { return <ProductsContent />; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: { gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  count: { color: colors.mutedText, fontSize: 12, marginTop: 3 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 42, height: 42, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,189,102,0.1)' },
  rowMain: { minWidth: 0, flex: 1 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  rowMeta: { color: colors.mutedText, fontSize: 12, marginTop: 5 },
  stockWrap: { minWidth: 42, alignItems: 'center' },
  stockValue: { color: colors.success, fontSize: 15, fontWeight: '900' },
  stockLow: { color: colors.danger },
  stockLabel: { color: colors.mutedText, fontSize: 9, marginTop: 2 },
  centerState: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 24 },
  stateText: { color: colors.mutedText, fontSize: 13, textAlign: 'center' },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  retry: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
});
