import { resolveTheme, type ResolvedTheme, type ThemePreference } from './core';

export const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

export function systemPrefersDark(): boolean {
  return globalThis.matchMedia?.(DARK_MODE_QUERY).matches ?? false;
}

export function applyTheme(preference: ThemePreference, systemDark = systemPrefersDark()): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference, systemDark);
  const root = document.documentElement;
  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;
  return resolvedTheme;
}
