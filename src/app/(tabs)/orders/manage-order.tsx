import OrderForm from '@/components/orders/order-form';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const CreateOrder = () => {
  // draftId chega quando o pedido é criado a partir de "Repetir pedido" (rascunho revalidado pela API).
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();

  return <OrderForm draftId={draftId} />;
};

export default CreateOrder;
