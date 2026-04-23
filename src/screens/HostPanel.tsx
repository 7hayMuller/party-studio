import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import ColorPicker from '../components/ColorPicker';
import StarBurst from '../components/StarBurst';
import { ThemeInput } from '../services/ai';
import { AppTheme, EVENT_CONFIG } from '../config/theme';

const TIPOS = [
  { label: '🎂 Aniversário', value: 'aniversário' },
  { label: '💍 Casamento',   value: 'casamento' },
  { label: '🎃 Halloween',   value: 'halloween' },
  { label: '🌽 Junina',      value: 'junina' },
  { label: '🌴 Tropical',    value: 'tropical' },
  { label: '🎭 Carnaval',    value: 'carnaval' },
  { label: '🎓 Formatura',   value: 'formatura' },
  { label: '🏢 Corporativo', value: 'corporativo' },
  { label: '🎉 Outro',       value: 'outro' },
];

const VIBES = [
  'Elegante', 'Animado', 'Dark', 'Colorido',
  'Minimalista', 'Glam', 'Futurista', 'Retrô',
];

const LOADING_MESSAGES = [
  'Escolhendo as cores perfeitas...',
  'Escrevendo o título da festa...',
  'Montando o convite...',
  'Aplicando o tema...',
  'Quase pronto...',
];

interface Props {
  onGenerate: (input: ThemeInput, event: typeof EVENT_CONFIG) => void;
  loading: boolean;
  source: 'api' | 'local' | null;
  theme: AppTheme;
}

export default function HostPanel({ onGenerate, loading, source }: Props) {
  const [step, setStep] = useState(1);

  const [tipo, setTipo]               = useState('');
  const [vibes, setVibes]             = useState<string[]>([]);

  const [a1, setA1]                   = useState('#ec4899');
  const [a2, setA2]                   = useState('#f59e0b');
  const [bg, setBg]                   = useState('#0a0a0a');
  const [aiA1, setAiA1]               = useState(false);
  const [aiA2, setAiA2]               = useState(false);
  const [aiBg, setAiBg]               = useState(false);

  const [partyTitle, setPartyTitle]   = useState('');
  const [description, setDescription] = useState('');
  const [imageDescription, setImageDesc] = useState('');
  const [imageFile, setImageFile]     = useState<string | null>(null);

  const [name, setName]         = useState('');
  const [date, setDate]         = useState('');
  const [time, setTime]         = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail]       = useState('');
  const [dressCode, setDressCode] = useState('');
  const [dressCodeImage, setDressCodeImage] = useState<string | null>(null);
  const [musicUri, setMusicUri]         = useState('');
  const [videoUri, setVideoUri]         = useState('');
  const [musicTab, setMusicTab]         = useState<'file' | 'youtube'>('file');
  const [youtubeUrl, setYoutubeUrl]     = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');

  // Loading screen state
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIdx(0);
    const cycle = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(cycle);
  }, [loading]);

  const toggleVibe = (v: string) =>
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const parseYouTubeUrl = (url: string) => {
    setYoutubeUrl(url);
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    setYoutubeVideoId(m ? m[1] : '');
  };

  const pickMusic = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.length) setMusicUri(result.assets[0].uri);
  };

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permissão necessária', 'Precisa de acesso à galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled) setVideoUri(result.assets[0].uri);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permissão necessária', 'Precisa de acesso à galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled) setImageFile(result.assets[0].uri);
  };

  const pickDressCodeImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permissão necessária', 'Precisa de acesso à galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) setDressCodeImage(result.assets[0].uri);
  };

  const goNext = () => {
    if (step === 1 && !tipo) { Alert.alert('Selecione o tipo da festa'); return; }
    if (step < 3) { setStep(s => s + 1); return; }
    onGenerate(
      {
        tipo, vibes,
        a1: aiA1 ? '' : a1,
        a2: aiA2 ? '' : a2,
        bg: aiBg ? '' : bg,
        partyTitle, description, imageDescription, imageFile,
      },
      {
        name:      name || 'Minha Festa',
        date:      date || 'A DEFINIR',
        time:      time || '00:00',
        location:  location || 'A definir',
        hostEmail: email,
        dressCode: dressCode || 'A definir',
        musicUri: musicTab === 'file' ? musicUri : '',
        videoUri,
        youtubeVideoId: musicTab === 'youtube' ? youtubeVideoId : '',
      },
    );
  };

  const starColors = [
    aiA1 ? '#fff' : a1,
    aiA2 ? '#fff' : a2,
    '#ffffff', '#ffffaa',
  ];

  // Loading screen
  if (loading) {
    return (
      <View style={s.loadRoot}>
        <StarBurst active colors={starColors} />
        <View style={s.loadContent}>
          <Text style={s.loadLogo}>✦ PARTY STUDIO</Text>
          <ActivityIndicator color="#fff" size="large" style={{ marginBottom: 32 }} />
          <Animated.Text style={[s.loadMsg, { opacity: fadeAnim }]}>
            {LOADING_MESSAGES[loadingMsgIdx]}
          </Animated.Text>
          <Text style={s.loadSub}>A IA está criando seu convite</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={s.inner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.logo}>✦ PARTY STUDIO ✦</Text>
          <Text style={s.title}>Personalize seu convite</Text>

          {/* STEP INDICATOR */}
          <View style={s.stepRow}>
            {[1, 2, 3].map(n => (
              <React.Fragment key={n}>
                <View style={[s.stepDot, step >= n && s.stepDotActive]}>
                  <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>
                </View>
                {n < 3 && <View style={[s.stepLine, step > n && s.stepLineActive]} />}
              </React.Fragment>
            ))}
          </View>
          <Text style={s.stepLabel}>
            {step === 1 && 'Tipo e estilo'}
            {step === 2 && 'Palheta e mídia'}
            {step === 3 && 'Dados do evento'}
          </Text>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <Text style={s.lbl}>TIPO DA FESTA</Text>
              <View style={s.chips}>
                {TIPOS.map(t => (
                  <TouchableOpacity
                    key={t.value}
                    style={[s.chip, tipo === t.value && s.chipActive]}
                    onPress={() => setTipo(t.value)}
                  >
                    <Text style={[s.chipTxt, tipo === t.value && s.chipTxtActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.lbl, { marginTop: 20 }]}>CLIMA (pode escolher mais de um)</Text>
              <View style={s.chips}>
                {VIBES.map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[s.chip, vibes.includes(v) && s.chipActive]}
                    onPress={() => toggleVibe(v)}
                  >
                    <Text style={[s.chipTxt, vibes.includes(v) && s.chipTxtActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.lbl, { marginTop: 20 }]}>TÍTULO E DESCRIÇÃO</Text>
              <TextInput
                style={s.inp}
                placeholder="Título da festa — deixe em branco para a IA criar"
                placeholderTextColor="#444"
                value={partyTitle}
                onChangeText={setPartyTitle}
              />
              <TextInput
                style={[s.inp, s.ta]}
                placeholder="Descrição — deixe em branco para a IA criar"
                placeholderTextColor="#444"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>              
              <ColorPicker
                label="COR PRINCIPAL (bordas, botões)"
                value={a1} aiMode={aiA1}
                onChangeColor={setA1} onToggleAi={setAiA1}
              />
              <ColorPicker
                label="COR SECUNDÁRIA (degradê, contraste)"
                value={a2} aiMode={aiA2}
                onChangeColor={setA2} onToggleAi={setAiA2}
              />
              <ColorPicker
                label="COR DE FUNDO"
                value={bg} aiMode={aiBg}
                onChangeColor={setBg} onToggleAi={setAiBg}
              />

              <Text style={[s.lbl, { marginTop: 16 }]}>IMAGEM DE CAPA</Text>
              <TextInput
                style={[s.inp, s.ta]}
                placeholder="Descreva a imagem — deixe em branco para a IA criar"
                placeholderTextColor="#444"
                value={imageDescription}
                onChangeText={setImageDesc}
                multiline
                numberOfLines={3}
              />
              <View style={s.uploadRow}>
                <TouchableOpacity style={s.uploadBtn} onPress={pickImage}>
                  <Text style={s.uploadTxt}>{imageFile ? '🔄 TROCAR IMAGEM' : '📁 ESCOLHER DA GALERIA'}</Text>
                </TouchableOpacity>
                {imageFile && (
                  <TouchableOpacity style={s.removeBtn} onPress={() => setImageFile(null)}>
                    <Text style={s.removeTxt}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {imageFile && (
                <Image source={{ uri: imageFile }} style={s.preview} resizeMode="cover" />
              )}

              <Text style={[s.lbl, { marginTop: 16 }]}>MÚSICA DE FUNDO</Text>
              <View style={s.tabRow}>
                <TouchableOpacity
                  style={[s.tabBtn, musicTab === 'file' && s.tabBtnActive]}
                  onPress={() => setMusicTab('file')}
                >
                  <Text style={[s.tabTxt, musicTab === 'file' && s.tabTxtActive]}>📁 Arquivo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tabBtn, musicTab === 'youtube' && s.tabBtnActive]}
                  onPress={() => setMusicTab('youtube')}
                >
                  <Text style={[s.tabTxt, musicTab === 'youtube' && s.tabTxtActive]}>▶ YouTube</Text>
                </TouchableOpacity>
              </View>

              {musicTab === 'file' ? (
                <>
                  <View style={s.uploadRow}>
                    <TouchableOpacity style={s.uploadBtn} onPress={pickMusic}>
                      <Text style={s.uploadTxt}>{musicUri ? '🔄 TROCAR MÚSICA' : '🎵 ESCOLHER MÚSICA'}</Text>
                    </TouchableOpacity>
                    {musicUri && (
                      <TouchableOpacity style={s.removeBtn} onPress={() => setMusicUri('')}>
                        <Text style={s.removeTxt}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {musicUri
                    ? <Text style={s.mediaName} numberOfLines={1}>♪ {musicUri.split('/').pop()}</Text>
                    : <Text style={s.mediaSub}>Opcional — toca enquanto o convidado vê o convite</Text>
                  }
                </>
              ) : (
                <>
                  <TextInput
                    style={s.inp}
                    placeholder="Cole o link do YouTube (ex: youtu.be/abc123)"
                    placeholderTextColor="#444"
                    value={youtubeUrl}
                    onChangeText={parseYouTubeUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  {youtubeVideoId
                    ? <Text style={s.mediaName}>▶ ID detectado: {youtubeVideoId}</Text>
                    : <Text style={s.mediaSub}>
                        {youtubeUrl.length > 5 ? '⚠ URL inválida — use youtu.be/... ou youtube.com/watch?v=...' : 'Toca em loop enquanto o convidado vê o convite'}
                      </Text>
                  }
                </>
              )}
              <Text style={[s.lbl, { marginTop: 16 }]}>VÍDEO DA TELA DE CONFIRMAÇÃO</Text>
              <View style={s.uploadRow}>
                <TouchableOpacity style={s.uploadBtn} onPress={pickVideo}>
                  <Text style={s.uploadTxt}>{videoUri ? '🔄 TROCAR VÍDEO' : '🎬 ESCOLHER VÍDEO'}</Text>
                </TouchableOpacity>
                {videoUri && (
                  <TouchableOpacity style={s.removeBtn} onPress={() => setVideoUri('')}>
                    <Text style={s.removeTxt}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {videoUri ? (
                <Text style={s.mediaName} numberOfLines={1}>▶ {videoUri.split('/').pop()}</Text>
              ) : (
                <Text style={s.mediaSub}>Opcional — aparece como fundo quando o convidado confirmar presença</Text>
              )}
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>              
              <TextInput style={s.inp} placeholder="Nome do evento" placeholderTextColor="#444" value={name} onChangeText={setName} />
              <View style={s.row}>
                <TextInput style={[s.inp, { flex: 1 }]} placeholder="Data (ex: 15 AGOSTO)" placeholderTextColor="#444" value={date} onChangeText={setDate} />
                <View style={{ width: 8 }} />
                <TextInput style={[s.inp, { flex: 1 }]} placeholder="Horário" placeholderTextColor="#444" value={time} onChangeText={setTime} />
              </View>
              <TextInput style={s.inp} placeholder="Local do evento" placeholderTextColor="#444" value={location} onChangeText={setLocation} />
              <TextInput style={s.inp} placeholder="E-mail para receber as confirmações" placeholderTextColor="#444" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <TextInput style={s.inp} placeholder="Dress Code" placeholderTextColor="#444" value={dressCode} onChangeText={setDressCode} />

              <Text style={[s.lbl, { marginTop: 8 }]}>IMAGEM MODELO DE DRESS CODE</Text>
              <View style={s.uploadRow}>
                <TouchableOpacity style={s.uploadBtn} onPress={pickDressCodeImage}>
                  <Text style={s.uploadTxt}>{dressCodeImage ? '🔄 TROCAR IMAGEM' : '👗 ESCOLHER IMAGEM'}</Text>
                </TouchableOpacity>
                {dressCodeImage && (
                  <TouchableOpacity style={s.removeBtn} onPress={() => setDressCodeImage(null)}>
                    <Text style={s.removeTxt}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {dressCodeImage ? (
                <Image source={{ uri: dressCodeImage }} style={s.preview} resizeMode="cover" />
              ) : (
                <Text style={s.mediaSub}>Opcional — exemplo visual do look esperado</Text>
              )}

              {source && (
                <Text style={[s.src, { color: source === 'api' ? '#4ade80' : '#fbbf24' }]}>
                  {source === 'api' ? '✓ Tema gerado pela IA' : '⚡ Preset local (backend offline)'}
                </Text>
              )}
            </>
          )}

          {/* NAVIGATION */}
          <View style={s.navRow}>
            {step > 1 && (
              <TouchableOpacity style={s.backBtn} onPress={() => setStep(s => s - 1)}>
                <Text style={s.backTxt}>← VOLTAR</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[s.nextBtn, step === 1 && s.nextBtnFull]} onPress={goNext}>
              <Text style={s.nextTxt}>
                {step < 3 ? 'PRÓXIMO →' : '✦ GERAR CONVITE'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StarBurst active={false} colors={starColors} />
    </View>
  );
}

const s = StyleSheet.create({
  // Loading
  loadRoot:    { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  loadContent: { alignItems: 'center', zIndex: 10 },
  loadLogo:    { fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 48 },
  loadMsg:     { fontSize: 16, color: '#fff', fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  loadSub:     { fontSize: 11, color: '#444', letterSpacing: 1 },

  // Form
  root:          { flex: 1, backgroundColor: '#0a0a0a' },
  inner:         { padding: 24, paddingBottom: 56 },
  logo:          { fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 4, marginTop:20 },
  title:         { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 20 },

  // Step indicator
  stepRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop:20 },
  stepDot:       { width: 28, height: 28, borderRadius: 14, backgroundColor: '#141414', borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#1e1e1e', borderColor: '#FF4FA3' },
  stepNum:       { fontSize: 11, color: '#555', fontWeight: '700' },
  stepNumActive: { color: '#FF4FA3' },
  stepLine:      { flex: 1, height: 1, backgroundColor: '#1e1e1e', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#FF4FA3' },
  stepLabel:     { fontSize: 16, letterSpacing: 2, color: '#555', marginBottom: 24 },

  lbl:           { fontSize: 9, letterSpacing: 2, color: '#555', marginBottom: 10 },
  chips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { backgroundColor: '#141414', borderWidth: 1, borderColor: '#252525', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14 },
  chipActive:    { backgroundColor: '#1e1e1e', borderColor: '#FF4FA3' },
  chipTxt:       { fontSize: 12, color: '#555' },
  chipTxtActive: { color: '#FF4FA3' },
  inp:           { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 8, padding: 11, color: '#fff', fontSize: 13, marginBottom: 8 },
  ta:            { minHeight: 75, textAlignVertical: 'top' },
  row:           { flexDirection: 'row' },
  uploadRow:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  uploadBtn:     { flex: 1, backgroundColor: '#161616', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 8, padding: 12, alignItems: 'center' },
  uploadTxt:     { fontSize: 11, color: '#888', letterSpacing: 1 },
  removeBtn:     { backgroundColor: '#1a0a0a', borderWidth: 1, borderColor: '#3a1a1a', borderRadius: 8, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  removeTxt:     { fontSize: 16, color: '#ef4444' },
  preview:       { width: '100%', height: 160, borderRadius: 10, marginBottom: 8 },
  src:           { fontSize: 11, textAlign: 'center', marginTop: 4, marginBottom: 8 },
  mediaName:     { fontSize: 11, color: '#888', marginBottom: 8, paddingHorizontal: 4 },
  mediaSub:      { fontSize: 10, color: '#333', marginBottom: 8, paddingHorizontal: 4, letterSpacing: 0.5 },
  tabRow:        { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tabBtn:        { flex: 1, backgroundColor: '#141414', borderWidth: 1, borderColor: '#252525', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  tabBtnActive:  { backgroundColor: '#1e1e1e', borderColor: '#fff' },
  tabTxt:        { fontSize: 11, color: '#555', letterSpacing: 1 },
  tabTxtActive:  { color: '#fff' },

  // Navigation
  navRow:        { flexDirection: 'row', gap: 10, marginTop: 24 },
  backBtn:       { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF4FA3', borderRadius: 10, padding: 16, alignItems: 'center' },
  backTxt:       { color: '#FF4FA3', fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  nextBtn:       { flex: 2, backgroundColor: '#FF4FA3', borderWidth: 1, borderColor: '#FF7ABF', borderRadius: 10, padding: 16, alignItems: 'center' },
  nextBtnFull:   { flex: 1 },
  nextTxt:       { color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 2 },
});
