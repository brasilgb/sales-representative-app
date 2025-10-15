import React from 'react'
import { ActivityIndicator, View } from 'react-native'

const AppLoading = () => {

    return (
        <View className='flex-1 items-center justify-center bg-[#0B78BC]'>
            <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
    )

}

export default AppLoading