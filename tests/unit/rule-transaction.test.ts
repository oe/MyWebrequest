import { describe, expect, it, vi } from 'vitest';

import { commitRuleState } from '@/application/rule-transaction';
import { createEmptyState, createSampleState } from '@/domain/rules/fixtures';

describe('rule state transaction', () => {
  it('applies browser rules before committing storage', async () => {
    const calls: string[] = [];
    const previous = createEmptyState();
    const next = createSampleState();

    await commitRuleState(previous, next, {
      reconcile: vi.fn(async () => {
        calls.push('reconcile');
      }),
      save: vi.fn(async () => {
        calls.push('save');
      }),
    });

    expect(calls).toEqual(['reconcile', 'save']);
  });

  it('does not write storage when applying browser rules fails', async () => {
    const applyError = new Error('DNR rejected the rule');
    const save = vi.fn(async () => undefined);

    await expect(
      commitRuleState(createEmptyState(), createSampleState(), {
        reconcile: vi.fn(async () => Promise.reject(applyError)),
        save,
      }),
    ).rejects.toBe(applyError);
    expect(save).not.toHaveBeenCalled();
  });

  it('restores the previous browser rules when storage fails', async () => {
    const previous = createEmptyState();
    const next = createSampleState();
    const saveError = new Error('storage unavailable');
    const reconcile = vi.fn(async () => undefined);

    await expect(
      commitRuleState(previous, next, {
        reconcile,
        save: vi.fn(async () => Promise.reject(saveError)),
      }),
    ).rejects.toBe(saveError);
    expect(reconcile).toHaveBeenNthCalledWith(1, next);
    expect(reconcile).toHaveBeenNthCalledWith(2, previous);
  });

  it('preserves both errors when compensation also fails', async () => {
    const saveError = new Error('storage unavailable');
    const compensationError = new Error('DNR rollback unavailable');
    const reconcile = vi
      .fn<(state: ReturnType<typeof createEmptyState>) => Promise<void>>()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(compensationError);

    const result = commitRuleState(createEmptyState(), createSampleState(), {
      reconcile,
      save: vi.fn(async () => Promise.reject(saveError)),
    });

    await expect(result).rejects.toMatchObject({
      name: 'RuleStateCompensationError',
      saveError,
      compensationError,
    });
  });
});
