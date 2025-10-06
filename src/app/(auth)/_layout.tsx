import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function AuthLayout() {
    return (
        <GestureHandlerRootView>
            <Stack>
                <Stack.Screen name='sign-in' options={{ headerShown: false }} />
                <Stack.Screen name='register' options={{ headerShown: false }} />
                <Stack.Screen name='forgot-password' options={{ headerShown: false }} />
            </Stack>
        </GestureHandlerRootView>
    )
}