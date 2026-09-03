import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

import { saveThemePreference, subscribeToThemePreference } from '@/infrastructure/theme-preferences';
import { applyTheme, DARK_MODE_QUERY, systemPrefersDark } from './apply';
import { resolveTheme, type ThemePreference } from './core';
import { ThemeContext } from './context';

export function ThemeProvider({
  children,
  initialPreference,
}: {
  children: ReactNode;
  initialPreference: ThemePreference;
}) {
  const [preference, setPreferenceState] = useState(initialPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const resolvedTheme = resolveTheme(preference, systemDark);
  const setPreference = useCallback(async (next: ThemePreference) => {
    await saveThemePreference(next);
    setPreferenceState(next);
  }, []);
  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  useEffect(() => {
    const media = globalThis.matchMedia?.(DARK_MODE_QUERY);
    if (!media) return;
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => subscribeToThemePreference(setPreferenceState), []);

  useLayoutEffect(() => {
    applyTheme(preference, systemDark);
  }, [preference, systemDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
