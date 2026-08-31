import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const targets = ['chrome-mv3', 'edge-mv3', 'firefox-mv3'];
const expectedPermissions = ['activeTab', 'declarativeNetRequest', 'storage'];
const expectedOptionalHosts = ['http://*/*', 'https://*/*'];
const expectedLocales = ['en', 'es', 'fr', 'ja', 'ko', 'zh_CN'];

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

console.log('Browser artifacts passed permission, locale, source-map, endpoint, and remote-code audits.');
