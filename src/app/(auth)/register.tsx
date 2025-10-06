import React, { useState } from 'react'
import { View, Text, ActivityIndicator, Keyboard, Platform } from 'react-native'
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/Input';
import { ArrowRight } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { useAuthContext } from '@/contexts/AppContext';
import AuthLayout from '@/components/auth-layout';
import ScreenHeader from '@/components/ScreenHeader';
import { maskCnpj } from '@/lib/mask';
import { RegisterProps } from '@/types/app-types';
import { router } from 'expo-router';

const Register = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const { signIn } = useAuthContext();

    const { control, handleSubmit, reset, formState: { errors } } = useForm<RegisterProps>({
        defaultValues: {
            cnpj: '',
            company: '',
            name: '',
            email: '',
            password: '',
            password_confirmation: ''
        },
    });

    const onSubmit: SubmitHandler<RegisterProps> = async (data: RegisterProps) => {
        try {
            setLoading(true);
            const registers = {
                cnpj: data.cnpj,
                company: data.company,
                name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                device_name: `${Platform.OS} ${Platform.Version}`
            };
            Keyboard.dismiss();
            await register(registers);
            reset();
            router.replace('/(tabs)/home');
        } catch (error) {
            console.log(error);
        } finally { () => setLoading(false) };
    }

    return (
        <AuthLayout logo={false}>
            <ScreenHeader title="Faça seu cadastro" subtitle="Utilize por 30 dias sem pagar nada" classTitle={'text-lg text-gray-600'} classSubtitle='text-lg text-gray-500' />
            <View className='px-4 rounded-t-3xl gap-4'>

                <View>
                    <Controller
                        control={control}
                        render={({
                            field: { onChange, onBlur, value }
                        }) => (
                            <View>
                                <Input
                                    label='Razão social'
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value && value.toLowerCase()}
                                    inputClasses={`${errors.company ? '!border-red-500' : ''}`}
                                />
                            </View>
                        )}
                        name='company'
                    />
                    {errors.company && (
                        <Text className='text-red-500'>{errors.company?.message}</Text>
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
                                    label='CNPJ'
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    inputClasses={`${errors.cnpj ? '!border-red-500' : ''}`}
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
                                    label='Nome'
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value && value.toLowerCase()}
                                    inputClasses={`${errors.name ? '!border-red-500' : ''}`}
                                />
                            </View>
                        )}
                        name='name'
                    />
                    {errors.name && (
                        <Text className='text-red-500'>{errors.name?.message}</Text>
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
                                    label='E-mail'
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value && value.toLowerCase()}
                                    inputClasses={`${errors.email ? '!border-red-500' : ''}`}
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
            <Button
                label="Login"
                variant='link'
                size='lg'
                onPress={() => { }}
                labelClasses='text-gray-500'
            />
        </AuthLayout>
    )
}

export default Register