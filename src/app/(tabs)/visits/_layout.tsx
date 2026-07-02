import HeaderStack from '@/components/header-stack';
import HeaderTabs from '@/components/header-tabs';
import { Stack } from 'expo-router';

export default function VisitLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: '#0b1220' } }}>
      <Stack.Screen name="index" options={{ headerShown: true, header: () => <HeaderTabs /> }} />
      <Stack.Screen name="schedule-visit" options={{ headerShown: true, header: () => <HeaderStack title="Agendar visita" /> }} />
    </Stack>
  );
}
