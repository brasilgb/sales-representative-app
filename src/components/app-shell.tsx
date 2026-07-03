import { PropsWithChildren, useEffect, useRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      className="flex-1 bg-background">
      <ScrollView
        ref={scrollRef}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerClassName={`grow px-4 pt-5 ${centered ? 'justify-center' : ''}`}
        contentContainerStyle={{ paddingBottom: bottomInset }}>
        <View className="w-full max-w-[1040px] self-center gap-[18px]">{children}</View>
      </ScrollView>
    </SafeAreaView>
  );

  if (!avoidKeyboard) return content;

  return (
    <KeyboardAvoidingView
      enabled
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
      className="flex-1 bg-background">
      {content}
    </KeyboardAvoidingView>
  );
}
