import { View, Text, ActivityIndicator, Keyboard, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Button } from '../Button'
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Input } from '../Input';
import { CustomerFormType, customerSchema } from '@/schema/app';
import megbapi from '@/utils/megbapi';

interface CustomerFormProps {
    initialData?: CustomerFormType;
    onSuccess: () => void;
}

const CustomerForm = ({ initialData, onSuccess }: CustomerFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormType>({
        resolver: zodResolver(customerSchema),
        defaultValues: initialData || {
            cnpj: '',
            name: '',
            email: '',
            phone: '',
            zip_code: '',
            state: '',
            city: '',
            district: '',
            street: '',
            complement: '',
            number: '',
            whatsapp: '',
            observations: ''
        },
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({
                cnpj: '',
                name: '',
                email: '',
                phone: '',
                zip_code: '',
                state: '',
                city: '',
                district: '',
                street: '',
                complement: '',
                number: '',
                whatsapp: '',
                observations: ''
            });
        }
    }, [initialData, reset]);

    const onSubmit: SubmitHandler<CustomerFormType> = async (data: CustomerFormType) => {
        setIsSubmitting(true);
        try {
            // The data object includes the id if it's an edit
            await megbapi.post('/customers', data);

            Alert.alert('Sucesso!', `Cliente ${initialData ? 'atualizado' : 'cadastrado'} com sucesso.`);
            
            Keyboard.dismiss();
            onSuccess(); // Notify parent to close modal and refresh list
        } catch (error: any) {
            console.log(error.response?.data || error.message);
            Alert.alert('Erro', 'Não foi possível salvar o cliente. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <View className='px-4 rounded-t-3xl pb-24 gap-4'>

            <View className='mt-4'>
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
                                value={(value)}
                                inputClasses={`${errors.cnpj ? '!border-red-500' : ''}`}
                                maxLength={14}
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
                                value={(value)}
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
                                value={(value)}
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
                                label='CEP'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.zip_code ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='zip_code'
                />
                {errors.zip_code && (
                    <Text className='text-red-500'>{errors.zip_code?.message}</Text>
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
                                label='Estado'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.state ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='state'
                />
                {errors.state && (
                    <Text className='text-red-500'>{errors.state?.message}</Text>
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
                                label='Cidade'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.city ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='city'
                />
                {errors.city && (
                    <Text className='text-red-500'>{errors.city?.message}</Text>
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
                                label='Bairro'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.district ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='district'
                />
                {errors.district && (
                    <Text className='text-red-500'>{errors.district?.message}</Text>
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
                                label='Logradouro'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.street ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='street'
                />
                {errors.street && (
                    <Text className='text-red-500'>{errors.street?.message}</Text>
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
                                label='Complemento'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.complement ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='complement'
                />
                {errors.complement && (
                    <Text className='text-red-500'>{errors.complement?.message}</Text>
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
                                label='Número'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.number ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='number'
                />
                {errors.number && (
                    <Text className='text-red-500'>{errors.number?.message}</Text>
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
                                label='Whatsapp'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.whatsapp ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='whatsapp'
                />
                {errors.whatsapp && (
                    <Text className='text-red-500'>{errors.whatsapp?.message}</Text>
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
                                label='Observações'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.observations ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='observations'
                />
                {errors.observations && (
                    <Text className='text-red-500'>{errors.observations?.message}</Text>
                )}
            </View>

            <View className='mt-4'>
                <Button
                    label={isSubmitting ? <ActivityIndicator size="small" color="#bccf00" /> : (initialData ? 'Salvar Alterações' : 'Cadastrar Cliente')}
                    variant={'default'}
                    size="lg"
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    labelClasses='text-white'
                />
            </View>
        </View>
    )
}

export default CustomerForm