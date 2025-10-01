import { View, Text, Alert, Dimensions } from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Edit2Icon, PlusIcon, Users2Icon } from 'lucide-react-native';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import AppLoading from '@/components/app-loading';
import { Button } from '@/components/Button';
import InputSearch from '@/components/input-search';
import { FlashList } from "@shopify/flash-list";
import { Modalize } from 'react-native-modalize';
import CustomerForm from '@/components/customers/add-form';
import { CustomerFormType } from '@/schema/app';

export default function Customers() {
  const [loading, setLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFormType | undefined>(undefined);

  const modalizeRef = useRef<Modalize>(null);

  const getCustomers = async () => {
    setLoading(true);
    try {
      const response = await megbapi.get('/customers');
      setCustomers(response.data);
      setFilteredData(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert('Atenção', 'Sessão expirada. Por favor, faça login novamente.', [
          { text: 'Ok', onPress: () => router.replace('/(auth)/sign-in') },
        ]);
      } else {
        console.log(error.response?.data || error.message);
        Alert.alert('Erro', 'Não foi possível carregar os clientes.');
      }
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      getCustomers();
    }, [])
  );

  const handleOpenModal = (customer?: CustomerFormType) => {
    setSelectedCustomer(customer);
    modalizeRef.current?.open();
  };

  const handleCloseModal = () => {
    modalizeRef.current?.close();
  };

  const handleFormSuccess = () => {
    handleCloseModal();
    getCustomers(); // Refresh the list
  }

  const HandleSearch = (texto: string) => {
    if (texto.length > 2) {
      const filtered = customers.filter((item: any) => (
        item.name.toLowerCase().includes(texto.toLowerCase()) ||
        item.cnpj.toLowerCase().includes(texto.toLowerCase())
      ));
      setFilteredData(filtered);
    } else {
      setFilteredData(customers);
    }
  }

  const RenderCustomers = ({ item }: { item: CustomerFormType }) => (
    <View className='flex-row items-center justify-between p-4 border-b border-gray-300'>
      <Text>{item?.cnpj}</Text>
      <Text>{item?.name}</Text>
      <View className='w-14'>
        <Button
          variant={'default'}
          size={'sm'}
          onPress={() => handleOpenModal(item)}
          label={<Edit2Icon color={'white'} />}
          labelClasses='my-2'
        />
      </View>
    </View>
  )

  if (loading && !customers.length) {
    return <AppLoading />
  }

  return (
    <View className='flex-1 bg-sky-600'>
      <View className='rounded-t-3xl bg-white h-full'>
        <View className='flex-row items-center justify-between h-20 px-4 gap-4 border-b border-gray-300'>
          <View className='flex-row items-center'>
            <Users2Icon />
          </View>
          <View className='flex-1'>
            <InputSearch handleChangeText={HandleSearch} />
          </View>
          <View>
            <Button
              labelClasses='text-white'
              label={<PlusIcon color={'white'} />}
              variant={'default'}
              onPress={() => handleOpenModal()} // Open modal for adding
            />
          </View>
        </View>
        <View className='flex-row items-center justify-between p-4 bg-gray-200'>
          <Text className=''>CNPJ</Text>
          <Text className=''>Cliente</Text>
          <Text style={{ width: 38 }}></Text>
        </View>

        <View className='flex-1 pb-24'>
          <FlashList
            data={filteredData}
            renderItem={RenderCustomers}
            keyExtractor={(item) => item.id!.toString()}
            // estimatedItemSize={70}
            keyboardShouldPersistTaps={'always'}
            showsVerticalScrollIndicator={false}
            onRefresh={getCustomers}
            refreshing={loading}
          />
        </View>

      </View>
      <Modalize
        ref={modalizeRef}
        modalHeight={Dimensions.get('window').height * 0.8}
        HeaderComponent={
          <View className='py-4 px-3 border-b border-gray-300 bg-gray-200'>
            <Text className='text-lg font-bold text-center'>
              {selectedCustomer ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
            </Text>
          </View>
        }
        onClose={() => setSelectedCustomer(undefined)}
      >
        <CustomerForm 
          onSuccess={handleFormSuccess} 
          initialData={selectedCustomer} 
        />
      </Modalize>
    </View>
  )
}