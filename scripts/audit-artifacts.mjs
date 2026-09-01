import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const targets = ['chrome-mv3', 'edge-mv3', 'firefox-mv3'];
const expectedPermissions = ['activeTab', 'declarativeNetRequest', 'storage'];
const expectedOptionalHosts = ['http://*/*', 'https://*/*'];
const expectedLocales = ['en', 'es', 'fr', 'ja', 'ko', 'zh_CN'];
const expectedIcons = {
  16: 'icon/16.png',
  32: 'icon/32.png',
  48: 'icon/48.png',
  96: 'icon/96.png',
  128: 'icon/128.png',
};
const browserSupport = JSON.parse(readFileSync(join(process.cwd(), 'browser-support.json'), 'utf8'));

function extensionIdFromPublicKey(publicKey) {
  const digest = createHash('sha256').update(Buffer.from(publicKey, 'base64')).digest().subarray(0, 16);
  return [...digest].map((value) => String.fromCharCode(97 + (value >> 4), 97 + (value & 15))).join('');
}

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

for (const target of targets) {
  const directory = join(process.cwd(), 'dist', target);
  const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json'), 'utf8'));
  const permissions = [...(manifest.permissions ?? [])].sort();
  const optionalHosts = [...(manifest.optional_host_permissions ?? [])].sort();
  const locales = readdirSync(join(directory, '_locales')).sort();
  const files = walk(directory);

  assert.deepEqual(permissions, expectedPermissions, `${target} has an unexpected required permission.`);
  assert.deepEqual(optionalHosts, expectedOptionalHosts, `${target} has unexpected optional hosts.`);
  assert.equal(manifest.host_permissions, undefined, `${target} must not request install-time hosts.`);
  assert.equal(manifest.content_scripts, undefined, `${target} must not inject content scripts.`);
  assert.equal(manifest.externally_connectable, undefined, `${target} must not expose external messaging.`);
  assert.deepEqual(manifest.icons, expectedIcons, `${target} does not expose the complete icon matrix.`);
  if (target === 'firefox-mv3') {
    assert.equal(
      manifest.browser_specific_settings?.gecko?.strict_min_version,
      browserSupport.firefoxMinimum,
      'Firefox must support both reliable dynamic rules and the required data-collection manifest key.',
    );
    assert.equal(manifest.minimum_chrome_version, undefined, 'Firefox must not contain Chromium metadata.');
    assert.equal(manifest.key, undefined, 'Firefox must not inherit the legacy Chrome identity key.');
  } else {
    assert.equal(
      manifest.minimum_chrome_version,
      browserSupport.chromiumMinimum,
      `${target} must declare the certified Chromium DNR baseline.`,
    );
    assert.equal(
      manifest.browser_specific_settings,
      undefined,
      `${target} must not contain Firefox-only metadata.`,
    );
    if (target === 'chrome-mv3') {
      assert.equal(
        manifest.key,
        browserSupport.chromeLegacyPublicKey,
        'Chrome must retain its signed V0 identity.',
      );
      assert.equal(
        extensionIdFromPublicKey(manifest.key),
        browserSupport.chromeLegacyExtensionId,
        'Chrome public key does not derive the recorded legacy extension ID.',
      );
    } else {
      assert.equal(manifest.key, undefined, 'Edge must not inherit the legacy Chrome identity key.');
    }
  }
  assert.deepEqual(locales, expectedLocales, `${target} does not contain the six release locales.`);
  assert.ok(
    files.every((file) => !file.endsWith('.map')),
    `${target} contains source maps.`,
  );

  const bundledCss = files
    .filter((path) => path.endsWith('.css'))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  assert.match(bundledCss, /prefers-reduced-motion/, `${target} lacks reduced-motion handling.`);
  assert.match(bundledCss, /prefers-contrast:more/, `${target} lacks increased-contrast handling.`);

  for (const file of files.filter((path) => /\.(?:css|html|js)$/.test(path))) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /sourceMappingURL=/, `${file} contains a source-map reference.`);
  }
}

const sourceFiles = walk(join(process.cwd(), 'src')).filter((path) => /\.(?:ts|tsx)$/.test(path));
for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  assert.doesNotMatch(
    source,
    /(?:fetch\s*\(|new\s+(?:XMLHttpRequest|WebSocket|EventSource)\s*\(|importScripts\s*\()/,
    `${file} contains an undeclared network primitive.`,
  );
  assert.doesNotMatch(source, /(?:eval|new\s+Function)\s*\(/, `${file} contains dynamic code execution.`);
}

console.log(
  'Browser artifacts passed permission, locale, icon, source-map, endpoint, and remote-code audits.',
);
