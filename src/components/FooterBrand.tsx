import React from 'react';
import { Text, StyleSheet } from 'react-native';

export default function FooterBrand({ color = 'rgba(255,255,255,0.22)' }: { color?: string }) {
  return (
    <Text style={[s.footer, { color }]}>
      feito com amor ♥ Party Studio
    </Text>
  );
}

const s = StyleSheet.create({
  footer: {
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
});
