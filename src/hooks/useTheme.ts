import { useState, useCallback } from 'react';
import { AppTheme, BASE_THEME } from '../config/theme';
import { generateTheme, localTheme, ThemeInput } from '../services/ai';

export function useTheme() {
  const [theme, setTheme] = useState<AppTheme>(BASE_THEME);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'api' | 'local' | null>(null);

  const generate = useCallback(async (input: ThemeInput): Promise<AppTheme> => {
    setLoading(true);
    try {
      const t = await generateTheme(input);
      setTheme(t);
      setSource('api');
      return t;
    } catch (e: any) {
      console.warn('[useTheme] backend falhou, usando preset local:', e?.message);
      const t = localTheme(input);
      setTheme(t);
      setSource('local');
      return t;
    } finally {
      setLoading(false);
    }
  }, []);

  return { theme, loading, source, generate };
}
