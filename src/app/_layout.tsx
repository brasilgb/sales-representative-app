import '@/styles/global.css'
import React from 'react'
import { Stack } from 'expo-router'
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
// import AppLoading from '@/components/app-loading';
// import { AuthProvider } from '@/contexts/AppContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const RootLayout = () => {

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  //   if (!fontsLoaded) {
  //     return <AppLoading />;
  //   }

  return (
    <SafeAreaView className='flex-1 bg-sky-600'>
      <StatusBar style='light' translucent={true} />
      {/* <AuthProvider> */}
      <Stack>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen name='(auth)' options={{ headerShown: false }} />
      </Stack>
      {/* </AuthProvider> */}
    </SafeAreaView>
  )
}

export default RootLayout