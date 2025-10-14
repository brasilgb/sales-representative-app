
import { ProductProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Button } from '../Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BoxIcon, X } from 'lucide-react-native';
import { Card, CardTitle } from '../Card';
import { router } from 'expo-router';

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

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await megbapi.get('/products');
                setProducts(response.data);
                setFilteredProducts(response.data);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    router.replace('/(auth)/sign-in');
                } else {
                    console.log(error.response?.data || error.message);
                    Alert.alert('Erro', 'Não foi possível carregar os produtos.');
                }
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            const filteredData = products.filter(product =>
                product.name.toLowerCase().includes(lowercasedQuery) ||
                product.reference.toLowerCase().includes(lowercasedQuery)
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
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white w-11/12 p-4 rounded-lg" style={{ marginTop: top + 20, marginBottom: bottom + 20, minHeight: '80%' }}>
                    <TextInput
                        placeholder="Buscar produto..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="border border-gray-300 p-2 rounded-lg mb-4"
                    />
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleSelectProduct(item)} className="p-2 border-b border-gray-200">
                                <Text className="font-bold">{item.name}</Text>
                                <Text className="text-sm text-gray-500">{item.reference}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text>Nenhum produto encontrado.</Text>}
                    />
                </View>
                <View className="absolute w-16 h-16 bottom-1 rounded-full  bg-primary items-center justify-center">
                    <Button label={<X color={'white'} size={30} />} onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
};

export default ProductSelector;
