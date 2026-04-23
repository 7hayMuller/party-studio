import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Modal, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import HostPanel from '../src/screens/HostPanel';
import IntroScreen from '../src/screens/IntroScreen';
import FormScreen from '../src/screens/FormScreen';
import ConfirmScreen from '../src/screens/ConfirmScreen';
import LoginScreen from '../src/screens/LoginScreen';
import HostMenu from '../src/screens/HostMenu';
import { useTheme } from '../src/hooks/useTheme';
import { EVENT_CONFIG, EventConfig } from '../src/config/theme';
import { ThemeInput, publishEvent } from '../src/services/ai';
import { useAuth } from '../src/context/AuthContext';
import { getAccessToken, signOut } from '../src/services/auth';

type Screen = 'editing' | 'preview' | 'intro' | 'form' | 'confirm';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://party-studio.vercel.app';

export default function Host() {
  const { session, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!session) return <LoginScreen />;
  return <HostContent />;
}

function HostContent() {
  const router = useRouter();
  const { theme, loading, source, generate } = useTheme();
  const [event, setEvent]       = useState<EventConfig>(EVENT_CONFIG);
  const [screen, setScreen]     = useState<Screen>('editing');
  const [lastInput, setLastInput] = useState<{ input: ThemeInput; ev: EventConfig } | null>(null);
  const [name, setName]         = useState('');
  const [guests, setGuests]     = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [shareModal, setShareModal] = useState<{ eventId: string; url: string } | null>(null);
  const [menuOpen, setMenuOpen]     = useState(false);

  const handleGenerate = async (input: ThemeInput, ev: EventConfig) => {
    setLastInput({ input, ev });
    setEvent(ev);
    await generate(input);
    setScreen('preview');
  };

  const handleRegenerate = async () => {
    if (!lastInput) return;
    setScreen('editing');
    setEvent(lastInput.ev);
    await generate(lastInput.input);
    setScreen('preview');
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await AsyncStorage.multiSet([
        ['rsvp_theme', JSON.stringify(theme)],
        ['rsvp_event', JSON.stringify(event)],
      ]);

      const token   = await getAccessToken();
      const eventId = await publishEvent(theme, event, token ?? undefined);
      const url     = `${WEB_URL}/guest?id=${eventId}`;

      setShareModal({ eventId, url });
    } catch (e: any) {
      console.error('[publicar] erro:', e?.message, e);
      const msg = e?.message ?? 'Tente novamente.';
      if (Platform.OS === 'web') {
        window.alert('Erro ao publicar: ' + msg);
      } else {
        Alert.alert('Erro ao publicar', msg);
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleShare = async () => {
    if (!shareModal) return;
    const eventName = event.name || 'Evento';
    const message   = `🎉 Você foi convidado para ${eventName}!\n\n${shareModal.url}`;

    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: eventName, text: message, url: shareModal.url });
      } else {
        await (navigator as any).clipboard.writeText(shareModal.url);
        Alert.alert('Link copiado!', 'O link foi copiado para a área de transferência.');
      }
    } else {
      await Share.share({ message, url: shareModal.url });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleConfirm = (n: string, g: number, _msg: string) => {
    setName(n);
    setGuests(g);
    setScreen('confirm');
  };

  return (
    <View style={s.root}>
      <View style={screen === 'editing' ? { flex: 1 } : { display: 'none' }}>
        <HostPanel onGenerate={handleGenerate} loading={loading} source={source} theme={theme} />
        <TouchableOpacity style={s.menuBtn} onPress={() => setMenuOpen(true)}>
          <Text style={s.menuIco}>≡</Text>
        </TouchableOpacity>
      </View>

      {screen === 'preview' && (
        <View style={{ flex: 1 }}>
          <IntroScreen theme={theme} event={event} onNext={() => setScreen('intro')} />

          <View style={s.previewBar}>
            <View style={s.previewTag}>
              <Text style={s.previewTagTxt}>PREVIEW DO HOST</Text>
            </View>
            <View style={s.previewActions}>
              <TouchableOpacity
                style={[s.previewBtn, s.regenBtn]}
                onPress={handleRegenerate}
                disabled={loading}
              >
                <Text style={s.regenTxt}>{loading ? '...' : '↺ REGENERAR'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.previewBtn, s.simulateBtn]}
                onPress={() => setScreen('intro')}
              >
                <Text style={s.simulateTxt}>▶ SIMULAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.previewBtn, s.publishBtn]}
                onPress={handlePublish}
                disabled={publishing}
              >
                {publishing
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={s.publishTxt}>✓ PUBLICAR</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {(screen === 'intro' || screen === 'form' || screen === 'confirm') && (
        <>
          {screen === 'intro'   && <IntroScreen   theme={theme} event={event} onNext={() => setScreen('form')} />}
          {screen === 'form'    && <FormScreen     theme={theme} event={event} onConfirm={handleConfirm} />}
          {screen === 'confirm' && (
            <ConfirmScreen
              theme={theme} event={event} name={name} guests={guests}
              onReset={() => { setName(''); setGuests(0); setScreen('editing'); }}
            />
          )}

          {/* Barra de simulação */}
          <View style={s.simBar}>
            <View style={s.previewTag}>
              <Text style={s.previewTagTxt}>SIMULANDO</Text>
            </View>
            <View style={s.previewActions}>
              <TouchableOpacity
                style={[s.previewBtn, s.regenBtn]}
                onPress={() => setScreen('editing')}
              >
                <Text style={s.regenTxt}>← EDITAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.previewBtn, s.publishBtn]}
                onPress={handlePublish}
                disabled={publishing}
              >
                {publishing
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={s.publishTxt}>✓ PUBLICAR</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <HostMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={() => { setMenuOpen(false); handleSignOut(); }}
      />

      {/* Modal de compartilhamento pós-publicação */}
      <Modal visible={!!shareModal} transparent animationType="fade">
        <Pressable style={s.overlay} onPress={() => { setShareModal(null); router.push('/guest'); }}>
          <Pressable style={s.modal} onPress={e => e.stopPropagation()}>
            <Text style={s.modalIcon}>🎉</Text>
            <Text style={s.modalTitle}>Convite publicado!</Text>
            <Text style={s.modalSub}>Compartilhe com seus convidados</Text>

            <View style={s.codeBox}>
              <Text style={s.codeLabel}>CÓDIGO DO EVENTO</Text>
              <Text style={s.code}>{shareModal?.eventId}</Text>
            </View>

            <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
              <Text style={s.shareBtnTxt}>↗ COMPARTILHAR LINK</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.guestBtn}
              onPress={() => { setShareModal(null); router.push('/guest'); }}
            >
              <Text style={s.guestBtnTxt}>Ver como convidado</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  simBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 10,
  },
  previewBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 10,
  },
  previewTag: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  previewTagTxt: { fontSize: 8, letterSpacing: 3, color: 'rgba(255,255,255,0.35)' },
  previewActions: { flexDirection: 'row', gap: 10 },
  previewBtn:    { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  regenBtn:      { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)' },
  regenTxt:      { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 1 },
  simulateBtn:   { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' },
  simulateTxt:   { fontSize: 11, color: '#fff', fontWeight: '600', letterSpacing: 1 },
  publishBtn:    { backgroundColor: '#fff', borderColor: '#fff' },
  publishTxt:    { fontSize: 11, color: '#000', fontWeight: '800', letterSpacing: 1 },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0f0f18',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  modalIcon:  { fontSize: 40, marginBottom: 4 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  modalSub:   { fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 },

  codeBox: {
    width: '100%',
    backgroundColor: 'rgba(0,220,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,220,255,0.3)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  codeLabel: { fontSize: 9, letterSpacing: 3, color: 'rgba(0,220,255,0.6)', marginBottom: 6 },
  code:      { fontSize: 32, fontWeight: '900', color: '#00dcff', letterSpacing: 6 },

  shareBtn: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  shareBtnTxt: { fontSize: 12, fontWeight: '800', color: '#000', letterSpacing: 2 },

  guestBtn:    { paddingVertical: 12 },
  guestBtnTxt: { fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 },

  menuBtn: {
    position: 'absolute',
    top: 30,
    right: 16,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIco: { fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 20, },
});
