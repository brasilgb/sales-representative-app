import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { VisitProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import { CalendarDays, ChevronLeft, ChevronRight, LogIn, LogOut, Plus } from 'lucide-react-native';
import moment from 'moment';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const statusLabels: Record<VisitProps['status'], string> = {
  scheduled: 'Agendada',
  checked_in: 'Em visita',
  completed: 'Concluída',
  canceled: 'Cancelada',
};

export default function VisitsScreen() {
  const { signOut } = useAuth();
  const [date, setDate] = useState(() => new Date());
  const [visits, setVisits] = useState<VisitProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<number | null>(null);

  const loadVisits = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await megbapi.get('/visits', { params: { date: moment(date).format('YYYY-MM-DD') } });
      setVisits(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) return void signOut();
      setMessage(error.response?.data?.message || 'Não foi possível carregar a agenda.');
    } finally {
      setLoading(false);
    }
  }, [date, signOut]);

  useFocusEffect(useCallback(() => { void loadVisits(); }, [loadVisits]));

  function changeDay(amount: number) {
    const next = moment(date).add(amount, 'day').toDate();
    setDate(next);
  }

  async function transition(visit: VisitProps, action: 'check-in' | 'check-out') {
    setTransitioningId(visit.id);
    try {
      await megbapi.patch(`/visits/${visit.id}/${action}`, {});
      await loadVisits();
    } catch (error: any) {
      Alert.alert('Não foi possível atualizar', error.response?.data?.message || 'Tente novamente.');
    } finally {
      setTransitioningId(null);
    }
  }

  function confirmTransition(visit: VisitProps, action: 'check-in' | 'check-out') {
    Alert.alert(
      action === 'check-in' ? 'Iniciar visita?' : 'Concluir visita?',
      action === 'check-in'
        ? `Confirma o check-in em ${visit.customer?.name}?`
        : `Confirma o check-out em ${visit.customer?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => void transition(visit, action) },
      ],
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarCopy}><Text style={styles.title}>Agenda de visitas</Text><Text style={styles.subtitle}>{visits.length} {visits.length === 1 ? 'compromisso' : 'compromissos'} no dia</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Agendar visita" onPress={() => router.push('/visits/schedule-visit' as any)} style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}>
          <Plus size={19} color={colors.primaryText} />
          <Text style={styles.newButtonText}>Agendar</Text>
        </Pressable>
      </View>

      <View style={styles.dateBar}>
        <Pressable accessibilityLabel="Dia anterior" onPress={() => changeDay(-1)} style={styles.dateButton}><ChevronLeft color={colors.text} /></Pressable>
        <Pressable onPress={() => setDate(new Date())} style={styles.dateCopy}><Text style={styles.dateText}>{moment(date).format('DD [de] MMMM')}</Text><Text style={styles.todayText}>{moment(date).isSame(new Date(), 'day') ? 'Hoje' : moment(date).format('dddd')}</Text></Pressable>
        <Pressable accessibilityLabel="Próximo dia" onPress={() => changeDay(1)} style={styles.dateButton}><ChevronRight color={colors.text} /></Pressable>
      </View>

      {message ? <View style={styles.center}><Text style={styles.error}>{message}</Text><Pressable onPress={() => void loadVisits()}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View> : loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Carregando agenda...</Text></View> : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {visits.length ? visits.map((visit) => <VisitCard key={visit.id} visit={visit} loading={transitioningId === visit.id} onTransition={confirmTransition} />) : <View style={styles.center}><CalendarDays size={30} color={colors.mutedText} /><Text style={styles.emptyTitle}>Dia livre</Text><Text style={styles.muted}>As visitas programadas no sistema aparecerão aqui.</Text></View>}
        </ScrollView>
      )}
    </View>
  );
}

function VisitCard({ visit, loading, onTransition }: { visit: VisitProps; loading: boolean; onTransition: (visit: VisitProps, action: 'check-in' | 'check-out') => void }) {
  const active = visit.status === 'checked_in';
  return (
    <View style={styles.card}>
      <View style={styles.time}><Text style={styles.timeText}>{moment(visit.scheduled_at).format('HH:mm')}</Text><View style={[styles.statusDot, { backgroundColor: active ? colors.warning : visit.status === 'completed' ? colors.success : colors.primary }]} /></View>
      <View style={styles.cardMain}><Text style={styles.customer} numberOfLines={1}>{visit.customer?.name}</Text><Text style={styles.muted} numberOfLines={1}>{visit.customer?.region?.name || 'Sem região'} • {statusLabels[visit.status]}</Text>{visit.notes ? <Text style={styles.notesText} numberOfLines={2}>{visit.notes}</Text> : null}</View>
      {visit.status === 'scheduled' ? <Pressable disabled={loading} accessibilityLabel="Fazer check-in" onPress={() => onTransition(visit, 'check-in')} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>{loading ? <ActivityIndicator size="small" color={colors.primary} /> : <><LogIn size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.primary }]}>Check-in</Text></>}</Pressable> : null}
      {visit.status === 'checked_in' ? <Pressable disabled={loading} accessibilityLabel="Fazer check-out" onPress={() => onTransition(visit, 'check-out')} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>{loading ? <ActivityIndicator size="small" color={colors.success} /> : <><LogOut size={17} color={colors.success} /><Text style={[styles.actionText, { color: colors.success }]}>Concluir</Text></>}</Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: { minHeight: 86, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  toolbarCopy: { minWidth: 0, flex: 1 },
  title: { color: colors.text, fontSize: 21, fontWeight: '900' },
  subtitle: { color: colors.mutedText, fontSize: 12, marginTop: 4 },
  dateBar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  dateButton: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  dateCopy: { flex: 1, alignItems: 'center' },
  dateText: { color: colors.text, fontSize: 15, fontWeight: '900', textTransform: 'capitalize' },
  todayText: { color: colors.primary, fontSize: 11, fontWeight: '800', marginTop: 2, textTransform: 'capitalize' },
  list: { paddingHorizontal: 14, paddingBottom: 24 },
  card: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  time: { width: 48, alignItems: 'center', gap: 7 },
  timeText: { color: colors.text, fontSize: 14, fontWeight: '900' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  cardMain: { minWidth: 0, flex: 1 },
  customer: { color: colors.text, fontSize: 14, fontWeight: '900' },
  muted: { color: colors.mutedText, fontSize: 12, textAlign: 'center' },
  notesText: { color: colors.mutedText, fontSize: 11, lineHeight: 16, marginTop: 5 },
  newButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, backgroundColor: colors.primary, paddingHorizontal: 12 },
  newButtonText: { color: colors.primaryText, fontSize: 12, fontWeight: '900' },
  action: { minWidth: 82, height: 42, flexDirection: 'row', borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surfaceRaised, paddingHorizontal: 9 },
  actionText: { fontSize: 11, fontWeight: '900' },
  pressed: { opacity: 0.65 },
  center: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 24 },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  retry: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
});
