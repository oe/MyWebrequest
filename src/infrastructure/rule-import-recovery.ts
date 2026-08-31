import { z } from 'zod/v3';

import type { StoredState } from '@/domain/rules/model';
import { storedStateSchema } from '@/domain/rules/schema';

const STORAGE_KEY = 'ruleImportRecovery';
const PREVIEW_KEY = 'request-rules-import-recovery';

const recoverySchema = z.object({
  version: z.literal(1),
  createdAt: z.string().datetime(),
  state: storedStateSchema,
});

export type RuleImportRecovery = {
  version: 1;
  createdAt: string;
  state: StoredState;
};

function hasExtensionStorage(): boolean {
  return typeof browser !== 'undefined' && Boolean(browser.storage?.local);
}

export async function loadRuleImportRecovery(): Promise<RuleImportRecovery | null> {
  let candidate: unknown;
  if (hasExtensionStorage()) {
    const stored = await browser.storage.local.get(STORAGE_KEY);
    candidate = stored[STORAGE_KEY];
  } else {
    const serialized = globalThis.localStorage?.getItem(PREVIEW_KEY);
    if (!serialized) return null;
    try {
      candidate = JSON.parse(serialized);
    } catch {
      return null;
    }
  }
  const parsed = recoverySchema.safeParse(candidate);
  return parsed.success ? (parsed.data as RuleImportRecovery) : null;
}

export async function saveRuleImportRecovery(recovery: RuleImportRecovery): Promise<void> {
  const parsed = recoverySchema.parse(recovery);
  if (hasExtensionStorage()) {
    await browser.storage.local.set({ [STORAGE_KEY]: parsed });
    return;
  }
  globalThis.localStorage?.setItem(PREVIEW_KEY, JSON.stringify(parsed));
}

export async function clearRuleImportRecovery(): Promise<void> {
  if (hasExtensionStorage()) {
    await browser.storage.local.remove(STORAGE_KEY);
    return;
  }
  globalThis.localStorage?.removeItem(PREVIEW_KEY);
}
