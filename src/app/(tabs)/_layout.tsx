import HeaderTabs from "@/components/header-tabs";
import { Tabs } from "expo-router";
import { HomeIcon, ShoppingCartIcon, UserRoundIcon } from 'lucide-react-native'

const TabsLlayout = () => {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#1a9cd9',
        tabBarActiveBackgroundColor: '#0284c7',
        tabBarInactiveBackgroundColor: '#FFFFFF',
        tabBarStyle: {
          height: 55,
          paddingBottom: 0,
          backgroundColor: '#0284c7',
          borderTopWidth: 0,
          shadowColor: '#000',
          marginBottom: 10,
          marginHorizontal: 10,
          borderRadius: 50,
          position: 'absolute',
          overflow: 'hidden',
          left: 0,
          bottom: 0,
          right: 0,
        },
        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: 0,
        },
        headerShown: false
      }}
    >

      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
          headerShown: true,
          header: () => <HeaderTabs />
        }}
      />

      <Tabs.Screen
        name="customers/index"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <UserRoundIcon color={color} size={size} />
          ),
          headerShown: true,
          header: () => <HeaderTabs />
        }}
      />

      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <ShoppingCartIcon color={color} size={size} />
          ),
          headerShown: true,
          header: () => <HeaderTabs />
        }}
      />

      <Tabs.Screen
        name="products/index"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
          headerShown: true,
          header: () => <HeaderTabs />
        }}
      />

    </Tabs>
  )
}

export default TabsLlayout