import { describe, expect, it, vi } from 'vitest';

import { createReconciliationScheduler } from '@/application/reconciliation-scheduler';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('service-worker reconciliation scheduler', () => {
  it('coalesces an event burst into one follow-up reconciliation', async () => {
    const first = deferred();
    const reconcile = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValue(undefined);
    const scheduler = createReconciliationScheduler(reconcile, vi.fn());

    scheduler.schedule();
    scheduler.schedule();
    scheduler.schedule();
    expect(reconcile).toHaveBeenCalledTimes(1);

    first.resolve();
    await scheduler.whenIdle();
    expect(reconcile).toHaveBeenCalledTimes(2);
  });

  it('reports a failure without poisoning the next lifecycle event', async () => {
    const failure = new Error('temporary DNR failure');
    const reconcile = vi.fn().mockRejectedValueOnce(failure).mockResolvedValue(undefined);
    const onError = vi.fn();
    const scheduler = createReconciliationScheduler(reconcile, onError);

    scheduler.schedule();
    await scheduler.whenIdle();
    expect(onError).toHaveBeenCalledWith(failure);

    scheduler.schedule();
    await scheduler.whenIdle();
    expect(reconcile).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
