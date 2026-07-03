import { colors } from '@/constants/theme';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HeaderStack({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-row items-center justify-between border-b border-white/15 bg-header px-4" style={{ height: 66 + insets.top, paddingTop: insets.top }}>
      <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-lg bg-white/10 active:opacity-65"><ChevronLeft color={colors.text} size={25} /></Pressable>
      <Text className="mx-3 min-w-0 flex-1 text-center text-base font-black text-foreground" numberOfLines={1}>{title}</Text>
      <View className="w-10" />
    </View>
  );
}
