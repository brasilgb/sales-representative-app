
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Dialog, DialogContent, DialogTrigger } from '../Dialog';
import { Badge } from '../Badge';
import megbapi from '@/utils/megbapi';
import { Button } from '../Button';
import { router } from 'expo-router';

interface OrderStatusModalProps {
    id: string;
    status: string;
    onStatusChange: (newStatus: string) => void;
}

const statusOptions = [
    { value: '1', label: "Pedido realizado", variant: 'default' },
    { value: '2', label: "Pago", variant: 'success' },
    { value: '3', label: "Entregue", variant: 'secondary' },
    { value: '4', label: "Cancelado", variant: 'destructive' },
];

const abreviationOptions = [
    { value: '1', label: "PR", variant: 'default' },
    { value: '2', label: "PG", variant: 'success' },
    { value: '3', label: "EN", variant: 'secondary' },
    { value: '4', label: "CA", variant: 'destructive' },
];

export function OrderStatusModal({ id, status, onStatusChange }: OrderStatusModalProps) {
    const [open, setOpen] = useState(false);
    const currentStatus = abreviationOptions.find(option => option.value === status);

    const handleStatusChange = async (newStatus: string) => {
        try {
            await megbapi.patch(`${newStatus === '4' ? 'cancelorderapp' : 'statusorderapp'}/${id}`, {
                status: newStatus,
            });
            onStatusChange(newStatus);
        } catch (error: any) {
            if (error.response?.status === 401) {
                router.replace('/(auth)/sign-in');
            } else {
                console.log(error.response?.data || error.message);
                Alert.alert('Erro', 'Não foi possível carregar os clientes.');
            }
        } finally {
            setOpen(false); // Fecha o modal após a tentativa de alteração
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button
                    size={'sm'}
                    variant={currentStatus?.variant as any}
                    label={currentStatus?.label || 'N/A'}
                />
            </DialogTrigger>
            <DialogContent>
                <View className="p-4 bg-white rounded-lg">
                    <Text className="text-xl font-bold mb-4 pb-2 border-b border-gray-400 text-gray-500">Alterar Status do Pedido</Text>
                    {statusOptions.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            className="p-2 my-1 rounded"
                            onPress={() => handleStatusChange(option.value)}
                        >
                            <Badge
                                variant={option.variant as any}
                                label={option.label}
                                className='p-4'
                                labelClasses='text-lg'
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </DialogContent>
        </Dialog>
    );
}
