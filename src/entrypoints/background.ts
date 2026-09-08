import { createRuntimeController } from '@/application/runtime-controller';
import type { StoredState } from '@/domain/rules/model';
import { storedStateSchema } from '@/domain/rules/schema';
import { RUNTIME_MESSAGE, type RuntimeRequest, type RuntimeResponse } from '@/infrastructure/runtime-client';
import { refreshActionState, updateActionState } from '@/infrastructure/action-state';
import { supportsLegacyMigration } from '@/infrastructure/browser-capabilities';
import { createReconciliationScheduler } from '@/application/reconciliation-scheduler';
import {
  getInstalledDynamicRuleIds,
  readPermissionChecker,
  reconcileDynamicRules,
} from '@/infrastructure/rule-runtime';
import { loadState, saveState, RULES_STORAGE_KEY } from '@/infrastructure/rule-store';

const PENDING_KEY = 'requestOrbitPendingCommit';
const controller = createRuntimeController({
  load: loadState,
  save: saveState,
  readPending: async () => {
    const value = (await browser.storage.local.get(PENDING_KEY))[PENDING_KEY] as
      { previous?: unknown; next?: unknown } | undefined;
    if (!value) return null;
    return {
      previous: storedStateSchema.parse(value.previous) as StoredState,
      next: storedStateSchema.parse(value.next) as StoredState,
    };
  },
  writePending: async (pending) => {
    await browser.storage.local.set({ [PENDING_KEY]: pending });
  },
  clearPending: async () => {
    await browser.storage.local.remove(PENDING_KEY);
  },
  reconcile: reconcileDynamicRules,
});

async function reconcile(): Promise<void> {
  try {
    await controller.synchronize();
  } catch (error) {
    await updateActionState('error');
    throw error;
  }
}

async function respond(message: RuntimeRequest): Promise<RuntimeResponse> {
  try {
    const state =
      message.operation === 'commit'
        ? await controller.commit(
            storedStateSchema.parse(message.previous) as StoredState,
            storedStateSchema.parse(message.next) as StoredState,
          )
        : await controller.synchronize();
    const [check, installed] = await Promise.all([readPermissionChecker(), getInstalledDynamicRuleIds()]);
    return {
      ok: true,
      state,
      permissions: Object.fromEntries(
        state.order.map((id) => [id, Boolean(state.rules[id] && check(state.rules[id]))]),
      ),
      installedRuleIds: installed ? [...installed] : null,
    };
  } catch (error) {
    await updateActionState('error');
    return { ok: false, error: error instanceof Error ? error.message : 'Rule update failed.' };
  }
}

const scheduler = createReconciliationScheduler(reconcile, (error) => {
  console.error('Rule reconciliation failed.', error);
});

export default defineBackground(() => {
  // Returning true keeps the response channel open on the supported Chromium
  // floor. Processing belongs to this context even if the sender is closed.
  browser.runtime.onMessage.addListener((message: RuntimeRequest, sender, sendResponse) => {
    if (
      sender.id !== browser.runtime.id ||
      message?.type !== RUNTIME_MESSAGE ||
      !['snapshot', 'commit'].includes(message.operation)
    )
      return;
    void respond(message).then(sendResponse);
    return true;
  });
  browser.runtime.onInstalled.addListener((details) => {
    scheduler.schedule();
    if (
      supportsLegacyMigration() &&
      details.reason === 'update' &&
      details.previousVersion?.startsWith('0.')
    ) {
      void browser.storage.local.set({ requestOrbitLegacyUpgrade: true }).catch((error: unknown) => {
        console.error('Could not record legacy upgrade.', error);
      });
    }
  });
  browser.runtime.onStartup.addListener(scheduler.schedule);

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes[RULES_STORAGE_KEY]) scheduler.schedule();
    if (changes['ui.locale']) void scheduler.whenIdle().then(refreshActionState);
  });

  const permissionsChanged = () => {
    controller.invalidate();
    scheduler.schedule();
  };
  browser.permissions.onAdded.addListener(permissionsChanged);
  browser.permissions.onRemoved.addListener(permissionsChanged);

  scheduler.schedule();
});
