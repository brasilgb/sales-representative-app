import AuthLayout from '@/components/auth-layout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { SignInFormType, signInSchema } from '@/schema/app';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { EyeClosedIcon, EyeIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';

const SignIn = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { signIn } = useAuth();

  const { control, handleSubmit, setError, reset, formState: { errors } } = useForm<SignInFormType>({
    resolver: zodResolver(signInSchema)
  });

  const onSubmit: SubmitHandler<SignInFormType> = async (data: SignInFormType) => {

    try {
      setLoading(true);
      Keyboard.dismiss();
      await signIn(data);
    } catch (error: any) {
      setError('email', { type: 'server', message: error.response?.data?.message || 'Credenciais inválidas.' });
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={'padding'}
      keyboardVerticalOffset={50}
      className='flex-1 bg-primary'
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <AuthLayout logo={true} >
          <ScreenHeader title="Bem vindo" subtitle="Digite seu e-mail e senha para acessar sua conta" classTitle={'text-lg text-gray-600'} classSubtitle='text-lg text-gray-500' />
          <View className='px-4 rounded-t-3xl gap-4'>
            <View>
              <Controller
                control={control}
                render={({
                  field: { onChange, onBlur, value }
                }) => (
                  <View>
                    <Input
                      label='E-mail'
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value && value.toLowerCase()}
                      inputClasses={`${errors.email ? '!border-red-500' : ''}`}
                      keyboardType='email-address'
                    />
                  </View>
                )}
                name='email'
              />
              {errors.email && (
                <Text className='text-red-500'>{errors.email?.message}</Text>
              )}
            </View>

            <View>
              <Controller
                control={control}
                render={({
                  field: { onChange, onBlur, value }
                }) => (
                  <View className='relative'>
                    <Input
                      label='Senha'
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      inputClasses={`${errors.password ? '!border-red-500' : ''}`}
                      secureTextEntry={!showPassword}
                    />
                    <View className='absolute right-1 top-9'>
                      {showPassword ? <EyeClosedIcon size={30} color={'#777777'} onPress={() => setShowPassword(!showPassword)} /> : <EyeIcon size={30} color={'#777777'} onPress={() => setShowPassword(!showPassword)} />}
                    </View>
                  </View>
                )}
                name='password'
              />
              {errors.password && (
                <Text className='text-red-500'>{errors.password?.message}</Text>
              )}
            </View>

            <View className='mt-4'>
              <Button
                label={loading ? <ActivityIndicator size="small" color="#bccf00" /> : 'Entrar'}
                variant={'default'}
                size="lg"
                onPress={handleSubmit(onSubmit)}
                labelClasses='text-white'
              />
            </View>

          </View>
          <View className='flex-row justify-between px-4 mt-4'>
            <Button
              label="Esqueci minha senha"
              variant="link"
              size="sm"
              onPress={() => router.push('/(auth)/forgot-password')}
              labelClasses="text-gray-500"
            />
            <Button
              label="Criar uma conta"
              variant="link"
              size="sm"
              onPress={() => router.push('/(auth)/register')}
              labelClasses="text-gray-500"
            />
          </View>
        </AuthLayout>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default SignIn