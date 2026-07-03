import { colors } from '@/constants/theme';
import { Search } from 'lucide-react-native';
import { TextInput, View } from 'react-native';

interface InputSearchProps {
  handleChangeText?: (value: string) => void;
  placeholder?: string;
}

export default function InputSearch({ handleChangeText, placeholder }: InputSearchProps) {
  return (
    <View className="min-h-[50px] flex-row items-center gap-2.5 rounded-xl border border-white/10 bg-surface-raised px-3.5">
      <Search color={colors.mutedText} size={20} />
      <TextInput
        className="min-w-0 min-h-12 flex-1 text-[15px] text-foreground"
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedText}
        autoCapitalize="none"
        returnKeyType="search"
      />
    </View>
  );
}
