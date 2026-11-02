
import { CustomerProps } from '@/types/app-types';
import { useOffline } from '@/offline/OfflineProvider';
import megbapi from '@/utils/megbapi';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { describeApiError } from '@/utils/api-errors';

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
    const { online, runtime } = useOffline();

    useEffect(() => {
        const fetchCustomers = async () => {
            // Offline, o catálogo local guarda o subconjunto sincronizado (campos usados pela tela).
            // Sem conexão: a lista vem do catálogo sincronizado no aparelho.
            if (!online) {
                const local = (await runtime?.catalog.customers()) ?? [];
                setCustomers(local as unknown as CustomerProps[]);
                setFilteredCustomers(local as unknown as CustomerProps[]);
                return;
            }
            try {
                const response = await megbapi.get('/customers');
                setCustomers(response.data);
                setFilteredCustomers(response.data);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    router.replace('/');
                } else {
                    console.log('Falha ao buscar clientes:', describeApiError(error).kind);
                    Alert.alert('Erro', 'Não foi possível carregar os clientes.');
                }
            }
        };
        fetchCustomers();
    }, [online, runtime]);

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
                <View className="bg-[#FFFFFF] w-11/12 p-4 rounded-2xl border border-[#E2E8F0]" style={{ marginTop: top + 20, marginBottom: bottom + 20, minHeight: '80%' }}>
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-[#0F172A]">Selecionar cliente</Text>
                        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar seleção de cliente" onPress={onClose} className="min-h-11 flex-row items-center gap-2 rounded-xl bg-[#F1F5F9] px-3">
                            <X color="#0F172A" size={18} />
                            <Text className="font-bold text-[#0F172A]">Fechar</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        placeholder="Buscar cliente..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#64748B"
                        className="min-h-14 border border-[#E2E8F0] bg-[#F1F5F9] text-[#0F172A] px-4 rounded-xl mb-4"
                    />
                    <FlatList
                        data={filteredCustomers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleSelectCustomer(item)} className="py-4 px-2 border-b border-[#E2E8F0]">
                                <Text className="font-bold text-[#0F172A]">{item.name}</Text>
                                <Text className="text-sm text-[#64748B] mt-1">{item.cnpj}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text className="text-[#64748B] text-center py-8">Nenhum cliente encontrado.</Text>}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default CustomerSelector;
