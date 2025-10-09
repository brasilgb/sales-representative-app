import { View, Text, ActivityIndicator, Keyboard, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Button } from '../Button'
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Input } from '../Input';
import megbapi from '@/utils/megbapi';
import { ProductProps } from '@/types/app-types';
import { Switch } from '../Switch';
import { maskMoney, maskMoneyDot, unMask } from '@/lib/mask';
import { router } from 'expo-router';

interface ProductFormProps {
    initialData?: ProductProps;
    onSuccess: () => void;
}

const ProductForm = ({ initialData, onSuccess }: ProductFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [disableInput, setDisableInput] = useState<any>(false);
    const { control, setValue, handleSubmit, reset, setError, formState: { errors } } = useForm<ProductProps>({
        defaultValues: initialData || {
            name: '',
            reference: '',
            description: '',
            unity: '',
            measure: '',
            price: '',
            quantity: '',
            min_quantity: '',
            enabled: true,
            observations: '',
        },
    } as any);

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
                enabled: true,
                observations: '',
            } as any);
        }
    }, [initialData, reset]);

    const referenceDataSelected = async (value:any) => {

        // let valueReference = e.target.value;

        try {
            const getPartsForPartNumber = await megbapi.get(`/auth/getproducts/${value}`)

            const { success, product } = getPartsForPartNumber.data;

            if (success && product) {
                setDisableInput(true)
                setValue('name', product.name);
                setValue('reference', product.reference);
                setValue('description', product.description);
                setValue('unity', product.unity);
                setValue('measure', product.measure);
                setValue('price', product.price);
                setValue('quantity', '0');
                setValue('min_quantity', product.min_quantity);
                setValue('enabled', product.enabled);
                setValue('observations', product.observations);
            } else {
                setDisableInput(false)
                // reset(
                //   'name',
                //   'reference',
                //   'description',
                //   'unity',
                //   'measure',
                //   'price',
                //   'quantity',
                //   'min_quantity',
                //   'enabled',
                //   'observations',
                // )
                setValue('price', '0');
            }

        } catch (error: any) {
            console.log(error.response?.data);
        }
    }

    const onSubmit: SubmitHandler<ProductProps> = async (data) => {
        setIsSubmitting(true);

        setValue('price', maskMoneyDot(data.price));
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
            console.log(error.response?.data);
            if (error.response.status === 401) {
                router.replace('/(auth)/sign-in');
            }
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
                                label='Referência'
                                onBlur={() => referenceDataSelected(value)}
                                onChangeText={onChange}
                                value={(value)}
                                inputClasses={`${errors.reference ? '!border-red-500' : ''}`}
                                readOnly={!!initialData}
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
                                label='Nome do produto'
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
                                value={String(value)}
                                inputClasses={`${errors.unity ? '!border-red-500' : ''}`}
                                readOnly={!!initialData}
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
                                value={String(value)}
                                inputClasses={`${errors.measure ? '!border-red-500' : ''}`}
                                readOnly={!!initialData}
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
                                value={maskMoney(value)}
                                inputClasses={`${errors.price ? '!border-red-500' : ''}`}
                                keyboardType='numeric'
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
                                value={String(value)}
                                inputClasses={`${errors.quantity ? '!border-red-500' : ''}`}
                                keyboardType='numeric'
                                readOnly={!!initialData}
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
                                value={String(value)}
                                inputClasses={`${errors.min_quantity ? '!border-red-500' : ''}`}
                                keyboardType='numeric'
                                readOnly={!!initialData}
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
                            <Switch
                                label="Habilitar produto"
                                onValueChange={onChange}
                                value={Boolean(value)}
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