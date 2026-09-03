export const themePreferences = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof themePreferences)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export function normalizeThemePreference(value: unknown): ThemePreference {
  return themePreferences.includes(value as ThemePreference) ? (value as ThemePreference) : 'system';
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}
