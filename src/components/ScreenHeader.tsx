import { View, Text } from 'react-native'
import React from 'react'

interface ScreenHeaderProps {
    title: string
    subtitle?: string
    classTitle?: string
    classSubtitle?: string
}
const ScreenHeader = ({ title, subtitle, classTitle, classSubtitle }: ScreenHeaderProps) => {
    return (
        <View className='pb-6 items-center justify-center'>
            {title && <Text className={`font-RobotoBold ${classTitle}`}>{(title).toUpperCase()}</Text>}
            {subtitle && <Text className={`font-RobotoMedium ${classSubtitle}`}>{subtitle}</Text>}
        </View>
    )
}

export default ScreenHeader