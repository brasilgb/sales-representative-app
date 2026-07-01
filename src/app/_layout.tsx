import '@/styles/global.css';
import AppLoading from '@/components/app-loading';
import { AuthProvider } from '@/contexts/AuthContext';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, useFonts } from '@expo-google-fonts/roboto';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const RootLayout = () => {

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style='light' backgroundColor='#15365f' />
          <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#0b1220' } }}>
            <Stack.Screen name='index' />
            <Stack.Screen name='(tabs)' />
            <Stack.Screen name='(auth)' />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default RootLayout
