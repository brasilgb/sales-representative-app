import '@/styles/global.css'
import React, { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
// import AppLoading from '@/components/app-loading';
// import { AuthProvider } from '@/contexts/AppContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppLoading from '@/components/app-loading';
import { AuthProvider } from '@/contexts/AppContext';
import { loadUser } from '@/services/AuthService';
import AuthContext from '@/contexts/AuthContext';

const RootLayout = () => {
  const [user, setUser] = useState([]);

  useEffect(() => {
    const runEffect = async () => {
      try {
        const user = await loadUser();
        setUser(user);
      } catch (error) {
        console.log("Falha ao ler usuário", error)
      }
    };
    runEffect();
  }, []);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <SafeAreaView className='flex-1 bg-primary'>
        <StatusBar style='light' translucent={true} />
        <Stack screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name='(auth)' options={{ headerShown: false }} />
          )}
        </Stack>
      </SafeAreaView>
    </AuthContext.Provider>
  )
}

export default RootLayout