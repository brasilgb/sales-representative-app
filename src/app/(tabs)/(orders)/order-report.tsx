import AppLoading from '@/components/app-loading';
import { Button } from '@/components/Button';
import { OrderProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from 'expo-router';
import { CalendarDaysIcon, EyeIcon, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { Badge } from '@/components/Badge';

const OrderReport = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [orders, setOrders] = useState<any>([]);
    const [orderData, setOrderData] = useState<any>([]);
    const [selectedOrder, setSelectedOrder] = useState<OrderProps | undefined>(undefined);

    const [date, setDate] = useState(new Date());
    const [mode, setMode] = useState('date');
    const [show, setShow] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setDate(new Date());
        }, [])
    );

    const onChange = (event: any, selectedDate: any) => {
        const currentDate = selectedDate;
        setShow(false);
        setDate(currentDate);
    };

    const showMode = (currentMode: any) => {
        setShow(true);
        setMode(currentMode);
    };

    const showDatepicker = () => {
        showMode('date');
    };

    useEffect(() => {
        const getOrders = async () => {
            setLoading(true);
            try {
                const response = await megbapi.post('/dateorders', {
                    date: moment(date).format('YYYY-MM-DD')
                });
                setOrders(response.data.orders);
                setSelectedOrder(response.data);
                setOrderData(response.data);
            } catch (error: any) {
                if (error.response?.status !== 401) {
                    console.log(error.response?.data || error.message);
                    Alert.alert('Erro', 'Não foi possível carregar os pedidos.');
                }
            } finally {
                setLoading(false)
            }
        }
        getOrders();
    }, [date]);

    const abreviationOptions = [
        { value: '1', label: "PR", variant: 'default' },
        { value: '2', label: "PG", variant: 'success' },
        { value: '3', label: "EN", variant: 'secondary' },
        { value: '4', label: "CA", variant: 'destructive' },
    ];

    const RenderOrders = ({ item }: { item: OrderProps }) => {
        const currentStatus = abreviationOptions.find(option => option.value === item?.status);
        return (
            <View className='flex-row items-center justify-between p-2 border-b border-gray-300'>
                <Text className='w-16'>{item?.order_number}</Text>
                <Text className='w-36'>{item?.customer?.name}</Text>
                <Text className='w-22'>{item?.total}</Text>
                <View className='w-20 flex-row items-center justify-end gap-2 pr-2'>
                    <Badge

                        variant={currentStatus?.variant as any}
                        label={currentStatus?.label || 'N/A'}
                    />

                    <Button
                        variant={'default'}
                        size={'sm'}
                        onPress={() => router.push({
                            pathname: '/view-order',
                            params: item as any
                        })}
                        label={<EyeIcon color={'white'} size={16} />}
                        labelClasses='my-2'
                    />
                </View>
            </View>
        )
    }

    return (
        <View className='flex-1 bg-primary'>
            <View className='rounded-t-3xl bg-white h-full p-2'>

                <View className='bg-primary rounded-t-3xl py-2'>

                    <View className='flex-row items-center justify-between px-4'>
                        <Text className='text-lg text-white'>Pedidos em {moment(date).format('DD/MM/YYYY')}</Text>
                        <Button
                            variant={'orange'}
                            size={'sm'}
                            onPress={showDatepicker}
                            label={<CalendarDaysIcon size={16} color={'white'} />} />
                    </View>

                    {show && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            maximumDate={new Date()}
                            mode={mode as any}
                            is24Hour={true}
                            onChange={onChange}
                            locale="pt"
                        />
                    )}

                </View>
                <View className='flex-row items-center justify-between py-2 px-1'>
                    <Text className='font-bold text-base'>Flex: <Text className='font-medium'>{orderData?.sumFlex}</Text></Text>
                    <Text className='font-bold text-base'>Desc.:<Text className='font-medium'>{orderData?.sumDiscount}</Text></Text>
                    <Text className='font-bold text-base'>Tot.: <Text className='font-medium'>{orderData?.sumTotal}</Text></Text>
                </View>
                <View className='flex-row items-center justify-between p-2 bg-gray-200'>
                    <Text className='w-16'>Ped.</Text>
                    <Text className='w-36'>Cliente</Text>
                    <Text className='w-22'>Total</Text>
                    <Text className='w-20'></Text>
                </View>

                <View className='flex-1 pb-24'>
                    <FlashList
                        data={orders}
                        renderItem={RenderOrders}
                        keyExtractor={(item) => item.order_number!.toString()}
                        keyboardShouldPersistTaps={'always'}
                        showsVerticalScrollIndicator={false}
                        refreshing={loading}
                    />
                </View>

            </View>
            <View>
                <KeyboardAvoidingView
                    behavior={'padding'}
                    keyboardVerticalOffset={0}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className='py-4 px-3 flex-row items-center justify-between border-t border-secundary bg-primary'>
                            <View className='flex-row items-center gap-2'>
                                <User color={'white'} size={24} />
                                <Text className='text-lg font-bold text-center text-white'>
                                    {selectedOrder ? 'Ver Pedido' : 'Adicionar Pedido'}
                                </Text>
                            </View>

                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>

            </View>
        </View>
    )
}

export default OrderReport