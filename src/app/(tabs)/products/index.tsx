import AppLayout from '@/components/layout'
import { BoxesIcon } from 'lucide-react-native'
import React from 'react'
import { View, Text } from 'react-native'

export default function Products() {
  return (
    <AppLayout title='Produtos'  url="url" icon={<BoxesIcon />}>
      <Text>Products</Text>
    </AppLayout>
  )
}
