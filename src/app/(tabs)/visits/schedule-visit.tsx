import CustomerSelector from '@/components/orders/customer-selector';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { CalendarDays, Check, Clock, UserRound } from 'lucide-react-native';
import moment from 'moment';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ScheduleVisit() {
  const { signOut } = useAuth();
  const [customer, setCustomer] = useState<CustomerProps | null>(null);
  const [customerSelectorOpen, setCustomerSelectorOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(() => moment().add(1, 'hour').startOf('hour').toDate());
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setPickerMode(null);
    if (event.type === 'dismissed' || !selected) return;

    const next = new Date(scheduledAt);
    if (pickerMode === 'date') next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    if (pickerMode === 'time') next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setScheduledAt(next);
  }

  async function submit() {
    if (!customer) return Alert.alert('Selecione um cliente', 'Informe quem será visitado.');
    if (scheduledAt.getTime() < Date.now()) return Alert.alert('Data inválida', 'Escolha uma data e horário futuros.');

    setLoading(true);
    try {
      await megbapi.post('/visits', {
        customer_id: customer.id,
        scheduled_at: scheduledAt.toISOString(),
        notes: notes.trim() || null,
      });
      Alert.alert('Visita agendada', 'O compromisso foi incluído na agenda.', [
        { text: 'Ver agenda', onPress: () => router.replace('/visits') },
      ]);
    } catch (error: any) {
      if (error.response?.status === 401) return void signOut();
      Alert.alert('Não foi possível agendar', error.response?.data?.message || 'Revise os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title}>Nova visita</Text>
          <Text style={styles.subtitle}>Escolha o cliente, a data e o horário do compromisso.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Cliente</Text>
          <Pressable onPress={() => setCustomerSelectorOpen(true)} style={({ pressed }) => [styles.selector, pressed && styles.pressed]}>
            <View style={styles.icon}><UserRound size={20} color={colors.primary} /></View>
            <View style={styles.selectorCopy}>
              <Text style={styles.selectorTitle} numberOfLines={1}>{customer?.name ?? 'Selecionar cliente'}</Text>
              <Text style={styles.selectorHint} numberOfLines={1}>{customer?.cnpj ?? 'Toque para buscar na carteira'}</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Quando</Text>
          <View style={styles.dateRow}>
            <Pressable onPress={() => setPickerMode('date')} style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}>
              <CalendarDays size={19} color={colors.primary} />
              <View style={styles.dateCopy}><Text style={styles.dateLabel}>Data</Text><Text style={styles.dateValue} numberOfLines={1}>{moment(scheduledAt).format('DD/MM/YYYY')}</Text></View>
            </Pressable>
            <Pressable onPress={() => setPickerMode('time')} style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}>
              <Clock size={19} color={colors.warning} />
              <View style={styles.dateCopy}><Text style={styles.dateLabel}>Horário</Text><Text style={styles.dateValue} numberOfLines={1}>{moment(scheduledAt).format('HH:mm')}</Text></View>
            </Pressable>
          </View>
          {pickerMode ? <DateTimePicker value={scheduledAt} mode={pickerMode} minimumDate={pickerMode === 'date' ? new Date() : undefined} is24Hour locale="pt-BR" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onPickerChange} /> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Observações</Text>
          <TextInput multiline maxLength={5000} value={notes} onChangeText={setNotes} placeholder="Objetivo da visita, contato ou lembrete..." placeholderTextColor={colors.mutedText} style={styles.notes} />
        </View>

        <Pressable disabled={loading} accessibilityRole="button" onPress={() => void submit()} style={({ pressed }) => [styles.submit, (pressed || loading) && styles.pressed]}>
          {loading ? <ActivityIndicator color={colors.primaryText} /> : <><Check size={20} color={colors.primaryText} /><Text style={styles.submitText}>Agendar visita</Text></>}
        </Pressable>
      </ScrollView>

      <CustomerSelector visible={customerSelectorOpen} onClose={() => setCustomerSelectorOpen(false)} onCustomerSelect={(selected) => { setCustomer(selected); setCustomerSelectorOpen(false); }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: 14, padding: 16, paddingBottom: 40 },
  intro: { marginBottom: 2 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.mutedText, fontSize: 13, lineHeight: 19, marginTop: 5 },
  card: { gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, padding: 14 },
  label: { color: colors.mutedText, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  selector: { minHeight: 58, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 11, borderRadius: 11, backgroundColor: colors.surfaceRaised, paddingHorizontal: 12 },
  icon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: 'rgba(34,184,240,0.1)' },
  selectorCopy: { minWidth: 0, flex: 1 },
  selectorTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  selectorHint: { color: colors.mutedText, fontSize: 11, marginTop: 3 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateButton: { minWidth: 0, flex: 1, minHeight: 62, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 10, borderRadius: 11, backgroundColor: colors.surfaceRaised, padding: 12 },
  dateCopy: { minWidth: 0, flex: 1 },
  dateLabel: { color: colors.mutedText, fontSize: 10 },
  dateValue: { flexShrink: 1, color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 3 },
  notes: { minHeight: 110, borderRadius: 11, backgroundColor: colors.surfaceRaised, color: colors.text, fontSize: 14, lineHeight: 20, padding: 13, textAlignVertical: 'top' },
  submit: { minHeight: 54, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: colors.primary, paddingHorizontal: 16 },
  submitText: { minWidth: 0, flexShrink: 1, color: colors.primaryText, fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.65 },
});
