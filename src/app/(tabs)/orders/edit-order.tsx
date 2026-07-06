import OrderForm from '@/components/orders/order-form';
import { useLocalSearchParams } from 'expo-router';

export default function EditOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderForm orderId={id} />;
}
