import { useCallback, useEffect, useRef, useState } from 'react';

export function useBackgroundAudio(musicUri: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!musicUri) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setPlaying(false);
      return;
    }

    const audio = new Audio(musicUri);
    audio.loop = true;
    audio.volume = 0.75;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [musicUri]);

  // Deve ser chamado diretamente dentro do handler de um gesto do usuário
  // para que o iOS Safari não bloqueie o play()
  const unlock = useCallback(() => {
    if (!audioRef.current || playing) return;
    audioRef.current.play()
      .then(() => setPlaying(true))
      .catch(() => {});
  }, [playing]);

  return { playing, unlock };
}
