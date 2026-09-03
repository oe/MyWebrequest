import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { loadThemePreference } from '@/infrastructure/theme-preferences';
import { I18nProvider } from '@/ui/i18n';
import { OptionsApp } from '@/ui/surfaces/options-app';
import { applyTheme, ThemeProvider } from '@/ui/theme';
import './style.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Options root element is missing.');
}

const initialThemePreference = await loadThemePreference().catch(() => 'system' as const);
applyTheme(initialThemePreference);

createRoot(root).render(
  <StrictMode>
    <ThemeProvider initialPreference={initialThemePreference}>
      <I18nProvider>
        <OptionsApp />
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);
