import { describe, expect, it } from 'vitest';

import {
  guideCopy,
  guideGroupCopy,
  guideGroups,
  guideGroupSlugs,
  guideSlugs,
  homeCopy,
  locales,
} from '../../site/src/content';
import type { Rule } from '../../src/domain/rules/model';
import { matchRule } from '../../src/domain/rules/test-match';

function redirectRule(match: Rule['condition']['url'], target: string): Rule {
  const timestamp = '2026-09-03T00:00:00.000Z';
  return {
    schemaVersion: 1,
    id: 'documentation-example',
    dnrId: 1,
    name: 'Documentation example',
    enabled: false,
    priority: 1,
    condition: {
      url: match,
      resourceTypes: ['xmlhttprequest'],
      initiatorDomains: ['app.example.com'],
    },
    action: { kind: 'redirect', target },
    permissionOrigins: ['https://example.com/*'],
    migrationState: 'none',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('website content matrix', () => {
  it('publishes every guide in every supported locale', () => {
    for (const locale of locales) {
      expect(homeCopy[locale].title.length).toBeGreaterThan(10);
      expect(homeCopy[locale].metaTitle).not.toBe('');
      for (const slug of guideSlugs) {
        const guide = guideCopy(locale, slug);
        expect(guide.title).not.toBe('');
        expect(guide.description).not.toBe('');
        expect(guide.sections.length).toBeGreaterThanOrEqual(2);
        expect(guide.sections.every((section) => section.paragraphs.length > 0)).toBe(true);
      }
    }
  });

  it('groups help into four short task-first entry points without hiding a guide', () => {
    expect(guideGroups).toHaveLength(4);
    expect(guideGroups.flatMap((group) => guideGroupSlugs[group])).toEqual(
      expect.arrayContaining([...guideSlugs]),
    );
    expect(new Set(guideGroups.flatMap((group) => guideGroupSlugs[group])).size).toBe(guideSlugs.length);

    for (const locale of locales) {
      for (const group of guideGroups) {
        expect(guideGroupCopy[locale][group].title).not.toBe('');
        expect(guideGroupCopy[locale][group].description).not.toBe('');
      }
    }
  });

  it('keeps public promises aligned with the implemented browser set', () => {
    for (const locale of locales) {
      expect(homeCopy[locale].compatibility).toBe('Chrome · Edge · Firefox');
    }
  });

  it('publishes substantial advanced and legacy-upgrade help in every locale', () => {
    for (const locale of locales) {
      const advanced = guideCopy(locale, 'advanced-examples');
      const breaking = guideCopy(locale, 'breaking-changes');
      expect(advanced.sections.length).toBeGreaterThanOrEqual(6);
      expect(advanced.sections.filter((section) => section.code).length).toBe(4);
      expect(advanced.sections.flatMap((section) => section.points ?? []).length).toBeGreaterThanOrEqual(4);
      expect(breaking.sections.length).toBeGreaterThanOrEqual(5);
      expect(breaking.sections.flatMap((section) => section.points ?? []).length).toBeGreaterThanOrEqual(15);
    }
  });

  it('keeps the documented redirect capture recipes executable', () => {
    const localApi = redirectRule(
      { kind: 'wildcard', value: 'https://api.staging.example.com/v1/*' },
      'http://localhost:3000/v1/$1',
    );
    const cdnMigration = redirectRule(
      { kind: 'wildcard', value: 'https://static.legacy.example.com/*' },
      'https://cdn.example.com/$1',
    );
    const apiBridge = redirectRule(
      { kind: 'regex', value: '^https://api\\.example\\.com/v1/(users|projects)/([^?]+)$' },
      'https://api.example.com/v2/$1/$2',
    );

    expect(matchRule(localApi, 'https://api.staging.example.com/v1/users/42')).toMatchObject({
      matched: true,
      result: 'http://localhost:3000/v1/users/42',
    });
    expect(matchRule(cdnMigration, 'https://static.legacy.example.com/assets/app.css')).toMatchObject({
      matched: true,
      result: 'https://cdn.example.com/assets/app.css',
    });
    expect(matchRule(apiBridge, 'https://api.example.com/v1/projects/alpha')).toMatchObject({
      matched: true,
      result: 'https://api.example.com/v2/projects/alpha',
    });
  });
});
