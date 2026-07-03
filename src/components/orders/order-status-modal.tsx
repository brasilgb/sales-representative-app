import { Dialog, DialogContent, DialogTrigger } from '@/components/Dialog';
import { colors } from '@/constants/theme';
import megbapi from '@/utils/megbapi';
import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

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
        <Pressable className="min-h-8 max-w-[132px] flex-row flex-nowrap items-center gap-1.5 rounded-lg border px-[9px] py-1.5" style={{ borderColor: `${current.color}55`, backgroundColor: `${current.color}16` }}>
          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: current.color }} />
          <Text className="min-w-0 shrink text-[10px] font-extrabold" style={{ color: current.color }} numberOfLines={1}>{current.label}</Text>
        </Pressable>
      </DialogTrigger>
      <DialogContent>
        <View className="min-h-[68px] flex-row items-center justify-between border-b border-white/10 px-[18px]">
          <View><Text className="text-[17px] font-black text-foreground">Status do pedido</Text><Text className="mt-0.5 text-xs text-muted">Selecione a nova etapa</Text></View>
          <Pressable accessibilityLabel="Fechar" onPress={() => setOpen(false)} className="min-h-10 flex-row flex-nowrap items-center justify-center gap-1.5 rounded-lg bg-surface-raised px-[11px] active:opacity-60"><X size={18} color={colors.text} /><Text className="shrink text-xs font-extrabold text-foreground">Fechar</Text></Pressable>
        </View>
        <View className="p-3 pb-6">
          {statusOptions.map((option) => {
            const selected = option.value === String(status);
            return (
              <Pressable key={option.value} disabled={Boolean(loading)} onPress={() => void changeStatus(option.value)} className="min-h-[58px] flex-row flex-nowrap items-center gap-3 border-b border-white/10 px-1.5 active:opacity-60">
                <View className="h-[34px] w-[34px] items-center justify-center rounded-lg" style={{ backgroundColor: `${option.color}16` }}><View className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: option.color }} /></View>
                <Text className="min-w-0 flex-1 text-sm font-bold text-foreground">{option.label}</Text>
                {loading === option.value ? <ActivityIndicator size="small" color={option.color} /> : selected ? <Check size={20} color={option.color} /> : null}
              </Pressable>
            );
          })}
        </View>
      </DialogContent>
    </Dialog>
  );
}
