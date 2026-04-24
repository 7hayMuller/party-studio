import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
  Image
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import HostPanel from "../src/screens/HostPanel";
import IntroScreen from "../src/screens/IntroScreen";
import FormScreen from "../src/screens/FormScreen";
import ConfirmScreen from "../src/screens/ConfirmScreen";
import LoginScreen from "../src/screens/LoginScreen";
import HostMenu from "../src/screens/HostMenu";
import { useTheme } from "../src/hooks/useTheme";
import { EVENT_CONFIG, EventConfig } from "../src/config/theme";
import { ThemeInput, publishEvent, updateEvent, loadEvent } from "../src/services/ai";
import { uploadMediaFile } from "../src/services/storage";
import { HostPanelInitialValues } from "../src/screens/HostPanel";
import { useTranslation } from "react-i18next";
import { useAuth } from "../src/context/AuthContext";
import { getAccessToken, signOut } from "../src/services/auth";
import { useBackgroundAudio } from "../src/hooks/useBackgroundAudio";
import YouTubePlayer from "../src/components/YouTubePlayer";

const FREE_REGENS = 2;

type Screen = "editing" | "preview" | "intro" | "form" | "confirm";

const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL || "https://party-studio.vercel.app";

export default function Host() {
  const { session, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!session) return <LoginScreen />;
  return <HostContent />;
}

function HostContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, loading, source, generate } = useTheme();
  const [event, setEvent] = useState<EventConfig>(EVENT_CONFIG);
  const [screen, setScreen] = useState<Screen>("editing");
  const [lastInput, setLastInput] = useState<{
    input: ThemeInput;
    ev: EventConfig;
  } | null>(null);
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [shareModal, setShareModal] = useState<{
    eventId: string;
    url: string;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Edição de convite existente
  const [editingEventId, setEditingEventId]       = useState<string | null>(null);
  const [panelInitialValues, setPanelInitialValues] = useState<HostPanelInitialValues | undefined>();

  // Contador de regenerações e paywall
  const [regenCount, setRegenCount]     = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Áudio persiste durante preview e simulação
  const simulating = screen === 'preview' || screen === 'intro' || screen === 'form' || screen === 'confirm';
  const { playing: musicPlaying } = useBackgroundAudio(simulating ? ((event as any).musicUri ?? '') : '');

  const handleGenerate = async (input: ThemeInput, ev: EventConfig) => {
    if (!editingEventId) setRegenCount(0);
    setLastInput({ input, ev });
    setEvent(ev);
    await generate(input);
    setScreen("preview");
  };

  const handleRegenerate = async () => {
    if (!lastInput) return;
    if (regenCount >= FREE_REGENS) {
      setPaywallVisible(true);
      return;
    }
    setRegenCount(c => c + 1);
    setScreen("editing");
    setEvent(lastInput.ev);
    await generate(lastInput.input);
    setScreen("preview");
  };

  const handleEditEvent = async (ev: any) => {
    try {
      const data = await loadEvent(ev.id);
      const td = data.theme as any;
      const e = data.event as any;
      setPanelInitialValues({
        a1: td?.a1, a2: td?.a2, bg: td?.bg,
        partyTitle: td?.partyTitle, description: td?.description,
        name: e?.name, date: e?.date, time: e?.time,
        location: e?.location, email: e?.hostEmail,
        dressCode: e?.dressCode, musicUri: e?.musicUri,
        videoUri: e?.videoUri, youtubeVideoId: e?.youtubeVideoId,
      });
      setEditingEventId(ev.id);
      setRegenCount(0);
      setScreen("editing");
    } catch {
      Alert.alert(t('common.error'), t('host.editLoadError'));
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      let publishTheme = { ...theme };
      let publishEv    = { ...event } as typeof event & { musicUri: string; videoUri: string };

      if ((event as any).musicUri) {
        (publishEv as any).musicUri = await uploadMediaFile((event as any).musicUri, 'music');
      }
      if ((event as any).videoUri) {
        (publishEv as any).videoUri = await uploadMediaFile((event as any).videoUri, 'video');
      }
      if (theme.imageUrl && !theme.imageUrl.startsWith('http')) {
        publishTheme = { ...publishTheme, imageUrl: await uploadMediaFile(theme.imageUrl, 'image') };
      }

      await AsyncStorage.multiSet([
        ["rsvp_theme", JSON.stringify(publishTheme)],
        ["rsvp_event", JSON.stringify(publishEv)],
      ]);

      const token = await getAccessToken();
      let eventId: string;

      if (editingEventId) {
        await updateEvent(editingEventId, publishTheme, publishEv, token!);
        eventId = editingEventId;
        setEditingEventId(null);
        setPanelInitialValues(undefined);
      } else {
        eventId = await publishEvent(publishTheme, publishEv, token ?? undefined);
      }

      const url = `${WEB_URL}/guest?id=${eventId}`;
      setShareModal({ eventId, url });
    } catch (e: any) {
      console.error("[publicar] erro:", e?.message, e);
      const msg = e?.message ?? t('host.publishError');
      if (Platform.OS === "web") {
        window.alert(t('host.publishError') + ": " + msg);
      } else {
        Alert.alert(t('host.publishError'), msg);
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleShare = async () => {
    if (!shareModal) return;
    const eventName = event.name || "Evento";
    const message = t('host.shareMessage', { name: eventName, url: shareModal.url });

    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: eventName,
          text: message,
          url: shareModal.url,
        });
      } else {
        await (navigator as any).clipboard.writeText(shareModal.url);
        Alert.alert(t('host.linkCopied'), t('host.linkCopiedBody'));
      }
    } else {
      await Share.share({ message, url: shareModal.url });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleConfirm = (n: string, g: number, _msg: string) => {
    setName(n);
    setGuests(g);
    setScreen("confirm");
  };

  return (
    <View style={s.root}>
      <View style={screen === "editing" ? { flex: 1 } : { display: "none" }}>
        <HostPanel
          key={editingEventId ?? "new"}
          onGenerate={handleGenerate}
          loading={loading}
          source={source}
          theme={theme}
          initialValues={panelInitialValues}
          isEditing={!!editingEventId}
        />
        <TouchableOpacity style={s.menuBtn} onPress={() => setMenuOpen(true)}>
          <Text style={s.menuIco}>≡</Text>
        </TouchableOpacity>
      </View>

      {screen === "preview" && (
        <View style={{ flex: 1 }}>
          <IntroScreen
            theme={theme}
            event={event}
            onNext={() => setScreen("intro")}
            musicPlaying={musicPlaying || !!event.youtubeVideoId}
          />

          <View style={s.previewBar}>
            <View style={s.previewTag}>
              <Text style={s.previewTagTxt}>{t('host.previewTag')}</Text>
            </View>
            <View style={s.previewActions}>
              <TouchableOpacity
                style={[s.previewBtn, s.regenBtn]}
                onPress={handleRegenerate}
                disabled={loading}
              >
                <Text style={s.regenTxt}>
                  {loading ? "..." : regenCount >= FREE_REGENS
                    ? t('host.regenerateLocked')
                    : t('host.regenerate', { count: FREE_REGENS - regenCount })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.previewBtn, s.simulateBtn]}
                onPress={() => setScreen("intro")}
              >
                <Text style={s.simulateTxt}>{t('host.simulate')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.previewBtn, s.publishBtn]}
                onPress={handlePublish}
                disabled={publishing}
              >
                {publishing ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={s.publishTxt}>{t('host.publish')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {(screen === "intro" || screen === "form" || screen === "confirm") && (
        <>
          {/* YouTubePlayer persiste durante a simulação */}
          <YouTubePlayer videoId={event.youtubeVideoId || ''} />

          {screen === "intro" && (
            <IntroScreen
              theme={theme}
              event={event}
              onNext={() => setScreen("form")}
              musicPlaying={musicPlaying || !!event.youtubeVideoId}
            />
          )}
          {screen === "form" && (
            <FormScreen theme={theme} event={event} onConfirm={handleConfirm} />
          )}
          {screen === "confirm" && (
            <ConfirmScreen
              theme={theme}
              event={event}
              name={name}
              guests={guests}
              onReset={() => {
                setName("");
                setGuests(0);
                setScreen("editing");
              }}
            />
          )}

          {/* Barra de simulação */}
          <View style={s.simBar}>
            <View style={s.previewTag}>
              <Text style={s.previewTagTxt}>{t('host.simulatingTag')}</Text>
            </View>
            <View style={s.previewActions}>
              <TouchableOpacity
                style={[s.previewBtn, s.regenBtn]}
                onPress={() => setScreen("editing")}
              >
                <Text style={s.regenTxt}>{t('host.backToEdit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.previewBtn, s.publishBtn]}
                onPress={handlePublish}
                disabled={publishing}
              >
                {publishing ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={s.publishTxt}>{t('host.publish')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <HostMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={() => {
          setMenuOpen(false);
          handleSignOut();
        }}
        onEdit={handleEditEvent}
      />

      {/* Modal de paywall — regenerações esgotadas */}
      <Modal visible={paywallVisible} transparent animationType="fade">
        <Pressable style={s.overlay} onPress={() => setPaywallVisible(false)}>
          <Pressable style={s.modal} onPress={e => e.stopPropagation()}>
            <Text style={s.paywallIcon}>✦</Text>
            <Text style={s.modalTitle}>{t('host.paywallTitle')}</Text>
            <Text style={s.paywallSub}>{t('host.paywallBody', { count: FREE_REGENS })}</Text>
            <View style={s.paywallBadge}>
              <Text style={s.paywallBadgeTxt}>{t('host.paywallBadge')}</Text>
            </View>
            <TouchableOpacity style={s.paywallClose} onPress={() => setPaywallVisible(false)}>
              <Text style={s.paywallCloseTxt}>{t('common.close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de compartilhamento pós-publicação */}
      <Modal visible={!!shareModal} transparent animationType="fade">
        <Pressable
          style={s.overlay}
          onPress={() => {
            setShareModal(null);
            router.push("/guest");
          }}
        >
          <Pressable style={s.modal} onPress={(e) => e.stopPropagation()}>
            <View style={s.logoWrap}>
              <Image
                source={require("../assets/check.png")}
                style={s.logoImg}
                resizeMode="contain"
              />
              <Text style={s.modalTitle}>{t('host.shareTitle')}</Text>
              <Text style={s.modalSub}>{t('host.shareSubtitle')}</Text>
            </View>

            <View style={s.codeBox}>
              <Text style={s.codeLabel}>{t('host.eventCode')}</Text>
              <Text style={s.code}>{shareModal?.eventId}</Text>
            </View>

            <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
              <Text style={s.shareBtnTxt}>{t('host.shareBtn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.guestBtn}
              onPress={() => {
                setShareModal(null);
                router.push("/guest");
              }}
            >
              <Text style={s.guestBtnTxt}>{t('host.viewAsGuest')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  logoWrap: { alignItems: "center", marginBottom: 10 },
  logoImg: { width: 500, height: 200 },
  logoSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1,
    marginTop: -50,
    marginBottom: 24,
    textAlign: "center",
  },

  simBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 10,
  },
  previewBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 10,
  },
  previewTag: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  previewTagTxt: {
    fontSize: 8,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.35)",
  },
  previewActions: { flexDirection: "row", gap: 10 },
  previewBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  regenBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  regenTxt: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    letterSpacing: 1,
  },
  simulateBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  simulateTxt: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 1,
  },
  publishBtn: { backgroundColor: "#fff", borderColor: "#fff" },
  publishTxt: {
    fontSize: 11,
    color: "#000",
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0f0f18",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  modalIcon: { fontSize: 40, marginBottom: 4 },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  modalSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    marginBottom: 8,
  },

  codeBox: {
    width: "100%",
    backgroundColor: "rgba(0,220,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,220,255,0.3)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 8,
  },
  codeLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: "rgba(0,220,255,0.6)",
    marginBottom: 6,
  },
  code: { fontSize: 32, fontWeight: "900", color: "#00dcff", letterSpacing: 6 },

  shareBtn: {
    width: "100%",
    backgroundColor: "#FF4FA3",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  shareBtnTxt: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 2,
  },

  guestBtn: { paddingVertical: 12 },
  guestBtnTxt: { fontSize: 12, color: "#FF4FA3", letterSpacing: 1 },

  paywallIcon: { fontSize: 32, color: "#FF4FA3", marginBottom: 12 },
  paywallSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  paywallBadge: {
    backgroundColor: "rgba(255,79,163,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,79,163,0.3)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  paywallBadgeTxt: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FF4FA3",
    letterSpacing: 2,
  },
  paywallClose: { paddingVertical: 12 },
  paywallCloseTxt: { fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 1 },

  menuBtn: {
    position: "absolute",
    top: 40,
    right: 16,
    width: 36,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIco: { fontSize: 18, color: "rgba(255,255,255,0.5)", lineHeight: 20 },
});
