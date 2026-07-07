import { Input } from '@/components/Input';
import { colors } from '@/constants/theme';
import megbapi from '@/utils/megbapi';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { BedDouble, Camera, Car, Images, ReceiptText, Utensils, X } from 'lucide-react-native';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Category = 'mileage' | 'food' | 'lodging' | 'other';
const categories = [
  { value: 'mileage' as const, label: 'Quilometragem', icon: Car },
  { value: 'food' as const, label: 'Alimentação', icon: Utensils },
  { value: 'lodging' as const, label: 'Hospedagem', icon: BedDouble },
  { value: 'other' as const, label: 'Outros', icon: ReceiptText },
];

function formatCurrencyInput(value: string) {
  const cents = Number(value.replace(/\D/g, '') || 0);
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function currencyToDecimal(value: string) {
  return (Number(value.replace(/\D/g, '') || 0) / 100).toFixed(2);
}

function receiptUrl(value: string | null | undefined) {
  if (!value || value.startsWith('http')) return value ?? null;
  const apiUrl = String(megbapi.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
  return `${apiUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

export function ExpenseForm({ expenseId }: { expenseId?: string }) {
  const [category, setCategory] = useState<Category>('mileage');
  const [date, setDate] = useState(moment().format('DD/MM/YYYY'));
  const [amount, setAmount] = useState('');
  const [kilometers, setKilometers] = useState('');
  const [description, setDescription] = useState('');
  const [receipt, setReceipt] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [existingReceipt, setExistingReceipt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(expenseId));

  useEffect(() => {
    if (!expenseId) return;

    const loadExpense = async () => {
      try {
        const { data } = await megbapi.get(`/expenses/${expenseId}`);
        setCategory(data.category);
        setDate(moment(data.expense_date).format('DD/MM/YYYY'));
        setAmount(data.category === 'mileage' ? '' : formatCurrencyInput(String(Math.round(Number(data.amount) * 100))));
        setKilometers(data.category === 'mileage' ? String(data.kilometers ?? '').replace('.', ',') : '');
        setDescription(data.description ?? '');
        const currentReceipt = receiptUrl(data.receipt_url);
        setExistingReceipt(currentReceipt);
        setReceiptPreview(currentReceipt);
      } catch (error: any) {
        Alert.alert('Não foi possível carregar', error.response?.data?.message || 'Tente novamente.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    void loadExpense();
  }, [expenseId]);

  function changeDate(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 4
      ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
      : digits.length > 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits;
    setDate(formatted);
  }

  async function selectReceipt(source: 'camera' | 'library') {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', source === 'camera' ? 'Permita o acesso à câmera para fotografar o comprovante.' : 'Permita o acesso às fotos para escolher o comprovante.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.75 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });

    if (!result.canceled) {
      setReceipt(result.assets[0]);
      setReceiptPreview(result.assets[0].uri);
    }
  }

  async function save() {
    const parsedDate = moment(date, 'DD/MM/YYYY', true);
    if (!parsedDate.isValid()) {
      Alert.alert('Data inválida', 'Informe a data no formato DD/MM/AAAA.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      if (expenseId) formData.append('_method', 'PUT');
      formData.append('expense_date', parsedDate.format('YYYY-MM-DD'));
      formData.append('category', category);
      if (category !== 'mileage') formData.append('amount', currencyToDecimal(amount));
      if (category === 'mileage') formData.append('kilometers', kilometers.replace(',', '.'));
      if (description) formData.append('description', description);
      if (receipt) {
        formData.append('receipt', {
          uri: receipt.uri,
          name: receipt.fileName || `comprovante-${Date.now()}.jpg`,
          type: receipt.mimeType || 'image/jpeg',
        } as any);
      }

      await megbapi.post(expenseId ? `/expenses/${expenseId}` : '/expenses', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert(expenseId ? 'Despesa atualizada' : 'Despesa salva', expenseId ? 'As alterações foram salvas com sucesso.' : 'O lançamento foi registrado com sucesso.', [{ text: 'OK', onPress: () => router.replace('/expenses' as any) }]);
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      Alert.alert('Confira os dados', String(firstError || error.response?.data?.message || 'Não foi possível salvar a despesa.'));
    } finally { setSaving(false); }
  }

  if (loading) return <View style={[styles.screen, styles.loading]}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Carregando despesa...</Text></View>;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Tipo de despesa</Text>
        <View style={styles.categories}>{categories.map(({ value, label, icon: Icon }) => <Pressable key={value} onPress={() => setCategory(value)} style={[styles.category, category === value && styles.categoryActive]}><Icon size={21} color={category === value ? colors.primary : colors.mutedText} /><Text style={[styles.categoryText, category === value && styles.categoryTextActive]}>{label}</Text></Pressable>)}</View>
        <View style={styles.form}>
          <Input label="Data" value={date} onChangeText={changeDate} placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} />
          {category !== 'mileage' && <Input label="Valor total" value={amount} onChangeText={(value) => setAmount(formatCurrencyInput(value))} placeholder="R$ 0,00" keyboardType="number-pad" />}
          {category === 'mileage' && <>
            <Input label="Quilômetros rodados" value={kilometers} onChangeText={setKilometers} placeholder="0" keyboardType="decimal-pad" />
          </>}
          <View style={styles.textareaGroup}><Text style={styles.label}>DESCRIÇÃO</Text><TextInput style={styles.textarea} value={description} onChangeText={setDescription} placeholder="Detalhes do gasto" placeholderTextColor={colors.mutedText} multiline textAlignVertical="top" /></View>
        </View>
        <View className="mt-5 gap-2">
          <Text className="text-xs font-black uppercase text-[#a8b3c7]">Comprovante</Text>
          {receiptPreview ? (
            <View className="overflow-hidden rounded-xl border border-white/10 bg-[#101a2d]">
              <Image source={{ uri: receiptPreview }} className="h-48 w-full" resizeMode="cover" />
              {receipt && <Pressable accessibilityLabel="Remover novo comprovante" onPress={() => { setReceipt(null); setReceiptPreview(existingReceipt); }} className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full bg-black/70"><X size={19} color="#ffffff" /></Pressable>}
            </View>
          ) : (
            <View className="flex-row gap-2">
              <Pressable onPress={() => void selectReceipt('camera')} className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-[#38a9eb] bg-[#0B78BC] active:opacity-65"><Camera size={18} color="#ffffff" /><Text className="font-black text-white">Fotografar</Text></Pressable>
              <Pressable onPress={() => void selectReceipt('library')} className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#16233a] active:opacity-65"><Images size={18} color="#ffffff" /><Text className="font-black text-white">Galeria</Text></Pressable>
            </View>
          )}
          <Text className="text-xs text-[#a8b3c7]">JPG, PNG ou WebP, até 5 MB.</Text>
        </View>
        <Pressable disabled={saving} onPress={() => void save()} className="mt-6 h-[52px] items-center justify-center rounded-xl bg-[#0B78BC] active:opacity-65 disabled:opacity-65">{saving ? <ActivityIndicator color="#ffffff" /> : <Text className="text-[15px] font-black text-white">{expenseId ? 'Salvar alterações' : 'Salvar despesa'}</Text>}</Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, loading: { alignItems: 'center', justifyContent: 'center', gap: 10 }, loadingText: { color: colors.mutedText, fontSize: 13 }, content: { padding: 16, paddingBottom: 36 }, sectionLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '900', marginBottom: 9, textTransform: 'uppercase' }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, category: { width: '48%', flexGrow: 1, minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface }, categoryActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,184,240,0.1)' }, categoryText: { color: colors.mutedText, fontSize: 12, fontWeight: '800' }, categoryTextActive: { color: colors.primary }, form: { gap: 15, marginTop: 20 }, textareaGroup: { gap: 6 }, label: { color: colors.mutedText, fontSize: 11, fontWeight: '900' }, textarea: { minHeight: 110, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surfaceRaised, color: colors.text, fontSize: 15, padding: 14 },
});

export default function NewExpenseScreen() {
  return <ExpenseForm />;
}
