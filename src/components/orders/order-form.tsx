import { maskMoney, maskMoneyDot } from '@/lib/mask';
import { CustomerProps, OrderItem, ProductProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import { BoxIcon, DollarSignIcon, UserIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../Button';
import { Card } from '../Card';
import { Input } from '../Input';
import CustomerSelector from './customer-selector';
import { OrderSummary } from './order-summary';
import ProductSelector from './product-selector';

const OrderForm = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProps | null>(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductProps | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [quantity, setQuantity] = useState('');

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [flex, setFlex] = useState('');
  const [flexValue, setFlexValue] = useState('');
  const [discount, setDiscount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCustomerSelect = (customer: CustomerProps) => {
    if (selectedCustomer?.id !== customer.id) {
      setOrderItems([]);
      setSelectedProduct(null);
    }
    setSelectedCustomer(customer);
    setCustomerModalVisible(false);
  };

  const handleProductSelect = (product: ProductProps) => {
    setSelectedProduct(product);
    setProductModalVisible(false);
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      Alert.alert('Erro', 'Selecione um produto.');
      return;
    }
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      Alert.alert('Erro', 'Insira uma quantidade válida.');
      return;
    }

    setOrderItems(prevItems => {
      const existingItem = prevItems.find(item => item.product_id === Number(selectedProduct.id));
      const adjustment = Number(selectedCustomer?.commercial_condition?.price_adjustment_percentage ?? 0);
      const productPrice = Math.round(Number(selectedProduct.price) * (1 + adjustment / 100) * 100) / 100;

      if (existingItem) {
        return prevItems.map(item =>
          item.product_id === Number(selectedProduct.id)
            ? {
              ...item,
              quantity: item.quantity + numQuantity,
              total: (item.quantity + numQuantity) * item.price
            }
            : item
        );
      } else {
        const newItem: OrderItem = {
          product_id: Number(selectedProduct.id),
          name: selectedProduct.name,
          price: productPrice,
          quantity: numQuantity,
          total: numQuantity * productPrice,
        };
        return [...prevItems, newItem];
      }
    });

    setSelectedProduct(null);
    setQuantity('');
  };

  const handleRemoveItem = (productId: number) => {
    setOrderItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Alert.alert('Erro de Validação', 'Por favor, selecione um cliente.');
      return;
    }

    if (orderItems.length === 0) {
      Alert.alert('Erro de Validação', 'O pedido deve ter pelo menos um item.');
      return;
    }

    const data = {
      customer_id: selectedCustomer.id,
      flex: maskMoneyDot(flex),
      discount: maskMoneyDot(discount),
      items: orderItems
    };

    setSubmitting(true);
    try {
      await megbapi.post('/orders', data);
      Alert.alert('Sucesso', 'Pedido enviado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/orders')
        }
      ]);
      // Clear form
      setSelectedCustomer(null);
      setOrderItems([]);
      setFlex('');
      setDiscount('');
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.replace('/');
      } else {
        Alert.alert('Erro', error.response?.data?.message || 'Não foi possível enviar o pedido. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const getFlexValue = async () => {
        try {
          const response = await megbapi.get('/flex');
          setFlexValue(response.data.value);
        } catch (error) {
          console.error('Erro ao buscar valor do flex:', error);
        }
      };
      getFlexValue();
    }, [])
  );

  return (
    <View className='flex-1 bg-[#0b1220]'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={30}
        className="flex-1 bg-[#0b1220]"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }}
          className='bg-[#0b1220] px-3 py-4'
        >
          <Card className="mb-4 border-white/10 p-2">
            <SectionTitle icon={<UserIcon color="#22b8f0" size={21} />} title="Cliente" />
            <View className='p-2'>
              {selectedCustomer ? (
                <TouchableOpacity onPress={() => setCustomerModalVisible(true)}>
                  <View>
                    <Text className='font-bold text-lg text-[#f7f8fa]'>{selectedCustomer.name}</Text>
                    <Text className='text-sm text-[#a8b3c7]'>{selectedCustomer.cnpj}</Text>
                    {selectedCustomer.commercial_condition ? <Text className='text-sm text-[#22b8f0] mt-1'>{selectedCustomer.commercial_condition.name}{selectedCustomer.commercial_condition.payment_terms ? ` • ${selectedCustomer.commercial_condition.payment_terms}` : ''}</Text> : null}
                  </View>
                </TouchableOpacity>
              ) : (
                <Button variant={'default'} label="Selecionar cliente" onPress={() => setCustomerModalVisible(true)} />
              )}
            </View>
          </Card>

          <CustomerSelector
            visible={customerModalVisible}
            onClose={() => setCustomerModalVisible(false)}
            onCustomerSelect={handleCustomerSelect}
          />

          <Card className="mb-4 border-white/10 p-2">
            <SectionTitle icon={<BoxIcon color="#ffbd66" size={21} />} title="Adicionar produto" />
            <View className='flex-col gap-4 p-2'>
              {selectedProduct ? (
                <TouchableOpacity onPress={() => setProductModalVisible(true)}>
                  <View>
                    <Text className='font-bold text-lg text-[#f7f8fa]'>{selectedProduct.name}</Text>
                    <Text className='text-sm text-[#a8b3c7]'>{selectedProduct.reference}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Button variant={'default'} label="Selecionar produto" onPress={() => setProductModalVisible(true)} />
              )}
              <Input inputClasses='border border-gray-300' label="" placeholder='Quantidade' keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              <Button variant={'secondary'} labelClasses='text-white' label="Adicionar ao pedido" onPress={handleAddItem} />
            </View>
          </Card>

          <ProductSelector
            visible={productModalVisible}
            onClose={() => setProductModalVisible(false)}
            onProductSelect={handleProductSelect}
          />

          <OrderSummary items={orderItems} onRemoveItem={handleRemoveItem} />

          <Card className="mb-4 border-white/10 p-2">
            <SectionTitle icon={<DollarSignIcon color="#2ed3a0" size={20} />} title="Financeiro" />
            <View className='gap-3 p-2'>
              <Input inputClasses='opacity-70' label="Flex disponível" placeholder='0,00' value={maskMoney(flexValue)} readOnly />
              <View className="flex-row gap-3">
                <Input className='min-w-0 flex-1' label="Usar flex" placeholder='0,00' keyboardType="numeric" value={maskMoney(flex)} onChangeText={setFlex} />
                <Input className='min-w-0 flex-1' label="Desconto" placeholder='0,00' keyboardType="numeric" value={maskMoney(discount)} onChangeText={setDiscount} />
              </View>
            </View>
          </Card>

          <Button disabled={submitting} variant={'default'} size={'lg'} label={submitting ? 'Enviando pedido...' : 'Finalizar pedido'} onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

export default OrderForm

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View className="mb-2 flex-row items-center gap-2 border-b border-white/10 p-2 pb-3">
      {icon}
      <Text className="text-base font-bold text-[#f7f8fa]">{title}</Text>
    </View>
  );
}
