import { View, Text, ActivityIndicator, Keyboard, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Button } from '../Button'
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Input } from '../Input';
import megbapi from '@/utils/megbapi';
import { ProductProps } from '@/types/app-types';

interface ProductFormProps {
    initialData?: ProductProps;
    onSuccess: () => void;
}

const ProductForm = ({ initialData, onSuccess }: ProductFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const { control, handleSubmit, reset, setError, formState: { errors } } = useForm<ProductProps>({
        defaultValues: initialData || {
            name: '',
            reference: '',
            description: '',
            unity: '',
            measure: '',
            price: '',
            quantity: '',
            min_quantity: '',
            enabled: '',
            observations: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({
                name: '',
                reference: '',
                description: '',
                unity: '',
                measure: '',
                price: '',
                quantity: '',
                min_quantity: '',
                enabled: '',
                observations: '',
            });
        }
    }, [initialData, reset]);

    const onSubmit: SubmitHandler<ProductProps> = async (data) => {
        setIsSubmitting(true);

        try {
            if (data.id) {
                // Se tem ID, atualiza (PUT)
                await megbapi.patch(`/products/${data.id}`, data);
            } else {
                // Se não tem ID, cria (POST)
                await megbapi.post('/products', data);
            }

            Alert.alert('Sucesso!', `Produto ${data.id ? 'atualizado' : 'cadastrado'} com sucesso.`);

            Keyboard.dismiss();
            onSuccess(); // Notify parent to close modal and refresh list
        } catch (error: any) {
            for (const field in error.response?.data?.errors) {
                setError(field as keyof ProductProps, { type: 'server', message: error.response?.data?.errors[field][0] });
            }
            console.log(error.response?.data?.errors || error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <View className='px-4 pb-24 gap-4 bg-white'>
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
                                inputClasses={`${errors.reference ? '!border-red-500' : ''}`}
                                maxLength={14}
                            />
                        </View>
                    )}
                    name='reference'
                />
                {errors.reference && (
                    <Text className='text-red-500'>{errors.reference?.message}</Text>
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
                                label='Descrição'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.description ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='description'
                />
                {errors.description && (
                    <Text className='text-red-500'>{errors.description?.message}</Text>
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
                                label='Unidade de medida'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.unity ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='unity'
                />
                {errors.unity && (
                    <Text className='text-red-500'>{errors.unity?.message}</Text>
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
                                label='Medida do produto'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.measure ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='measure'
                />
                {errors.measure && (
                    <Text className='text-red-500'>{errors.measure?.message}</Text>
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
                                label='Preço'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.price ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='price'
                />
                {errors.price && (
                    <Text className='text-red-500'>{errors.price?.message}</Text>
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
                                label='Quantidade'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.quantity ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='quantity'
                />
                {errors.quantity && (
                    <Text className='text-red-500'>{errors.quantity?.message}</Text>
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
                                label='Quantidade mínima'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.min_quantity ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='min_quantity'
                />
                {errors.min_quantity && (
                    <Text className='text-red-500'>{errors.min_quantity?.message}</Text>
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
                                label='Habiitado'
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.enabled ? '!border-red-500' : ''}`}
                            />
                        </View>
                    )}
                    name='enabled'
                />
                {errors.enabled && (
                    <Text className='text-red-500'>{errors.enabled?.message}</Text>
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
                    label={isSubmitting ? <ActivityIndicator size="small" color="#bccf00" /> : (initialData ? 'Salvar Alterações' : 'Cadastrar Produto')}
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

export default ProductForm