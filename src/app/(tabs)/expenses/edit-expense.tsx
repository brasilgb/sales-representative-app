import { ExpenseForm } from './new-expense';
import { useLocalSearchParams } from 'expo-router';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ExpenseForm expenseId={id} />;
}
