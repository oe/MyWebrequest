import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { loadThemePreference } from '@/infrastructure/theme-preferences';
import { I18nProvider } from '@/ui/i18n';
import { PopupApp } from '@/ui/surfaces/popup-app';
import { applyTheme, ThemeProvider } from '@/ui/theme';
import './style.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Popup root element is missing.');
}

const initialThemePreference = await loadThemePreference().catch(() => 'system' as const);
applyTheme(initialThemePreference);

createRoot(root).render(
  <StrictMode>
    <ThemeProvider initialPreference={initialThemePreference}>
      <I18nProvider>
        <PopupApp />
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);
