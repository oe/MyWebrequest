import type { StoredState } from '@/domain/rules/model';

// Canonical comparison also works across storage/schema round trips, whose key
// insertion order can differ from the caller's object.
export function stateKey(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, (item as Record<string, unknown>)[key]]),
        )
      : item,
  );
}

export type PendingRuleCommit = { previous: StoredState; next: StoredState };
export type RuntimeControllerPorts = {
  load: () => Promise<StoredState>;
  save: (state: StoredState) => Promise<void>;
  readPending: () => Promise<PendingRuleCommit | null>;
  writePending: (pending: PendingRuleCommit) => Promise<void>;
  clearPending: () => Promise<void>;
  reconcile: (state: StoredState) => Promise<void>;
};

export function createRuntimeController(ports: RuntimeControllerPorts) {
  let tail: Promise<unknown> = Promise.resolve();
  let appliedKey: string | undefined;
  let generation = 0;
  const run = <T>(task: () => Promise<T>): Promise<T> => {
    const result = tail.then(task);
    tail = result.catch(() => undefined);
    return result;
  };
  const apply = async (state: StoredState) => {
    const key = stateKey(state);
    if (key === appliedKey) return;
    appliedKey = undefined;
    const startedGeneration = generation;
    await ports.reconcile(state);
    if (generation === startedGeneration) appliedKey = key;
  };
  const recover = async () => {
    const pending = await ports.readPending();
    if (!pending) return;
    const current = await ports.load();
    // A later external write takes precedence over an abandoned transaction.
    if (stateKey(current) !== stateKey(pending.previous) && stateKey(current) !== stateKey(pending.next)) {
      await ports.clearPending();
      return;
    }
    await apply(pending.next);
    await ports.save(pending.next);
    await ports.clearPending();
  };
  return {
    invalidate() {
      generation += 1;
      appliedKey = undefined;
    },
    synchronize: () =>
      run(async () => {
        await recover();
        const state = await ports.load();
        await apply(state);
        return state;
      }),
    commit: (previous: StoredState, next: StoredState) =>
      run(async () => {
        await recover();
        const current = await ports.load();
        if (stateKey(current) !== stateKey(previous))
          throw new Error('Rules changed in another window. Please retry.');
        if (stateKey(current) === stateKey(next)) return current;
        // Durable intent is written before DNR changes. A restarted background
        // completes it even if the UI or service worker disappeared mid-save.
        await ports.writePending({ previous: current, next });
        try {
          await apply(next);
          await ports.save(next);
        } catch (error) {
          // Persist the rollback intent first so interruption cannot resurrect a
          // change that has already been reported as failed to the caller.
          await ports.writePending({ previous: current, next: current });
          await apply(current);
          await ports.clearPending();
          throw error;
        }
        await ports.clearPending();
        return next;
      }),
  };
}
