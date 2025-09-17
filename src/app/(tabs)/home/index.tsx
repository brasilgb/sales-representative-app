import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Card, CardContent, CardTitle } from '@/components/Card'

export default function index() {
  return (
    <View className='flex-1 items-start justify-start p-4'>
      <View className='flex-row items-start justify-between w-full gap-4 mb-4'>
        <Card className='flex-1 bg-white border border-gray-300' style={{ elevation: 4 }}>
          <CardTitle className='text-xl p-2 font-semibold'>Clientes</CardTitle>
          <CardContent className='flex-row justify-end'>
            <Text className='text-4xl font-bold'>25</Text>
          </CardContent>
        </Card>
        <Card className='flex-1 bg-white border border-gray-300' style={{ elevation: 4 }}>
          <CardTitle className='text-xl p-2 font-semibold'>Pedidos</CardTitle>
          <CardContent className='flex-row justify-end'>
            <Text className='text-4xl font-bold'>65</Text>
          </CardContent>
        </Card>
        <Card className='flex-1 bg-white border border-gray-300' style={{ elevation: 4 }}>
          <CardTitle className='text-xl p-2 font-semibold'>Produtos</CardTitle>
          <CardContent className='flex-row justify-end'>
            <Text className='text-4xl font-bold'>128</Text>
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

          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-row justify-between px-2 py-1'>
            <Text className='flex-1 self-start'>89569</Text><Text className='flex-1 self-start'>José da Silva</Text><Text className='flex-1 self-start'>R$ 895,00</Text>
          </TouchableOpacity>

        </CardContent>
      </Card>
    </View>
  )
}