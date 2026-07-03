import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';
import { LogOut, UserRound } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HeaderTabs() {
  const { signOut, user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-row items-center justify-between border-b border-white/15 bg-header px-4" style={{ paddingTop: insets.top, height: 70 + insets.top }}>
      <View className="flex-1 flex-row items-center gap-[11px]">
        <View className="h-10 w-10 items-center justify-center">
          <Image source={require('@/assets/images/logo.png')} className="h-9 w-9" resizeMode="contain" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-extrabold text-foreground">VetorPet</Text>
          <Text className="mt-0.5 text-xs text-white/70" numberOfLines={1}>{user?.name || 'Área de vendas'}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <View className="h-[38px] w-[38px] items-center justify-center rounded-lg bg-white/10" accessibilityElementsHidden>
          <UserRound size={20} color={colors.text} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair do aplicativo"
          hitSlop={8}
          onPress={() => void signOut()}
          className="h-[38px] w-[38px] items-center justify-center rounded-lg bg-white/10 active:opacity-70">
          <LogOut size={21} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
