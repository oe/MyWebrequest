import { loadLocalePreference } from './ui-preferences';
import { browserLocaleCandidates, resolveLocale } from '@/ui/i18n/core';
import { actionStateCopy } from '@/ui/action-state-copy';

export async function updateActionState(state: 'active' | 'paused' | 'error'): Promise<void> {
  if (typeof browser === 'undefined' || !browser.action) return;
  try {
    const preference = await loadLocalePreference();
    const locale = preference === 'system' ? resolveLocale(browserLocaleCandidates()) : preference;
    const copy = actionStateCopy[locale];
    const paused = state === 'paused';
    await browser.action.setIcon({
      path: paused
        ? { 16: 'icon/paused-16.png', 32: 'icon/paused-32.png', 48: 'icon/paused-48.png' }
        : { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png' },
    });
    // The icon and badge describe applied runtime state, never a pending toggle.
    await browser.action.setBadgeBackgroundColor({ color: state === 'error' ? '#B91C1C' : '#92400E' });
    await browser.action.setBadgeTextColor({ color: '#FFFFFF' });
    await browser.action.setBadgeText({ text: state === 'error' ? '!' : '' });
    await browser.action.setTitle({
      title: state === 'active' ? 'RequestOrbit' : `RequestOrbit · ${copy[state]}`,
    });
  } catch (error) {
    console.error('Could not update toolbar state.', error);
  }
}
