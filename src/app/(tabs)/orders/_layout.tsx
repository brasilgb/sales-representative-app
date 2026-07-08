import HeaderStack from '@/components/header-stack'
import HeaderTabs from '@/components/header-tabs'
import { Stack } from 'expo-router'
import React from 'react'

export const unstable_settings = {
  initialRouteName: 'index',
}

const OrderLayout = () => {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: '#0b1220' } }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          header: () => <HeaderTabs />
        }}
      />
      <Stack.Screen
        name="manage-order"
        options={{
          headerShown: true,
          header: () => <HeaderStack title={'Gerar pedido'} />
        }}
      />
      <Stack.Screen
        name="view-order"
        options={{
          headerShown: true,
          header: () => <HeaderStack title={'Visualizar pedido'} />
        }}
      />
      <Stack.Screen
        name="edit-order"
        options={{ headerShown: true, header: () => <HeaderStack title={'Editar pedido'} /> }}
      />
      <Stack.Screen
        name="order-report"
        options={{
          headerShown: true,
          header: () => <HeaderStack title={'Relatórios de pedidos'} />
        }}
      />

    </Stack>
  )
}

export default OrderLayout
