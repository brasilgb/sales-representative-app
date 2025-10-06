import { Image, KeyboardAvoidingView, Platform, View } from 'react-native'
import React, { ReactNode } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

interface AuthLayoutProps {
  children: ReactNode;
  logo?: boolean
}

const AuthLayout = ({ children, logo }: AuthLayoutProps) => {
  return (
    <SafeAreaView className='flex-1 bg-primary'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className='flex-1 justify-center items-center px-3'>
          {logo && <View className='mb-10'>
            <Image source={require('@/assets/images/logo.png')} className='w-24 h-24' />
          </View>}
          <View className='w-full bg-gray-50 border-4 border-white rounded-lg py-4' style={{ elevation: 2 }}>
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AuthLayout