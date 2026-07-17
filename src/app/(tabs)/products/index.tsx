import InputSearch from '@/components/input-search';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ProductProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { FlashList } from '@shopify/flash-list';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from 'expo-router';
import { Box, Boxes, Link2, Share2, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') || 'https://vetorpet.com.br/api').replace(/\/api$/, '');

function resolveProductImageUrl(product: ProductProps) {
  const imageUrl = typeof product.image_url === 'string' ? product.image_url.trim() : '';

  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl) return `${apiBaseUrl}/${imageUrl.replace(/^\/+/, '')}`;

  const imagePath = typeof product.image_path === 'string' ? product.image_path.trim() : '';
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  return `${apiBaseUrl}/storage/${imagePath.replace(/^\/+/, '').replace(/^storage\//, '')}`;
}

function ProductsContent() {
  const { signOut, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [search, setSearch] = useState('');
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductProps | null>(null);

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

  const openCatalog = async () => {
    if (sharing || !user?.public_catalog_url) return;
    setSharing(true);

    try {
      await WebBrowser.openBrowserAsync(user.public_catalog_url, {
        toolbarColor: colors.header,
        controlsColor: '#ffffff',
        showTitle: true,
      });
    } catch {
      Alert.alert('Não foi possível abrir', 'O catálogo não pôde ser aberto. Tente novamente.');
    } finally {
      setSharing(false);
    }
  };

  const sendCatalogByWhatsApp = async () => {
    if (!user?.public_catalog_url) return;

    const message = encodeURIComponent(`Olá! Confira nosso catálogo de produtos: ${user.public_catalog_url}`);

    try {
      await Linking.openURL(`https://wa.me/?text=${message}`);
    } catch {
      Alert.alert('Não foi possível abrir', 'O WhatsApp não pôde ser aberto. Tente novamente.');
    }
  };

  const openProductDetails = (product: ProductProps) => setSelectedProduct(product);
  const closeProductDetails = () => setSelectedProduct(null);

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}><Text style={styles.title}>Produtos</Text><Text style={styles.count}>Somente consulta • {products.length} cadastrados</Text></View>
          <View style={styles.catalogActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir catálogo de produtos" accessibilityHint="Abre o catálogo dentro do aplicativo" disabled={sharing || !user?.public_catalog_url} onPress={openCatalog} style={({ pressed }) => [styles.catalogButton, pressed && styles.catalogButtonPressed, (sharing || !user?.public_catalog_url) && styles.catalogButtonDisabled]}>
              {sharing ? <ActivityIndicator size="small" color="#ffffff" /> : <Link2 size={20} color="#ffffff" strokeWidth={2.4} />}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Enviar catálogo pelo WhatsApp" disabled={!user?.public_catalog_url} onPress={sendCatalogByWhatsApp} style={({ pressed }) => [styles.catalogButton, styles.whatsappButton, pressed && styles.catalogButtonPressed, !user?.public_catalog_url && styles.catalogButtonDisabled]}>
              <Share2 size={20} color="#ffffff" strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>
        <InputSearch handleChangeText={setSearch} placeholder="Buscar por nome ou referência" />
      </View>

      {message ? <ErrorState message={message} onRetry={loadProducts} /> : loading && !products.length ? <LoadingState /> : (
        <FlashList
          data={filtered}
          renderItem={({ item }) => <ProductRow product={item} onOpenDetails={openProductDetails} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onRefresh={loadProducts}
          refreshing={loading}
          ListEmptyComponent={<EmptyState search={search} />}
        />
      )}

      <Modal visible={!!selectedProduct} transparent animationType="slide" onRequestClose={closeProductDetails}>
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsSheet}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsHeaderTitle} numberOfLines={1}>Detalhes do produto</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes do produto" onPress={closeProductDetails} style={styles.detailsCloseButton}>
                <X size={22} color={colors.text} />
              </Pressable>
            </View>
            {selectedProduct && <ProductDetails product={selectedProduct} />}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProductRow({ product, onOpenDetails }: { product: ProductProps; onOpenDetails: (product: ProductProps) => void }) {
  const stock = Number(product.quantity || 0);
  const minimum = Number(product.min_quantity || 0);
  const lowStock = stock <= minimum;
  const imageUrl = resolveProductImageUrl(product);
  const [imageFailed, setImageFailed] = useState(false);

  const showImage = !!imageUrl && !imageFailed;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver detalhes de ${product.name}`}
      onPress={() => onOpenDetails(product)}
      style={({ pressed }) => [pressed && styles.rowPressed]}
    >
      <View style={styles.row}>
        <View style={styles.imageColumn}>
          {showImage ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Box size={18} color={colors.warning} />
          )}
        </View>
        <View style={styles.productColumn}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.productReference} numberOfLines={1}>Ref. {product.reference}</Text>
          <Text style={styles.productPrice} numberOfLines={1}>{formatCurrency(product.price)}</Text>
        </View>
        <View style={styles.stockColumn}>
          <Text style={[styles.stockQuantity, lowStock && styles.stockLow]}>{stock}</Text>
          <Text style={styles.stockText}>estoque</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ProductDetails({ product }: { product: ProductProps }) {
  const imageUrl = resolveProductImageUrl(product);
  const stock = Number(product.quantity || 0);
  const minimum = Number(product.min_quantity || 0);

  return (
    <ScrollView contentContainerStyle={styles.detailsContent}>
      <View style={styles.detailsImageFrame}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.detailsImage} resizeMode="contain" />
        ) : (
          <View style={styles.detailsImageFallback}>
            <Box size={42} color={colors.warning} />
          </View>
        )}
      </View>

      <View style={styles.detailsTitleBlock}>
        <Text style={styles.detailsProductName}>{product.name}</Text>
        <Text style={styles.detailsReference}>Ref. {product.reference || '-'}</Text>
      </View>

      <View style={styles.detailsGrid}>
        <DetailItem label="Preço" value={formatCurrency(product.price)} />
        <DetailItem label="Estoque" value={`${stock} un.`} danger={stock <= minimum} />
        <DetailItem label="Estoque mínimo" value={`${minimum} un.`} />
        <DetailItem label="Medida" value={[product.measure, product.unity].filter(Boolean).join(' ') || '-'} />
        <DetailItem label="Marca" value={product.brand || '-'} />
        <DetailItem label="Embalagem" value={product.package_size || '-'} />
        <DetailItem label="Categoria" value={product.category || '-'} />
        <DetailItem label="Linha" value={product.line || '-'} />
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsSectionLabel}>Descrição</Text>
        <Text style={styles.detailsSectionText}>{product.description || '-'}</Text>
      </View>

      {!!product.observations && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionLabel}>Observações</Text>
          <Text style={styles.detailsSectionText}>{product.observations}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function DetailItem({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, danger && styles.detailValueDanger]} numberOfLines={2}>{value}</Text>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  titleCopy: { minWidth: 0, flex: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  count: { color: colors.mutedText, fontSize: 12, marginTop: 3 },
  catalogActions: { flexShrink: 0, flexDirection: 'row', gap: 6 },
  catalogButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary },
  whatsappButton: { backgroundColor: '#16a34a' },
  catalogButtonPressed: { opacity: 0.82 },
  catalogButtonDisabled: { opacity: 0.5 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { minHeight: 86, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { opacity: 0.82 },
  imageColumn: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(255,189,102,0.1)' },
  productImage: { width: 44, height: 44 },
  productColumn: { flex: 1, minWidth: 0, paddingLeft: 14, paddingRight: 12 },
  productName: { color: colors.text, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  productReference: { color: colors.mutedText, fontSize: 12, lineHeight: 17, marginTop: 3 },
  productPrice: { color: colors.mutedText, fontSize: 12, lineHeight: 17, marginTop: 2 },
  stockColumn: { width: 58, flexShrink: 0, alignItems: 'flex-end', justifyContent: 'center' },
  stockQuantity: { color: colors.success, fontSize: 15, fontWeight: '900', lineHeight: 20 },
  stockLow: { color: colors.danger },
  stockText: { color: colors.mutedText, fontSize: 9, lineHeight: 12, marginTop: 2 },
  centerState: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 24 },
  stateText: { color: colors.mutedText, fontSize: 13, textAlign: 'center' },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  retry: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  detailsOverlay: { flex: 1, justifyContent: 'flex-end', paddingTop: 28, paddingBottom: 18, backgroundColor: 'rgba(2,6,23,0.66)' },
  detailsSheet: { maxHeight: '90%', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, backgroundColor: colors.background, overflow: 'hidden' },
  detailsHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailsHeaderTitle: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '900' },
  detailsCloseButton: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(148,163,184,0.12)' },
  detailsContent: { padding: 16, paddingBottom: 28 },
  detailsImageFrame: { height: 220, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  detailsImage: { width: '100%', height: '100%' },
  detailsImageFallback: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,189,102,0.1)' },
  detailsTitleBlock: { paddingTop: 16, paddingBottom: 12 },
  detailsProductName: { color: colors.text, fontSize: 20, fontWeight: '900', lineHeight: 26 },
  detailsReference: { color: colors.mutedText, fontSize: 13, fontWeight: '700', marginTop: 5 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailItem: { width: '48%', minHeight: 62, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 9 },
  detailLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '700' },
  detailValue: { color: colors.text, fontSize: 14, fontWeight: '900', lineHeight: 18, marginTop: 4 },
  detailValueDanger: { color: colors.danger },
  detailsSection: { marginTop: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12 },
  detailsSectionLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  detailsSectionText: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 8 },
});
