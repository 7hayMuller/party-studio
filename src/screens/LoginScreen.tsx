import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/auth';

export default function LoginScreen() {
  const [tab, setTab]         = useState<'login' | 'signup'>('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha no login com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }
    setLoading(true);
    try {
      if (tab === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        const { needsConfirmation } = await signUpWithEmail(email.trim(), password);
        if (needsConfirmation) {
          Alert.alert('Conta criada!', 'Verifique seu email para confirmar o cadastro antes de entrar.');
        }
        // se needsConfirmation = false, o onAuthStateChange já atualiza a sessão automaticamente
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#04040e', '#0a0a1a']} style={s.root}>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={s.logoWrap}>
            <Text style={s.logoEmoji}>🎉</Text>
            <Text style={s.logoTitle}>Party Studio</Text>
            <Text style={s.logoSub}>Crie convites que surpreendem</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            {/* Tabs */}
            <View style={s.tabs}>
              {(['login', 'signup'] as const).map(t => (
                <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
                  <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
                    {t === 'login' ? 'Entrar' : 'Criar conta'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Google */}
            <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={loading}>
              <Text style={s.googleIcon}>G</Text>
              <Text style={s.googleTxt}>Continuar com Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>ou</Text>
              <View style={s.divLine} />
            </View>

            {/* Email/Senha */}
            <Text style={s.lbl}>EMAIL</Text>
            <TextInput
              style={s.inp}
              placeholder="seu@email.com"
              placeholderTextColor="#333"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[s.lbl, { marginTop: 14 }]}>SENHA</Text>
            <TextInput
              style={s.inp}
              placeholder="mínimo 6 caracteres"
              placeholderTextColor="#333"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={s.submitBtn} onPress={handleEmail} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={s.submitTxt}>{tab === 'login' ? '▸ ENTRAR' : '▸ CRIAR CONTA'}</Text>
              }
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>feito com amor ♥ Party Studio</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  inner: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  logoWrap:  { alignItems: 'center', marginBottom: 36 },
  logoEmoji: { fontSize: 48, marginBottom: 8 },
  logoTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  logoSub:   { fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginTop: 6 },

  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f0f1c',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    gap: 0,
  },

  tabs:       { flexDirection: 'row', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 },
  tab:        { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  tabActive:  { backgroundColor: '#fff' },
  tabTxt:     { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  tabTxtActive: { color: '#000' },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  googleIcon: { fontSize: 16, fontWeight: '900', color: '#4285F4' },
  googleTxt:  { fontSize: 13, fontWeight: '700', color: '#111' },

  divider:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  divLine:  { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  divTxt:   { fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 },

  lbl: { fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.35)', marginBottom: 8 },
  inp: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    color: '#fff',
  },

  submitBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitTxt: { fontSize: 12, fontWeight: '800', color: '#000', letterSpacing: 2 },

  footer: { marginTop: 32, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.2)' },
});
