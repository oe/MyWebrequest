import { stateKey } from '@/application/runtime-controller';
import { commitRuleState } from '@/application/rule-transaction';
import type { RuleRuntimeSnapshot } from '@/application/rule-runtime-snapshot';
import type { StoredState } from '@/domain/rules/model';
import { getInstalledDynamicRuleIds, readPermissionChecker, reconcileDynamicRules } from './rule-runtime';
import { saveState } from './rule-store';

export const RUNTIME_MESSAGE = 'requestorbit.runtime.v1';
export type RuntimeRequest =
  | { type: typeof RUNTIME_MESSAGE; operation: 'snapshot' }
  | { type: typeof RUNTIME_MESSAGE; operation: 'commit'; previous: StoredState; next: StoredState };
export type RuntimeResponse =
  | { ok: false; error: string }
  | { ok: true; state: StoredState; permissions: Record<string, boolean>; installedRuleIds: number[] | null };

function hasMessaging() {
  return typeof browser !== 'undefined' && Boolean(browser.runtime?.sendMessage);
}

async function request(message: RuntimeRequest): Promise<Extract<RuntimeResponse, { ok: true }>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let response: RuntimeResponse;
  try {
    response = await Promise.race([
      browser.runtime.sendMessage(message) as Promise<RuntimeResponse>,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('Background runtime did not respond. Please retry.')),
          message.operation === 'commit' ? 20_000 : 5_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
  if (!response?.ok) throw new Error(response?.error ?? 'Background runtime unavailable.');
  return response;
}

export async function readRuntimeSnapshot(
  state: StoredState,
): Promise<RuleRuntimeSnapshot & { state: StoredState }> {
  if (hasMessaging()) {
    const message = { type: RUNTIME_MESSAGE, operation: 'snapshot' } as const;
    const response = await request(message).catch(() => request(message));
    return {
      state: response.state,
      permissions: response.permissions,
      installedRuleIds: response.installedRuleIds === null ? null : new Set(response.installedRuleIds),
    };
  }
  const [check, installedRuleIds] = await Promise.all([
    readPermissionChecker(),
    getInstalledDynamicRuleIds(),
  ]);
  return {
    state,
    permissions: Object.fromEntries(
      state.order.map((id) => [id, Boolean(state.rules[id] && check(state.rules[id]))]),
    ),
    installedRuleIds,
  };
}

export async function commitRuntimeState(
  previous: StoredState,
  next: StoredState,
): Promise<RuleRuntimeSnapshot & { state: StoredState }> {
  if (hasMessaging()) {
    let response: Extract<RuntimeResponse, { ok: true }>;
    try {
      response = await request({ type: RUNTIME_MESSAGE, operation: 'commit', previous, next });
    } catch (error) {
      // A worker can stop after committing but before replying. Read/recover
      // the authoritative outcome instead of replaying a potentially applied edit.
      const recovered = await readRuntimeSnapshot(previous);
      if (stateKey(recovered.state) !== stateKey(next)) throw error;
      return recovered;
    }
    return {
      state: response.state,
      permissions: response.permissions,
      installedRuleIds: response.installedRuleIds === null ? null : new Set(response.installedRuleIds),
    };
  }
  await commitRuleState(previous, next, { reconcile: reconcileDynamicRules, save: saveState });
  return readRuntimeSnapshot(next);
}
