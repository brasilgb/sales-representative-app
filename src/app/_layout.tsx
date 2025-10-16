import '@/styles/global.css';
import AppLoading from '@/components/app-loading';
import { AuthProvider } from '@/contexts/AuthContext';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, useFonts } from '@expo-google-fonts/roboto';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <AuthProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B78BC' }}>
        <StatusBar style='light' translucent={true} />
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
          <Stack.Screen name='(auth)' options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
    </AuthProvider>
  )
}

export default RootLayout