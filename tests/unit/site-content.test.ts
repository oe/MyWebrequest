import { describe, expect, it } from 'vitest';

import { guideCopy, guideSlugs, homeCopy, locales } from '../../site/src/content';

describe('website content matrix', () => {
  it('publishes every guide in every supported locale', () => {
    for (const locale of locales) {
      expect(homeCopy[locale].title.length).toBeGreaterThan(10);
      for (const slug of guideSlugs) {
        const guide = guideCopy(locale, slug);
        expect(guide.title).not.toBe('');
        expect(guide.description).not.toBe('');
        expect(guide.sections.length).toBeGreaterThanOrEqual(2);
        expect(guide.sections.every((section) => section.paragraphs.length > 0)).toBe(true);
      }
    }
  });

  it('keeps public promises aligned with the implemented browser set', () => {
    for (const locale of locales) {
      expect(homeCopy[locale].compatibility).toBe('Chrome · Edge · Firefox');
    }
  });
});
