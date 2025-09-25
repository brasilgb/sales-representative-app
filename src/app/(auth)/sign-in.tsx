import React, { useState } from 'react'
import { View, Text, ActivityIndicator, Keyboard } from 'react-native'
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { SignInFormType, signInSchema } from '@/schema/app';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuthContext } from '@/contexts/AppContext';
import AuthLayout from '@/components/auth-layout';
import ScreenHeader from '@/components/ScreenHeader';
import { maskCnpj } from '@/lib/mask';

const SignIn = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { signIn } = useAuthContext();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SignInFormType>({

    resolver: zodResolver(signInSchema)
  });

  const onSubmit: SubmitHandler<SignInFormType> = async (data: SignInFormType) => {
    setLoading(true);
    try {
      console.log(data);
      
      // await signIn(data);
      // reset();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <ScreenHeader title="Bem vindo" subtitle="Digite seu cnpj e senha para acessar sua conta" classTitle={'text-lg text-gray-600'} classSubtitle='text-lg text-gray-500' />
      <View className='px-4 rounded-t-3xl gap-4'>
        <View>
          <Controller
            control={control}
            render={({
              field: { onChange, onBlur, value }
            }) => (
              <View>
                <Input
                  label='CNPJ meu chule'
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={maskCnpj(value)}
                  keyboardType='numeric'
                  inputClasses={`${errors.cnpj ? '!border-red-500' : ''}`}
                  maxLength={18}
                />
              </View>
            )}
            name='cnpj'
          />
          {errors.cnpj && (
            <Text className='text-red-500'>{errors.cnpj?.message}</Text>
          )}
        </View>

        <View>
          <Controller
            control={control}
            render={({
              field: { onChange, onBlur, value }
            }) => (
              <View>
                <Input
                  label='Senha'
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType='default'
                  inputClasses={`${errors.password ? '!border-red-500' : ''}`}
                />
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

    </AuthLayout>
  )
}

export default SignIn