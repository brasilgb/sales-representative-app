import { View } from 'react-native'
import React from 'react'
import { Input } from './Input'
import { SearchIcon } from 'lucide-react-native'

interface InputSearchProps {
handleChangeText?: any;
placeholder?: string;
}

export default function InputSearch({handleChangeText, placeholder}:InputSearchProps) {

  return (
    <View className='relative'>
      <Input
        inputClasses='!border-gray-300 !pl-10'
        onChangeText={(value) => handleChangeText(value)}
        placeholder={placeholder}
      />
      <View className='absolute top-2 left-1'>
        <SearchIcon color="#b1b1b1" />
      </View>
    </View>
  )
}