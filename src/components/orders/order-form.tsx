import { CustomerProps, OrderItem, ProductProps } from '@/types/app-types';
import React, { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../Button';
import { Card, CardTitle } from '../Card';
import { Input } from '../Input';
import CustomerSelector from './customer-selector';
import { OrderSummary } from './order-summary';
import ProductSelector from './product-selector';
import { BoxIcon, UserIcon, DollarSignIcon } from 'lucide-react-native';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import { maskMoney, maskMoneyDot } from '@/lib/mask';

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

  const handleCustomerSelect = (customer: CustomerProps) => {
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
      const productPrice = Number(selectedProduct.price);

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

    const total = orderItems.reduce((sum, item) => sum + item.total, 0);
    const finalTotal = total - parseFloat(discount || '0');

    const data = {
      customer_id: selectedCustomer.id,
      flex: maskMoneyDot(flex),
      discount: maskMoneyDot(discount),
      total: finalTotal.toFixed(2),
      items: orderItems
    };

    try {
      await megbapi.post('/orders', data);
      Alert.alert('Sucesso', 'Pedido enviado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.push('/')
        }
      ]);
      // Clear form
      setSelectedCustomer(null);
      setOrderItems([]);
      setFlex('');
      setDiscount('');
    } catch (error: any) {
      console.error(error.response.data);
      Alert.alert('Erro', 'Não foi possível enviar o pedido. Tente novamente.');
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
    <View className='bg-primary'>
      <KeyboardAvoidingView
        behavior={'padding'}
        keyboardVerticalOffset={30}
        className="bg-primary"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }}
          className='bg-white px-2 py-4 rounded-t-3xl'
        >
          <Card className="mb-4 border-b border-gray-400">
            <CardTitle className="flex-row items-center gap-2 text-xl font-bold mb-2 border-b border-gray-400 p-2"><UserIcon size={22} /> Cliente</CardTitle>
            <View className='p-2'>
              {selectedCustomer ? (
                <TouchableOpacity onPress={() => setCustomerModalVisible(true)}>
                  <View>
                    <Text className='font-bold text-lg'>{selectedCustomer.name}</Text>
                    <Text className='text-sm text-gray-500'>{selectedCustomer.cnpj}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Button variant={'default'} labelClasses='text-white' label="Selecionar Cliente" onPress={() => setCustomerModalVisible(true)} />
              )}
            </View>
          </Card>

          <CustomerSelector
            visible={customerModalVisible}
            onClose={() => setCustomerModalVisible(false)}
            onCustomerSelect={handleCustomerSelect}
          />

          <Card className="mb-4 border-b border-gray-400">
            <CardTitle className="flex-row items-center gap-2 text-xl font-bold mb-2 border-b border-gray-400 p-2"><BoxIcon size={22} /> Adicionar produto</CardTitle>
            <View className='flex-col gap-4 p-2'>
              {selectedProduct ? (
                <TouchableOpacity onPress={() => setProductModalVisible(true)}>
                  <View>
                    <Text className='font-bold text-lg'>{selectedProduct.name}</Text>
                    <Text className='text-sm text-gray-500'>{selectedProduct.reference}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Button variant={'default'} labelClasses='text-white' label="Selecionar Produto" onPress={() => setProductModalVisible(true)} />
              )}
              <Input inputClasses='border border-gray-300' label="" placeholder='Quantidade' keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              <Button variant={'secondary'} labelClasses='text-white' label="Adicionar ao Pedido" onPress={handleAddItem} />
            </View>
          </Card>

          <ProductSelector
            visible={productModalVisible}
            onClose={() => setProductModalVisible(false)}
            onProductSelect={handleProductSelect}
          />

          <OrderSummary items={orderItems} onRemoveItem={handleRemoveItem} />

          <Card className="mb-4 border-b border-gray-400">
            <CardTitle className="flex-row items-center gap-2 text-xl font-bold mb-2 border-b border-gray-400 p-2">
              <DollarSignIcon size={20} /> Financeiro</CardTitle>
            <View className='flex-row gap-4 p-2'>
              <Input className='flex-1' inputClasses='bg-gray-200 border border-gray-200' label="Flex Disponível" placeholder='0,00' value={maskMoney(flexValue)} onChangeText={setFlex} readOnly />
              <Input className='flex-1' inputClasses='border border-gray-200' label="Flex" placeholder='0,00' value={maskMoney(flex)} onChangeText={setFlex} />
              <Input className='flex-1' inputClasses='border border-gray-200' label="Desconto" placeholder='0,00' keyboardType="numeric" value={maskMoney(discount)} onChangeText={setDiscount} />
            </View>
          </Card>

          <Button variant={'terciary'} size={'lg'} label="Finalizar Pedido" onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

export default OrderForm