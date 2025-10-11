import AppLoading from '@/components/app-loading';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import InputSearch from '@/components/input-search';
import { OrderProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from 'expo-router';
import { EyeIcon, PlusIcon, User, Users2Icon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const Orders = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderProps | undefined>(undefined);

  const getOrders = async () => {
    setLoading(true);
    try {
      const response = await megbapi.get('/orders');
      setOrders(response.data);
      setFilteredData(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.replace('/(auth)/sign-in');
      } else {
        console.log(error.response?.data || error.message);
        Alert.alert('Erro', 'Não foi possível carregar os pedidos.');
      }
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      getOrders();
    }, [])
  );

  const HandleSearch = (texto: string) => {
    if (texto.length > 2) {
      const filtered = orders.filter((item: any) => (
        item.name.toLowerCase().includes(texto.toLowerCase()) ||
        item.cnpj.toLowerCase().includes(texto.toLowerCase())
      ));
      setFilteredData(filtered);
    } else {
      setFilteredData(orders);
    }
  }

  const RenderOrders = ({ item }: { item: OrderProps }) => (
    <View className='flex-row items-center justify-between p-4 border-b border-gray-300'>
      <Text>{item?.order_number}</Text>
      <Text>{item?.customer?.name}</Text>
      <Text>{item?.total}</Text>
      <View className='w-14'>
        <Button
          variant={'default'}
          size={'sm'}
          onPress={() => router.push({
            pathname: '/view-order',
            params: item as any
          })}
          label={<EyeIcon color={'white'} size={16} />}
          labelClasses='my-2'
        />
      </View>
    </View>
  )

  if (loading && !Orders.length) {
    return <AppLoading />
  }

  return (
    <View className='flex-1 bg-primary'>
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
              onPress={() => router.push('/manage-order')} // Open modal for adding
            />
          </View>
        </View>
        <View className='flex-row items-center justify-between p-4 bg-gray-200'>
          <Text className=''>Pedido</Text>
          <Text className=''>Cliente</Text>
          <Text className=''>Total</Text>
          <Text style={{ width: 38 }}></Text>
        </View>

        <View className='flex-1 pb-24'>
          <FlashList
            data={filteredData}
            renderItem={RenderOrders}
            keyExtractor={(item) => item.order_number!.toString()}
            keyboardShouldPersistTaps={'always'}
            showsVerticalScrollIndicator={false}
            onRefresh={getOrders}
            refreshing={loading}
          />
        </View>

      </View>
      <View>
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
                  {selectedOrder ? 'Ver Pedido' : 'Adicionar Pedido'}
                </Text>
              </View>

            </View>

          </ScrollView>
        </KeyboardAvoidingView>

      </View>
    </View>
  )
}

export default function OrdersScreen() {
  return (
    <Dialog>
      <Orders />
    </Dialog>
  )
}