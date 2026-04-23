import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, ActivityIndicator, Modal, Pressable, Alert,
} from 'react-native';
import { fetchMyEvents, fetchEventRsvps, deleteEvent } from '../services/ai';
import { getAccessToken } from '../services/auth';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSignOut: () => void;
  onEdit: (ev: any) => void;
}

export default function HostMenu({ visible, onClose, onSignOut, onEdit }: Props) {
  const [events, setEvents]               = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [rsvps, setRsvps]                 = useState<any[]>([]);
  const [loadingRsvps, setLoadingRsvps]   = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(340)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      loadEvents();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 340, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
      setSelectedEvent(null);
    }
  }, [visible]);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const data = await fetchMyEvents(token);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const openEvent = async (ev: any) => {
    setSelectedEvent(ev);
    setLoadingRsvps(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const data = await fetchEventRsvps(ev.id, token);
      setRsvps(data);
    } catch {
      setRsvps([]);
    } finally {
      setLoadingRsvps(false);
    }
  };

  const handleDelete = (ev: any) => {
    Alert.alert(
      'Excluir convite',
      `Tem certeza que deseja excluir "${ev.event?.name || ev.id}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            setDeletingId(ev.id);
            try {
              const token = await getAccessToken();
              if (!token) return;
              await deleteEvent(ev.id, token);
              setEvents(prev => prev.filter(e => e.id !== ev.id));
              if (selectedEvent?.id === ev.id) setSelectedEvent(null);
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o convite.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleEdit = (ev: any) => {
    onClose();
    onEdit(ev);
  };

  const totalPeople = (rsvps: any[]) =>
    rsvps.reduce((acc, r) => acc + 1 + (r.guests ?? 0), 0);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[s.overlay, { opacity: fadeAnim }]} />
      </Pressable>

      <Animated.View style={[s.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Cabeçalho */}
        <View style={s.header}>
          {selectedEvent ? (
            <TouchableOpacity onPress={() => setSelectedEvent(null)} style={s.backBtn}>
              <Text style={s.backTxt}>← VOLTAR</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.headerTitle}>MEUS CONVITES</Text>
          )}
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {selectedEvent && (
          <View style={s.eventHeader}>
            <Text style={s.eventHeaderName}>{selectedEvent.event?.name || '—'}</Text>
            <Text style={s.eventHeaderMeta}>
              {selectedEvent.event?.date}  ·  {selectedEvent.event?.location}
            </Text>
            <View style={s.eventActions}>
              <TouchableOpacity style={s.editBtn} onPress={() => handleEdit(selectedEvent)}>
                <Text style={s.editTxt}>✎ EDITAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => handleDelete(selectedEvent)}
                disabled={deletingId === selectedEvent.id}
              >
                {deletingId === selectedEvent.id
                  ? <ActivityIndicator color="#ef4444" size="small" />
                  : <Text style={s.deleteTxt}>⌫ EXCLUIR</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Conteúdo */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          {!selectedEvent ? (
            loadingEvents ? (
              <ActivityIndicator color="#00dcff" style={{ marginTop: 40 }} />
            ) : events.length === 0 ? (
              <Text style={s.emptyTxt}>Nenhum convite criado ainda.</Text>
            ) : (
              events.map(ev => (
                <View key={ev.id} style={s.eventCard}>
                  <TouchableOpacity style={s.eventCardMain} onPress={() => openEvent(ev)}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.eventName}>{ev.event?.name || '—'}</Text>
                      <Text style={s.eventMeta}>
                        {ev.event?.date}  ·  {ev.event?.location || 'Local não definido'}
                      </Text>
                    </View>
                    <View style={s.eventCodeBox}>
                      <Text style={s.eventCode}>{ev.id}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={s.cardActions}>
                    <TouchableOpacity style={s.cardEditBtn} onPress={() => handleEdit(ev)}>
                      <Text style={s.cardEditTxt}>✎ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.cardDeleteBtn}
                      onPress={() => handleDelete(ev)}
                      disabled={deletingId === ev.id}
                    >
                      {deletingId === ev.id
                        ? <ActivityIndicator color="#ef4444" size="small" />
                        : <Text style={s.cardDeleteTxt}>Excluir</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : (
            loadingRsvps ? (
              <ActivityIndicator color="#00dcff" style={{ marginTop: 40 }} />
            ) : rsvps.length === 0 ? (
              <Text style={s.emptyTxt}>Nenhuma confirmação ainda.</Text>
            ) : (
              <>
                <View style={s.rsvpSummary}>
                  <Text style={s.rsvpSummaryNum}>{totalPeople(rsvps)}</Text>
                  <Text style={s.rsvpSummaryLbl}>PESSOAS CONFIRMADAS</Text>
                </View>
                {rsvps.map(r => (
                  <View key={r.id} style={s.rsvpCard}>
                    <View style={s.rsvpRow}>
                      <Text style={s.rsvpName}>{r.name}</Text>
                      {r.guests > 0 && (
                        <View style={s.guestBadge}>
                          <Text style={s.guestBadgeTxt}>+{r.guests}</Text>
                        </View>
                      )}
                    </View>
                    {!!r.msg && <Text style={s.rsvpMsg}>"{r.msg}"</Text>}
                  </View>
                ))}
              </>
            )
          )}
        </ScrollView>

        {/* Rodapé */}
        <TouchableOpacity style={s.signOutBtn} onPress={onSignOut}>
          <Text style={s.signOutTxt}>SAIR DA CONTA</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0,
    width: 320,
    backgroundColor: '#0c0c14',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.9)',
  },
  backBtn:  { paddingVertical: 4 },
  backTxt:  { fontSize: 10, color: '#00dcff', letterSpacing: 2, fontWeight: '700' },
  closeBtn: { padding: 4 },
  closeTxt: { fontSize: 14, color: 'rgba(255,255,255,0.3)' },

  eventHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 2,
  },
  eventHeaderName: { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 2 },
  eventHeaderMeta: { fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 10 },
  eventActions:    { flexDirection: 'row', gap: 8 },
  editBtn: {
    flex: 1,
    backgroundColor: 'rgba(0,220,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,220,255,0.25)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editTxt:   { fontSize: 10, color: '#00dcff', fontWeight: '700', letterSpacing: 1 },
  deleteBtn: {
    flex: 1,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  deleteTxt: { fontSize: 10, color: '#ef4444', fontWeight: '700', letterSpacing: 1 },

  emptyTxt: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    marginTop: 48,
    letterSpacing: 1,
  },

  eventCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 10,
    overflow: 'hidden',
  },
  eventCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  eventName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  eventMeta: { fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },
  eventCodeBox: {
    backgroundColor: 'rgba(0,220,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,220,255,0.2)',
  },
  eventCode: { fontSize: 12, fontWeight: '900', color: '#00dcff', letterSpacing: 2 },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  cardEditBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  cardEditTxt:   { fontSize: 10, color: '#00dcff', fontWeight: '700', letterSpacing: 1 },
  cardDeleteBtn: { flex: 1, paddingVertical: 9, alignItems: 'center' },
  cardDeleteTxt: { fontSize: 10, color: '#ef4444', fontWeight: '700', letterSpacing: 1 },

  rsvpSummary: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  rsvpSummaryNum: { fontSize: 40, fontWeight: '900', color: '#00dcff' },
  rsvpSummaryLbl: { fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.35)', marginTop: 4 },

  rsvpCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 12,
    marginBottom: 8,
  },
  rsvpRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rsvpName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  guestBadge: {
    backgroundColor: 'rgba(0,220,255,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,220,255,0.25)',
  },
  guestBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#00dcff' },
  rsvpMsg: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6, fontStyle: 'italic' },

  signOutBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  signOutTxt: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 3 },
});
