import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import ColorPicker from '../components/ColorPicker';
import StarBurst from '../components/StarBurst';
import { ThemeInput } from '../services/ai';
import { AppTheme, EVENT_CONFIG } from '../config/theme';

const TIPOS_VALUES = [
  { key: 'birthday',   value: 'aniversário' },
  { key: 'wedding',    value: 'casamento' },
  { key: 'halloween',  value: 'halloween' },
  { key: 'junina',     value: 'junina' },
  { key: 'tropical',   value: 'tropical' },
  { key: 'carnival',   value: 'carnaval' },
  { key: 'graduation', value: 'formatura' },
  { key: 'corporate',  value: 'corporativo' },
  { key: 'other',      value: 'outro' },
];

const VIBES_KEYS = ['elegant', 'lively', 'dark', 'colorful', 'minimalist', 'glam', 'futuristic', 'retro'] as const;
const LOADING_MSG_KEYS = ['loadingMsg1', 'loadingMsg2', 'loadingMsg3', 'loadingMsg4', 'loadingMsg5'] as const;

export interface HostPanelInitialValues {
  a1?: string;
  a2?: string;
  bg?: string;
  partyTitle?: string;
  description?: string;
  name?: string;
  date?: string;
  time?: string;
  location?: string;
  email?: string;
  dressCode?: string;
  musicUri?: string;
  videoUri?: string;
  youtubeVideoId?: string;
}

interface Props {
  onGenerate: (input: ThemeInput, event: typeof EVENT_CONFIG) => void;
  loading: boolean;
  source: 'api' | 'local' | null;
  theme: AppTheme;
  initialValues?: HostPanelInitialValues;
  isEditing?: boolean;
}

export default function HostPanel({ onGenerate, loading, source, initialValues, isEditing }: Props) {
  const { t } = useTranslation();
  const TIPOS = TIPOS_VALUES.map(tp => ({ label: t(`hostPanel.tipos.${tp.key}` as any), value: tp.value }));
  const VIBES = VIBES_KEYS.map(k => t(`hostPanel.vibes.${k}` as any));
  const LOADING_MESSAGES = LOADING_MSG_KEYS.map(k => t(`hostPanel.${k}` as any));
  const [step, setStep] = useState(1);

  const [tipo, setTipo]               = useState('');
  const [vibes, setVibes]             = useState<string[]>([]);

  const [a1, setA1]                   = useState(initialValues?.a1 ?? '#ec4899');
  const [a2, setA2]                   = useState(initialValues?.a2 ?? '#f59e0b');
  const [bg, setBg]                   = useState(initialValues?.bg ?? '#0a0a0a');
  const [aiA1, setAiA1]               = useState(false);
  const [aiA2, setAiA2]               = useState(false);
  const [aiBg, setAiBg]               = useState(false);

  const [partyTitle, setPartyTitle]   = useState(initialValues?.partyTitle ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [imageDescription, setImageDesc] = useState('');
  const [imageFile, setImageFile]     = useState<string | null>(null);

  const [name, setName]         = useState(initialValues?.name ?? '');
  const [date, setDate]         = useState(initialValues?.date ?? '');
  const [time, setTime]         = useState(initialValues?.time ?? '');
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [email, setEmail]       = useState(initialValues?.email ?? '');
  const [dressCode, setDressCode] = useState(initialValues?.dressCode ?? '');
  const [dressCodeImage, setDressCodeImage] = useState<string | null>(null);
  const [musicUri, setMusicUri]         = useState(initialValues?.musicUri ?? '');
  const [videoUri, setVideoUri]         = useState(initialValues?.videoUri ?? '');
  const [musicTab, setMusicTab]         = useState<'file' | 'youtube'>(initialValues?.youtubeVideoId ? 'youtube' : 'file');
  const [youtubeUrl, setYoutubeUrl]     = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState(initialValues?.youtubeVideoId ?? '');

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
    if (!perm.granted) { Alert.alert(t('common.permissionRequired'), t('common.galleryPermission')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled) setVideoUri(result.assets[0].uri);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert(t('common.permissionRequired'), t('common.galleryPermission')); return; }
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
    if (!perm.granted) { Alert.alert(t('common.permissionRequired'), t('common.galleryPermission')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) setDressCodeImage(result.assets[0].uri);
  };

  const goNext = () => {
    if (step === 1 && !tipo) { Alert.alert(t('hostPanel.selectPartyType')); return; }
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
          <Text style={s.loadSub}>{t('hostPanel.loadingSubtitle')}</Text>
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
          <Text style={s.title}>{t('hostPanel.title')}</Text>

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
            {step === 1 && t('hostPanel.step1Label')}
            {step === 2 && t('hostPanel.step2Label')}
            {step === 3 && t('hostPanel.step3Label')}
          </Text>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <Text style={s.lbl}>{t('hostPanel.partyTypeLabel')}</Text>
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

              <Text style={[s.lbl, { marginTop: 20 }]}>{t('hostPanel.vibesLabel')}</Text>
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

              <Text style={[s.lbl, { marginTop: 20 }]}>{t('hostPanel.titleDescLabel')}</Text>
              <TextInput
                style={s.inp}
                placeholder={t('hostPanel.titlePlaceholder')}
                placeholderTextColor="#444"
                value={partyTitle}
                onChangeText={setPartyTitle}
              />
              <TextInput
                style={[s.inp, s.ta]}
                placeholder={t('hostPanel.descPlaceholder')}
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
                label={t('hostPanel.colorPrimary')}
                value={a1} aiMode={aiA1}
                onChangeColor={setA1} onToggleAi={setAiA1}
              />
              <ColorPicker
                label={t('hostPanel.colorSecondary')}
                value={a2} aiMode={aiA2}
                onChangeColor={setA2} onToggleAi={setAiA2}
              />
              <ColorPicker
                label={t('hostPanel.colorBg')}
                value={bg} aiMode={aiBg}
                onChangeColor={setBg} onToggleAi={setAiBg}
              />

              <Text style={[s.lbl, { marginTop: 16 }]}>{t('hostPanel.coverImageLabel')}</Text>
              <TextInput
                style={[s.inp, s.ta]}
                placeholder={t('hostPanel.coverImagePlaceholder')}
                placeholderTextColor="#444"
                value={imageDescription}
                onChangeText={setImageDesc}
                multiline
                numberOfLines={3}
              />
              <View style={s.uploadRow}>
                <TouchableOpacity style={s.uploadBtn} onPress={pickImage}>
                  <Text style={s.uploadTxt}>{imageFile ? t('hostPanel.changeImage') : t('hostPanel.pickImage')}</Text>
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

              <Text style={[s.lbl, { marginTop: 16 }]}>{t('hostPanel.musicLabel')}</Text>
              <View style={s.tabRow}>
                <TouchableOpacity
                  style={[s.tabBtn, musicTab === 'file' && s.tabBtnActive]}
                  onPress={() => setMusicTab('file')}
                >
                  <Text style={[s.tabTxt, musicTab === 'file' && s.tabTxtActive]}>{t('hostPanel.tabFile')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tabBtn, musicTab === 'youtube' && s.tabBtnActive]}
                  onPress={() => setMusicTab('youtube')}
                >
                  <Text style={[s.tabTxt, musicTab === 'youtube' && s.tabTxtActive]}>{t('hostPanel.tabYoutube')}</Text>
                </TouchableOpacity>
              </View>

              {musicTab === 'file' ? (
                <>
                  <View style={s.uploadRow}>
                    <TouchableOpacity style={s.uploadBtn} onPress={pickMusic}>
                      <Text style={s.uploadTxt}>{musicUri ? t('hostPanel.changeMusic') : t('hostPanel.pickMusic')}</Text>
                    </TouchableOpacity>
                    {musicUri && (
                      <TouchableOpacity style={s.removeBtn} onPress={() => setMusicUri('')}>
                        <Text style={s.removeTxt}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {musicUri
                    ? <Text style={s.mediaName} numberOfLines={1}>♪ {musicUri.split('/').pop()}</Text>
                    : <Text style={s.mediaSub}>{t('hostPanel.musicOptional')}</Text>
                  }
                </>
              ) : (
                <>
                  <TextInput
                    style={s.inp}
                    placeholder={t('hostPanel.youtubePlaceholder')}
                    placeholderTextColor="#444"
                    value={youtubeUrl}
                    onChangeText={parseYouTubeUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  {youtubeVideoId
                    ? <Text style={s.mediaName}>{t('hostPanel.youtubeDetected', { id: youtubeVideoId })}</Text>
                    : <Text style={s.mediaSub}>
                        {youtubeUrl.length > 5 ? t('hostPanel.youtubeInvalid') : t('hostPanel.youtubeHint')}
                      </Text>
                  }
                </>
              )}
              <Text style={[s.lbl, { marginTop: 16 }]}>{t('hostPanel.videoLabel')}</Text>
              <View style={s.uploadRow}>
                <TouchableOpacity style={s.uploadBtn} onPress={pickVideo}>
                  <Text style={s.uploadTxt}>{videoUri ? t('hostPanel.changeVideo') : t('hostPanel.pickVideo')}</Text>
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
                <Text style={s.mediaSub}>{t('hostPanel.videoOptional')}</Text>
              )}
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>              
              <TextInput style={s.inp} placeholder={t('hostPanel.eventNamePlaceholder')} placeholderTextColor="#444" value={name} onChangeText={setName} />
              <View style={s.row}>
                <TextInput style={[s.inp, { flex: 1 }]} placeholder={t('hostPanel.datePlaceholder')} placeholderTextColor="#444" value={date} onChangeText={setDate} />
                <View style={{ width: 8 }} />
                <TextInput style={[s.inp, { flex: 1 }]} placeholder={t('hostPanel.timePlaceholder')} placeholderTextColor="#444" value={time} onChangeText={setTime} />
              </View>
              <TextInput style={s.inp} placeholder={t('hostPanel.locationPlaceholder')} placeholderTextColor="#444" value={location} onChangeText={setLocation} />
              <TextInput style={s.inp} placeholder={t('hostPanel.emailPlaceholder')} placeholderTextColor="#444" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <TextInput style={s.inp} placeholder={t('hostPanel.dressCodePlaceholder')} placeholderTextColor="#444" value={dressCode} onChangeText={setDressCode} />

              <Text style={[s.lbl, { marginTop: 8 }]}>{t('hostPanel.dressCodeImageLabel')}</Text>
              <View style={s.uploadRow}>
                <TouchableOpacity style={s.uploadBtn} onPress={pickDressCodeImage}>
                  <Text style={s.uploadTxt}>{dressCodeImage ? t('hostPanel.changeDressImage') : t('hostPanel.pickDressImage')}</Text>
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
                <Text style={s.mediaSub}>{t('hostPanel.dressImageOptional')}</Text>
              )}

              {source && (
                <Text style={[s.src, { color: source === 'api' ? '#4ade80' : '#fbbf24' }]}>
                  {source === 'api' ? t('hostPanel.sourceApi') : t('hostPanel.sourceLocal')}
                </Text>
              )}
            </>
          )}

          {/* NAVIGATION */}
          <View style={s.navRow}>
            {step > 1 && (
              <TouchableOpacity style={s.backBtn} onPress={() => setStep(s => s - 1)}>
                <Text style={s.backTxt}>{t('common.back')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[s.nextBtn, step === 1 && s.nextBtnFull]} onPress={goNext}>
              <Text style={s.nextTxt}>
                {step < 3 ? t('common.next') : isEditing ? t('hostPanel.update') : t('hostPanel.generate')}
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
