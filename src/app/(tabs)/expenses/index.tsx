import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ExpenseProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import { Car, ChevronLeft, ChevronRight, Plus, ReceiptText, Trash2, Utensils, WalletCards } from 'lucide-react-native';
import moment from 'moment';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const labels: Record<ExpenseProps['category'], string> = { mileage: 'Quilometragem', food: 'Alimentação', lodging: 'Hospedagem', other: 'Outros gastos' };
const money = (value: string | number) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ExpensesScreen() {
  const { signOut } = useAuth();
  const [month, setMonth] = useState(() => moment().startOf('month'));
  const [expenses, setExpenses] = useState<ExpenseProps[]>([]);
  const [summary, setSummary] = useState({ amount: 0, kilometers: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await megbapi.get('/expenses', { params: { month: month.format('YYYY-MM') } });
      setExpenses(response.data.data);
      setSummary(response.data.summary);
    } catch (error: any) {
      if (error.response?.status === 401) return void signOut();
      setMessage(error.response?.data?.message || 'Não foi possível carregar as despesas.');
    } finally {
      setLoading(false);
    }
  }, [month, signOut]);

  useFocusEffect(useCallback(() => { void loadExpenses(); }, [loadExpenses]));

  const remove = (expense: ExpenseProps) => Alert.alert('Excluir despesa?', expense.category === 'mileage' ? `${expense.kilometers} km rodados` : `${labels[expense.category]} no valor de ${money(expense.amount)}`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: async () => {
      try { await megbapi.delete(`/expenses/${expense.id}`); await loadExpenses(); }
      catch (error: any) { Alert.alert('Não foi possível excluir', error.response?.data?.message || 'Tente novamente.'); }
    } },
  ]);

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarCopy}><Text style={styles.title}>Despesas</Text><Text style={styles.subtitle}>Gastos da atividade em campo</Text></View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar despesa"
          onPress={() => router.push('/expenses/new-expense' as any)}
          className="h-11 w-28 shrink-0 flex-row flex-nowrap items-center justify-center gap-2 rounded-xl border border-[#38a9eb] bg-[#0B78BC] px-3 active:opacity-65"
        >
          <Plus size={19} color="#ffffff" />
          <Text className="shrink-0 text-[13px] font-black text-white" numberOfLines={1}>Adicionar</Text>
        </Pressable>
      </View>
      <View style={styles.monthBar}>
        <Pressable onPress={() => setMonth((value) => value.clone().subtract(1, 'month'))} style={styles.monthButton}><ChevronLeft color={colors.text} /></Pressable>
        <Pressable onPress={() => setMonth(moment().startOf('month'))}><Text style={styles.monthText}>{month.format('MMMM [de] YYYY')}</Text></Pressable>
        <Pressable onPress={() => setMonth((value) => value.clone().add(1, 'month'))} style={styles.monthButton}><ChevronRight color={colors.text} /></Pressable>
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryItem}><WalletCards size={18} color={colors.primary} /><Text style={styles.summaryValue}>{money(summary.amount)}</Text><Text style={styles.summaryLabel}>Total</Text></View>
        <View style={styles.divider} /><View style={styles.summaryItem}><Car size={18} color={colors.success} /><Text style={styles.summaryValue}>{Number(summary.kilometers).toLocaleString('pt-BR')} km</Text><Text style={styles.summaryLabel}>Rodados</Text></View>
        <View style={styles.divider} /><View style={styles.summaryItem}><ReceiptText size={18} color={colors.warning} /><Text style={styles.summaryValue}>{summary.count}</Text><Text style={styles.summaryLabel}>Registros</Text></View>
      </View>
      {message ? <View style={styles.center}><Text style={styles.error}>{message}</Text><Pressable onPress={() => void loadExpenses()}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View> : loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Carregando despesas...</Text></View> : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {expenses.length ? expenses.map((expense) => <View key={expense.id} style={styles.card}>
            <View style={styles.categoryIcon}>{expense.category === 'mileage' ? <Car size={21} color={colors.primary} /> : expense.category === 'food' ? <Utensils size={21} color={colors.warning} /> : <ReceiptText size={21} color={colors.success} />}</View>
            <View style={styles.cardCopy}><Text style={styles.category}>{labels[expense.category]}</Text><Text style={styles.details} numberOfLines={2}>{expense.category === 'mileage' ? `${expense.kilometers} km rodados` : expense.description || 'Sem descrição'}</Text><Text style={styles.date}>{moment(expense.expense_date).format('DD/MM/YYYY')}</Text></View>
            <View style={styles.cardEnd}>{expense.category !== 'mileage' && <Text style={styles.amount}>{money(expense.amount)}</Text>}<Pressable accessibilityLabel="Excluir despesa" onPress={() => remove(expense)} style={styles.deleteButton}><Trash2 size={17} color={colors.danger} /></Pressable></View>
          </View>) : <View style={styles.center}><ReceiptText size={32} color={colors.mutedText} /><Text style={styles.emptyTitle}>Nenhuma despesa</Text><Text style={styles.muted}>Seus lançamentos do mês aparecerão aqui.</Text></View>}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, toolbar: { minHeight: 86, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }, toolbarCopy: { minWidth: 0, flex: 1 }, title: { color: colors.text, fontSize: 21, fontWeight: '900' }, subtitle: { color: colors.mutedText, fontSize: 12, marginTop: 4 }, pressed: { opacity: 0.65 }, monthBar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }, monthButton: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }, monthText: { color: colors.text, fontSize: 14, fontWeight: '900', textTransform: 'capitalize' }, summary: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }, summaryItem: { flex: 1, alignItems: 'center', gap: 3 }, summaryValue: { color: colors.text, fontSize: 13, fontWeight: '900' }, summaryLabel: { color: colors.mutedText, fontSize: 10 }, divider: { width: 1, backgroundColor: colors.border }, list: { gap: 10, padding: 14, paddingBottom: 30 }, card: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface }, categoryIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.surfaceRaised }, cardCopy: { minWidth: 0, flex: 1 }, category: { color: colors.text, fontSize: 14, fontWeight: '900' }, details: { color: colors.mutedText, fontSize: 11, lineHeight: 15, marginTop: 3 }, date: { color: colors.mutedText, fontSize: 10, marginTop: 4 }, cardEnd: { alignItems: 'flex-end', gap: 9 }, amount: { color: colors.success, fontSize: 13, fontWeight: '900' }, deleteButton: { width: 32, height: 30, alignItems: 'center', justifyContent: 'center' }, center: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 24 }, muted: { color: colors.mutedText, fontSize: 12, textAlign: 'center' }, error: { color: colors.danger, fontSize: 13, textAlign: 'center' }, retry: { color: colors.primary, fontSize: 13, fontWeight: '900' }, emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
});
