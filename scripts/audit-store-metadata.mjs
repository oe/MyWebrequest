import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const listing = readFileSync(join(root, 'STORE_LISTING.md'), 'utf8');
const privacy = readFileSync(join(root, 'PRIVACY.md'), 'utf8');
const localeRoot = join(root, 'src/public/_locales');
const listingLocaleRoot = join(root, 'store-assets/listing');
const expectedLocales = ['en', 'es', 'fr', 'ja', 'ko', 'zh_CN'];
const expectedListingLocales = ['en', 'es', 'fr', 'ja', 'ko', 'zh-CN'];

function section(document, heading) {
  const marker = `## ${heading}\n\n`;
  const start = document.indexOf(marker);
  assert.notEqual(start, -1, `Missing store metadata section: ${heading}`);
  const contentStart = start + marker.length;
  const nextHeading = document.indexOf('\n## ', contentStart);
  return document.slice(contentStart, nextHeading === -1 ? undefined : nextHeading).trim();
}

function characterLength(value) {
  return Array.from(value).length;
}

const name = section(listing, 'Name');
const singlePurpose = section(listing, 'Single-purpose statement');
const shortDescription = section(listing, 'Short description');
const detailedDescription = section(listing, 'Detailed description');
const chromeMigrationNote = section(listing, 'Chrome-only migration note');
const permissionDisclosure = section(listing, 'Permission disclosure');
const normalizedPrivacy = privacy.replace(/\s+/g, ' ');
const normalizedDetails = detailedDescription.replace(/\s+/g, ' ');

assert.equal(name, 'RequestOrbit', 'The store name must match the restored product identity.');
assert.ok(characterLength(singlePurpose) <= 1_000, 'The single-purpose statement is unexpectedly long.');
assert.ok(
  characterLength(shortDescription) >= 20 && characterLength(shortDescription) <= 132,
  'The short description must fit browser-store and manifest description limits.',
);
assert.ok(characterLength(detailedDescription) >= 300, 'The detailed description is too short for review.');
assert.doesNotMatch(
  detailedDescription,
  /\b(?:Chrome|Edge|Firefox|legacy|migration)\b/i,
  'The shared store description must not expose browser-specific migration behavior.',
);
assert.match(chromeMigrationNote, /Chrome/i, 'The Chrome-only migration note must name its target.');
assert.match(chromeMigrationNote, /legacy|migration/i, 'The Chrome-only migration note is incomplete.');
assert.match(
  chromeMigrationNote,
  /Do not append this paragraph to Edge or Firefox listings/i,
  'The Chrome-only note must explicitly prevent cross-store reuse.',
);
assert.match(permissionDisclosure, /PRIVACY\.md/, 'The store disclosure must point reviewers to the policy.');

const locales = readdirSync(localeRoot).sort();
assert.deepEqual(locales, expectedLocales, 'Store metadata must cover the exact six release locales.');
for (const locale of locales) {
  const messages = JSON.parse(readFileSync(join(localeRoot, locale, 'messages.json'), 'utf8'));
  assert.equal(messages.appName?.message, name, `${locale} uses a different product name.`);
  for (const key of ['appDesc', 'actionTitle']) {
    const message = messages[key]?.message;
    assert.equal(typeof message, 'string', `${locale}.${key} must be a string.`);
    assert.ok(characterLength(message) > 0, `${locale}.${key} must not be empty.`);
    assert.ok(characterLength(message) <= 132, `${locale}.${key} exceeds the store-safe length.`);
  }
}

const localizedListingFiles = readdirSync(listingLocaleRoot).sort();
assert.deepEqual(
  localizedListingFiles,
  expectedListingLocales.map((locale) => `${locale}.json`).sort(),
  'Localized store listing metadata must cover exactly the six release locales.',
);
const migrationTerms = {
  en: /legacy|migration/i,
  es: /migraci[oó]n/i,
  fr: /ancienne|migration/i,
  ja: /旧版|移行/,
  ko: /기존|마이그레이션/,
  'zh-CN': /旧版|迁移/,
};
for (const locale of expectedListingLocales) {
  const metadata = JSON.parse(readFileSync(join(listingLocaleRoot, `${locale}.json`), 'utf8'));
  const manifestLocale = locale === 'zh-CN' ? 'zh_CN' : locale;
  const manifestMessages = JSON.parse(
    readFileSync(join(localeRoot, manifestLocale, 'messages.json'), 'utf8'),
  );
  assert.equal(metadata.locale, locale, `${locale} listing declares a different locale.`);
  assert.equal(metadata.name, name, `${locale} listing uses a different product name.`);
  assert.equal(
    metadata.shortDescription,
    manifestMessages.appDesc.message,
    `${locale} listing and manifest short descriptions drifted apart.`,
  );
  assert.ok(
    characterLength(metadata.shortDescription) >= 10 && characterLength(metadata.shortDescription) <= 132,
    `${locale} short description is outside store limits.`,
  );
  assert.ok(
    characterLength(metadata.detailedDescription) >= 250 &&
      characterLength(metadata.detailedDescription) <= 10_000,
    `${locale} detailed description is outside Edge's 250-10,000 character limit.`,
  );
  assert.doesNotMatch(
    metadata.detailedDescription,
    /Chrome|Edge|Firefox/i,
    `${locale} common description contains browser-specific copy.`,
  );
  assert.doesNotMatch(
    metadata.detailedDescription,
    migrationTerms[locale],
    `${locale} common description exposes Chrome-only migration copy.`,
  );
  assert.ok(characterLength(metadata.privacySummary) >= 40, `${locale} privacy summary is too short.`);
  assert.ok(characterLength(metadata.permissionSummary) >= 80, `${locale} permission summary is too short.`);
  const normalizedPermissionSummary = metadata.permissionSummary.toLocaleLowerCase(locale);
  for (const permission of ['storage', 'declarativeNetRequest', 'activeTab']) {
    assert.ok(
      normalizedPermissionSummary.includes(permission.toLowerCase()),
      `${locale} permission summary omits ${permission}.`,
    );
  }
  assert.match(
    metadata.chromeLegacyMigrationNote,
    /Chrome/,
    `${locale} Chrome-only migration note does not name Chrome.`,
  );
  assert.match(
    metadata.chromeLegacyMigrationNote,
    migrationTerms[locale],
    `${locale} Chrome-only migration note does not explain migration.`,
  );
  assert.equal(metadata.screenshotCaptions.length, 3, `${locale} must describe all three screenshots.`);
  for (const caption of metadata.screenshotCaptions) {
    assert.ok(
      characterLength(caption) >= 30 && characterLength(caption) <= 240,
      `${locale} screenshot caption is outside the review-safe range.`,
    );
  }
  assert.ok(
    metadata.searchTerms.length >= 4 && metadata.searchTerms.length <= 8,
    `${locale} must provide a focused search-term set.`,
  );
  assert.equal(
    new Set(metadata.searchTerms.map((term) => term.toLocaleLowerCase(locale))).size,
    metadata.searchTerms.length,
    `${locale} search terms contain duplicates.`,
  );
}

for (const permission of ['`storage`', '`declarativeNetRequest`', '`activeTab`']) {
  assert.match(privacy, new RegExp(permission.replaceAll('`', '\\`')), `Privacy policy omits ${permission}.`);
}
for (const origin of ['`http://*/*`', '`https://*/*`']) {
  assert.ok(privacy.includes(origin), `Privacy policy omits optional origin ${origin}.`);
}
assert.match(
  normalizedPrivacy,
  /does not collect, transmit, sell, or share personal data/i,
  'The privacy policy must make the local-only data declaration explicit.',
);
assert.match(
  normalizedDetails,
  /no analytics, account, advertisements, remote code, or product-owned network service/i,
  'The store description must match the audited local-only runtime.',
);

console.log(
  'Store name, six localized listings, Chrome-only migration copy, permissions, and privacy metadata passed preflight.',
);
