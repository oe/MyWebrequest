import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

await import('./verify-image-size-patch.mjs');

const root = process.cwd();
const expectedAdvisories = new Set(['GHSA-5p2g-fcmc-qvqq', 'GHSA-w3rx-r6r6-pgpr']);
const workspaceSource = await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8');
const configuredIgnores = new Set(workspaceSource.match(/GHSA-[a-z0-9-]+/g) ?? []);
assert.deepEqual(
  [...configuredIgnores].sort(),
  [...expectedAdvisories].sort(),
  'The audit allowlist must contain only the two locally patched image-size advisories.',
);

function withoutAuditAllowlist(source) {
  const result = [];
  let skippingAuditConfig = false;
  for (const line of source.split('\n')) {
    if (/^auditConfig:\s*$/.test(line)) {
      skippingAuditConfig = true;
      continue;
    }
    if (skippingAuditConfig && /^\S/.test(line)) skippingAuditConfig = false;
    if (!skippingAuditConfig) result.push(line);
  }
  return result.join('\n');
}

const auditRoot = await mkdtemp(join(tmpdir(), 'mwr-unignored-audit-'));
try {
  await Promise.all([
    writeFile(join(auditRoot, 'package.json'), await readFile(join(root, 'package.json'))),
    writeFile(join(auditRoot, 'pnpm-lock.yaml'), await readFile(join(root, 'pnpm-lock.yaml'))),
    writeFile(join(auditRoot, 'pnpm-workspace.yaml'), withoutAuditAllowlist(workspaceSource), 'utf8'),
  ]);

  const audit = spawnSync('pnpm', ['audit', '--lockfile-only', '--json'], {
    cwd: auditRoot,
    encoding: 'utf8',
    env: process.env,
  });
  if (audit.error) throw audit.error;
  assert.ok(audit.stdout.trim(), `pnpm audit produced no JSON. ${audit.stderr}`.trim());

  const report = JSON.parse(audit.stdout);
  const advisories = Object.values(report.advisories ?? {});
  const actualAdvisories = new Set(advisories.map((advisory) => advisory.github_advisory_id));
  assert.deepEqual(
    [...actualAdvisories].sort(),
    [...expectedAdvisories].sort(),
    'The unignored lockfile audit contains an unexpected or missing advisory.',
  );

  assert.deepEqual(report.metadata?.vulnerabilities, {
    info: 0,
    low: 0,
    moderate: 0,
    high: 2,
    critical: 0,
  });
  for (const advisory of advisories) {
    assert.equal(advisory.module_name, 'image-size');
    assert.equal(advisory.severity, 'high');
    assert.ok(advisory.findings?.length > 0, `${advisory.github_advisory_id} has no dependency path.`);
    assert.ok(
      advisory.findings.every(
        (finding) => finding.version === '2.0.2' && finding.dev === true && finding.bundled === false,
      ),
      `${advisory.github_advisory_id} escaped the expected patched build-only dependency boundary.`,
    );
  }

  console.log(
    'Unignored audit contains only the two exact build-time image-size advisories covered by the verified local patch.',
  );
} finally {
  await rm(auditRoot, { recursive: true, force: true });
}
