
import { CustomerProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomerSelectorProps {
    onCustomerSelect: (customer: CustomerProps) => void;
    visible: boolean;
    onClose: () => void;
}

const CustomerSelector = ({ onCustomerSelect, visible, onClose }: CustomerSelectorProps) => {
    const [customers, setCustomers] = useState<CustomerProps[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<CustomerProps[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { top, bottom } = useSafeAreaInsets();

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await megbapi.get('/customers');
                setCustomers(response.data);
                setFilteredCustomers(response.data);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    router.replace('/');
                } else {
                    console.log(error.response?.data || error.message);
                    Alert.alert('Erro', 'Não foi possível carregar os clientes.');
                }
            }
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            const filteredData = customers.filter(customer =>
                customer.name.toLowerCase().includes(lowercasedQuery) ||
                customer.cnpj.toLowerCase().includes(lowercasedQuery)
            );
            setFilteredCustomers(filteredData);
        } else {
            setFilteredCustomers(customers);
        }
    }, [searchQuery, customers]);

    const handleSelectCustomer = (customer: CustomerProps) => {
        onCustomerSelect(customer);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/80">
                <View className="bg-[#101a2d] w-11/12 p-4 rounded-2xl border border-white/10" style={{ marginTop: top + 20, marginBottom: bottom + 20, minHeight: '80%' }}>
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-[#f7f8fa]">Selecionar cliente</Text>
                        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar seleção de cliente" onPress={onClose} className="min-h-11 flex-row items-center gap-2 rounded-xl bg-[#16233a] px-3">
                            <X color="#f7f8fa" size={18} />
                            <Text className="font-bold text-[#f7f8fa]">Fechar</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        placeholder="Buscar cliente..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#a8b3c7"
                        className="min-h-14 border border-white/10 bg-[#16233a] text-[#f7f8fa] px-4 rounded-xl mb-4"
                    />
                    <FlatList
                        data={filteredCustomers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleSelectCustomer(item)} className="py-4 px-2 border-b border-white/10">
                                <Text className="font-bold text-[#f7f8fa]">{item.name}</Text>
                                <Text className="text-sm text-[#a8b3c7] mt-1">{item.cnpj}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text className="text-[#a8b3c7] text-center py-8">Nenhum cliente encontrado.</Text>}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default CustomerSelector;
