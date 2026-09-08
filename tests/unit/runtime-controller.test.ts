import { describe, expect, it, vi } from 'vitest';
import {
  createRuntimeController,
  type PendingRuleCommit,
  type RuntimeControllerPorts,
} from '@/application/runtime-controller';
import { createEmptyState } from '@/domain/rules/fixtures';

function fixture() {
  let stored = createEmptyState();
  let pending: PendingRuleCommit | null = null;
  const ports: RuntimeControllerPorts = {
    load: async () => structuredClone(stored),
    save: vi.fn(async (next) => {
      stored = structuredClone(next);
    }),
    readPending: async () => pending,
    writePending: async (value) => {
      pending = structuredClone(value);
    },
    clearPending: async () => {
      pending = null;
    },
    reconcile: vi.fn(async () => {}),
  };
  return {
    ports,
    get stored() {
      return stored;
    },
    get pending() {
      return pending;
    },
  };
}

describe('background runtime controller', () => {
  it('serializes writers and rejects a stale second window without losing the first change', async () => {
    const f = fixture();
    const controller = createRuntimeController(f.ports);
    const previous = f.stored;
    const next = { ...previous, settings: { globallyPaused: true } };
    const first = controller.commit(previous, next);
    const second = controller.commit(previous, previous);
    await expect(first).resolves.toEqual(next);
    await expect(second).rejects.toThrow('another window');
    expect(f.stored).toEqual(next);
    expect(f.pending).toBeNull();
  });

  it('skips unchanged synchronization but rechecks after permission invalidation', async () => {
    const f = fixture();
    const controller = createRuntimeController(f.ports);
    await controller.synchronize();
    await controller.synchronize();
    expect(f.ports.reconcile).toHaveBeenCalledTimes(1);
    controller.invalidate();
    await controller.synchronize();
    expect(f.ports.reconcile).toHaveBeenCalledTimes(2);
  });

  it('recovers a durable intent in a fresh controller after interruption before saving', async () => {
    const f = fixture();
    const next = { ...f.stored, settings: { globallyPaused: true } };
    await f.ports.writePending({ previous: f.stored, next });
    await f.ports.reconcile(next);
    const restarted = createRuntimeController(f.ports);
    await restarted.synchronize();
    expect(f.stored).toEqual(next);
    expect(f.pending).toBeNull();
  });

  it('rolls back a failed save and does not replay that failed change after restarting', async () => {
    const f = fixture();
    const previous = structuredClone(f.stored);
    vi.mocked(f.ports.save).mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(
      createRuntimeController(f.ports).commit(previous, { ...previous, settings: { globallyPaused: true } }),
    ).rejects.toThrow('storage unavailable');
    expect(f.ports.reconcile).toHaveBeenLastCalledWith(previous);
    await createRuntimeController(f.ports).synchronize();
    expect(f.stored).toEqual(previous);
    expect(f.pending).toBeNull();
  });

  it('does not overwrite a newer external write with an old recovery record', async () => {
    const f = fixture();
    const previous = f.stored;
    await f.ports.writePending({ previous, next: { ...previous, settings: { globallyPaused: true } } });
    const external = { ...previous, order: ['external'] };
    await f.ports.save(external);
    await createRuntimeController(f.ports).synchronize();
    expect(f.stored).toEqual(external);
    expect(f.pending).toBeNull();
  });

  it('does not lose a permission event arriving during an in-flight reconciliation', async () => {
    const f = fixture();
    const controller = createRuntimeController(f.ports);
    vi.mocked(f.ports.reconcile).mockImplementationOnce(async () => {
      controller.invalidate();
    });
    await controller.synchronize();
    await controller.synchronize();
    expect(f.ports.reconcile).toHaveBeenCalledTimes(2);
  });
});
