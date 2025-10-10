import OrderForm from '@/components/orders/order-form';
import { View } from 'react-native';
import React from 'react';

const CreateOrder = () => {

  return (
    <View className='pb-24 p-2'>
        <OrderForm />
    </View>
  )

}

export default CreateOrder