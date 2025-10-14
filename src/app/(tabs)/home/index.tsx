import AuthLayout from '@/app/(auth)/_layout';
import AppLoading from '@/components/app-loading';
import { Badge } from '@/components/Badge';
import { Card, CardContent, CardTitle } from '@/components/Card';
import AuthContext from '@/contexts/AuthContext';
import megbapi from '@/utils/megbapi';
import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
export default function index() {
  const [loading, setLoading] = useState<boolean>(false);
  const [allData, setAllData] = useState<any>([]);

  useFocusEffect(
    useCallback(() => {
      const getAllData = async () => {
        setLoading(true);
        try {
          const response = await megbapi.get('/alldata');
          setAllData(response.data.data);
        } catch (error: any) {

          if (error.response.status === 401) {
            router.replace('/(auth)/sign-in');
          } else {
            console.log(error.response.data);
          }
        } finally {
          setLoading(false)
        }
      }
      getAllData();
    }, [])
  );

  if (loading) {
    return <AppLoading />
  }
  const abreviationOptions = [
    { value: '1', label: "PR", variant: 'default' },
    { value: '2', label: "PG", variant: 'success' },
    { value: '3', label: "EN", variant: 'secondary' },
    { value: '4', label: "CA", variant: 'destructive' },
  ];

  const RenderOrders = ({ item }: any) => {
    const currentStatus = abreviationOptions.find(option => option.value === item?.status);
    return (
      <View className='flex-row items-center justify-between p-2 border-b border-gray-300'>
        <Text className='w-16'>{item?.order_number}</Text>
        <Text className='w-36'>{item?.customer?.name}</Text>
        <Text className='w-22'>{item?.total}</Text>
        <View className='w-20 flex-row items-center justify-end gap-2 pr-2'>
          <Badge

            variant={currentStatus?.variant as any}
            label={currentStatus?.label || 'N/A'}
          />
        </View>
      </View>
    )
  }
  return (
    <View className='flex-1 items-start justify-start p-4'>
      <View className='flex-row items-start justify-between w-full gap-4 mb-4'>
        <Card className='flex-1 bg-white border border-gray-300' style={{ elevation: 4 }}>
          <CardTitle className='text-xl p-2 font-semibold'>Clientes</CardTitle>
          <CardContent className='flex-row justify-end'>
            <Text className='text-4xl font-bold'>{allData?.customers?.length}</Text>
          </CardContent>
        </Card>
        <Card className='flex-1 bg-white border border-gray-300' style={{ elevation: 4 }}>
          <CardTitle className='text-xl p-2 font-semibold'>Pedidos</CardTitle>
          <CardContent className='flex-row justify-end'>
            <Text className='text-4xl font-bold'>{allData?.orders?.length}</Text>
          </CardContent>
        </Card>
        <Card className='flex-1 bg-white border border-gray-300' style={{ elevation: 4 }}>
          <CardTitle className='text-xl p-2 font-semibold'>Produtos</CardTitle>
          <CardContent className='flex-row justify-end'>
            <Text className='text-4xl font-bold'>{allData?.products?.length}</Text>
          </CardContent>
        </Card>
      </View>

      <Card className='h-[70%] bg-white border border-gray-300 w-full' style={{ elevation: 4 }}>
        <CardTitle className='text-xl p-2 font-semibold border-b border-gray-300'>
          Pedidos recentes
        </CardTitle>
        <CardContent className='px-0'>
          <View className='flex-row justify-between bg-gray-200 px-2 py-1'>
            <Text className='self-start font-bold w-16'>Pedido</Text>
            <Text className='self-start font-bold w-36'>Cliente</Text>
            <Text className='self-start font-bold w-22'>Valor</Text>
            <View className='w-20'></View>
          </View>
        </CardContent>
        <FlashList
          className='flex-1'
          data={allData?.orders}
          renderItem={RenderOrders}
          keyExtractor={(item: any) => item?.order_number!.toString()}
          keyboardShouldPersistTaps={'always'}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
        />
      </Card>
    </View>
  )
}