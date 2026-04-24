import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated as RNAnimated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import FooterBrand from '../components/FooterBrand';
import { AppTheme, EventConfig } from '../config/theme';

interface Props { theme: AppTheme; event: EventConfig; onConfirm: (name: string, guests: number, msg: string) => void; }

export default function FormScreen({ theme, event, onConfirm }: Props) {
  const { t } = useTranslation();
  const [name, setName]   = useState('');
  const [guests, setGuests] = useState(0);
  const [msg, setMsg]     = useState('');
  const fade = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const b = theme.a1 + '33';

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: theme.bg }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <RNAnimated.View style={{ opacity: fade, width: '100%', alignItems: 'center' }}>
          <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.a1 + '44' }]}>

            <View style={[s.head, { borderBottomColor: b }]}>
               <Text style={[s.ey, { color: '#666666', marginBottom:10 }]}>{t('form.brand')}</Text>
              
              <Text style={[s.title, { color: theme.a1 }]}>{event.name}</Text>
              <Text style={[s.ey, { color: theme.a1 }]}>{theme.s2ey}</Text>
              <Text style={[s.sub, { color: theme.a1  }]}>{event.date} · {event.location}</Text>
              <LinearGradient
                colors={['transparent', theme.a1, 'transparent'] as [string, string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.neon}
              />
            </View>

            <View style={s.body}>
              <Text style={s.lbl}>{t('form.nameLabel')}</Text>
              <TextInput
                style={[s.inp, { borderColor: theme.a1 + '44' }]}
                placeholder={t('form.namePlaceholder')}
                placeholderTextColor="#444"
                value={name}
                onChangeText={setName}
              />

              <View style={[s.grow, { borderColor: b }]}>
                <Text style={s.glbl}>{t('form.companions')}</Text>
                <View style={s.gctrl}>
                  <TouchableOpacity style={[s.gbtn, { borderColor: theme.a1 + '55' }]} onPress={() => setGuests(Math.max(0, guests - 1))}>
                    <Text style={[s.gbtxt, { color: theme.a1 }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.gcnt}>{guests}</Text>
                  <TouchableOpacity style={[s.gbtn, { borderColor: theme.a1 + '55' }]} onPress={() => setGuests(Math.min(9, guests + 1))}>
                    <Text style={[s.gbtxt, { color: theme.a1 }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={s.lbl}>{t('form.messageLabel')}</Text>
              <TextInput
                style={[s.inp, s.ta, { borderColor: b }]}
                placeholder={t('form.messagePlaceholder')}
                placeholderTextColor="#444"
                value={msg}
                onChangeText={setMsg}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity onPress={() => name.trim() && onConfirm(name.trim(), guests, msg)} activeOpacity={0.85}>
                <LinearGradient
                  colors={[theme.a1, theme.a2] as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.submit}
                >
                  <Text style={[s.submitTxt, { color: theme.bg }]}>{t('form.confirm')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
          <FooterBrand />
        </RNAnimated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor:'transparent' },
  inner:     { flexGrow: 1, alignItems: 'center', justifyContent:'center', paddingVertical: 40, paddingHorizontal: 20 },
  card:      { width: '100%', maxWidth: 340, borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  head:      { padding: 20, alignItems: 'center', borderBottomWidth: 1 },
  ey:        { fontSize: 8, letterSpacing: 5, marginBottom: 4 },
  title:     { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  sub:       { fontSize: 9, letterSpacing: 3, marginTop: 4 },
  neon:      { height: 1, width: '100%', marginTop: 12, opacity: 0.4 },
  body:      { padding: 26, flex: 1, justifyContent: 'center' },
  lbl:       { fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 10, marginTop: 16 },
  inp:       { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderRadius: 8, padding: 11, fontSize: 13, color: '#fff', },
  ta:        { minHeight: 70, textAlignVertical: 'top' },
  grow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderRadius: 8, padding: 11, marginTop: 12 },
  glbl:      { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  gctrl:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gbtn:      { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gbtxt:     { fontSize: 18, lineHeight: 22 },
  gcnt:      { fontSize: 18, fontWeight: '700', color: '#fff', minWidth: 20, textAlign: 'center' },
  submit:    { marginTop: 20, padding: 15, borderRadius: 12, alignItems: 'center' },
  submitTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
});
