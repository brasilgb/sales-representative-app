import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { formatCustomerAddress, openRouteToCustomer } from '@/lib/maps';
import { VisitProps } from '@/types/app-types';
import megbapi from '@/utils/megbapi';
import { router, useFocusEffect } from 'expo-router';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, LogIn, LogOut, MapPin, Navigation, Plus, StickyNote } from 'lucide-react-native';
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
  const address = formatCustomerAddress(visit.customer);
  const statusColor = visit.status === 'checked_in'
    ? colors.warning
    : visit.status === 'completed'
      ? colors.success
      : visit.status === 'canceled'
        ? colors.danger
        : colors.primary;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.timeBadge}><Clock3 size={15} color={colors.text} /><Text style={styles.timeText}>{moment(visit.scheduled_at).format('HH:mm')}</Text></View>
        <View style={[styles.statusBadge, { borderColor: `${statusColor}55`, backgroundColor: `${statusColor}16` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabels[visit.status]}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.customer} numberOfLines={2}>{visit.customer?.name || 'Cliente não informado'}</Text>
        <View style={styles.metaRow}><MapPin size={15} color={colors.mutedText} /><Text style={styles.metaText} numberOfLines={2}>{address || visit.customer?.region?.name || 'Endereço não informado'}</Text></View>
        {visit.notes ? <View style={styles.notes}><StickyNote size={15} color={colors.warning} /><Text style={styles.notesText} numberOfLines={3}>{visit.notes}</Text></View> : null}
      </View>

      {visit.status === 'completed' && visit.check_in_at && visit.check_out_at ? (
        <Text style={styles.completedTime}>Atendimento: {moment(visit.check_in_at).format('HH:mm')}–{moment(visit.check_out_at).format('HH:mm')}</Text>
      ) : null}

      {visit.status === 'scheduled' || visit.status === 'checked_in' ? (
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Traçar rota até ${visit.customer?.name || 'o cliente'}`}
            onPress={() => void openRouteToCustomer(visit.customer)}
            style={({ pressed }) => [styles.action, styles.routeButton, pressed && styles.pressed]}>
            <View style={styles.iconTextRow}><Navigation size={17} color={colors.primary} /><Text style={styles.routeButtonText}>Traçar rota</Text></View>
          </Pressable>

          {visit.status === 'scheduled' ? <Pressable disabled={loading} accessibilityLabel="Fazer check-in" onPress={() => onTransition(visit, 'check-in')} style={({ pressed }) => [styles.action, styles.checkInAction, pressed && styles.pressed]}>{loading ? <ActivityIndicator size="small" color={colors.primary} /> : <View style={styles.iconTextRow}><LogIn size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.primary }]}>Iniciar visita - Check-in</Text></View>}</Pressable> : null}
          {visit.status === 'checked_in' ? <Pressable disabled={loading} accessibilityLabel="Fazer check-out" onPress={() => onTransition(visit, 'check-out')} style={({ pressed }) => [styles.action, styles.checkOutAction, pressed && styles.pressed]}>{loading ? <ActivityIndicator size="small" color={colors.success} /> : <View style={styles.iconTextRow}><LogOut size={18} color={colors.success} /><Text style={[styles.actionText, { color: colors.success }]}>Concluir visita - Check-out</Text></View>}</Pressable> : null}
        </View>
      ) : null}
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
  list: { gap: 12, padding: 14, paddingBottom: 30 },
  card: { overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  cardHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 14 },
  timeBadge: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 7 },
  timeText: { color: colors.text, fontSize: 15, fontWeight: '900' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '900' },
  cardBody: { gap: 9, padding: 14 },
  customer: { color: colors.text, fontSize: 16, lineHeight: 21, fontWeight: '900' },
  metaRow: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 7 },
  metaText: { minWidth: 0, flex: 1, color: colors.mutedText, fontSize: 12 },
  routeButton: { borderColor: 'rgba(34,184,240,0.3)', backgroundColor: 'rgba(34,184,240,0.08)' },
  iconTextRow: { maxWidth: '100%', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: 7 },
  routeButtonText: { minWidth: 0, flexShrink: 1, color: colors.primary, fontSize: 12, fontWeight: '900' },
  muted: { color: colors.mutedText, fontSize: 12, textAlign: 'center' },
  notes: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'flex-start', gap: 8, borderRadius: 9, backgroundColor: colors.surfaceRaised, padding: 10 },
  notesText: { minWidth: 0, flex: 1, color: colors.mutedText, fontSize: 12, lineHeight: 17 },
  completedTime: { color: colors.mutedText, fontSize: 11, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 14, paddingVertical: 10 },
  newButton: { minHeight: 44, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, backgroundColor: colors.primary, paddingHorizontal: 12 },
  newButtonText: { minWidth: 0, flexShrink: 1, color: colors.primaryText, fontSize: 12, fontWeight: '900' },
  actionsRow: { minHeight: 68, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 12, paddingVertical: 8 },
  action: { minWidth: 0, flex: 1, minHeight: 48, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 9, paddingHorizontal: 8 },
  checkInAction: { borderColor: 'rgba(34,184,240,0.3)', backgroundColor: 'rgba(34,184,240,0.08)' },
  checkOutAction: { borderColor: 'rgba(46,211,160,0.3)', backgroundColor: 'rgba(46,211,160,0.08)' },
  actionText: { minWidth: 0, flexShrink: 1, fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.65 },
  center: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 24 },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  retry: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
});
