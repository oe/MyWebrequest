import { describe, expect, it } from 'vitest';

import { createMigrationBundle } from '@/application/migration-service';
import { compileDnrRule } from '@/domain/rules/compile-dnr';
import { parseLegacySource } from '@/domain/migration/parse-legacy';

import fixture from '../fixtures/legacy-installation.json';

const now = '2026-08-31T00:00:00.000Z';

describe('legacy migration', () => {
  it('represents every source item exactly once with deterministic outcomes', async () => {
    const bundle = await createMigrationBundle(fixture, 'legacy-json-import', now);

    expect(bundle.report.summary).toEqual({
      automatic: 3,
      reviewRequired: 3,
      unsupported: 3,
      removedFeature: 11,
      invalid: 0,
    });
    expect(bundle.report.items).toHaveLength(20);
    expect(new Set(bundle.report.items.map((item) => item.id)).size).toBe(20);
    expect(
      bundle.report.items.every((item) => item.outcome !== 'automatic' || !item.candidateRule?.enabled),
    ).toBe(true);
  });

  it('compiles safe URL rules and keeps the original enabled intent separate', async () => {
    const { report } = await createMigrationBundle(fixture, 'legacy-json-import', now);
    const block = report.items.find((item) => item.sourceLocator === 'block[0]');

    expect(block).toMatchObject({ outcome: 'automatic', enabledIntent: true });
    expect(block?.candidateRule).toMatchObject({
      enabled: false,
      migrationState: 'none',
      permissionOrigins: ['*://ads.example.com/*'],
      action: { kind: 'block' },
    });
    expect(block?.candidateRule && compileDnrRule(block.candidateRule).ok).toBe(true);
  });

  it('converts path and splat placeholders but requires review for encoding semantics', async () => {
    const { report } = await createMigrationBundle(fixture, 'legacy-json-import', now);
    const custom = report.items.find((item) => item.sourceLocator === 'custom.https://api.example.com/v1/*');

    expect(custom).toMatchObject({
      outcome: 'review-required',
      enabledIntent: true,
      reasonCode: 'substitution-semantics-review',
      candidateRule: {
        enabled: false,
        migrationState: 'review-required',
        condition: {
          url: {
            kind: 'regex',
            value: '^https:\\/\\/api\\.example\\.com/v1/([^/?]+)/([^?]*)',
          },
        },
        action: { kind: 'redirect', target: 'https://local.example/$1/$2' },
      },
    });
  });

  it('retains query extraction, reserved computation, removed features, and unknown keys without activation', async () => {
    const { report, rawSnapshot } = await createMigrationBundle(fixture, 'legacy-json-import', now);
    const byLocator = Object.fromEntries(report.items.map((item) => [item.sourceLocator, item]));

    expect(byLocator['custom.https://search.example.com/*']).toMatchObject({
      outcome: 'unsupported',
      reasonCode: 'query-extraction-unsupported',
    });
    expect(byLocator['custom.https://docs.example.com/*']).toMatchObject({
      outcome: 'unsupported',
      reasonCode: 'computed-placeholder-unsupported',
    });
    expect(byLocator['log[0]']).toMatchObject({ outcome: 'removed-feature' });
    expect(byLocator['gstatic[0]']).toMatchObject({ outcome: 'removed-feature' });
    expect(byLocator['future-key']).toMatchObject({
      outcome: 'unsupported',
      reasonCode: 'unknown-legacy-key',
    });
    expect(rawSnapshot['future-key']).toContain('<img src=x onerror=alert(1)>');
    expect(report.items.some((item) => item.candidateRule?.enabled)).toBe(false);
  });

  it('isolates invalid JSON and invalid shapes instead of aborting other keys', async () => {
    const source = {
      block: '["*://ok.example/*"]',
      hsts: '{not-json',
      hotlink: { wrong: 'shape' },
      custom: JSON.stringify({ broken: null }),
    };
    const { report } = await createMigrationBundle(source, 'legacy-local-storage', now);

    expect(report.summary).toEqual({
      automatic: 1,
      reviewRequired: 0,
      unsupported: 0,
      removedFeature: 0,
      invalid: 3,
    });
    expect(report.items.map((item) => item.sourceKey)).toEqual(
      expect.arrayContaining(['block', 'hsts', 'hotlink', 'custom']),
    );
  });

  it('uses canonical source data for an order-independent fingerprint', async () => {
    const first = await createMigrationBundle(
      { onoff: { block: true, custom: false }, block: ['*://a.example/*'] },
      'legacy-json-import',
      now,
    );
    const second = await createMigrationBundle(
      { block: ['*://a.example/*'], onoff: { custom: false, block: true } },
      'legacy-json-import',
      now,
    );

    expect(first.report.sourceFingerprint).toBe(second.report.sourceFingerprint);
    expect(first.report.items.map((item) => item.id).sort()).toEqual(
      second.report.items.map((item) => item.id).sort(),
    );
    expect(await createMigrationBundle(first.rawSnapshot, 'legacy-json-import', now)).toEqual(first);
  });

  it('bounds oversized values and records their byte length', () => {
    const parsed = parseLegacySource(
      { block: JSON.stringify(['x'.repeat(1024 * 1024)]) },
      'legacy-json-import',
    );

    expect(parsed.entries).toEqual([]);
    expect(parsed.rawSnapshot).toEqual({});
    expect(parsed.issues).toEqual([
      expect.objectContaining({ key: 'block', code: 'limit-exceeded', byteLength: expect.any(Number) }),
    ]);
  });
});
