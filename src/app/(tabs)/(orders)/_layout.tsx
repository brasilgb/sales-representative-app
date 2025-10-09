import { Stack } from 'expo-router'
import React from 'react'

const OrderLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false
        }}
      />
        <Stack.Screen
        name="manage-order"
        options={{
          headerShown: false
        }}
      />

    </Stack>
  )
}

export default OrderLayout