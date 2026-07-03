import HeaderStack from '@/components/header-stack';
import HeaderTabs from '@/components/header-tabs';
import { Stack } from 'expo-router';

export default function ExpenseLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: '#0b1220' } }}>
      <Stack.Screen name="index" options={{ headerShown: true, header: () => <HeaderTabs /> }} />
      <Stack.Screen name="new-expense" options={{ headerShown: true, header: () => <HeaderStack title="Nova despesa" /> }} />
    </Stack>
  );
}
