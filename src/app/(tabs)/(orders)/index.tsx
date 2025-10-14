import AppLoading from '@/components/app-loading';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import InputSearch from '@/components/input-search';
import { OrderStatusModal } from '@/components/orders/order-status-modal';
import { OrderProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from 'expo-router';
import { CalendarDaysIcon, EyeIcon, PlusIcon, User, Users2Icon } from 'lucide-react-native';
import moment from 'moment';
import React, { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const Orders = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [filteredData, setFilteredData] = useState<OrderProps[]>([]);
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

  const handleStatusChange = (order_number: string, newStatus: string) => {
    const updatedOrders = orders.map(order => {
      if (order.order_number === order_number) {
        return { ...order, status: newStatus };
      }
      return order;
    });
    setOrders(updatedOrders);
    setFilteredData(updatedOrders);
  };

  const RenderOrders = ({ item }: { item: OrderProps }) => (
    <View className='flex-row items-center justify-between p-2 border-b border-gray-300'>
      <Text className='text-sm w-12'>{item?.order_number}</Text>
      <Text className='text-sm w-20'>{moment(item?.created_at).format("DD/MM/YYYY")}</Text>
      <Text className='text-sm w-28'>{item?.customer?.name}</Text>
      <Text className='text-sm w-20'>{item?.total}</Text>
      <View className='w-12'>
        <OrderStatusModal
          id={item.id}
          status={item.status}
          onStatusChange={(newStatus) => handleStatusChange(item.order_number, newStatus)}
          />
      </View>
      <View className='w-10'>
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

  if (loading) {
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
        <View className='flex-row items-center justify-between p-2 bg-gray-200'>
          <Text className='text-sm font-bold w-12'>Ped.</Text>
          <Text className='text-sm font-bold w-20'>Data</Text>
          <Text className='text-sm font-bold w-28'>Cliente</Text>
          <Text className='text-sm font-bold w-24'>Total</Text>
          <View className='w-20 pr-2'>
            <Button
              variant={'orange'}
              size={'sm'}
              onPress={() => router.push('/order-report')}
              label={<CalendarDaysIcon size={16} color={'white'} />}
              className='px-[16px]'
            />
          </View>

        </View>

        <View className='flex-1 pb-24'>
          <FlashList
            data={filteredData}
            renderItem={RenderOrders}
            keyExtractor={(item) => item.id!.toString()}
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