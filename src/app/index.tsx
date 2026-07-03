import AppLoading from '@/components/app-loading';
import { AppShell } from '@/components/app-shell';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { SignInFormType, signInSchema } from '@/schema/app';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowRight, Check, Eye, EyeOff, Fingerprint, LockKeyhole, Mail } from 'lucide-react-native';
import { ReactNode, useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ActivityIndicator, Image, Keyboard, Pressable, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

export default function SignIn() {
  const { width } = useWindowDimensions();
  const { user, signIn, unlockWithBiometrics, biometricAvailable, biometricConfigured, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [useBiometrics, setUseBiometrics] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const isWide = width >= 768;
  const { control, handleSubmit, setError, formState: { errors } } = useForm<SignInFormType>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (user) router.replace('/(tabs)/home');
  }, [user]);

  useEffect(() => {
    setUseBiometrics(biometricAvailable);
  }, [biometricAvailable]);

  const onSubmit: SubmitHandler<SignInFormType> = async (data) => {
    setLoading(true);
    setSubmitError(null);
    Keyboard.dismiss();
    try {
      await signIn({ ...data, email: data.email.trim().toLowerCase(), useBiometrics });
    } catch (error: any) {
      const credentialError = error.response?.data?.errors?.email?.[0];

      if (credentialError) {
        setError('email', { type: 'server', message: credentialError });
      } else if (!error.response) {
        setSubmitError(error.code === 'ECONNABORTED'
          ? 'O servidor demorou para responder. Verifique a conexão e tente novamente.'
          : 'Não foi possível conectar ao servidor. Confirme se a API está ligada e acessível na rede.');
      } else {
        setSubmitError(error.response?.data?.message || 'Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onBiometricLogin = async () => {
    setBiometricLoading(true);
    setSubmitError(null);
    const success = await unlockWithBiometrics();
    if (!success) setSubmitError('Não foi possível autenticar. Use sua senha ou tente a digital novamente.');
    setBiometricLoading(false);
  };

  if (isLoading || user) return <AppLoading />;

  return (
    <AppShell centered avoidKeyboard safeTop>
      <View style={[styles.layout, isWide && styles.layoutWide]}>
        <View style={[styles.brandPanel, isWide && styles.widePanel]}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.kicker}>Vendas em movimento</Text>
          <Text style={styles.brandTitle}>VetorPet</Text>
          <Text style={styles.brandText}>Pet shops, catálogo, visitas e pedidos reunidos para sua rotina de vendas de suprimentos pet.</Text>
        </View>

        <View style={[styles.formPanel, isWide && styles.widePanel]}>
          <View>
            <Text style={styles.formTitle}>Acesse sua conta</Text>
            <Text style={styles.formDescription}>Use as mesmas credenciais do sistema web.</Text>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field label="E-mail" error={errors.email?.message}>
                <Mail size={20} color={colors.mutedText} />
                <TextInput
                  style={styles.input}
                  placeholder="nome@empresa.com.br"
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field label="Senha" error={errors.password?.message}>
                <LockKeyhole size={20} color={colors.mutedText} />
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha"
                  placeholderTextColor={colors.mutedText}
                  autoComplete="current-password"
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onPress={() => setShowPassword((current) => !current)}
                  style={({ pressed }) => [styles.passwordButton, pressed && styles.pressed]}>
                  {showPassword ? <EyeOff size={21} color={colors.mutedText} /> : <Eye size={21} color={colors.mutedText} />}
                </Pressable>
              </Field>
            )}
          />

          {submitError ? (
            <View accessibilityRole="alert" style={styles.submitErrorBox}>
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            disabled={loading}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading, busy: loading }}
            activeOpacity={0.78}
            onPress={() => void handleSubmit(onSubmit)()}
            style={[styles.submit, loading && styles.submitDisabled]}>
            {loading ? <ActivityIndicator color={colors.primaryText} /> : <><Text style={styles.submitText}>Entrar</Text><ArrowRight size={20} color={colors.primaryText} /></>}
          </TouchableOpacity>

          {biometricConfigured ? (
            <TouchableOpacity
              disabled={biometricLoading}
              accessibilityRole="button"
              activeOpacity={0.75}
              onPress={() => void onBiometricLogin()}
              style={styles.biometricButton}>
              {biometricLoading ? <ActivityIndicator color={colors.primary} /> : <Fingerprint size={22} color={colors.primary} />}
              <Text style={styles.biometricButtonText}>Entrar com digital</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.links}>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')}><Text style={styles.link}>Esqueci minha senha</Text></Pressable>
            {biometricAvailable ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: useBiometrics }}
                onPress={() => setUseBiometrics((current) => !current)}
                style={({ pressed }) => [styles.biometricOption, pressed && styles.pressed]}>
                <View style={styles.biometricOptionContent}>
                  <View style={[styles.checkbox, useBiometrics && styles.checkboxChecked]}>
                    {useBiometrics ? <Check size={12} strokeWidth={3} color={colors.primaryText} /> : null}
                  </View>
                  <Text numberOfLines={1} style={styles.biometricOptionTitle}>Biometria</Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </AppShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>{children}</View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = {
  layout: { width: '100%', gap: 18 },
  layoutWide: { flexDirection: 'row', alignItems: 'stretch' },
  widePanel: { flex: 1 },
  brandPanel: { minHeight: 260, borderRadius: 16, padding: 24, justifyContent: 'center', backgroundColor: colors.header },
  logo: { width: 76, height: 76, marginBottom: 20 },
  kicker: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  brandTitle: { color: colors.text, fontSize: 32, lineHeight: 39, fontWeight: '900', marginTop: 4 },
  brandText: { color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 430 },
  formPanel: { justifyContent: 'center', gap: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 20 },
  formTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  formDescription: { color: colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 4 },
  field: { gap: 7 },
  label: { color: colors.mutedText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  inputWrap: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, paddingHorizontal: 15 },
  inputError: { borderColor: colors.danger },
  input: { minWidth: 0, flex: 1, minHeight: 54, color: colors.text, fontSize: 16 },
  passwordButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  errorText: { color: colors.danger, fontSize: 12 },
  submitErrorBox: { borderWidth: 1, borderColor: 'rgba(249,112,102,0.4)', borderRadius: 10, backgroundColor: 'rgba(249,112,102,0.1)', paddingHorizontal: 13, paddingVertical: 11 },
  submitErrorText: { color: colors.danger, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  submit: {
    width: '100%',
    minHeight: 56,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: '#67d3fa',
    borderRadius: 12,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 5,
  },
  submitDisabled: { opacity: 0.58 },
  submitText: { minWidth: 0, flexShrink: 1, color: colors.primaryText, fontSize: 16, fontWeight: '900', letterSpacing: 0.2 },
  biometricOption: { minHeight: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  biometricOptionContent: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 5, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised },
  checkboxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  biometricOptionTitle: { flexShrink: 0, marginLeft: 7, color: colors.mutedText, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  biometricButton: { minHeight: 52, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 14 },
  biometricButtonText: { minWidth: 0, flexShrink: 1, color: colors.primary, fontSize: 15, fontWeight: '800' },
  links: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  link: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.7 },
} as const;
