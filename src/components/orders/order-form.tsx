import { CustomerProps, OrderProps, ProductProps } from '@/types/app-types';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Card } from '../Card';
import CustomerSelector from './customer-selector';
import ProductSelector from './product-selector';
import { OrderSummary } from './order-summary';

const OrderForm = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProps | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductProps | null>(null);

  const handleCustomerSelect = (customer: CustomerProps) => {
    setSelectedCustomer(customer);
  };
  const handleProductSelect = (product: ProductProps) => {
    setSelectedProduct(product);
  };

  return (
    <View className='p-4'>
        <Card className="mb-4 p-2">
            {selectedCustomer ? (
                <View>
                    <Text className='font-bold text-lg'>{selectedCustomer.name}</Text>
                    <Text className='text-sm text-gray-500'>{selectedCustomer.cnpj}</Text>
                </View>
            ) : (
                <CustomerSelector onCustomerSelect={handleCustomerSelect} />
            )}
        </Card>
      <Text>OrderForm</Text>
        <Card className="mb-4 p-2">
            {selectedProduct ? (
                <View>
                    <Text className='font-bold text-lg'>{selectedProduct.name}</Text>
                    <Text className='text-sm text-gray-500'>{selectedProduct.reference}</Text>
                </View>
            ) : (
                <ProductSelector onProductSelect={handleProductSelect} />
            )}
        </Card>
      
      <OrderSummary items={[]} onRemoveItem={() => {}} />
    </View>
  )
}

export default OrderForm