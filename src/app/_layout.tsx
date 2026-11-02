import '@/styles/global.css';
import AppLoading from '@/components/app-loading';
import { AuthProvider } from '@/contexts/AuthContext';
import { OfflineProvider } from '@/offline/OfflineProvider';
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
          <OfflineProvider>
            <StatusBar style='dark' backgroundColor='#F8FAFC' />
            <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#F8FAFC' } }}>
              <Stack.Screen name='index' />
              <Stack.Screen name='(tabs)' />
              <Stack.Screen name='(auth)' />
              <Stack.Screen name='sync' />
            </Stack>
          </OfflineProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default RootLayout
