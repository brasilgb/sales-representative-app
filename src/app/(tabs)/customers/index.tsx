import { View, Text, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Edit2Icon, PlusIcon, Users2Icon } from 'lucide-react-native';
import megbapi from '@/utils/megbapi';
import { router } from 'expo-router';
import AppLoading from '@/components/app-loading';
import { Button } from '@/components/Button';
import InputSearch from '@/components/input-search';
import { FlashList } from "@shopify/flash-list";

export default function Customers() {
  const [loading, setLoading] = useState<boolean>(false);
  const [customers, setCustomers] = useState<any>([]);

  useEffect(() => {
    const getCustomers = async () => {
      setLoading(true);
      try {
        const response = await megbapi.get('/customers');
        setCustomers(response.data);
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
    getCustomers();
  }, []);

  if (loading) {
    return <AppLoading />
  }

  const RenderCustomers = ({ item }: any) => (
    <View className='flex-row items-center justify-between p-4 border-b border-gray-300'>
      <Text>{item?.cnpj}</Text>
      <Text>{item?.name}</Text>
      <View className='w-14'>
        <Button
          variant={'default'}
          size={'sm'}
          label={<Edit2Icon color={'white'} />}
          labelClasses='my-2'
        />
      </View>
    </View>
  )

  return (
    <View className='flex-1 bg-sky-600'>
      <View className='rounded-t-3xl bg-white h-full'>
        <View className='flex-row items-center justify-between h-20 px-4 gap-4 border-b border-gray-300'>
          <View className='flex-row items-center'>
            <Users2Icon />
          </View>
          <View className='flex-1'>
            <InputSearch />
          </View>
          <View>
            <Button
              labelClasses='text-white'
              label={<PlusIcon color={'white'} />}
              variant={'default'}
              onPress={() => 'ok'}
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
            key={customers.length}
            data={customers}
            renderItem={({ item }: any) => {
              return <RenderCustomers item={item} />;
            }}
            keyboardShouldPersistTaps={'always'}
            showsVerticalScrollIndicator={false}
          />
        </View>

      </View>
    </View>
  )
}