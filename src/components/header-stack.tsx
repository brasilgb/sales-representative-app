import { View } from 'react-native'
import React from 'react'
import { ChevronLeftIcon } from 'lucide-react-native'
import { Button } from './Button'
import { router } from 'expo-router';

export default function HeaderStack() {
    return (
        <View className='flex-row items-center justify-between bg-primary h-20 px-4 gap-4'>
            <View>
                <Button
                    label={<ChevronLeftIcon color={'white'} size={30} />}
                    onPress={() => router.back()}
                />
            </View>
            <View></View>
        </View>
    )
}