import { describe, expect, it } from 'vitest';

import { supportedPageOrigin } from '@/ui/lib/supported-page';

describe('popup active-page support', () => {
  it.each([
    ['https://example.com/path?query=1', 'https://example.com'],
    ['http://localhost:3000/path', 'http://localhost:3000'],
  ])('accepts an HTTP(S) page: %s', (url, expected) => {
    expect(supportedPageOrigin(url)).toBe(expected);
  });

  it.each([
    'chrome://extensions/',
    'edge://extensions/',
    'about:config',
    'file:///tmp/example.html',
    'moz-extension://example/options.html',
    'not a URL',
  ])('rejects a protected or unsupported page: %s', (url) => {
    expect(supportedPageOrigin(url)).toBeNull();
  });
});
