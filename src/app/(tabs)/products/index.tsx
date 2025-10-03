import { View, Text, Alert, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useCallback, useState } from 'react';
import { Edit2Icon, PlusIcon, Users2Icon } from 'lucide-react-native';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import AppLoading from '@/components/app-loading';
import { Button } from '@/components/Button';
import InputSearch from '@/components/input-search';
import { FlashList } from "@shopify/flash-list";
import ProductForm from '@/components/products/add-form';
import { Dialog, DialogContent, useDialog } from '@/components/Dialog';
import { ScrollView } from 'react-native-gesture-handler';
import { ProductProps } from '@/types/app-types';

function ProductsContent() {
  const [loading, setLoading] = useState<boolean>(true);
  const [Products, setProducts] = useState<any[]>([]);
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
        Alert.alert('Atenção', 'Sessão expirada. Por favor, faça login novamente.', [
          { text: 'Ok', onPress: () => router.replace('/(auth)/sign-in') },
        ]);
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
      const filtered = Products.filter((item: any) => (
        item.name.toLowerCase().includes(texto.toLowerCase()) ||
        item.referencia.toLowerCase().includes(texto.toLowerCase())
      ));
      setFilteredData(filtered);
    } else {
      setFilteredData(Products);
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

  if (loading && !Products.length) {
    return <AppLoading />
  }

  return (
    <View className='flex-1 bg-sky-600'>
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
          behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={75}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className='py-4 px-3 border-t border-secundary bg-primary'>
              <Text className='text-lg font-bold text-center'>
                {selectedProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
              </Text>
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