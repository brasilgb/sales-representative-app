// resources/js/Pages/Orders/Components/OrderSummary.tsx

import { OrderItem } from '@/types/app-types';
import { maskMoney } from '@/lib/mask';
import { Button } from '../Button';
import { Card, CardTitle } from '../Card';
import { ShoppingCartIcon, Trash2, Trash2Icon } from 'lucide-react-native';
import { View, Text } from 'react-native';

interface Props {
  items: OrderItem[];
  onRemoveItem: (productId: number) => void;
}

export function OrderSummary({ items, onRemoveItem }: Props) {
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <Card className="mb-4 border border-gray-300">
      <CardTitle className="flex items-center gap-2 font-bold mb-2 p-2"><ShoppingCartIcon className="w-6 h-6" /> Resumo do Pedido</CardTitle>
      <View className="w-full">
        <View className="flex-row border-b border-gray-400 bg-gray-200">
          <View className="py-2 px-1 w-40"><Text>Produto</Text></View>
          <View className="py-2 px-1 w-10"><Text>Qtd</Text></View>
          <View className="py-2 px-1 w-24"><Text>Val./Un.</Text></View>
          <View className="py-2 px-1 w-24"><Text>Total</Text></View>
          <View className="py-2 px-1 text-gray-200"><Text></Text></View>
        </View>
        <View>
          {items.map((item) => (
            <View key={item.product_id} className="flex-row items-center border-b border-gray-200">
              <View className="py-2 px-1 w-40"><Text>{item.name}</Text></View>
              <View className="py-2 px-1 w-10"><Text>{item.quantity}</Text></View>
              <View className="py-2 px-1 w-24"><Text>{maskMoney(item.price.toString())}</Text></View>
              <View className="py-2 px-1 w-24"><Text>{maskMoney((item.quantity * item.price).toFixed(2))}</Text></View>
              <View className="py-2 px-1">
                <Trash2Icon color={'red'} size={20} onPress={() => onRemoveItem(item.product_id)} />
              </View>
            </View>
          ))}
        </View>
        <View className='flex-row bg-secundary rounded-b-lg'>
          <Text className="text-right font-bold p-2 text-white">Total:</Text>
          <Text className="font-bold p-2 text-white">R$ {maskMoney(total.toFixed(2))}</Text>
        </View>
      </View>
    </Card>
  );
}