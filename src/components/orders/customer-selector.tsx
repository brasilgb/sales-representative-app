
import { CustomerProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Button } from '../Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserIcon, X } from 'lucide-react-native';
import { Card, CardTitle } from '../Card';

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
            } catch (error) {
                console.error(error);
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
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white w-11/12 p-4 rounded-lg" style={{ marginTop: top + 20, marginBottom: bottom + 20 }}>
                    <TextInput
                        placeholder="Buscar cliente..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="border border-gray-300 p-2 rounded-lg mb-4"
                    />
                    <FlatList
                        data={filteredCustomers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleSelectCustomer(item)} className="p-2 border-b border-gray-200">
                                <Text className="font-bold">{item.name}</Text>
                                <Text className="text-sm text-gray-500">{item.cnpj}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text>Nenhum cliente encontrado.</Text>}
                    />
                </View>
                <View className="absolute w-16 h-16 bottom-1 rounded-full  bg-primary items-center justify-center">
                    <Button label={<X color={'white'} size={30} />} variant="destructive" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
};

export default CustomerSelector;
