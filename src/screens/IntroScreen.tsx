import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated as RNAnimated, Image, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import YouTubePlayer from '../components/YouTubePlayer';
import FooterBrand from '../components/FooterBrand';
import { AppTheme, EventConfig } from '../config/theme';

interface Props { theme: AppTheme; event: EventConfig; onNext: () => void; }

// Renders a title with each character fading+sliding in with stagger
function AnimatedTitle({ text, color }: { text: string; color: string }) {
  const chars = text.split('');
  const anims = useRef(chars.map(() => new RNAnimated.Value(0))).current;

  useEffect(() => {
    RNAnimated.stagger(
      45,
      anims.map(a =>
        RNAnimated.timing(a, { toValue: 1, duration: 500, delay: 500, useNativeDriver: true })
      ),
    ).start();
  }, []);

  return (
    <View style={titleWrap}>
      {chars.map((ch, i) => (
        <RNAnimated.Text
          key={i}
          style={[
            titleChar,
            { color },
            {
              opacity: anims[i],
              transform: [{
                translateY: anims[i].interpolate({
                  inputRange: [0, 1], outputRange: [18, 0],
                }),
              }],
            },
          ]}
        >
          {ch}
        </RNAnimated.Text>
      ))}
    </View>
  );
}

// Animated waveform bars shown while music plays
function MusicBar({ color }: { color: string }) {
  const bars = useRef([0, 1, 2, 3].map(() => new RNAnimated.Value(0.3))).current;

  useEffect(() => {
    bars.forEach((b, i) => {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.delay(i * 120),
          RNAnimated.timing(b, { toValue: 1, duration: 400, useNativeDriver: true }),
          RNAnimated.timing(b, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={waveRow}>
      {bars.map((b, i) => (
        <RNAnimated.View
          key={i}
          style={[waveBar, { backgroundColor: color, transform: [{ scaleY: b }] }]}
        />
      ))}
    </View>
  );
}

export default function IntroScreen({ theme, event, onNext }: Props) {
  const fade    = useRef(new RNAnimated.Value(0)).current;
  const slideUp = useRef(new RNAnimated.Value(30)).current;
  const glow    = useRef(new RNAnimated.Value(0.6)).current;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const player = useAudioPlayer(event.musicUri ? { uri: event.musicUri } : undefined);

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fade,    { toValue: 1, duration: 900, useNativeDriver: true }),
      RNAnimated.spring(slideUp, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();

    RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(glow, { toValue: 1,   duration: 2500, useNativeDriver: true }),
      RNAnimated.timing(glow, { toValue: 0.4, duration: 2500, useNativeDriver: true }),
    ])).start();

    if (event.musicUri) {
      setAudioModeAsync({ playsInSilentMode: true })
        .then(() => {
          player.loop = true;
          player.volume = 0.75;
          player.play();
          setMusicPlaying(true);
        })
        .catch(() => {});
    }
    if (event.youtubeVideoId) setMusicPlaying(true);

    return () => {
      if (event.musicUri) player.pause();
    };
  }, []);

  const displayTitle = theme.partyTitle || `${theme.titleMain} ${theme.titleEm}`;
  const displayDesc  = theme.description || theme.tagline;

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* IMAGEM OU GRADIENTE DE FUNDO */}
      {theme.imageUrl && !imgError ? (
        <>
          {!imgLoaded && (
            <View style={[s.imgLoader, { backgroundColor: theme.bg }]}>
              <ActivityIndicator color={theme.a1} size="large" />
              <Text style={[s.imgLoadTxt, { color: theme.a1 + '99' }]}>gerando imagem…</Text>
            </View>
          )}
          <Image
            source={{ uri: theme.imageUrl }}
            style={s.bgImage}
            resizeMode="cover"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        </>
      ) : (
        <LinearGradient
          colors={[theme.a1 + '44', theme.bg, theme.bg] as [string, string, string]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* GRADIENTE ESCURO SOBRE A IMAGEM */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', theme.bg] as [string, string, string]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <YouTubePlayer videoId={event.youtubeVideoId || ''} />

      {/* INDICADOR DE MÚSICA */}
      {musicPlaying && (
        <View style={s.musicBadge}>
          <MusicBar color={theme.a1} />
          <Text style={[s.musicTxt, { color: theme.a1 + 'cc' }]}>♪</Text>
        </View>
      )}

      {/* CONTEÚDO */}
      <RNAnimated.View style={[s.content, { opacity: fade, transform: [{ translateY: slideUp }] }]}>

        {/* ICON + EYEBROW */}
        {/* <View style={s.top}>
          <Text style={s.icon}>{theme.icon}</Text>
          <Text style={[s.eyebrow, { color: theme.a1 }]}>{theme.eyebrow}</Text>
        </View> */}

        {/* TÍTULO ANIMADO LETRA A LETRA */}
        <AnimatedTitle text={displayTitle} color="#fff" />

        {/* NEON LINE */}
        <LinearGradient
          colors={['transparent', theme.a1, 'transparent'] as [string, string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.neon}
        />

        {/* DESCRIÇÃO */}
        <Text style={s.description}>{displayDesc}</Text>

        {/* META */}
        <Text style={[s.meta, { color: theme.a1 + 'aa' }]}>
          {event.date}  ·  {event.time}  ·  {event.location}
        </Text>

        {/* BOTÃO */}
        <RNAnimated.View style={{ opacity: glow, width: '100%' }}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: theme.a1 }]}
            onPress={onNext}
            activeOpacity={0.85}
          >
            <Text style={[s.btnTxt, { color: theme.bg }]}>{theme.btnTxt}</Text>
          </TouchableOpacity>
        </RNAnimated.View>

        <FooterBrand color={theme.a1 + '55'} />
      </RNAnimated.View>
    </View>
  );
}

// Shared style objects for the animated title (defined outside component to avoid re-creation)
const titleWrap: any = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginBottom: 16,
};

const titleChar: any = {
  fontSize: 42,
  fontWeight: '900',
  lineHeight: 52,
  textShadowColor: 'rgba(0,0,0,0.6)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 8,
};

const waveRow: any = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
  height: 16,
};

const waveBar: any = {
  width: 3,
  height: 14,
  borderRadius: 2,
};

const s = StyleSheet.create({
  container:   { flex: 1 },
  bgImage:     { ...StyleSheet.absoluteFillObject },
  imgLoader:   {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  imgLoadTxt:  { fontSize: 11, letterSpacing: 3, marginTop: 8 },

  musicBadge: {
    position: 'absolute',
    top: 52,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  musicTxt: { fontSize: 13 },

  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 56,
    paddingTop: 80,
  },

  top:        { marginBottom: 12 },
  icon:       { fontSize: 48, marginBottom: 6 },
  eyebrow:    { fontSize: 10, letterSpacing: 6 },

  neon:        { height: 1.5, marginBottom: 16 },

  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 24,
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  meta:   { fontSize: 10, letterSpacing: 3, marginBottom: 24 },

  btn:    { width: '100%', padding: 18, borderRadius: 14, alignItems: 'center' },
  btnTxt: { fontSize: 13, fontWeight: '800', letterSpacing: 3 },
});
