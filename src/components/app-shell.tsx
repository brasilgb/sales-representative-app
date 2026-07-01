import { PropsWithChildren, useEffect, useRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type AppShellProps = PropsWithChildren<{
  centered?: boolean;
  avoidKeyboard?: boolean;
  bottomInset?: number;
  safeTop?: boolean;
  safeBottom?: boolean;
}>;

export function AppShell({ children, centered, avoidKeyboard, bottomInset = 28, safeTop = false, safeBottom = true }: AppShellProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!avoidKeyboard) return;

    const subscription = Keyboard.addListener('keyboardDidHide', () => {
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
    });

    return () => subscription.remove();
  }, [avoidKeyboard]);

  const content = (
    <SafeAreaView
      edges={safeTop ? (safeBottom ? ['top', 'bottom'] : ['top']) : (safeBottom ? ['bottom'] : [])}
      style={styles.container}>
      <ScrollView
        ref={scrollRef}
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
      enabled={Platform.OS === 'ios'}
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
