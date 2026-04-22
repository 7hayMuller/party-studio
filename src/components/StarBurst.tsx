import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');
const CHARS = ['✦', '✧', '★', '✸', '✶', '·', '✺', '✹'];
const STAR_COUNT = 50;

interface StarData {
  x: Animated.Value;
  y: Animated.Value;
  op: Animated.Value;
  scale: Animated.Value;
  char: string;
  color: string;
}

interface Props {
  active: boolean;
  colors: string[];
}

export default function StarBurst({ active, colors }: Props) {
  const stars = useRef<StarData[]>(
    Array.from({ length: STAR_COUNT }, (_, i) => ({
      x: new Animated.Value(width / 2),
      y: new Animated.Value(height / 2),
      op: new Animated.Value(0),
      scale: new Animated.Value(0),
      char: CHARS[i % CHARS.length],
      color: '#fff',
    }))
  ).current;

  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  const fireStar = (star: StarData, color: string, delay: number) => {
    const angle = Math.random() * Math.PI * 2;
    const dist  = 80 + Math.random() * (Math.max(width, height) * 0.55);
    const toX   = width  / 2 + Math.cos(angle) * dist;
    const toY   = height / 2 + Math.sin(angle) * dist;
    const dur   = 900 + Math.random() * 700;

    star.x.setValue(width / 2);
    star.y.setValue(height / 2);
    star.op.setValue(0);
    star.scale.setValue(0);
    (star as any).color = color;

    return Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(star.scale, { toValue: 0.6 + Math.random() * 1.2, duration: dur * 0.25, useNativeDriver: true, easing: Easing.out(Easing.back(2)) }),
        Animated.timing(star.op,    { toValue: 1, duration: dur * 0.2, useNativeDriver: true }),
        Animated.timing(star.x,     { toValue: toX, duration: dur, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(star.y,     { toValue: toY, duration: dur, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      ]),
      Animated.timing(star.op,    { toValue: 0, duration: dur * 0.5, useNativeDriver: true }),
    ]);
  };

  const runWave = () => {
    const anims = stars.map((star, i) => {
      const color = colors[i % colors.length] ?? '#fff';
      return fireStar(star, color, (i * 35) % 600);
    });
    const composite = Animated.parallel(anims);
    animationsRef.current = [composite];
    composite.start(({ finished }) => {
      if (finished && active) runWave();
    });
  };

  useEffect(() => {
    if (active) {
      runWave();
    } else {
      animationsRef.current.forEach(a => a.stop());
      stars.forEach(s => { s.op.setValue(0); s.scale.setValue(0); });
    }
    return () => { animationsRef.current.forEach(a => a.stop()); };
  }, [active]);

  return (
    <View style={s.container} pointerEvents="none">
      {stars.map((star, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: 0, top: 0,
            fontSize: 18,
            color: (star as any).color,
            opacity: star.op,
            transform: [
              { translateX: star.x },
              { translateY: star.y },
              { scale: star.scale },
            ],
          }}
        >
          {star.char}
        </Animated.Text>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
});
