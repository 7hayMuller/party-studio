import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated as RNAnimated, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { AppTheme, EventConfig } from '../config/theme';
import PartyTicketAi from '../components/PartyTicketAi';
import FooterBrand from '../components/FooterBrand';

interface Props {
  theme: AppTheme;
  event: EventConfig;
  name: string;
  guests: number;
  onReset: () => void;
}

const GRID_DELAY = 900;

export default function ConfirmScreen({ theme, event, name, guests, onReset }: Props) {
  const videoPlayer = useVideoPlayer(
    event.videoUri ? { uri: event.videoUri } : null,
    p => { p.loop = true; p.muted = true; },
  );

  useEffect(() => {
    if (event.videoUri) videoPlayer.play();
  }, []);

  const iconScale  = useRef(new RNAnimated.Value(0)).current;
  const headerFade = useRef(new RNAnimated.Value(0)).current;
  const msgFade    = useRef(new RNAnimated.Value(0)).current;
  const footerFade = useRef(new RNAnimated.Value(0)).current;

  const ring1   = useRef(new RNAnimated.Value(1)).current;
  const ring1op = useRef(new RNAnimated.Value(0.6)).current;
  const ring2   = useRef(new RNAnimated.Value(1)).current;
  const ring2op = useRef(new RNAnimated.Value(0.4)).current;

  const dots = useRef(
    Array.from({ length: 14 }, () => ({
      x: new RNAnimated.Value(0),
      y: new RNAnimated.Value(0),
      op: new RNAnimated.Value(0),
      scale: new RNAnimated.Value(0),
    }))
  ).current;

  const cellAnims = useRef(
    Array.from({ length: 4 }, () => ({
      opacity: new RNAnimated.Value(0),
      translateY: new RNAnimated.Value(16),
    }))
  ).current;

  useEffect(() => {
    RNAnimated.spring(iconScale, { toValue: 1, tension: 55, friction: 5, useNativeDriver: true }).start();
    RNAnimated.timing(headerFade, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }).start();
    RNAnimated.timing(msgFade,    { toValue: 1, duration: 600, delay: 500, useNativeDriver: true }).start();
    RNAnimated.timing(footerFade, { toValue: 1, duration: 500, delay: GRID_DELAY + 400, useNativeDriver: true }).start();

    cellAnims.forEach((c, i) => {
      RNAnimated.parallel([
        RNAnimated.timing(c.opacity,    { toValue: 1, duration: 400, delay: GRID_DELAY + i * 100, useNativeDriver: true }),
        RNAnimated.timing(c.translateY, { toValue: 0, duration: 400, delay: GRID_DELAY + i * 100, useNativeDriver: true }),
      ]).start();
    });

    const pulse = (s: RNAnimated.Value, o: RNAnimated.Value, delay: number) =>
      RNAnimated.loop(RNAnimated.sequence([
        RNAnimated.delay(delay),
        RNAnimated.parallel([
          RNAnimated.timing(s, { toValue: 1.7, duration: 1600, useNativeDriver: true }),
          RNAnimated.timing(o, { toValue: 0,   duration: 1600, useNativeDriver: true }),
        ]),
        RNAnimated.parallel([
          RNAnimated.timing(s, { toValue: 1,   duration: 0, useNativeDriver: true }),
          RNAnimated.timing(o, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])).start();

    pulse(ring1, ring1op, 0);
    pulse(ring2, ring2op, 800);

    dots.forEach((d, i) => {
      const angle = (i / dots.length) * Math.PI * 2;
      const dist  = 80 + Math.random() * 60;
      RNAnimated.sequence([
        RNAnimated.delay(250 + i * 35),
        RNAnimated.parallel([
          RNAnimated.spring(d.x,     { toValue: Math.cos(angle) * dist, tension: 35, friction: 6, useNativeDriver: true }),
          RNAnimated.spring(d.y,     { toValue: Math.sin(angle) * dist - 15, tension: 35, friction: 6, useNativeDriver: true }),
          RNAnimated.spring(d.scale, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
          RNAnimated.sequence([
            RNAnimated.timing(d.op, { toValue: 1, duration: 120, useNativeDriver: true }),
            RNAnimated.delay(600),
            RNAnimated.timing(d.op, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });
  }, []);

  const [ticketVisible, setTicketVisible] = useState(true);
  const ticketAnim = useRef(new RNAnimated.Value(1)).current;

  const toggleTicket = () => {
    const toValue = ticketVisible ? 0 : 1;
    RNAnimated.timing(ticketAnim, { toValue, duration: 300, useNativeDriver: true }).start();
    setTicketVisible(v => !v);
  };

  const dotColors = [theme.a1, theme.a2, '#fff', '#ffd700'];
  const code = useRef(`RSV${Math.floor(1000 + Math.random() * 9000)}`).current;

  const gridItems = [
    { val: event.date,           lbl: 'DATA',       c: theme.a1 },
    { val: String(guests + 1),   lbl: 'PESSOAS',    c: theme.a2 },
    { val: event.time,           lbl: 'HORA',       c: theme.a1 },
    { val: event.dressCode || code, lbl: 'DRESS CODE', c: theme.a2 },
  ];

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>

      {/* VÍDEO DE FUNDO */}
      {event.videoUri ? (
        <>
          <VideoView
            player={videoPlayer}
            style={s.videoBg}
            contentFit="cover"
            nativeControls={false}
          />
          <LinearGradient
            colors={[theme.bg + 'bb', theme.bg + 'ee', theme.bg] as any}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        <LinearGradient
          colors={[theme.a1 + '18', theme.bg, theme.bg] as any}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* CONFETTI */}
      <View style={s.confettiOrigin}>
        {dots.map((d, i) => (
          <RNAnimated.View
            key={i}
            style={[s.dot, {
              backgroundColor: dotColors[i % dotColors.length],
              opacity: d.op,
              transform: [{ translateX: d.x }, { translateY: d.y }, { scale: d.scale }],
            }]}
          />
        ))}
      </View>

      {/* CONTEÚDO */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >     


        {/* TICKET */}
        <RNAnimated.View style={{ opacity: ticketAnim, width: '100%', alignItems: 'center' }}
          pointerEvents={ticketVisible ? 'auto' : 'none'}>
          <PartyTicketAi theme={theme} event={event} name={name} />
        </RNAnimated.View>

        {/* RODAPÉ */}
        <RNAnimated.View style={{ opacity: footerFade, alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 32 }}>
          {event.videoUri ? (
            <TouchableOpacity style={[s.toggleBtn, { borderColor: theme.a1 + '55' }]} onPress={toggleTicket}>
              <Text style={[s.toggleTxt, { color: theme.a1 }]}>
                {ticketVisible ? '▼ ESCONDER TICKET' : '▲ VER TICKET'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={s.resetBtn} onPress={onReset}>
            <Text style={s.resetTxt}>↺ NOVO CONVIDADO</Text>
          </TouchableOpacity>
          <FooterBrand />
        </RNAnimated.View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1 },
  videoBg:        { ...StyleSheet.absoluteFillObject },
  confettiOrigin: { position: 'absolute', top: '42%', left: '50%' },
  dot:            { position: 'absolute', width: 8, height: 8, borderRadius: 4 },

  content: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 48 },

  ringWrap:   { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  ring:       { position: 'absolute', borderWidth: 1, borderRadius: 100 },
  iconCircle: { width: 82, height: 82, borderRadius: 41, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  iconTxt:    { fontSize: 36 },

  title:   { fontSize: 17, fontWeight: '900', letterSpacing: 3, marginBottom: 6, textAlign: 'center' },
  jp:      { fontSize: 10, letterSpacing: 6, marginBottom: 16 },
  msg:     { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20, textAlign: 'center', marginBottom: 20, maxWidth: 280 },
  divider: { height: 1, width: '60%', marginBottom: 20 },

  grid:    { flexDirection: 'row', flexWrap: 'wrap', width: 300, gap: 10, marginBottom: 20, justifyContent: 'center' },
  cell:    { width: '44%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center' },
  cellVal: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cellLbl: { fontSize: 8, color: 'rgba(255,255,255,0.28)', letterSpacing: 2 },

  by:       { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 },
  resetBtn:  { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 9, paddingHorizontal: 22 },
  resetTxt:  { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 3 },
  toggleBtn: { borderRadius: 8, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 22 },
  toggleTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 3 },
});
