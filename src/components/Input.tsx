import { forwardRef } from 'react';
import { Text, TextInput, View } from 'react-native';

import { cn } from '../lib/utils';

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  labelClasses?: string;
  inputClasses?: string;
}
const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, label, labelClasses, inputClasses, ...props }, ref) => (
    <View className={cn('flex flex-col gap-1.5', className)}>
      {label && <Text className={cn('text-xs font-bold uppercase text-[#a8b3c7]', labelClasses)}>{label}</Text>}
      <TextInput
        placeholderTextColor="#a8b3c7"
        className={cn(
          inputClasses,
          'min-h-14 border border-white/10 bg-[#16233a] py-2.5 px-4 rounded-xl text-base text-[#f7f8fa]'
        )}
        {...props}
      />
    </View>
  )
);

export { Input };
