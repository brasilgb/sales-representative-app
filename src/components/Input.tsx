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
      {label && <Text className={cn('text-xs font-bold uppercase text-[#64748B]', labelClasses)}>{label}</Text>}
      <TextInput
        placeholderTextColor="#64748B"
        className={cn(
          inputClasses,
          'min-h-14 border border-[#E2E8F0] bg-[#F1F5F9] py-2.5 px-4 rounded-xl text-base text-[#0F172A]'
        )}
        {...props}
      />
    </View>
  )
);

Input.displayName = 'Input';

export { Input };
