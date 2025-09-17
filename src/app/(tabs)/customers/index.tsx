import { View, Text } from 'react-native'
import React from 'react'
import AppLayout from '@/components/layout'
import { User2Icon } from 'lucide-react-native'

export default function Customers() {
  return (
    <AppLayout title='Clientes'  url="url" icon={<User2Icon />}>
      <View className='p-2 '>
        <Text></Text>
      </View>
    </AppLayout>
  )
}