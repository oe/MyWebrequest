import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Resolve the actual dependency used by web-ext, not a stale pnpm store entry.
const require = createRequire(import.meta.url);
const webExtRequire = createRequire(require.resolve('web-ext'));
const profileRequire = createRequire(webExtRequire.resolve('firefox-profile/package.json'));
const AdmZip = profileRequire('adm-zip');
const root = mkdtempSync(join(tmpdir(), 'requestorbit-zip-security-'));
try {
  for (const mode of ['sync', 'entry', 'async', 'callback']) {
    for (const kind of ['file', 'directory', 'dangling', 'root']) {
      const base = join(root, `${mode}-${kind}`);
      const destination = join(base, 'destination');
      const outside = join(base, 'outside');
      mkdirSync(outside, { recursive: true });
      const victim = join(outside, 'victim.txt');
      writeFileSync(victim, 'unchanged', { mode: 0o600 });
      const originalMode = statSync(victim).mode;
      if (kind === 'root') symlinkSync(outside, destination, 'dir');
      else mkdirSync(destination);
      const zip = new AdmZip();
      let entry = 'victim.txt';
      if (kind === 'directory') {
        symlinkSync(outside, join(destination, 'nested'), 'dir');
        entry = 'nested/victim.txt';
      } else if (kind !== 'root') {
        symlinkSync(kind === 'dangling' ? join(outside, 'missing.txt') : victim, join(destination, entry));
      }
      zip.addFile(entry, Buffer.from('attacker-content'));
      const blocked = /Refusing ZIP extraction through symbolic link/;
      if (mode === 'sync') assert.throws(() => zip.extractAllTo(destination, true), blocked);
      if (mode === 'entry') assert.throws(() => zip.extractEntryTo(entry, destination, true, true), blocked);
      if (mode === 'async') await assert.rejects(zip.extractAllToAsync(destination, true), blocked);
      if (mode === 'callback') {
        await assert.rejects(
          new Promise((resolve, reject) => {
            zip.extractAllToAsync(destination, true, false, (error) => (error ? reject(error) : resolve()));
          }),
          blocked,
        );
      }
      assert.equal(readFileSync(victim, 'utf8'), 'unchanged');
      assert.equal(statSync(victim).mode, originalMode);
      assert.deepEqual(readdirSync(outside), ['victim.txt']);
    }
  }
  // Preserve normal profile packaging and overwrite behavior.
  const normal = join(root, 'normal');
  const zip = new AdmZip();
  zip.addFile('nested/prefs.js', Buffer.from('user_pref("example", true);'));
  zip.extractAllTo(normal, true);
  writeFileSync(join(normal, 'nested/prefs.js'), 'old');
  await zip.extractAllToAsync(normal, true);
  assert.equal(readFileSync(join(normal, 'nested/prefs.js'), 'utf8'), 'user_pref("example", true);');
  const packed = new AdmZip();
  packed.addLocalFolder(normal);
  assert.equal(new AdmZip(packed.toBuffer()).readAsText('nested/prefs.js'), 'user_pref("example", true);');
  console.log(
    'Verified adm-zip rejects 16 destination symlink cases and preserves normal profile ZIP operations.',
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
