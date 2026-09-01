import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const projectRoot = resolve(process.env.MWR_CERT_PROJECT_ROOT ?? process.cwd());
const distDirectory = join(projectRoot, 'dist');
const outputPath = resolve(
  projectRoot,
  process.env.MWR_CERT_OUTPUT ?? 'dist/browser-floor-certification.json',
);
const browserSupport = JSON.parse(await readFile(join(projectRoot, 'browser-support.json'), 'utf8'));

function requiredEnvironment(name, fallbackName) {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
  assert.ok(value?.trim(), `Missing required environment value: ${name}.`);
  return value.trim();
}

function parseChecksums(source) {
  return new Map(
    source
      .trim()
      .split('\n')
      .map((line) => {
        const match = /^([a-f0-9]{64}) {2}(.+)$/.exec(line);
        assert.ok(match, `Invalid SHA256SUMS row: ${line}`);
        return [match[2], match[1]];
      }),
  );
}

async function certifiedArtifact(target, checksums) {
  const matches = [...checksums.keys()].filter((name) => name.endsWith(`-${target}.zip`));
  assert.equal(matches.length, 1, `Expected one ${target} release archive in SHA256SUMS.`);
  const filename = matches[0];
  assert.equal(filename, basename(filename), `Invalid release archive path: ${filename}.`);
  const bytes = await readFile(join(distDirectory, filename));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, checksums.get(filename), `${filename} does not match SHA256SUMS.`);
  return { filename, sha256 };
}

function assertObservedVersion(browser, observedVersion, expectedVersion) {
  const numericVersions = observedVersion.match(/\d+(?:\.\d+)+/g) ?? [];
  assert.ok(
    numericVersions.includes(expectedVersion),
    `${browser} reported ${observedVersion}; expected ${expectedVersion}.`,
  );
}

const commitSha = requiredEnvironment('MWR_CERT_COMMIT_SHA', 'GITHUB_SHA');
assert.match(commitSha, /^[a-f0-9]{40}$/, 'Certification requires a full 40-character commit SHA.');

const runnerOs = requiredEnvironment('MWR_CERT_RUNNER_OS', 'RUNNER_OS');
const runnerArch = requiredEnvironment('MWR_CERT_RUNNER_ARCH', 'RUNNER_ARCH');
assert.equal(runnerOs, 'Linux', 'Floor certification must run on native Linux.');
assert.equal(runnerArch, 'X64', 'Floor certification must run on native x86-64 hardware.');

const observedVersions = {
  chrome: requiredEnvironment('MWR_CHROME_OBSERVED_VERSION'),
  edge: requiredEnvironment('MWR_EDGE_OBSERVED_VERSION'),
  firefox: requiredEnvironment('MWR_FIREFOX_OBSERVED_VERSION'),
};
const expectedVersions = {
  chrome: browserSupport.chromeForTestingFloor,
  edge: browserSupport.edgeFloorPackageVersion.replace(/-\d+$/, ''),
  firefox: browserSupport.firefoxMinimum,
};
for (const browser of Object.keys(observedVersions)) {
  assertObservedVersion(browser, observedVersions[browser], expectedVersions[browser]);
}

const checksums = parseChecksums(await readFile(join(distDirectory, 'SHA256SUMS'), 'utf8'));
const artifacts = Object.fromEntries(
  await Promise.all(
    ['chrome', 'edge', 'firefox'].map(async (target) => [target, await certifiedArtifact(target, checksums)]),
  ),
);

const repository = requiredEnvironment('MWR_CERT_REPOSITORY', 'GITHUB_REPOSITORY');
const runId = requiredEnvironment('MWR_CERT_RUN_ID', 'GITHUB_RUN_ID');
const serverUrl = process.env.GITHUB_SERVER_URL?.trim() || 'https://github.com';
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: {
    repository,
    commitSha,
    ref: process.env.MWR_CERT_REF ?? process.env.GITHUB_REF ?? null,
    runId,
    runAttempt: process.env.MWR_CERT_RUN_ATTEMPT ?? process.env.GITHUB_RUN_ATTEMPT ?? null,
    runUrl: `${serverUrl}/${repository}/actions/runs/${runId}`,
    runner: { os: runnerOs, arch: runnerArch },
  },
  browsers: Object.fromEntries(
    ['chrome', 'edge', 'firefox'].map((browser) => [
      browser,
      {
        expectedVersion: expectedVersions[browser],
        observedVersion: observedVersions[browser],
        artifact: artifacts[browser],
        result: 'passed',
      },
    ]),
  ),
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = ['chrome', 'edge', 'firefox']
    .map(
      (browser) =>
        `| ${browser} | ${observedVersions[browser]} | ${basename(artifacts[browser].filename)} | \`${artifacts[browser].sha256}\` |`,
    )
    .join('\n');
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    `## Browser floor certification\n\nCommit: \`${commitSha}\`\n\n| Browser | Observed version | Artifact | SHA-256 |\n| --- | --- | --- | --- |\n${rows}\n`,
    'utf8',
  );
}

console.log(`Wrote native x86 browser floor certification to ${outputPath}.`);
