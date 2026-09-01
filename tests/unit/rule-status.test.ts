import { describe, expect, it } from 'vitest';

import { sampleRules } from '@/domain/rules/fixtures';
import { deriveRuleStatus } from '@/domain/rules/validate';

describe('rule operational status', () => {
  const activeRule = sampleRules[1];

  it('reports a globally paused enabled rule as paused', () => {
    expect(activeRule).toBeDefined();
    if (!activeRule) return;

    expect(deriveRuleStatus(activeRule, true, { globallyPaused: true, isInstalled: false })).toBe('paused');
  });

  it('does not claim an enabled permitted rule is active when DNR did not install it', () => {
    expect(activeRule).toBeDefined();
    if (!activeRule) return;

    expect(deriveRuleStatus(activeRule, true, { isInstalled: false })).toBe('not-applied');
  });

  it('surfaces runtime inspection failures instead of claiming success', () => {
    expect(activeRule).toBeDefined();
    if (!activeRule) return;

    expect(deriveRuleStatus(activeRule, true, { runtimeError: true })).toBe('runtime-error');
  });

  it('does not mislabel an unknown permission snapshot as a denied permission after a runtime failure', () => {
    expect(activeRule).toBeDefined();
    if (!activeRule) return;

    expect(deriveRuleStatus(activeRule, false, { runtimeError: true })).toBe('runtime-error');
  });
});
