import { maskMoneyDot } from '@/lib/mask';
import { CustomerProps, OrderItem, ProductProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import { BoxIcon, DollarSignIcon, UserIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../Button';
import { Card } from '../Card';
import { Input } from '../Input';
import CustomerSelector from './customer-selector';
import { OrderSummary } from './order-summary';
import ProductSelector from './product-selector';

const OrderForm = ({ orderId }: { orderId?: string }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProps | null>(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<ProductProps | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [quantity, setQuantity] = useState('');

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [flexValue, setFlexValue] = useState('');
  const [total, setTotal] = useState('');
  const [discount, setDiscount] = useState('');
  const [totalWasEdited, setTotalWasEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(Boolean(orderId));
  const skipNextTotalReset = useRef(false);

  const subtotal = useMemo(() => orderItems.reduce((sum, item) => sum + Number(item.total ?? item.price * item.quantity), 0), [orderItems]);
  const finalTotal = Number(maskMoneyDot(total) ?? 0);
  const manualDiscount = Number(maskMoneyDot(discount) ?? 0);
  const generatedFlex = Math.max(finalTotal - subtotal, 0);
  const usedFlex = Math.max(subtotal - finalTotal, 0);
  const payableTotal = Math.max(finalTotal - manualDiscount, 0);
  const resultingFlex = Number(flexValue || 0) + generatedFlex - usedFlex - manualDiscount;
  const availableCampaigns = campaigns.filter(campaign =>
    campaign.commercial_condition && (campaign.audience_type === 'all' || Number(campaign.region_id) === Number(selectedCustomer?.region_id))
  );
  const selectedCondition = selectedCampaign?.commercial_condition ?? selectedCustomer?.commercial_condition ?? null;
  const minimumOrderAmount = Number(selectedCondition?.minimum_order_amount ?? 0);
  const minimumOrderQuantity = Number(selectedCampaign?.commercial_condition?.minimum_order_quantity ?? 0);
  const campaignProductIds = new Set((selectedCampaign?.products ?? []).map((product: any) => Number(product.id)));
  const campaignQuantity = orderItems.reduce((sum, item) => sum + (campaignProductIds.has(Number(item.product_id)) ? Number(item.quantity) : 0), 0);

  useEffect(() => {
    if (skipNextTotalReset.current) {
      skipNextTotalReset.current = false;
      return;
    }
    setTotal(String(Math.round(subtotal * 100)));
    setTotalWasEdited(false);
  }, [subtotal]);

  const handleCustomerSelect = (customer: CustomerProps) => {
    if (selectedCustomer?.id !== customer.id) {
      setOrderItems([]);
      setSelectedProduct(null);
      setSelectedCampaign(null);
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
      const isCampaignProduct = selectedCampaign?.products?.some((product: any) => Number(product.id) === Number(selectedProduct.id));
      const priceCondition = isCampaignProduct ? selectedCampaign?.commercial_condition : selectedCustomer?.commercial_condition;
      const adjustment = isCampaignProduct
        ? -Number(priceCondition?.max_discount_percentage ?? 0)
        : Number(priceCondition?.price_adjustment_percentage ?? 0);
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

    if (resultingFlex < 0) {
      Alert.alert('Flex insuficiente', 'O total informado consome mais flex do que o saldo disponível.');
      return;
    }

    if (manualDiscount > finalTotal) {
      Alert.alert('Desconto inválido', 'O desconto não pode ser maior que o total ajustado.');
      return;
    }

    if (selectedCampaign && campaignQuantity < minimumOrderQuantity) {
      Alert.alert('Quantidade mínima não atingida', `A campanha exige no mínimo ${minimumOrderQuantity} unidade(s). Faltam ${minimumOrderQuantity - campaignQuantity}.`);
      return;
    }

    if (!selectedCampaign && payableTotal < minimumOrderAmount) {
      Alert.alert(
        'Pedido mínimo não atingido',
        `O valor mínimo para ${selectedCampaign ? `a campanha ${selectedCampaign.name}` : 'esta condição comercial'} é ${formatCurrency(minimumOrderAmount)}.`,
      );
      return;
    }

    const data = {
      customer_id: selectedCustomer.id,
      campaign_id: selectedCampaign?.id ?? null,
      adjusted_total: maskMoneyDot(total),
      total_was_edited: totalWasEdited,
      discount: maskMoneyDot(discount),
      payment_condition: selectedCampaign?.commercial_condition?.payment_terms ?? selectedCustomer.commercial_condition?.payment_terms,
      items: orderItems.map(({ product_id, quantity }) => ({ product_id, quantity })),
    };

    setSubmitting(true);
    try {
      if (orderId) await megbapi.put(`/orders/${orderId}`, data);
      else await megbapi.post('/orders', totalWasEdited ? { ...data, total: data.adjusted_total } : data);
      Alert.alert('Sucesso', `Pedido ${orderId ? 'atualizado' : 'enviado'} com sucesso!`, [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/orders')
        }
      ]);
      // Clear form
      setSelectedCustomer(null);
      setOrderItems([]);
      setTotal('');
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
        if (orderId) return;
        try {
          const response = await megbapi.get('/flex');
          setFlexValue(response.data.value);
        } catch (error) {
          console.error('Erro ao buscar valor do flex:', error);
        }
      };
      getFlexValue();
    }, [orderId])
  );

  useFocusEffect(
    useCallback(() => {
      if (orderId) return;
      const loadCampaigns = async () => {
        try {
          const response = await megbapi.get('/alldata');
          setCampaigns(response.data?.data?.campaigns ?? []);
        } catch (error) {
          console.error('Erro ao buscar campanhas:', error);
        }
      };
      void loadCampaigns();
    }, [orderId])
  );

  useEffect(() => {
    if (!orderId) return;
    const loadOrder = async () => {
      try {
        const [{ data: details }, { data: customers }] = await Promise.all([
          megbapi.get(`/orders/${orderId}`),
          megbapi.get('/customers'),
        ]);
        const order = details.order;
        const customer = customers.find((candidate: CustomerProps) => Number(candidate.id) === Number(order.customer_id));
        setSelectedCustomer(customer ?? order.customer);
        skipNextTotalReset.current = true;
        setOrderItems((order.order_items ?? details.orderitems).map((item: any) => ({
          product_id: Number(item.product_id), name: item.name, quantity: Number(item.quantity),
          price: Number(item.price), total: Number(item.total ?? Number(item.price) * Number(item.quantity)),
        })));
        setTotal(String(Math.round(Number(order.adjusted_total ?? order.total) * 100)));
        setDiscount(String(Math.round(Math.max(Number(order.adjusted_total ?? order.total) - Number(order.total), 0) * 100)));
        setFlexValue(String(Number(details.flex ?? 0) - Number(order.flex ?? 0) + Number(order.discount ?? 0)));
      } catch (error: any) {
        Alert.alert('Erro', error.response?.data?.message || 'Não foi possível carregar o pedido.');
        router.back();
      } finally {
        setLoadingOrder(false);
      }
    };
    void loadOrder();
  }, [orderId]);

  if (loadingOrder) return <View className="flex-1 items-center justify-center bg-[#0b1220]"><Text className="text-[#a8b3c7]">Carregando pedido...</Text></View>;

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

          {selectedCustomer && availableCampaigns.length > 0 && !orderId ? (
            <Card className="mb-4 border-white/10 p-2">
              <SectionTitle icon={<DollarSignIcon color="#2ed3a0" size={20} />} title="Campanha" />
              <View className="gap-2 p-2">
                <TouchableOpacity onPress={() => { setSelectedCampaign(null); setOrderItems([]); }} className={`rounded-xl border p-3 ${!selectedCampaign ? 'border-[#22b8f0] bg-[#22b8f0]/10' : 'border-white/10'}`}>
                  <Text className="font-bold text-[#f7f8fa]">Sem campanha</Text>
                </TouchableOpacity>
                {availableCampaigns.map(campaign => (
                  <TouchableOpacity key={campaign.id} onPress={() => { setSelectedCampaign(campaign); setOrderItems([]); }} className={`rounded-xl border p-3 ${selectedCampaign?.id === campaign.id ? 'border-[#22b8f0] bg-[#22b8f0]/10' : 'border-white/10'}`}>
                    <Text className="font-bold text-[#f7f8fa]">{campaign.name}</Text>
                    <Text className="mt-1 text-xs text-[#a8b3c7]">{campaign.products_count} produto(s) com valores da campanha</Text>
                    {Number(campaign.commercial_condition?.minimum_order_quantity ?? 0) > 0 ? <Text className="mt-1 text-xs font-bold text-[#ffbd66]">Quantidade mínima: {campaign.commercial_condition.minimum_order_quantity} unidade(s)</Text> : null}
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          ) : null}

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
              <View className="flex-row gap-3">
                <Input className='min-w-0 flex-1' inputClasses='opacity-70' label="Subtotal" value={formatCurrency(subtotal)} readOnly />
                <Input className='min-w-0 flex-1' label="Total ajustado" placeholder='R$ 0,00' keyboardType="numeric" value={formatCurrencyFromDigits(total)} onChangeText={(value) => { setTotal(value.replace(/\D/g, '')); setTotalWasEdited(true); }} />
              </View>
              <Input label="Desconto manual" placeholder='R$ 0,00' keyboardType="numeric" value={formatCurrencyFromDigits(discount)} onChangeText={(value) => setDiscount(value.replace(/\D/g, ''))} />
              <View className="rounded-xl border border-white/10 bg-[#16233a] p-3">
                <View className="flex-row justify-between"><Text className="text-xs text-[#a8b3c7]">Flex disponível</Text><Text className="text-sm font-black text-[#f7f8fa]">{formatCurrency(Number(flexValue || 0))}</Text></View>
                <View className="mt-2 flex-row justify-between"><Text className="text-xs text-[#a8b3c7]">{generatedFlex > 0 ? 'Flex gerado' : 'Flex utilizado'}</Text><Text className={generatedFlex > 0 ? 'text-sm font-black text-[#2ed3a0]' : 'text-sm font-black text-[#ffbd66]'}>{formatCurrency(generatedFlex || usedFlex)}</Text></View>
                <View className="mt-2 flex-row justify-between"><Text className="text-xs text-[#a8b3c7]">Desconto</Text><Text className="text-sm font-black text-[#ffbd66]">− {formatCurrency(manualDiscount)}</Text></View>
                <View className="mt-2 flex-row justify-between border-t border-white/10 pt-2"><Text className="text-xs font-bold text-[#a8b3c7]">Saldo após pedido</Text><Text className={resultingFlex >= 0 ? 'text-sm font-black text-[#22b8f0]' : 'text-sm font-black text-[#f97066]'}>{formatCurrency(resultingFlex)}</Text></View>
              </View>
              <View className="flex-row items-center justify-between rounded-xl border border-[#2ed3a0]/30 bg-[#2ed3a0]/10 p-3"><Text className="text-sm font-bold text-[#a8b3c7]">Total do pedido</Text><Text className="text-lg font-black text-[#2ed3a0]">{formatCurrency(payableTotal)}</Text></View>
              {resultingFlex < 0 ? <Text className="text-xs font-bold text-[#f97066]">O total informado consome mais flex do que o saldo disponível.</Text> : null}
              {selectedCampaign && campaignQuantity < minimumOrderQuantity ? <Text className="text-xs font-bold text-[#f97066]">Quantidade mínima: {minimumOrderQuantity} unidade(s). Faltam {minimumOrderQuantity - campaignQuantity}.</Text> : null}
              {!selectedCampaign && payableTotal < minimumOrderAmount ? <Text className="text-xs font-bold text-[#f97066]">Pedido mínimo: {formatCurrency(minimumOrderAmount)}.</Text> : null}
            </View>
          </Card>

          <Button disabled={submitting} variant={'default'} size={'lg'} label={submitting ? 'Salvando pedido...' : orderId ? 'Salvar alterações' : 'Finalizar pedido'} onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCurrencyFromDigits(value: string) {
  return formatCurrency(Number(value.replace(/\D/g, '') || 0) / 100);
}

export default OrderForm

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View className="mb-2 flex-row flex-nowrap items-center gap-2 border-b border-white/10 p-2 pb-3">
      <View className="shrink-0">{icon}</View>
      <Text className="min-w-0 shrink text-base font-bold text-[#f7f8fa]">{title}</Text>
    </View>
  );
}
