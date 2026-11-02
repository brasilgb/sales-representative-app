import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

const AppLoading = () => {

    return (
        <View className='flex-1 items-center justify-center gap-3 bg-[#F8FAFC]'>
            <ActivityIndicator size="large" color="#166534" />
            <Text className='text-sm font-medium text-[#64748B]'>Preparando sua área de vendas...</Text>
        </View>
    )

}

export default AppLoading
