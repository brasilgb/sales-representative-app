import React, { useState } from 'react'
import { View, Text, ActivityIndicator, Keyboard, Alert } from 'react-native'
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import AuthLayout from '@/components/auth-layout';
import ScreenHeader from '@/components/ScreenHeader';
import { router } from 'expo-router';
import { RetypePasswordProps } from '@/types/app-types';
import { sendPasswordResetLink } from '@/services/AuthService';

const ForgotPassword = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { control, handleSubmit, setError, reset, formState: { errors } } = useForm<RetypePasswordProps>();

  const onSubmit: SubmitHandler<RetypePasswordProps> = async (data: RetypePasswordProps) => {

    try {
      setLoading(true);
      const status = await sendPasswordResetLink(data.email);
      Keyboard.dismiss();
      reset();
      Alert.alert('Sucesso', status);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      if (error.response?.status === 422) {
        for (const field in error?.response?.data?.data) {
          setError(field as keyof RetypePasswordProps, { type: 'server', message: error.response?.data?.data[field][0] });
        }
      }
    } finally { () => setLoading(false) };
  }

  return (
    <AuthLayout>
      <ScreenHeader title="Recuperação de Senha" subtitle="Preencha corretamente o e-mail de cadastro para receber um link de redefinição de senha." classTitle={'text-lg text-gray-600'} classSubtitle='text-lg text-gray-500 text-center' />
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

        <View className='mt-4'>
          <Button
            label={loading ? <ActivityIndicator size="small" color="#bccf00" /> : 'Enviar link de redefinição de senha'}
            variant={'default'}
            size="lg"
            onPress={handleSubmit(onSubmit)}
            labelClasses='text-white'
          />
        </View>

      </View>
      <View className='flex-row items-center justify-end px-4 mt-4'>
        <Text className='text-gray-500 text-sm'>Retornar para </Text>
        <Button
          label="login"
          variant="link"
          size="sm"
          onPress={() => router.push('/(auth)/sign-in')}
          labelClasses="text-gray-500"
        />
      </View>
    </AuthLayout>
  )
}

export default ForgotPassword