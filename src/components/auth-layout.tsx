import { Image, KeyboardAvoidingView, Platform, View, Text } from 'react-native'
import React, { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode;
  logo?: boolean
}

const AuthLayout = ({ children, logo }: AuthLayoutProps) => {
  return (
        <View className='flex-1 justify-center items-center px-3 bg-primary'>
          {logo && <View className='mb-8'>
            <Image source={require('@/assets/images/logo.png')} className='w-28 h-28' />
          </View>}
          <View className='w-full bg-gray-50 border-4 border-white rounded-lg py-4' style={{ elevation: 2 }}>
            {children}
          </View>
        </View>
  )
}

export default AuthLayout