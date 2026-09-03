import { createContext, useContext } from 'react';

import type { ResolvedTheme, ThemePreference } from './core';

export type ThemeValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

export const ThemeContext = createContext<ThemeValue>({
  preference: 'system',
  resolvedTheme: 'light',
  setPreference: async () => undefined,
});

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
