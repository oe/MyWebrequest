import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const pnpmStore = join(process.cwd(), 'node_modules', '.pnpm');
const patchedPackage = readdirSync(pnpmStore).find((name) =>
  name.startsWith('image-size@2.0.2_patch_hash='),
);

assert.ok(patchedPackage, 'The patched image-size package is not installed.');

const typesDirectory = join(pnpmStore, patchedPackage, 'node_modules', 'image-size', 'dist', 'types');
const [{ ICNS }, { HEIF }, { JXL }] = await Promise.all(
  ['icns.mjs', 'heif.mjs', 'jxl.mjs'].map((file) =>
    import(pathToFileURL(join(typesDirectory, file)).href),
  ),
);

const icns = new Uint8Array(16);
icns.set(new TextEncoder().encode('icns'), 0);
new DataView(icns.buffer).setUint32(4, 16, false);
icns.set(new TextEncoder().encode('ic07'), 8);
new DataView(icns.buffer).setUint32(12, 0, false);

assert.throws(() => ICNS.calculate(icns), /entry length is too small/);
assert.throws(() => HEIF.calculate(new Uint8Array(16)), /no ipco box found/);
assert.throws(() => JXL.calculate(new Uint8Array(16)), /No codestream found/);

console.log('Verified patched image-size parsers reject non-advancing entries.');
