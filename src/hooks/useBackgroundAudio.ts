import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

export function useBackgroundAudio(musicUri: string) {
  const player = useAudioPlayer(musicUri ? { uri: musicUri } : undefined);
  const [needsUnlock, setNeedsUnlock] = useState(false);

  useEffect(() => {
    if (!musicUri) {
      player.pause();
      setNeedsUnlock(false);
      return;
    }

    let cancelled = false;

    setAudioModeAsync({ playsInSilentMode: true })
      .then(() => {
        if (cancelled) return;
        player.loop = true;
        player.volume = 0.75;
        player.play();
      })
      .catch(() => {
        if (!cancelled) setNeedsUnlock(true);
      });

    // Fallback: se após 2s o player não estiver tocando, pede interação do usuário
    const timer = setTimeout(() => {
      if (!cancelled && !player.playing) {
        setNeedsUnlock(true);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      player.pause();
    };
  }, [musicUri]);

  const unlock = () => {
    if (!musicUri) return;
    player.loop = true;
    player.volume = 0.75;
    player.play();
    setNeedsUnlock(false);
  };

  return { playing: !!musicUri && !needsUnlock, needsUnlock, unlock };
}
