import { View, Text } from 'react-native'
import React, { useCallback, useState } from 'react'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import megbapi from '@/utils/megbapi';
import { FlashList } from '@shopify/flash-list';

const ViewOrder = () => {
  const params = useLocalSearchParams();
  const [orderDetails, setOrderDetails] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await megbapi.get(`/orders/${params.id}`);
      setOrderDetails(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetails();
    }, [])
  );

  const getProductName = (productId: number) => {
    const product = orderDetails?.products.find((p: any) => p.id === productId);
    const productDetail = {reference: product?.reference, name: product?.name} as any;
    return product ? productDetail : 'Produto desconhecido';
  }

  const RenderOrders = ({ item }: { item: any }) => (
    <View key={item.id} className='flex-row items-center justify-between p-2 border-b border-gray-300'>
      <Text className='font-bold text-sm w-24 px-0.5'>{getProductName(item.product_id).reference}</Text>
      <Text className='font-bold text-sm w-36'>{getProductName(item.product_id).name}</Text>
      <Text className='font-bold text-sm w-20'>{item.quantity}</Text>
      <Text className='font-bold text-sm w-28'>R$ {item.price}</Text>
    </View>
  );

  return (
    <View className='flex-1 bg-primary'>
      <View className='rounded-t-3xl bg-white h-full p-2'>
        <View className='flex-1'>
          <View className='bg-primary rounded-t-3xl py-2'>
            <Text className='text-center text-lg text-gray-200'>Cliente</Text>
            <Text className='text-center text-2xl text-white'>{orderDetails?.order?.customer.name}</Text>
          </View>
          <View className='bg-gray-100 px-2 py-1'>
            <Text className='text-center text-xl text-primary mt-2 uppercase font-bold'>Itens do pedido</Text>
            <View className='flex-row justify-between py-1'>
              <Text className='text-center text-sm text-gray-800'><Text className='font-bold'>Tot:</Text> R$ {orderDetails?.order?.total}</Text>
            <Text className='text-center text-sm text-gray-800'><Text className='font-bold'>Flex:</Text> R$ {params?.flex}</Text>
            <Text className='text-center text-sm text-gray-800'><Text className='font-bold'>Desc.:</Text> R$ {params?.discount}</Text>
            </View>
          </View>
          <View className='border-x border-b border-gray-200 rounded-b-xl mb-10 bg-gray-50 min-h-[70%]'>
            <View className='flex-row justify-between p-2 border-b border-gray-300 bg-gray-200'>
              <Text className='font-bold w-24'>Ref.</Text>
              <Text className='font-bold w-36'>Produto</Text>
              <Text className='font-bold w-20'>Quant.</Text>
              <Text className='font-bold w-28'>Preço</Text>
            </View>
            <View className='flex-1'>
              <FlashList
                data={orderDetails?.order?.order_items}
                renderItem={RenderOrders}
                keyExtractor={(item: any) => item.id!.toString()}
                keyboardShouldPersistTaps={'always'}
                showsVerticalScrollIndicator={false}
                onRefresh={fetchOrderDetails}
                refreshing={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default ViewOrder