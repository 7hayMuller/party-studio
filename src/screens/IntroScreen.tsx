import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated as RNAnimated, Image, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import FooterBrand from '../components/FooterBrand';
import { AppTheme, EventConfig } from '../config/theme';

interface Props {
  theme: AppTheme;
  event: EventConfig;
  onNext: () => void;
  musicPlaying?: boolean;
  hasMusicUri?: boolean;
  onPlayMusic?: () => void;
}

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
                translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
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
        <RNAnimated.View key={i} style={[waveBar, { backgroundColor: color, transform: [{ scaleY: b }] }]} />
      ))}
    </View>
  );
}

// Badge recolhível: mostra ♪ ou waveform, expande para mostrar botão de play
function MusicControl({ playing, hasMusicUri, color, bg, onPlay }: {
  playing: boolean;
  hasMusicUri: boolean;
  color: string;
  bg: string;
  onPlay: () => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new RNAnimated.Value(0)).current;

  // Auto-expande ao montar se música ainda não tocou
  useEffect(() => {
    if (hasMusicUri && !playing) {
      RNAnimated.spring(expandAnim, { toValue: 1, useNativeDriver: false, tension: 60, friction: 10 }).start();
      setExpanded(true);
    }
  }, []);

  // Quando a música começa, recolhe automaticamente
  useEffect(() => {
    if (playing && expanded) {
      RNAnimated.spring(expandAnim, { toValue: 0, useNativeDriver: false, tension: 80, friction: 10 }).start();
      setExpanded(false);
    }
  }, [playing]);

  const handleToggle = () => {
    const next = !expanded;
    RNAnimated.spring(expandAnim, { toValue: next ? 1 : 0, useNativeDriver: false, tension: 60, friction: 10 }).start();
    setExpanded(next);
  };

  const expandedW = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, playing ? 0 : 110] });
  const expandedOpacity = expandAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  if (!hasMusicUri && !playing) return null;

  return (
    <TouchableOpacity
      style={[s.musicBadge, { backgroundColor: 'rgba(0,0,0,0.55)', borderColor: color + '44' }]}
      onPress={handleToggle}
      activeOpacity={0.8}
    >
      {/* Ícone ou waveform */}
      {playing
        ? <MusicBar color={color} />
        : <Text style={[s.musicNote, { color }]}>♪</Text>
      }

      {/* Botão expansível de play — só aparece quando não está tocando */}
      {!playing && (
        <RNAnimated.View style={{ width: expandedW, overflow: 'hidden' }}>
          <RNAnimated.View style={{ opacity: expandedOpacity }}>
            <TouchableOpacity
              style={[s.playBtn, { backgroundColor: color }]}
              onPress={onPlay}
              activeOpacity={0.85}
            >
              <Text style={[s.playBtnTxt, { color: bg }]}>{t('intro.enableMusicConfirm')}</Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </RNAnimated.View>
      )}
    </TouchableOpacity>
  );
}

export default function IntroScreen({ theme, event, onNext, musicPlaying, hasMusicUri, onPlayMusic }: Props) {
  const { t } = useTranslation();
  const fade    = useRef(new RNAnimated.Value(0)).current;
  const slideUp = useRef(new RNAnimated.Value(30)).current;
  const glow    = useRef(new RNAnimated.Value(0.6)).current;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fade,    { toValue: 1, duration: 900, useNativeDriver: true }),
      RNAnimated.spring(slideUp, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();

    RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(glow, { toValue: 1,   duration: 2500, useNativeDriver: true }),
      RNAnimated.timing(glow, { toValue: 0.4, duration: 2500, useNativeDriver: true }),
    ])).start();
  }, []);

  const displayTitle = theme.partyTitle || `${theme.titleMain} ${theme.titleEm}`;
  const displayDesc  = theme.description || theme.tagline;
  const showMusicControl = !!(hasMusicUri || musicPlaying);

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {theme.imageUrl && !imgError ? (
        <>
          {!imgLoaded && (
            <View style={[s.imgLoader, { backgroundColor: theme.bg }]}>
              <ActivityIndicator color={theme.a1} size="large" />
              <Text style={[s.imgLoadTxt, { color: theme.a1 + '99' }]}>{t('intro.generatingImage')}</Text>
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

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', theme.bg] as [string, string, string]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Controle de música recolhível */}
      {showMusicControl && (
        <View style={s.musicControlWrap}>
          <MusicControl
            playing={!!musicPlaying}
            hasMusicUri={!!hasMusicUri}
            color={theme.a1}
            bg={theme.bg}
            onPlay={onPlayMusic ?? (() => {})}
          />
        </View>
      )}

      <RNAnimated.View style={[s.content, { opacity: fade, transform: [{ translateY: slideUp }] }]}>
        <AnimatedTitle text={displayTitle} color="#fff" />

        <LinearGradient
          colors={['transparent', theme.a1, 'transparent'] as [string, string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.neon}
        />

        <Text style={s.description}>{displayDesc}</Text>

        <Text style={[s.meta, { color: theme.a1 + 'aa' }]}>
          {event.date}  ·  {event.time}  ·  {event.location}
        </Text>

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

const titleWrap: any = { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 };
const titleChar: any = {
  fontSize: 42, fontWeight: '900', lineHeight: 52,
  textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
};
const waveRow: any = { flexDirection: 'row', alignItems: 'center', gap: 3, height: 16 };
const waveBar: any = { width: 3, height: 14, borderRadius: 2 };

const s = StyleSheet.create({
  container:  { flex: 1 },
  bgImage:    { ...StyleSheet.absoluteFillObject },
  imgLoader:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 12 },
  imgLoadTxt: { fontSize: 11, letterSpacing: 3, marginTop: 8 },

  musicControlWrap: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
  },
  musicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  musicNote: { fontSize: 16, lineHeight: 18 },
  playBtn:   { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5, marginLeft: 2 },
  playBtnTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  content: {
    flex: 1, justifyContent: 'flex-end',
    paddingHorizontal: 28, paddingBottom: 56, paddingTop: 80,
  },
  neon:        { height: 1.5, marginBottom: 16 },
  description: {
    fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 24, marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  meta:   { fontSize: 10, letterSpacing: 3, marginBottom: 24 },
  btn:    { width: '100%', padding: 18, borderRadius: 14, alignItems: 'center' },
  btnTxt: { fontSize: 13, fontWeight: '800', letterSpacing: 3 },
});
