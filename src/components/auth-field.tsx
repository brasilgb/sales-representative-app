import { colors } from '@/constants/theme';
import { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function AuthField({ label, error, leftIcon, rightIcon, style, ...props }: AuthFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        {leftIcon}
        <TextInput
          {...props}
          placeholderTextColor={colors.mutedText}
          style={[styles.input, style]}
        />
        {rightIcon}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { color: colors.mutedText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  inputWrap: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, paddingHorizontal: 15 },
  inputError: { borderColor: colors.danger },
  input: { minWidth: 0, flex: 1, minHeight: 54, color: colors.text, fontSize: 16 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 16 },
});
