import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function FooterBrand({ color = 'rgba(255,255,255,0.22)' }: { color?: string }) {
  const { t } = useTranslation();
  return (
    <Text style={[s.footer, { color }]}>
      {t('common.footer')}
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
