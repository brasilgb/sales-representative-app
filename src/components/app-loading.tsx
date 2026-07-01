import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

const AppLoading = () => {

    return (
        <View className='flex-1 items-center justify-center gap-3 bg-[#0b1220]'>
            <ActivityIndicator size="large" color="#22b8f0" />
            <Text className='text-sm font-medium text-[#a8b3c7]'>Preparando sua área de vendas...</Text>
        </View>
    )

}

export default AppLoading
