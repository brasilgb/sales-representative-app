import HeaderTabs from '@/components/header-tabs';
import { colors } from '@/constants/theme';
import { Tabs } from 'expo-router';
import { Boxes, CalendarDays, House, ShoppingCart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const screens = [
  { name: 'home/index', title: 'Início', icon: House },
  { name: 'orders', title: 'Pedidos', icon: ShoppingCart },
  { name: 'visits', title: 'Agenda', icon: CalendarDays },
  { name: 'products/index', title: 'Produtos', icon: Boxes },
] as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <HeaderTabs />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          height: 60 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarItemStyle: { minWidth: 58 },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      {screens.map(({ name, title, icon: Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            headerShown: !['orders', 'visits'].includes(name),
            tabBarIcon: ({ color, size }) => <Icon color={color} size={size} strokeWidth={2.2} />,
          }}
        />
      ))}
      <Tabs.Screen name="customers/index" options={{ href: null }} />
    </Tabs>
  );
}
