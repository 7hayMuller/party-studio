import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [screen, setScreen]   = useState<S>('loading');
  const [theme, setTheme]     = useState<AppTheme>(BASE_THEME);
  const [event, setEvent]     = useState<EventConfig>(EVENT_CONFIG);
  const [eventId, setEventId] = useState<string | null>(null);
  const [name, setName]       = useState('');
  const [guests, setGuests]   = useState(0);

  const active = screen !== 'loading' && screen !== 'error';
  const { playing: musicPlaying } = useBackgroundAudio(active ? (event.musicUri ?? '') : '');

  useEffect(() => {
    (async () => {
      try {
        if (id) {
          const data = await loadEvent(id);
          setTheme({ ...BASE_THEME, ...(data.theme as AppTheme) });
          setEvent({ ...EVENT_CONFIG, ...(data.event as EventConfig) });
          setEventId(id);

          // Se já confirmou neste dispositivo, vai direto para a tela de confirmação
          const saved = await AsyncStorage.getItem(`confirmed_${id}`);
          if (saved) {
            const { name: n, guests: g } = JSON.parse(saved);
            setName(n);
            setGuests(g);
            setScreen('confirm');
            return;
          }
        } else {
          // Fallback: carrega do AsyncStorage (mesmo dispositivo)
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
        <Text style={s.errTxt}>Convite não encontrado.</Text>
        <Text style={s.errSub}>Peça um novo link ao organizador.</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* YouTubePlayer persiste em todas as telas */}
      {active && <YouTubePlayer videoId={event.youtubeVideoId || ''} />}

      {screen === 'intro' && (
        <IntroScreen theme={theme} event={event} onNext={() => setScreen('form')} musicPlaying={musicPlaying || !!event.youtubeVideoId} />
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
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  center:  { flex: 1, backgroundColor: '#04040e', alignItems: 'center', justifyContent: 'center', gap: 8 },
  errTxt:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  errSub:  { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  hostBtn: {
    position: 'absolute',
    top: 52, left: 16,
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostTxt: { fontSize: 12, color: 'rgba(255,255,255,0.25)' },
});
