import AppLoading from '@/components/app-loading';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import '@/styles/global.css';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, useFonts } from '@expo-google-fonts/roboto';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const InitialLayout = () => {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (user && !inTabsGroup) {
      router.replace('/(tabs)/home');
    } else if (!user && inTabsGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return <AppLoading />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='(auth)' options={{ headerShown: false }} />
    </Stack>
  );
}

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
        <InitialLayout />
      </SafeAreaView>
    </AuthProvider>
  )
}

export default RootLayout