import { colors } from '@/constants/theme';
import { Search } from 'lucide-react-native';
import { StyleSheet, TextInput, View } from 'react-native';

interface InputSearchProps {
  handleChangeText?: (value: string) => void;
  placeholder?: string;
}

export default function InputSearch({ handleChangeText, placeholder }: InputSearchProps) {
  return (
    <View style={styles.wrap}>
      <Search color={colors.mutedText} size={20} />
      <TextInput
        style={styles.input}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedText}
        autoCapitalize="none"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surfaceRaised, paddingHorizontal: 14 },
  input: { minWidth: 0, flex: 1, minHeight: 48, color: colors.text, fontSize: 15 },
});
