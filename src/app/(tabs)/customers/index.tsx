import { View, Text, Alert, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useCallback, useState } from 'react';
import { ClosedCaption, Edit2Icon, PlusIcon, User, Users2Icon, X } from 'lucide-react-native';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import AppLoading from '@/components/app-loading';
import { Button } from '@/components/Button';
import InputSearch from '@/components/input-search';
import { FlashList } from "@shopify/flash-list";
import CustomerForm from '@/components/customers/add-form';
import { Dialog, DialogContent, useDialog } from '@/components/Dialog';
import { ScrollView } from 'react-native-gesture-handler';
import { CustomerProps } from '@/types/app-types';
import { maskCnpj } from '@/lib/mask';

function CustomersContent() {
  const [loading, setLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProps | undefined>(undefined);
  const { setOpen } = useDialog();

  const getCustomers = async () => {
    setLoading(true);
    try {
      const response = await megbapi.get('/customers');
      setCustomers(response.data);
      setFilteredData(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.replace('/(auth)/sign-in');
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

  const handleOpenModal = (customer?: CustomerProps) => {
    Keyboard.dismiss();
    setSelectedCustomer(customer);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    // Use a timeout to avoid seeing the old data as the modal closes
    setTimeout(() => {
      setSelectedCustomer(undefined);
    }, 200);
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

  const RenderCustomers = ({ item }: { item: CustomerProps }) => (
    <View className='flex-row items-center justify-between p-4 border-b border-gray-300'>
      <Text>{maskCnpj(item?.cnpj)}</Text>
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
            keyboardShouldPersistTaps={'always'}
            showsVerticalScrollIndicator={false}
            onRefresh={getCustomers}
            refreshing={loading}
          />
        </View>

      </View>
      <DialogContent>
        <KeyboardAvoidingView
          behavior={'padding'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className='py-4 px-3 flex-row items-center justify-between border-t border-secundary bg-primary'>
              <View className='flex-row items-center gap-2'>
                <User color={'white'} size={24} />
                <Text className='text-lg font-bold text-center text-white'>
                  {selectedCustomer ? 'Editar Cliente' : 'Adicionar Cliente'}
                </Text>
              </View>
              <Button
                label={<X color={'white'} size={24} />}
                onPress={() => handleCloseModal()}
              />
            </View>
            <CustomerForm
              onSuccess={handleFormSuccess}
              initialData={selectedCustomer}
            />
          </ScrollView>
        </KeyboardAvoidingView>

      </DialogContent>
    </View>
  )
}

export default function Customers() {
  return (
    <Dialog>
      <CustomersContent />
    </Dialog>
  )
}