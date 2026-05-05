import { useCallback, useEffect, useState } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

export function useBackgroundAudio(musicUri: string) {
  const player = useAudioPlayer(musicUri ? { uri: musicUri } : undefined);
  // Começa como true sempre que há música — o usuário precisa tocar para destravá-la
  const [needsUnlock, setNeedsUnlock] = useState(!!musicUri);

  // Atualiza quando a URI muda (ex: troca de evento)
  useEffect(() => {
    setNeedsUnlock(!!musicUri);
    if (!musicUri) player.pause();
  }, [musicUri]);

  const unlock = useCallback(() => {
    if (!musicUri) return;
    setAudioModeAsync({ playsInSilentMode: true })
      .catch(() => {})
      .finally(() => {
        player.loop = true;
        player.volume = 0.75;
        player.play();
        setNeedsUnlock(false);
      });
  }, [musicUri, player]);

  return { playing: !!musicUri && !needsUnlock, needsUnlock, unlock };
}
