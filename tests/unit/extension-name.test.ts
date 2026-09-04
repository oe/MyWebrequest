import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const localeDirectory = join(process.cwd(), 'src/public/_locales');
const localeNames = ['en', 'es', 'fr', 'ja', 'ko', 'zh_CN'];

describe('extension product name', () => {
  it.each(localeNames)('keeps the original name in %s', async (locale) => {
    const messages = JSON.parse(await readFile(join(localeDirectory, locale, 'messages.json'), 'utf8')) as {
      appName?: { message?: string };
    };

    expect(messages.appName?.message).toBe('RequestOrbit');
  });
});
