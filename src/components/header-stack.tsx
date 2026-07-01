import { colors } from '@/constants/theme';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HeaderStack({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { height: 66 + insets.top, paddingTop: insets.top }]}>
      <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><ChevronLeft color={colors.text} size={25} /></Pressable>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: colors.header, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.14)' },
  back: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  title: { minWidth: 0, flex: 1, color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'center', marginHorizontal: 12 },
  spacer: { width: 40 },
  pressed: { opacity: 0.65 },
});
