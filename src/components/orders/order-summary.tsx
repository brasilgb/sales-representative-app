// resources/js/Pages/Orders/Components/OrderSummary.tsx

import { maskMoney } from '@/lib/mask';
import { Button } from '../Button';
import { Card, CardTitle } from '../Card';
import { ShoppingCartIcon } from 'lucide-react-native';
import { View, Text } from 'react-native';

interface OrderItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Props {
  items: OrderItem[];
  onRemoveItem: (productId: number) => void;
}

export function OrderSummary({ items, onRemoveItem }: Props) {
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <Card className="mb-4 p-2">
      <CardTitle className="flex items-center gap-2 font-bold mb-2"><ShoppingCartIcon className="w-6 h-6" /> Resumo do Pedido</CardTitle>
      <View className="w-full table-auto">
        <View className="text-left">
          <View className="p-2"><Text>Produto</Text></View>
          <View className="p-2"><Text>Quantidade</Text></View>
          <View className="p-2"><Text>Preço Unitário</Text></View>
          <View className="p-2"><Text>Total</Text></View>
          <View className="p-2"><Text>Ações</Text></View>
        </View>
        <View>
          {items.map((item) => (
            <View key={item.product_id} className="border-b">
              <View className="p-2"><Text>{item.name}</Text></View>
              <View className="p-2"><Text>{item.quantity}</Text></View>
              <View className="p-2"><Text>R$ {maskMoney(item.price.toString())}</Text></View>
              <View className="p-2"><Text>R$ {maskMoney((item.quantity * item.price).toFixed(2))}</Text></View>
              <View className="p-2">
                <Button
                  label="Remover"
                  variant="destructive"
                  onPress={() => onRemoveItem(item.product_id)}
                />
              </View>
            </View>
          ))}
        </View>
        <View>

          <Text className="text-right font-bold p-2">Total:</Text>
          <Text className="font-bold p-2">R$ {maskMoney(total.toFixed(2))}</Text>

        </View>
      </View>
    </Card>
  );
}