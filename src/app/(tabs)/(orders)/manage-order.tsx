import { Card, CardTitle } from '@/components/Card';
import OrderForm from '@/components/orders/order-form';
import { OrderProps } from '@/types/app-types';
import { UserIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

const CreateOrder = () => {

  return (
    <View className='p-4'>
        <Card className="mb-4 p-2">
         <CardTitle className="flex items-center gap-2 font-bold mb-2"><UserIcon className="w-6 h-6" /> Cliente</CardTitle>
               <OrderForm />
        </Card>
    </View>
  )

}

export default CreateOrder