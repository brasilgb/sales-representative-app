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
import { ActivityIndicator, Keyboard, Pressable, Text, View } from 'react-native';

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
      <View className="flex-row items-start gap-3.5">
        <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} className="h-[42px] w-[42px] items-center justify-center rounded-lg bg-surface-raised active:opacity-65">
          <ArrowLeft size={21} color={colors.text} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-2xl font-black text-foreground">Crie sua conta</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">Comece seu período de avaliação com todos os módulos.</Text>
        </View>
      </View>

      <View className="gap-4 rounded-2xl border border-white/10 bg-surface p-[18px]">
        <Controller control={control} name="company" render={({ field }) => <AuthField label="Empresa" placeholder="Razão social" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.company?.message} leftIcon={<Building2 size={20} color={colors.mutedText} />} />} />
        <Controller control={control} name="cnpj" render={({ field }) => <AuthField label="CNPJ" placeholder="00.000.000/0000-00" value={maskCnpj(field.value) || ''} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.cnpj?.message} keyboardType="numeric" maxLength={18} leftIcon={<Building2 size={20} color={colors.mutedText} />} />} />
        <Controller control={control} name="name" render={({ field }) => <AuthField label="Seu nome" placeholder="Nome completo" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.name?.message} leftIcon={<UserRound size={20} color={colors.mutedText} />} />} />

        <View className="gap-4">
          <Controller control={control} name="phone" render={({ field }) => <AuthField label="Telefone" placeholder="(00) 00000-0000" value={maskPhone(field.value) || ''} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.phone?.message} keyboardType="phone-pad" maxLength={15} leftIcon={<Phone size={19} color={colors.mutedText} />} />} />
          <Controller control={control} name="whatsapp" render={({ field }) => <AuthField label="WhatsApp" placeholder="(00) 00000-0000" value={maskPhone(field.value) || ''} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.whatsapp?.message} keyboardType="phone-pad" maxLength={15} leftIcon={<Phone size={19} color={colors.mutedText} />} />} />
        </View>

        <Controller control={control} name="email" render={({ field }) => <AuthField label="E-mail" placeholder="nome@empresa.com.br" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} autoCapitalize="none" keyboardType="email-address" leftIcon={<Mail size={20} color={colors.mutedText} />} />} />

        <Controller
          control={control}
          name="plan_type"
          render={({ field }) => (
            <View className="gap-[7px]">
              <Text className="text-xs font-extrabold uppercase text-muted">Formato da operação</Text>
              <View className="flex-row rounded-xl bg-surface-raised p-1">
                <PlanOption label="Vendedor único" selected={field.value === 'individual'} onPress={() => field.onChange('individual')} />
                <PlanOption label="Equipe" selected={field.value === 'team'} onPress={() => field.onChange('team')} />
              </View>
              <Text className="text-xs text-muted">{field.value === 'team' ? 'Para operações com até 8 vendedores.' : 'Para sua operação individual.'}</Text>
            </View>
          )}
        />

        <Controller control={control} name="password" render={({ field }) => <AuthField label="Senha" placeholder="Crie uma senha" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password?.message} secureTextEntry={!showPassword} leftIcon={<LockKeyhole size={20} color={colors.mutedText} />} rightIcon={<PasswordToggle visible={showPassword} onPress={() => setShowPassword((value) => !value)} />} />} />
        <Controller control={control} name="password_confirmation" render={({ field }) => <AuthField label="Confirme a senha" placeholder="Digite a senha novamente" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password_confirmation?.message} secureTextEntry={!showPassword} leftIcon={<LockKeyhole size={20} color={colors.mutedText} />} />} />

        {generalError ? <Text className="text-[13px] leading-[19px] text-destructive">{generalError}</Text> : null}

        <Pressable disabled={loading} onPress={handleSubmit(onSubmit)} className="min-h-14 flex-row flex-nowrap items-center justify-center gap-2 rounded-xl bg-primary px-4 active:opacity-65 disabled:opacity-65">
          {loading ? <ActivityIndicator color={colors.primaryText} /> : <><Text className="min-w-0 shrink text-base font-black text-primary-foreground">Criar conta</Text><ArrowRight size={20} color={colors.primaryText} /></>}
        </Pressable>
      </View>

      <Pressable onPress={() => router.replace('/')} className="min-h-11 items-center justify-center"><Text className="text-sm font-extrabold text-primary">Já tenho uma conta</Text></Pressable>
    </AppShell>
  );
}

function PlanOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} className={`min-h-11 flex-1 items-center justify-center rounded-[9px] ${selected ? 'bg-primary' : ''}`}><Text className={`text-[13px] font-extrabold ${selected ? 'text-primary-foreground' : 'text-muted'}`}>{label}</Text></Pressable>;
}

function PasswordToggle({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  return <Pressable accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} onPress={onPress} className="h-[38px] w-[38px] items-center justify-center">{visible ? <EyeOff size={21} color={colors.mutedText} /> : <Eye size={21} color={colors.mutedText} />}</Pressable>;
}
