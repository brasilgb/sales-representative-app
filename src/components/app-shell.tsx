import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type AppShellProps = PropsWithChildren<{
  centered?: boolean;
  avoidKeyboard?: boolean;
  bottomInset?: number;
  safeBottom?: boolean;
}>;

export function AppShell({ children, centered, avoidKeyboard, bottomInset = 28, safeBottom = true }: AppShellProps) {
  const content = (
    <SafeAreaView edges={safeBottom ? ['bottom'] : []} style={styles.container}>
      <ScrollView
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          centered && styles.centered,
          { paddingBottom: bottomInset },
        ]}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );

  if (!avoidKeyboard) return content;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
      style={styles.container}>
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 20 },
  centered: { justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 1040, alignSelf: 'center', gap: 18 },
});
