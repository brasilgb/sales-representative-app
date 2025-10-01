import AuthLayout from '@/app/(auth)/_layout';
import AppLoading from '@/components/app-loading';
import { Card, CardContent, CardTitle } from '@/components/Card';
import AuthContext from '@/contexts/AuthContext';
import megbapi from '@/utils/megbapi';
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
            Alert.alert('Atenção', 'Sessão expirada. Por favor, faça login novamente.', [
              {
                text: 'Ok',
                onPress: () => {
                  router.replace('/(auth)/sign-in');
                },
              },
            ]);
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

      <Card className='bg-white border border-gray-300 w-full' style={{ elevation: 4 }}>
        <CardTitle className='text-xl p-2 font-semibold border-b border-gray-300'>
          Pedidos recentes
        </CardTitle>
        <CardContent className='px-0'>
          <View className='flex-row justify-between bg-gray-200 px-2 py-1'>
            <Text className='flex-1 self-start font-bold'>Pedido</Text><Text className='flex-1 self-start font-bold'>Cliente</Text><Text className='flex-1 self-start font-bold'>Valor</Text>
          </View>
          {allData?.orders?.map((order: any) => (
            <TouchableOpacity key={order.id} className='flex-row justify-between px-2 py-1'>
              <Text className='flex-1 self-start'>{order.order_number}</Text><Text className='flex-1 self-start'>{order.customer.name}</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
            </TouchableOpacity>
          ))}
        </CardContent>
      </Card>
    </View>
  )
}