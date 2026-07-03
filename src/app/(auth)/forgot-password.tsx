import { AppShell } from '@/components/app-shell';
import { AuthField } from '@/components/auth-field';
import { colors } from '@/constants/theme';
import { sendPasswordResetLink } from '@/services/AuthService';
import { RetypePasswordProps } from '@/types/app-types';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Keyboard, Pressable, Text, View } from 'react-native';

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
      <View className="w-full max-w-[540px] self-center gap-[18px] rounded-2xl border border-white/10 bg-surface p-5">
        <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} className="h-[42px] w-[42px] items-center justify-center rounded-lg bg-surface-raised active:opacity-65"><ArrowLeft size={21} color={colors.text} /></Pressable>
        <View><Text className="text-2xl font-black text-foreground">Recuperar senha</Text><Text className="mt-1 text-sm leading-5 text-muted">Enviaremos as instruções para o e-mail cadastrado.</Text></View>
        <Controller control={control} name="email" render={({ field }) => <AuthField label="E-mail" placeholder="nome@empresa.com.br" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} autoCapitalize="none" keyboardType="email-address" leftIcon={<Mail size={20} color={colors.mutedText} />} />} />
        {message ? <Text className="text-[13px] text-destructive">{message}</Text> : null}
        <Pressable disabled={loading} onPress={handleSubmit(onSubmit)} className="min-h-14 flex-row flex-nowrap items-center justify-center gap-2 rounded-xl bg-primary px-4 active:opacity-65 disabled:opacity-65">{loading ? <ActivityIndicator color={colors.primaryText} /> : <><Text className="min-w-0 shrink text-base font-black text-primary-foreground">Enviar link</Text><Send size={19} color={colors.primaryText} /></>}</Pressable>
      </View>
    </AppShell>
  );
}
