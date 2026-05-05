import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, Pressable, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import IntroScreen from '../src/screens/IntroScreen';
import FormScreen from '../src/screens/FormScreen';
import ConfirmScreen from '../src/screens/ConfirmScreen';
import YouTubePlayer from '../src/components/YouTubePlayer';
import { BASE_THEME, EVENT_CONFIG, AppTheme, EventConfig } from '../src/config/theme';
import { loadEvent, submitRsvp } from '../src/services/ai';
import { useBackgroundAudio } from '../src/hooks/useBackgroundAudio';

type S = 'loading' | 'intro' | 'form' | 'confirm' | 'error';

export default function Guest() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [screen, setScreen]   = useState<S>('loading');
  const [theme, setTheme]     = useState<AppTheme>(BASE_THEME);
  const [event, setEvent]     = useState<EventConfig>(EVENT_CONFIG);
  const [eventId, setEventId] = useState<string | null>(null);
  const [name, setName]       = useState('');
  const [guests, setGuests]   = useState(0);
  const [musicModalOpen, setMusicModalOpen] = useState(false);

  const active    = screen !== 'loading' && screen !== 'error';
  const musicUri  = (event as any).musicUri ?? '';

  // Hook sempre recebe a URI — play() só é chamado via unlock()
  const { playing: musicPlaying, unlock: audioUnlock } = useBackgroundAudio(musicUri);

  // Abre modal assim que a tela de intro exibida e há música
  useEffect(() => {
    if (screen === 'intro' && musicUri && !musicPlaying) {
      setMusicModalOpen(true);
    }
  }, [screen, musicUri, musicPlaying]);

  useEffect(() => {
    (async () => {
      try {
        if (id) {
          const data = await loadEvent(id);
          setTheme({ ...BASE_THEME, ...(data.theme as AppTheme) });
          setEvent({ ...EVENT_CONFIG, ...(data.event as EventConfig) });
          setEventId(id);

          const saved = await AsyncStorage.getItem(`confirmed_${id}`);
          if (saved) {
            const { name: n, guests: g } = JSON.parse(saved);
            setName(n);
            setGuests(g);
            setScreen('confirm');
            return;
          }
        } else {
          const [[, rawTheme], [, rawEvent]] = await AsyncStorage.multiGet(['rsvp_theme', 'rsvp_event']);
          if (rawTheme) setTheme({ ...BASE_THEME, ...JSON.parse(rawTheme) });
          if (rawEvent) setEvent({ ...EVENT_CONFIG, ...JSON.parse(rawEvent) });
        }
        setScreen('intro');
      } catch {
        setScreen('error');
      }
    })();
  }, [id]);

  // Chamado direto no onPress — preserva contexto de gesto do iOS Safari
  const handleUnlockAudio = () => {
    audioUnlock();
    setMusicModalOpen(false);
  };

  const handleConfirm = async (n: string, g: number, msg: string) => {
    setName(n);
    setGuests(g);
    setScreen('confirm');
    if (eventId) {
      submitRsvp(eventId, n, g, msg).catch(() => {});
      AsyncStorage.setItem(`confirmed_${eventId}`, JSON.stringify({ name: n, guests: g })).catch(() => {});
    }
  };

  if (screen === 'loading') {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#00dcff" />
      </View>
    );
  }

  if (screen === 'error') {
    return (
      <View style={s.center}>
        <Text style={s.errTxt}>{t('guest.notFound')}</Text>
        <Text style={s.errSub}>{t('guest.askNewLink')}</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {active && <YouTubePlayer videoId={event.youtubeVideoId || ''} />}

      {screen === 'intro' && (
        <IntroScreen
          theme={theme}
          event={event}
          onNext={() => setScreen('form')}
          musicPlaying={musicPlaying || !!event.youtubeVideoId}
          hasMusicUri={!!musicUri}
          onPlayMusic={handleUnlockAudio}
        />
      )}
      {screen === 'form' && (
        <FormScreen theme={theme} event={event} onConfirm={handleConfirm} />
      )}
      {screen === 'confirm' && (
        <ConfirmScreen
          theme={theme}
          event={event}
          name={name}
          guests={guests}
          onReset={() => setScreen('form')}
          showReset={false}
        />
      )}

      {/* Modal de permissão de música */}
      <Modal visible={musicModalOpen} transparent animationType="fade">
        <Pressable style={s.overlay} onPress={() => setMusicModalOpen(false)}>
          <Pressable style={s.modal} onPress={e => e.stopPropagation()}>
            <Text style={[s.modalIcon, { color: theme.a1 }]}>♪</Text>
            <Text style={s.modalTitle}>{t('intro.enableMusic')}</Text>
            <Text style={s.modalSub}>{t('intro.enableMusicSub')}</Text>
            <TouchableOpacity
              style={[s.modalBtn, { backgroundColor: theme.a1 }]}
              onPress={handleUnlockAudio}
              activeOpacity={0.85}
            >
              <Text style={[s.modalBtnTxt, { color: theme.bg }]}>{t('intro.enableMusicConfirm')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMusicModalOpen(false)} style={{ marginTop: 14 }}>
              <Text style={s.modalSkip}>{t('intro.enableMusicSkip')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, backgroundColor: '#04040e', alignItems: 'center', justifyContent: 'center', gap: 8 },
  errTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#141414',
    borderRadius: 20,
    padding: 28,
    width: 300,
    alignItems: 'center',
  },
  modalIcon:   { fontSize: 40, marginBottom: 12 },
  modalTitle:  { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2, marginBottom: 8 },
  modalSub:    { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalBtn:    { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
  modalBtnTxt: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  modalSkip:   { fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
});
