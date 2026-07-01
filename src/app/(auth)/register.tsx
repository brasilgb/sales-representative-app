import { AppShell } from '@/components/app-shell';
import { AuthField } from '@/components/auth-field';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { maskCnpj, maskPhone } from '@/lib/mask';
import { RegisterProps } from '@/types/app-types';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState: { errors } } = useForm<RegisterProps>({
    defaultValues: {
      company: '', cnpj: '', name: '', phone: '', whatsapp: '', email: '',
      password: '', password_confirmation: '', plan_type: 'individual',
    },
  });

  const onSubmit: SubmitHandler<RegisterProps> = async (data) => {
    setLoading(true);
    setGeneralError(null);
    Keyboard.dismiss();
    try {
      await signUp({ ...data, email: data.email.trim().toLowerCase() });
    } catch (error: any) {
      const apiErrors = error.response?.data?.data || error.response?.data?.errors;
      if (apiErrors) {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          setError(field as keyof RegisterProps, { type: 'server', message: (messages as string[])[0] });
        });
      } else {
        setGeneralError(error.response?.data?.message || 'Não foi possível criar a conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell avoidKeyboard>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <ArrowLeft size={21} color={colors.text} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>Crie sua conta</Text>
          <Text style={styles.subtitle}>Comece seu período de avaliação com todos os módulos.</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Controller control={control} name="company" render={({ field }) => <AuthField label="Empresa" placeholder="Razão social" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.company?.message} leftIcon={<Building2 size={20} color={colors.mutedText} />} />} />
        <Controller control={control} name="cnpj" render={({ field }) => <AuthField label="CNPJ" placeholder="00.000.000/0000-00" value={maskCnpj(field.value) || ''} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.cnpj?.message} keyboardType="numeric" maxLength={18} leftIcon={<Building2 size={20} color={colors.mutedText} />} />} />
        <Controller control={control} name="name" render={({ field }) => <AuthField label="Seu nome" placeholder="Nome completo" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.name?.message} leftIcon={<UserRound size={20} color={colors.mutedText} />} />} />

        <View style={styles.twoColumns}>
          <Controller control={control} name="phone" render={({ field }) => <AuthField label="Telefone" placeholder="(00) 00000-0000" value={maskPhone(field.value) || ''} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.phone?.message} keyboardType="phone-pad" maxLength={15} leftIcon={<Phone size={19} color={colors.mutedText} />} />} />
          <Controller control={control} name="whatsapp" render={({ field }) => <AuthField label="WhatsApp" placeholder="(00) 00000-0000" value={maskPhone(field.value) || ''} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.whatsapp?.message} keyboardType="phone-pad" maxLength={15} leftIcon={<Phone size={19} color={colors.mutedText} />} />} />
        </View>

        <Controller control={control} name="email" render={({ field }) => <AuthField label="E-mail" placeholder="nome@empresa.com.br" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} autoCapitalize="none" keyboardType="email-address" leftIcon={<Mail size={20} color={colors.mutedText} />} />} />

        <Controller
          control={control}
          name="plan_type"
          render={({ field }) => (
            <View style={styles.planField}>
              <Text style={styles.label}>Formato da operação</Text>
              <View style={styles.planControl}>
                <PlanOption label="Vendedor único" selected={field.value === 'individual'} onPress={() => field.onChange('individual')} />
                <PlanOption label="Equipe" selected={field.value === 'team'} onPress={() => field.onChange('team')} />
              </View>
              <Text style={styles.planHint}>{field.value === 'team' ? 'Para operações com até 8 vendedores.' : 'Para sua operação individual.'}</Text>
            </View>
          )}
        />

        <Controller control={control} name="password" render={({ field }) => <AuthField label="Senha" placeholder="Crie uma senha" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password?.message} secureTextEntry={!showPassword} leftIcon={<LockKeyhole size={20} color={colors.mutedText} />} rightIcon={<PasswordToggle visible={showPassword} onPress={() => setShowPassword((value) => !value)} />} />} />
        <Controller control={control} name="password_confirmation" render={({ field }) => <AuthField label="Confirme a senha" placeholder="Digite a senha novamente" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password_confirmation?.message} secureTextEntry={!showPassword} leftIcon={<LockKeyhole size={20} color={colors.mutedText} />} />} />

        {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}

        <Pressable disabled={loading} onPress={handleSubmit(onSubmit)} style={({ pressed }) => [styles.submit, (pressed || loading) && styles.pressed]}>
          {loading ? <ActivityIndicator color={colors.primaryText} /> : <><Text style={styles.submitText}>Criar conta</Text><ArrowRight size={20} color={colors.primaryText} /></>}
        </Pressable>
      </View>

      <Pressable onPress={() => router.replace('/')} style={styles.loginLink}><Text style={styles.loginText}>Já tenho uma conta</Text></Pressable>
    </AppShell>
  );
}

function PlanOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.planOption, selected && styles.planOptionSelected]}><Text style={[styles.planOptionText, selected && styles.planOptionTextSelected]}>{label}</Text></Pressable>;
}

function PasswordToggle({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  return <Pressable accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} onPress={onPress} style={styles.passwordButton}>{visible ? <EyeOff size={21} color={colors.mutedText} /> : <Eye size={21} color={colors.mutedText} />}</Pressable>;
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconButton: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  subtitle: { color: colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 4 },
  panel: { gap: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18 },
  twoColumns: { gap: 16 },
  planField: { gap: 7 },
  label: { color: colors.mutedText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  planControl: { flexDirection: 'row', padding: 4, borderRadius: 12, backgroundColor: colors.surfaceRaised },
  planOption: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  planOptionSelected: { backgroundColor: colors.primary },
  planOptionText: { color: colors.mutedText, fontSize: 13, fontWeight: '800' },
  planOptionTextSelected: { color: colors.primaryText },
  planHint: { color: colors.mutedText, fontSize: 12 },
  passwordButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  generalError: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  submit: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: colors.primary },
  submitText: { color: colors.primaryText, fontSize: 16, fontWeight: '900' },
  loginLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  loginText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
