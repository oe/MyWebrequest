import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSampleState } from '@/domain/rules/fixtures';
import {
  clearRuleImportRecovery,
  loadRuleImportRecovery,
  saveRuleImportRecovery,
  type RuleImportRecovery,
} from '@/infrastructure/rule-import-recovery';

describe('rule import recovery storage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('saves, loads, and clears one bounded recovery snapshot', async () => {
    let stored: unknown;
    const local = {
      get: vi.fn(async () => ({ ruleImportRecovery: stored })),
      set: vi.fn(async (value: Record<string, unknown>) => {
        stored = value.ruleImportRecovery;
      }),
      remove: vi.fn(async () => {
        stored = undefined;
      }),
    };
    vi.stubGlobal('browser', { storage: { local } });
    const recovery: RuleImportRecovery = {
      version: 1,
      createdAt: '2026-09-01T00:00:00.000Z',
      state: createSampleState(),
    };

    await saveRuleImportRecovery(recovery);
    await expect(loadRuleImportRecovery()).resolves.toEqual(recovery);
    await clearRuleImportRecovery();
    await expect(loadRuleImportRecovery()).resolves.toBeNull();
  });

  it('does not load a structurally invalid snapshot', async () => {
    vi.stubGlobal('browser', {
      storage: { local: { get: vi.fn(async () => ({ ruleImportRecovery: { version: 1 } })) } },
    });
    await expect(loadRuleImportRecovery()).resolves.toBeNull();
  });
});
