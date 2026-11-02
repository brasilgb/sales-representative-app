
import { ProductProps } from '@/types/app-types';
import { useOffline } from '@/offline/OfflineProvider';
import megbapi from '@/utils/megbapi';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { describeApiError } from '@/utils/api-errors';

interface ProductSelectorProps {
    onProductSelect: (product: ProductProps) => void;
    visible: boolean;
    onClose: () => void;
}

const ProductSelector = ({ onProductSelect, visible, onClose }: ProductSelectorProps) => {
    const [products, setProducts] = useState<ProductProps[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductProps[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { top, bottom } = useSafeAreaInsets();
    const { online, runtime } = useOffline();

    useEffect(() => {
        const fetchProducts = async () => {
            // Offline, o catálogo local guarda o subconjunto sincronizado (campos usados pela tela).
            // Sem conexão: a lista vem do catálogo sincronizado no aparelho (preço base do cadastro).
            if (!online) {
                const local = (await runtime?.catalog.products()) ?? [];
                setProducts(local as unknown as ProductProps[]);
                setFilteredProducts(local as unknown as ProductProps[]);
                return;
            }
            try {
                const response = await megbapi.get('/products');
                setProducts(response.data);
                setFilteredProducts(response.data);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    router.replace('/');
                } else {
                    console.log('Falha ao buscar produtos:', describeApiError(error).kind);
                    Alert.alert('Erro', 'Não foi possível carregar os produtos.');
                }
            }
        };
        fetchProducts();
    }, [online, runtime]);

    useEffect(() => {
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            const filteredData = products.filter(product =>
                product.name?.toLowerCase().includes(lowercasedQuery) ||
                product.reference?.toLowerCase().includes(lowercasedQuery)
            );
            setFilteredProducts(filteredData);
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    const handleSelectProduct = (product: ProductProps) => {
        onProductSelect(product);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/80">
                <View className="bg-[#FFFFFF] w-11/12 p-4 rounded-2xl border border-[#E2E8F0]" style={{ marginTop: top + 20, marginBottom: bottom + 20, minHeight: '80%' }}>
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-[#0F172A]">Selecionar produto</Text>
                        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar seleção de produto" onPress={onClose} className="min-h-11 flex-row items-center gap-2 rounded-xl bg-[#F1F5F9] px-3">
                            <X color="#0F172A" size={18} />
                            <Text className="font-bold text-[#0F172A]">Fechar</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        placeholder="Buscar por referência ou nome..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#64748B"
                        className="min-h-14 border border-[#E2E8F0] bg-[#F1F5F9] text-[#0F172A] px-4 rounded-xl mb-4"
                    />
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleSelectProduct(item)} className="py-4 px-2 border-b border-[#E2E8F0]">
                                <Text className="font-bold text-[#0F172A]">{item.name}</Text>
                                <Text className="text-sm text-[#64748B] mt-1">Ref. {item.reference}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text className="text-[#64748B] text-center py-8">Nenhum produto encontrado.</Text>}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default ProductSelector;
