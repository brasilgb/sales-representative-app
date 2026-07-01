import { Dialog, DialogContent, DialogTrigger } from '@/components/Dialog';
import { colors } from '@/constants/theme';
import megbapi from '@/utils/megbapi';
import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

interface OrderStatusModalProps { id: string; status: string; onStatusChange: (newStatus: string) => void }

export const statusOptions = [
  { value: '1', label: 'Pedido realizado', color: colors.warning },
  { value: '2', label: 'Pago', color: colors.success },
  { value: '3', label: 'Entregue', color: colors.primary },
  { value: '4', label: 'Cancelado', color: colors.danger },
];

export function OrderStatusModal({ id, status, onStatusChange }: OrderStatusModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const current = statusOptions.find((option) => option.value === String(status)) ?? statusOptions[0];

  async function changeStatus(nextStatus: string) {
    if (nextStatus === String(status)) return setOpen(false);
    setLoading(nextStatus);
    try {
      await megbapi.patch(`/${nextStatus === '4' ? 'cancelorderapp' : 'statusorderapp'}/${id}`, { status: nextStatus });
      onStatusChange(nextStatus);
      setOpen(false);
    } catch (error: any) {
      Alert.alert('Não foi possível alterar', error.response?.data?.message || 'Tente novamente em instantes.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Pressable style={[styles.pill, { borderColor: `${current.color}55`, backgroundColor: `${current.color}16` }]}>
          <View style={[styles.dot, { backgroundColor: current.color }]} />
          <Text style={[styles.pillText, { color: current.color }]} numberOfLines={1}>{current.label}</Text>
        </Pressable>
      </DialogTrigger>
      <DialogContent>
        <View style={styles.header}>
          <View><Text style={styles.title}>Status do pedido</Text><Text style={styles.subtitle}>Selecione a nova etapa</Text></View>
          <Pressable accessibilityLabel="Fechar" onPress={() => setOpen(false)} style={styles.close}><X size={18} color={colors.text} /><Text style={styles.closeText}>Fechar</Text></Pressable>
        </View>
        <View style={styles.options}>
          {statusOptions.map((option) => {
            const selected = option.value === String(status);
            return (
              <Pressable key={option.value} disabled={Boolean(loading)} onPress={() => void changeStatus(option.value)} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                <View style={[styles.optionIcon, { backgroundColor: `${option.color}16` }]}><View style={[styles.optionDot, { backgroundColor: option.color }]} /></View>
                <Text style={styles.optionText}>{option.label}</Text>
                {loading === option.value ? <ActivityIndicator size="small" color={option.color} /> : selected ? <Check size={20} color={option.color} /> : null}
              </Pressable>
            );
          })}
        </View>
      </DialogContent>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  pill: { minHeight: 32, maxWidth: 132, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: '800' },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontSize: 17, fontWeight: '900' },
  subtitle: { color: colors.mutedText, fontSize: 12, marginTop: 3 },
  close: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, backgroundColor: colors.surfaceRaised, paddingHorizontal: 11 },
  closeText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  options: { padding: 12, paddingBottom: 24 },
  option: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 6 },
  optionIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  optionDot: { width: 9, height: 9, borderRadius: 5 },
  optionText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.62 },
});
