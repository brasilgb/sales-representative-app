
import { ProductProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Button } from '../Button';

interface ProductSelectorProps {
    onProductSelect: (product: ProductProps) => void;
}

const ProductSelector = ({ onProductSelect }: ProductSelectorProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [products, setProducts] = useState<ProductProps[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductProps[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await megbapi.get('/products');
                setProducts(response.data);
                setFilteredProducts(response.data);
            } catch (error) {
                console.error(error);
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
        setModalVisible(false);
    };

    return (
        <View>
            <Button label={'Selecionar Produto'} onPress={() => setModalVisible(true)} />
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white w-11/12 p-4 rounded-lg">
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
                </View>
            </Modal>
        </View>
    );
};

export default ProductSelector;
