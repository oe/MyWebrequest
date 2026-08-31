import type { StoredState } from '@/domain/rules/model';

export type RuleStateTransactionPorts = {
  reconcile: (state: StoredState) => Promise<void>;
  save: (state: StoredState) => Promise<void>;
};

export class RuleStateCompensationError extends Error {
  readonly saveError: unknown;
  readonly compensationError: unknown;

  constructor(saveError: unknown, compensationError: unknown) {
    super('Saving rule state failed, and restoring the previous browser rules also failed.');
    this.name = 'RuleStateCompensationError';
    this.saveError = saveError;
    this.compensationError = compensationError;
  }
}

export async function commitRuleState(
  previousState: StoredState,
  nextState: StoredState,
  ports: RuleStateTransactionPorts,
): Promise<void> {
  await ports.reconcile(nextState);

  try {
    await ports.save(nextState);
  } catch (saveError) {
    try {
      await ports.reconcile(previousState);
    } catch (compensationError) {
      throw new RuleStateCompensationError(saveError, compensationError);
    }
    throw saveError;
  }
}
