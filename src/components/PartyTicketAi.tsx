import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme, EventConfig } from '../config/theme';

interface Props { theme: AppTheme; event: EventConfig; name: string }

// ── Barcode ───────────────────────────────────────────────────────────────────
function Barcode({ seed, color }: { seed: string; color: string }) {
  const bars = useMemo(() =>
    Array.from({ length: 38 }, (_, i) => {
      const c = seed.charCodeAt(i % seed.length) || 65;
      return { w: ((c * (i + 3)) % 3) + 1, gap: (c + i) % 2 === 0 ? 2 : 1 };
    }), [seed]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 44 }}>
      {bars.map((b, i) => (
        <React.Fragment key={i}>
          <View style={{ width: b.w, height: i % 5 === 0 ? 44 : 34, backgroundColor: color, borderRadius: 0.5 }} />
          <View style={{ width: b.gap }} />
        </React.Fragment>
      ))}
    </View>
  );
}

// ── Picote (linha perfurada horizontal) ───────────────────────────────────────
function Picote({ ticketW, bgColor }: { ticketW: number; bgColor: string }) {
  const dots = Math.floor((ticketW - 40) / 10);
  return (
    <View style={{ width: ticketW, height: 20, flexDirection: 'row', alignItems: 'center' }}>
      {/* Meia-lua esquerda */}
      <View style={{ width:30, height: 30, borderRadius: 25,backgroundColor: bgColor, marginLeft: -16 }} />
      {/* Pontilhado */}
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
        {Array.from({ length: dots }, (_, i) => (
          <View key={i} style={{ width: 4, height: 1.5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
        ))}
      </View>
      {/* Meia-lua direita */}
      <View style={{ width:30, height: 30, borderRadius: 25,backgroundColor: bgColor, marginRight: -16 }} />
    </View>
  );
}

// ── Campo label + valor ───────────────────────────────────────────────────────
function Field({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ gap: 3 }}>
      <Text style={f.label}>{label}</Text>
      <Text style={[f.value, { color }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}
const f = StyleSheet.create({
  label: { fontSize: 7, letterSpacing: 2, color: 'rgba(255,255,255,0.3)' },
  value: { fontSize: 13, fontWeight: '800' },
});

// ── Componente principal ──────────────────────────────────────────────────────
export default function PartyTicketAi({ theme, event, name }: Props) {
  const { width: screenW } = useWindowDimensions();
  const containerW = Math.min(screenW, 390);
  const ticketW    = containerW * 0.88;
  const ticketH    = ticketW * 1.68;
  const stubH      = ticketW * 0.26;
  const isWeb      = Platform.OS === 'web';

  const [flipped, setFlipped] = useState(false);
  const flip = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1,   duration: 2200, useNativeDriver: !isWeb }),
      Animated.timing(glow, { toValue: 0.3, duration: 2200, useNativeDriver: !isWeb }),
    ])).start();
  }, []);

  const frontRot  = flip.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRot   = flip.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });
  const frontOpac = flip.interpolate({ inputRange: [0, 89, 90, 180], outputRange: [1, 1, 0, 0] });
  const backOpac  = flip.interpolate({ inputRange: [0, 89, 90, 180], outputRange: [0, 0, 1, 1] });

  const faceBase = {
    position: 'absolute' as const,
    width: ticketW,
    height: ticketH,
    ...(!isWeb && { backfaceVisibility: 'hidden' as const }),
  };

  const toggleFlip = () => {
    Animated.spring(flip, { toValue: flipped ? 0 : 180, useNativeDriver: !isWeb, friction: 8, tension: 70 }).start();
    setFlipped(f => !f);
  };

  const displayTitle = (theme.partyTitle || `${theme.titleMain} ${theme.titleEm}`).toUpperCase();
  const displayDesc  = (theme.description || theme.tagline).toUpperCase();
  const ticketCode   = useMemo(() => `PSTYD${1000 + (displayTitle.length * 1337) % 9000}`, [displayTitle]);
  const cardBg       = '#0e0e14';
  const outerBg      = theme.bg;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>

      {/* ── Glow halo ──────────────────────────────────── */}
      <Animated.View
        style={{
          position: 'absolute',
          width: ticketW + 24,
          height: ticketH + 24,
          borderRadius: 22,
          opacity: glow,
          shadowColor: theme.a1,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 32,
          elevation: 24,
          backgroundColor: 'transparent',
        }}
      />

      {/* ── Glow halo secundário (cor a2) ─────────────── */}
      <Animated.View
        style={{
          position: 'absolute',
          width: ticketW + 8,
          height: ticketH + 8,
          borderRadius: 18,
          opacity: Animated.subtract(glow, new Animated.Value(0.1)) as any,
          shadowColor: theme.a2,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 18,
          elevation: 12,
          backgroundColor: 'transparent',
        }}
      />

      <Pressable
        onPress={toggleFlip}
        style={{ width: ticketW, height: ticketH }}
      >
        {/* ══════════════════════════════════════════════
            FRENTE
        ══════════════════════════════════════════════ */}
        <Animated.View style={[faceBase, {
          opacity: frontOpac,
          ...(!isWeb && { transform: [{ perspective: 1400 }, { rotateY: frontRot }] as any }),
        }]}>
          <View style={[s.card, { width: ticketW, height: ticketH, backgroundColor: cardBg, borderColor: theme.a1 + '55' }]}>

            {/* Faixa superior colorida */}
            <LinearGradient
              colors={[theme.a1, theme.a2] as any}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ height: 4, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}
            />

            {/* Área principal */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
             

              {/* Eyebrow */}
              <Text style={[s.eyebrow, { color: theme.a1 + 'cc' }]}>{theme.eyebrow}</Text>

              {/* Título em CAPS grande */}
              <Text style={[s.frontTitle, { color: theme.a1 }]} numberOfLines={3}>
                {displayTitle}
              </Text>

              {/* Linha neon */}
              <LinearGradient
                colors={['transparent', theme.a1 + 'aa', theme.a2 + 'aa', 'transparent'] as any}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 1.5, width: '75%', marginVertical: 18 }}
              />

              {/* Descrição em CAPS */}
              <Text style={[s.frontDesc, { color: theme.a2 }]} numberOfLines={4}>
                {displayDesc}
              </Text>

              {/* Hint */}
              <Text style={s.hint}>toque para ver os detalhes  ↩</Text>
            </View>

            {/* Picote */}
            <Picote ticketW={ticketW} bgColor={outerBg} />

            {/* Stub inferior */}
            <View style={[s.stub, { height: stubH }]}>
              <View>
                <Text style={s.stubLabel}>DATA & HORA</Text>
                <Text style={[s.stubVal, { color: '#fff' }]}>{event.date}  ·  {event.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.stubLabel}>TICKET</Text>
                <Text style={[s.stubVal, { color: theme.a2 }]}>{ticketCode}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ══════════════════════════════════════════════
            VERSO
        ══════════════════════════════════════════════ */}
        <Animated.View style={[faceBase, {
          opacity: backOpac,
          ...(!isWeb && { transform: [{ perspective: 1400 }, { rotateY: backRot }] as any }),
        }]}>
          <View style={[s.card, { width: ticketW, height: ticketH, backgroundColor: cardBg, borderColor: theme.a1 + '55' }]}>

            {/* Faixa superior */}
            <LinearGradient
              colors={[theme.a1, theme.a2] as any}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ height: 4, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}
            />

            {/* Conteúdo principal */}
            <View style={{ flex: 1, padding: 24 }}>

              {/* Cabeçalho */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>              
                <View style={{ flex: 1 }}>
                  <Text style={[s.eyebrow, { color: theme.a1 + 'cc', marginBottom: 2 }]}>{theme.eyebrow}</Text>
                  <Text style={[s.backTitle, { color: '#fff' }]} numberOfLines={2}>{displayTitle}</Text>
                </View>
                <Text style={[s.passTag, { color: theme.a2, borderColor: theme.a2 + '55' }]}>CONVITE</Text>
              </View>

              {/* Linha */}
              <LinearGradient
                colors={['transparent', theme.a1 + '55', 'transparent'] as any}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 1, marginBottom: 20 }}
              />

              {/* Campos em grid 2×2 */}
              <View style={s.fieldsGrid}>
                <Field label="DATA"   value={event.date}     color={theme.a1} />
                <Field label="HORA"   value={event.time}     color={theme.a1} />
                <Field label="LOCAL"  value={event.location} color="#fff" />
                <Field label="DRESS CODE" value={event.dressCode || '—'} color={theme.a2} />
              </View>

              {/* Convidado */}
              {name ? (
                <View style={s.guestBlock}>
                  <Text style={s.stubLabel}>CONVIDADO</Text>
                  <Text style={[s.guestName, { color: '#fff' }]}>{name.toUpperCase()}</Text>
                </View>
              ) : null}
            </View>

            {/* Picote */}
            <Picote ticketW={ticketW} bgColor={outerBg} />

            {/* Stub com barcode */}
            <View style={[s.stub, { height: stubH, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }]}>
              <Barcode seed={ticketCode + displayTitle} color="rgba(255,255,255,0.8)" />
              <Text style={[s.stubLabel, { letterSpacing: 4 }]}>{ticketCode}</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  eyebrow:    { fontSize: 8, letterSpacing: 3 },
  frontTitle: { fontSize: 30, fontWeight: '900', textAlign: 'center', letterSpacing: 2, lineHeight: 36 },
  frontDesc:  { fontSize: 10, textAlign: 'center', letterSpacing: 1.5, lineHeight: 17, opacity: 0.85 },
  hint:       { fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 22, letterSpacing: 2 },

  stub:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingBottom: 4 },
  stubLabel:  { fontSize: 7, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 3 },
  stubVal:    { fontSize: 13, fontWeight: '800' },

  backTitle:  { fontSize: 15, fontWeight: '900', lineHeight: 20 },
  passTag:    { fontSize: 7, fontWeight: '700', letterSpacing: 2, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },

  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 20 },

  guestBlock: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 16 },
  guestName:  { fontSize: 18, fontWeight: '900', letterSpacing: 2, marginTop: 3 },
});
