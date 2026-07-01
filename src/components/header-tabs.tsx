import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';
import { LogOut, UserRound } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HeaderTabs() {
  const { signOut, user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top, height: 70 + insets.top }]}>
      <View style={styles.brand}>
        <View style={styles.logoWrap}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.userText}>
          <Text style={styles.product}>VetorPet</Text>
          <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Área de vendas'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.userIcon} accessibilityElementsHidden>
          <UserRound size={20} color={colors.text} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair do aplicativo"
          hitSlop={8}
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <LogOut size={21} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.header,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 36, height: 36 },
  userText: { flex: 1 },
  product: { color: colors.text, fontSize: 15, fontWeight: '800' },
  userName: { color: 'rgba(255,255,255,0.68)', fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userIcon: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  iconButton: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  pressed: { opacity: 0.7 },
});
