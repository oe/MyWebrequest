import { describe, expect, it } from 'vitest';

import { localeLanguageTag, localePathSegment } from '../../site/src/lib/routes';

describe('website locale routes', () => {
  it('uses a lowercase script-based URL for Simplified Chinese', () => {
    expect(localePathSegment('zh-CN')).toBe('zh-hans');
  });

  it('emits the canonical BCP 47 language tag for Simplified Chinese', () => {
    expect(localeLanguageTag('zh-CN')).toBe('zh-Hans');
  });

  it('keeps the default locale at the site root', () => {
    expect(localePathSegment('en')).toBe('');
    expect(localeLanguageTag('en')).toBe('en');
  });
});
