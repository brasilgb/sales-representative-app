import React, { useState } from 'react'
import { View, Text, ActivityIndicator, Keyboard } from 'react-native'
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { SignInFormType, signInSchema } from '@/schema/app';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/Input';
import { ArrowRight } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { useAuthContext } from '@/contexts/AppContext';
import AuthLayout from '@/components/auth-layout';
import ScreenHeader from '@/components/ScreenHeader';
import { maskCnpj } from '@/lib/mask';

const Register = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const { signIn } = useAuthContext();

    const { control, handleSubmit, reset, formState: { errors } } = useForm<SignInFormType>({
        defaultValues: {
            cnpj: '',
            password: ''
        },
        resolver: zodResolver(signInSchema)
    });

    const onSubmit: SubmitHandler<SignInFormType> = async (data: SignInFormType) => {
        setLoading(true);
        try {
            let { cnpj }: any = data;
            Keyboard.dismiss();
            await signIn(cnpj);
            reset();
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout>
            <ScreenHeader title="Acessar conta" subtitle="Digite seu cpf/cnpj para acessar sua conta" classTitle={'text-lg text-gray-600'} classSubtitle='text-lg text-gray-500' />
            <View className='px-4 rounded-t-3xl'>

                    <View>
                      <Controller
                        control={control}
                        render={({
                            field: { onChange, onBlur, value }
                        }) => (
                            <View>
                                <Input
                                    label=''
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={maskCnpj(value)}
                                    keyboardType='numeric'
                                    inputClasses={`${errors.cnpj ? '!border-solar-red-primary' : ''}`}
                                    maxLength={14}
                                />
                            </View>
                        )}
                        name='cnpj'
                    />
                    {errors.cnpj && (
                        <Text className='text-solar-red-primary'>{errors.cnpj?.message}</Text>
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
                                    label=''
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    keyboardType='default'
                                    inputClasses={`${errors.password ? '!border-solar-red-primary' : ''}`}
                                    maxLength={14}
                                />
                            </View>
                        )}
                        name='password'
                    />
                    {errors.password && (
                        <Text className='text-solar-red-primary'>{errors.password?.message}</Text>
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
                                    label=''
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    keyboardType='default'
                                    inputClasses={`${errors.confirmPassword ? '!border-solar-red-primary' : ''}`}
                                    maxLength={14}
                                />
                            </View>
                        )}
                        name='confirmPassword'
                    />
                    {errors.confirmPassword && (
                        <Text className='text-solar-red-primary'>{errors.confirmPassword?.message}</Text>
                    )}
                    </View>

                    <Button
                        label={loading ? <ActivityIndicator size="small" color="#bccf00" /> : <ArrowRight />}
                        variant={'link'}
                        size="default"
                        onPress={handleSubmit(onSubmit)}
                        className={`absolute right-1 top-1 border border-gray-400 rounded-full ${loading ? 'pt-3' : 'pt-2'} items-center justify-center`}
                    />
            </View>

        </AuthLayout>
    )
}

export default Register