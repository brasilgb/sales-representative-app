import AppLayout from '@/components/layout'
import { ShoppingBasketIcon } from 'lucide-react-native'
import React from 'react'
import { View, Text } from 'react-native'

export default function Orders() {
  return (
    <AppLayout title='Pedidos' url="url" icon={<ShoppingBasketIcon />}>
      <Text>Orders</Text>
    </AppLayout>
  )
}
