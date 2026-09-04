import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';

import browserSupport from '../../browser-support.json';

const execFileAsync = promisify(execFile);
const temporaryDirectories: string[] = [];
const scriptPath = resolve('scripts/write-floor-certification.mjs');

async function fixtureRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'mwr-floor-certification-'));
  temporaryDirectories.push(root);
  const dist = join(root, 'dist');
  await mkdir(dist);
  await writeFile(join(root, 'browser-support.json'), JSON.stringify(browserSupport), 'utf8');

  const names = ['chrome', 'edge', 'firefox'].map((target) => `request-orbit-1.0.0-alpha.1-${target}.zip`);
  const rows: string[] = [];
  for (const name of names) {
    const bytes = Buffer.from(`fixture:${name}`);
    await writeFile(join(dist, name), bytes);
    rows.push(`${createHash('sha256').update(bytes).digest('hex')}  ${name}`);
  }
  await writeFile(join(dist, 'SHA256SUMS'), `${rows.join('\n')}\n`, 'utf8');
  return root;
}

function certificationEnvironment(root: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    MWR_CERT_PROJECT_ROOT: root,
    MWR_CERT_COMMIT_SHA: 'a'.repeat(40),
    MWR_CERT_REPOSITORY: 'oe/MyWebrequest',
    MWR_CERT_RUN_ID: '123456',
    MWR_CERT_RUNNER_OS: 'Linux',
    MWR_CERT_RUNNER_ARCH: 'X64',
    MWR_CHROME_OBSERVED_VERSION: `Google Chrome for Testing ${browserSupport.chromeForTestingFloor}`,
    MWR_EDGE_OBSERVED_VERSION: `Microsoft Edge ${browserSupport.edgeFloorPackageVersion.replace(/-\d+$/, '')}`,
    MWR_FIREFOX_OBSERVED_VERSION: `Mozilla Firefox ${browserSupport.firefoxMinimum}`,
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('browser floor certification script', () => {
  it('writes provenance only for exact native x86 floor versions and checksummed artifacts', async () => {
    const root = await fixtureRoot();
    await execFileAsync(process.execPath, [scriptPath], { env: certificationEnvironment(root) });

    const report = JSON.parse(
      await readFile(join(root, 'dist', 'browser-floor-certification.json'), 'utf8'),
    ) as {
      source: { commitSha: string; runner: { os: string; arch: string }; runUrl: string };
      browsers: Record<
        'chrome' | 'edge' | 'firefox',
        { expectedVersion: string; result: string; artifact: { sha256: string } }
      >;
    };
    expect(report.source).toMatchObject({
      commitSha: 'a'.repeat(40),
      runner: { os: 'Linux', arch: 'X64' },
      runUrl: 'https://github.com/oe/MyWebrequest/actions/runs/123456',
    });
    expect(report.browsers.chrome.expectedVersion).toBe(browserSupport.chromeForTestingFloor);
    expect(report.browsers.edge.expectedVersion).toBe('121.0.2277.128');
    expect(report.browsers.firefox.result).toBe('passed');
    expect(report.browsers.chrome.artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects a newer browser masquerading as the declared floor', async () => {
    const root = await fixtureRoot();
    await expect(
      execFileAsync(process.execPath, [scriptPath], {
        env: { ...certificationEnvironment(root), MWR_CHROME_OBSERVED_VERSION: 'Google Chrome 151.0.0.0' },
      }),
    ).rejects.toMatchObject({ stderr: expect.stringContaining('expected 121.0.6167.184') });
  });

  it('requires the observed version token to match exactly', async () => {
    const root = await fixtureRoot();
    await expect(
      execFileAsync(process.execPath, [scriptPath], {
        env: {
          ...certificationEnvironment(root),
          MWR_CHROME_OBSERVED_VERSION: 'Google Chrome 121.0.6167.1840',
        },
      }),
    ).rejects.toMatchObject({ stderr: expect.stringContaining('expected 121.0.6167.184') });
  });

  it('rejects an archive that changed after SHA256SUMS was written', async () => {
    const root = await fixtureRoot();
    await writeFile(join(root, 'dist', 'request-orbit-1.0.0-alpha.1-chrome.zip'), 'tampered archive', 'utf8');

    await expect(
      execFileAsync(process.execPath, [scriptPath], { env: certificationEnvironment(root) }),
    ).rejects.toMatchObject({ stderr: expect.stringContaining('does not match SHA256SUMS') });
  });
});
