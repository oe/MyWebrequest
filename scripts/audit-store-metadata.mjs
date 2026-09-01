import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const listing = readFileSync(join(root, 'STORE_LISTING.md'), 'utf8');
const privacy = readFileSync(join(root, 'PRIVACY.md'), 'utf8');
const localeRoot = join(root, 'src/public/_locales');
const expectedLocales = ['en', 'es', 'fr', 'ja', 'ko', 'zh_CN'];

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
const permissionDisclosure = section(listing, 'Permission disclosure');
const normalizedPrivacy = privacy.replace(/\s+/g, ' ');
const normalizedDetails = detailedDescription.replace(/\s+/g, ' ');

assert.equal(name, 'My Webrequest', 'The store name must match the restored product identity.');
assert.ok(characterLength(singlePurpose) <= 1_000, 'The single-purpose statement is unexpectedly long.');
assert.ok(
  characterLength(shortDescription) >= 20 && characterLength(shortDescription) <= 132,
  'The short description must fit browser-store and manifest description limits.',
);
assert.ok(characterLength(detailedDescription) >= 300, 'The detailed description is too short for review.');
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

console.log('Store name, descriptions, locales, permissions, and privacy metadata passed preflight.');
