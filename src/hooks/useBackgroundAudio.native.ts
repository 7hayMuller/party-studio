import { useCallback, useEffect, useState } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

export function useBackgroundAudio(musicUri: string) {
  const player = useAudioPlayer(musicUri ? { uri: musicUri } : undefined);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!musicUri) {
      player.pause();
      setPlaying(false);
    }
    // Não faz autoplay — aguarda unlock() pelo gesto do usuário
  }, [musicUri]);

  const unlock = useCallback(() => {
    if (!musicUri) return;
    setAudioModeAsync({ playsInSilentMode: true })
      .catch(() => {})
      .finally(() => {
        player.loop = true;
        player.volume = 0.75;
        player.play();
        setPlaying(true);
      });
  }, [musicUri, player]);

  return { playing, unlock };
}
