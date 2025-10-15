import AppLoading from '@/components/app-loading';
import { Button } from '@/components/Button';
import { Dialog, DialogContent, useDialog } from '@/components/Dialog';
import InputSearch from '@/components/input-search';
import ProductForm from '@/components/products/product-form';
import { ProductProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from 'expo-router';
import { BoxIcon, Edit2Icon, PlusIcon, Users2Icon, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

function ProductsContent() {
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductProps | undefined>(undefined);
  const { setOpen } = useDialog();

  const getProducts = async () => {
    setLoading(true);
    try {
      const response = await megbapi.get('/products');
      setProducts(response.data);
      setFilteredData(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.replace('/(auth)/sign-in');
      } else {
        console.log(error.response?.data || error.message);
        Alert.alert('Erro', 'Não foi possível carregar os produtod.');
      }
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      getProducts();
    }, [])
  );

  const handleOpenModal = (Product?: ProductProps) => {
    Keyboard.dismiss();
    setSelectedProduct(Product);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    // Use a timeout to avoid seeing the old data as the modal closes
    setTimeout(() => {
      setSelectedProduct(undefined);
    }, 200);
  };

  const handleFormSuccess = () => {
    handleCloseModal();
    getProducts(); // Refresh the list
  }

  const HandleSearch = (texto: string) => {
    if (texto.length > 2) {
      const filtered = products?.filter((item: any) => (
        item?.name?.toLowerCase().includes(texto?.toLowerCase()) ||
        item?.referencia?.toLowerCase().includes(texto?.toLowerCase())
      ));
      setFilteredData(filtered);
    } else {
      setFilteredData(products);
    }
  }

  const RenderProducts = ({ item }: { item: ProductProps }) => (
    <View className='flex-row items-center justify-between p-4 border-b border-gray-300'>
      <Text>{item?.reference}</Text>
      <Text>{item?.name}</Text>
      <View className='w-14'>
        <Button
          variant={'default'}
          size={'sm'}
          onPress={() => handleOpenModal(item)}
          label={<Edit2Icon color={'white'} />}
          labelClasses='my-2'
        />
      </View>
    </View>
  )

  return (
    <View className='flex-1 bg-primary'>
      <View className='rounded-t-3xl bg-white h-full'>
        <View className='flex-row items-center justify-between h-20 px-4 gap-4 border-b border-gray-300'>
          <View className='flex-row items-center'>
            <Users2Icon />
          </View>
          <View className='flex-1'>
            <InputSearch handleChangeText={HandleSearch} />
          </View>
          <View>
            <Button
              labelClasses='text-white'
              label={<PlusIcon color={'white'} />}
              variant={'default'}
              onPress={() => handleOpenModal()} // Open modal for adding
            />
          </View>
        </View>
        <View className='flex-row items-center justify-between p-4 bg-gray-200'>
          <Text className=''>Referência</Text>
          <Text className=''>Produto</Text>
          <Text style={{ width: 38 }}></Text>
        </View>

        <View className='flex-1 pb-24'>
          <FlashList
            data={filteredData}
            renderItem={RenderProducts}
            keyExtractor={(item) => item.id!.toString()}
            keyboardShouldPersistTaps={'always'}
            showsVerticalScrollIndicator={false}
            onRefresh={getProducts}
            refreshing={loading}
          />
        </View>

      </View>
      <DialogContent>
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
                <BoxIcon color={'white'} size={24} />
                <Text className='text-lg font-bold text-center text-white'>
                  {selectedProduct ? 'Editar Produto' : 'Adicionar Produto'}
                </Text>
              </View>
              <Button
                label={<X color={'white'} size={24} />}
                onPress={() => handleCloseModal()}
              />
            </View>
            <ProductForm
              onSuccess={handleFormSuccess}
              initialData={selectedProduct}
            />
          </ScrollView>
        </KeyboardAvoidingView>

      </DialogContent>
    </View>
  )
}

export default function Products() {
  return (
    <Dialog>
      <ProductsContent />
    </Dialog>
  )
}