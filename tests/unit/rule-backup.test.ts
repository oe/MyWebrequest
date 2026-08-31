import { describe, expect, it } from 'vitest';

import { createRuleBackup, createRuleImportPreview, parseRuleBackup } from '@/application/rule-backup';
import { createEmptyState, createSampleState } from '@/domain/rules/fixtures';
import { storedStateSchema } from '@/domain/rules/schema';

const exportedAt = '2026-09-01T00:00:00.000Z';

describe('rule backups', () => {
  it('creates and verifies a checksummed backup', async () => {
    const backup = await createRuleBackup(createSampleState(), exportedAt);
    expect(backup.format).toBe('my-webrequest-rules');
    expect(backup.checksum).toMatch(/^[a-f0-9]{64}$/);

    const parsed = await parseRuleBackup(JSON.stringify(backup));
    expect(parsed.integrity).toBe('verified');
    expect(parsed.backup.state.order).toEqual(createSampleState().order);
  });

  it('rejects tampering and invalid state relationships', async () => {
    const backup = await createRuleBackup(createSampleState(), exportedAt);
    const firstId = backup.state.order[0];
    expect(firstId).toBeDefined();
    if (!firstId) return;
    backup.state.rules[firstId]!.name = 'Tampered';
    await expect(parseRuleBackup(JSON.stringify(backup))).rejects.toThrow('checksum');

    expect(() =>
      storedStateSchema.parse({
        ...createEmptyState(),
        order: ['missing-rule'],
      }),
    ).toThrow();
  });

  it('accepts a validated pre-envelope state as an unverified legacy backup', async () => {
    const parsed = await parseRuleBackup(JSON.stringify(createSampleState()));
    expect(parsed.integrity).toBe('legacy-unverified');
    expect(parsed.backup.state.order).toHaveLength(5);
  });

  it('merges conflicts as deterministic disabled copies without trusting stored permissions', async () => {
    const current = createSampleState();
    const parsed = await parseRuleBackup(JSON.stringify(await createRuleBackup(current, exportedAt)));
    const preview = await createRuleImportPreview(current, parsed, 'merge', exportedAt);

    expect(preview.conflictCount).toBe(5);
    expect(preview.nextState.order).toHaveLength(10);
    const importedIds = preview.nextState.order.slice(5);
    expect(importedIds.every((id) => id.startsWith('import-'))).toBe(true);
    expect(importedIds.every((id) => preview.nextState.rules[id]?.enabled === false)).toBe(true);
    expect(new Set(Object.values(preview.nextState.rules).map((rule) => rule.dnrId)).size).toBe(10);
  });

  it('previews replacement without activating imported rules', async () => {
    const source = createSampleState();
    const parsed = await parseRuleBackup(JSON.stringify(await createRuleBackup(source, exportedAt)));
    const preview = await createRuleImportPreview(createEmptyState(), parsed, 'replace', exportedAt);

    expect(preview.conflictCount).toBe(0);
    expect(preview.nextState.order).toEqual(source.order);
    expect(Object.values(preview.nextState.rules).every((rule) => !rule.enabled)).toBe(true);
  });
});
