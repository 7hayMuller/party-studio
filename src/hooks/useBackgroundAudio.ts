import { useEffect } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

export function useBackgroundAudio(musicUri: string) {
  const player = useAudioPlayer(musicUri ? { uri: musicUri } : undefined);

  useEffect(() => {
    if (!musicUri) {
      player.pause();
      return;
    }
    setAudioModeAsync({ playsInSilentMode: true })
      .then(() => {
        player.loop = true;
        player.volume = 0.75;
        player.play();
      })
      .catch(() => {});

    return () => {
      player.pause();
    };
  }, [musicUri]);

  return { playing: !!musicUri };
}
