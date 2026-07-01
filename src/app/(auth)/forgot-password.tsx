import { AppShell } from '@/components/app-shell';
import { AuthField } from '@/components/auth-field';
import { colors } from '@/constants/theme';
import { sendPasswordResetLink } from '@/services/AuthService';
import { RetypePasswordProps } from '@/types/app-types';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState: { errors } } = useForm<RetypePasswordProps>({ defaultValues: { email: '' } });

  const onSubmit: SubmitHandler<RetypePasswordProps> = async ({ email }) => {
    setLoading(true);
    setMessage(null);
    Keyboard.dismiss();
    try {
      const status = await sendPasswordResetLink(email.trim().toLowerCase());
      Alert.alert('Link enviado', status, [{ text: 'Voltar ao login', onPress: () => router.replace('/') }]);
    } catch (error: any) {
      const emailError = error.response?.data?.errors?.email?.[0] || error.response?.data?.message;
      if (emailError) setError('email', { type: 'server', message: emailError });
      else setMessage('Não foi possível enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell centered avoidKeyboard>
      <View style={styles.panel}>
        <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><ArrowLeft size={21} color={colors.text} /></Pressable>
        <View><Text style={styles.title}>Recuperar senha</Text><Text style={styles.subtitle}>Enviaremos as instruções para o e-mail cadastrado.</Text></View>
        <Controller control={control} name="email" render={({ field }) => <AuthField label="E-mail" placeholder="nome@empresa.com.br" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} autoCapitalize="none" keyboardType="email-address" leftIcon={<Mail size={20} color={colors.mutedText} />} />} />
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <Pressable disabled={loading} onPress={handleSubmit(onSubmit)} style={({ pressed }) => [styles.submit, (pressed || loading) && styles.pressed]}>{loading ? <ActivityIndicator color={colors.primaryText} /> : <><Text style={styles.submitText}>Enviar link</Text><Send size={19} color={colors.primaryText} /></>}</Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  panel: { width: '100%', maxWidth: 540, alignSelf: 'center', gap: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 20 },
  back: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  subtitle: { color: colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 5 },
  error: { color: colors.danger, fontSize: 13 },
  submit: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: colors.primary },
  submitText: { color: colors.primaryText, fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.65 },
});
