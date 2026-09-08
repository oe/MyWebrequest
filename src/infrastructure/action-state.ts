import { loadLocalePreference } from './ui-preferences';
import { browserLocaleCandidates, resolveLocale } from '@/ui/i18n/core';
import { actionStateCopy } from '@/ui/action-state-copy';

export async function updateActionState(state: 'active' | 'paused' | 'error'): Promise<void> {
  if (typeof browser === 'undefined' || !browser.action) return;
  try {
    const preference = await loadLocalePreference();
    const locale = preference === 'system' ? resolveLocale(browserLocaleCandidates()) : preference;
    const copy = actionStateCopy[locale];
    // Set the color before showing text; the badge always describes applied runtime state.
    await browser.action.setBadgeBackgroundColor({ color: state === 'error' ? '#B91C1C' : '#92400E' });
    await browser.action.setBadgeTextColor({ color: '#FFFFFF' });
    await browser.action.setBadgeText({ text: state === 'active' ? '' : state === 'paused' ? 'Ⅱ' : '!' });
    await browser.action.setTitle({
      title: state === 'active' ? 'RequestOrbit' : `RequestOrbit · ${copy[state]}`,
    });
  } catch (error) {
    console.error('Could not update toolbar state.', error);
  }
}
