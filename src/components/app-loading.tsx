import { View, Text, ActivityIndicator, Modal } from 'react-native'
import React from 'react'
const AppLoading = () => {

    return (
        <Modal
            animationType="fade" // Ou "fade", "none"
            transparent={true}
            visible={true}
        // onRequestClose={onClose}
        >
            <View className='flex-1 items-center justify-center bg-black/20'>
                <ActivityIndicator size="large" color="#283E5E" />
            </View>
        </Modal>
    )
}

export default AppLoading