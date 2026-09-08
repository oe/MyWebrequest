import { loadLocalePreference } from './ui-preferences';
import { browserLocaleCandidates, resolveLocale } from '@/ui/i18n/core';
import { actionStateCopy } from '@/ui/action-state-copy';

type ActionState = 'active' | 'paused' | 'error';
let currentState: ActionState = 'active';
const appliedStates = new WeakMap<object, { state: ActionState; locale: string }>();

export async function refreshActionState(): Promise<void> {
  await updateActionState(currentState);
}

export async function updateActionState(state: ActionState): Promise<void> {
  currentState = state;
  if (typeof browser === 'undefined' || !browser.action) return;
  try {
    const preference = await loadLocalePreference();
    const locale = preference === 'system' ? resolveLocale(browserLocaleCandidates()) : preference;
    const copy = actionStateCopy[locale];
    const applied = appliedStates.get(browser.action);
    if (applied?.state === state && applied.locale === locale) return;
    const paused = state === 'paused';
    if (applied?.state !== state) {
      await browser.action.setIcon({
        path: paused
          ? { 16: 'icon/paused-16.png', 32: 'icon/paused-32.png', 48: 'icon/paused-48.png' }
          : { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png' },
      });
      // The icon and badge describe applied runtime state, never a pending toggle.
      await browser.action.setBadgeBackgroundColor({ color: state === 'error' ? '#B91C1C' : '#92400E' });
      await browser.action.setBadgeTextColor({ color: '#FFFFFF' });
      await browser.action.setBadgeText({ text: state === 'error' ? '!' : '' });
    }
    await browser.action.setTitle({
      title: state === 'active' ? 'RequestOrbit' : `RequestOrbit · ${copy[state]}`,
    });
    appliedStates.set(browser.action, { state, locale });
  } catch (error) {
    console.error('Could not update toolbar state.', error);
  }
}
