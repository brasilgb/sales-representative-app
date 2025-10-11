import HeaderStack from '@/components/header-stack'
import HeaderTabs from '@/components/header-tabs'
import { Stack } from 'expo-router'
import React from 'react'

const OrderLayout = () => {
  return (
    <Stack>
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
          header: () => <HeaderStack />
        }}
      />
      <Stack.Screen
        name="view-order"
        options={{
          headerShown: true,
          header: () => <HeaderStack />
        }}
      />

    </Stack>
  )
}

export default OrderLayout