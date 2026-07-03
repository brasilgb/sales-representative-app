import { colors } from '@/constants/theme';
import { ReactNode } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function AuthField({ label, error, leftIcon, rightIcon, style, ...props }: AuthFieldProps) {
  return (
    <View className="gap-[7px]">
      <Text className="text-xs font-extrabold uppercase text-muted">{label}</Text>
      <View className={`min-h-14 flex-row items-center gap-2.5 rounded-xl border bg-surface-raised px-[15px] ${error ? 'border-destructive' : 'border-white/10'}`}>
        {leftIcon}
        <TextInput
          {...props}
          placeholderTextColor={colors.mutedText}
          className="min-w-0 flex-1 min-h-[54px] text-base text-foreground"
          style={style}
        />
        {rightIcon}
      </View>
      {error ? <Text className="text-xs leading-4 text-destructive">{error}</Text> : null}
    </View>
  );
}
