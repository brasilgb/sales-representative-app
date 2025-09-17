import { View, Text } from 'react-native'
import React from 'react'
import { User2Icon } from 'lucide-react-native'

export default function HeaderTabs() {
    return (
        <View className='flex-row items-center justify-between bg-sky-600 h-20 px-6 gap-4'>
            <View>
                <User2Icon size={30} color={'white'} />
            </View>
            <View className='flex-1'><Text className='text-xl text-white'>Anderson Brasil</Text></View>
            <View>
            </View>
        </View>
    )
}