
import { CustomerProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Button } from '../Button';

interface CustomerSelectorProps {
    onCustomerSelect: (customer: CustomerProps) => void;
}

const CustomerSelector = ({ onCustomerSelect }: CustomerSelectorProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [customers, setCustomers] = useState<CustomerProps[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<CustomerProps[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

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
        setModalVisible(false);
    };

    return (
        <View>
            <Button label={'Selecionar Cliente'} onPress={() => setModalVisible(true)} />
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
                </View>
            </Modal>
        </View>
    );
};

export default CustomerSelector;
