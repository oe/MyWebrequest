import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { join } from 'node:path';

const firefox = process.env.MWR_FIREFOX_EXECUTABLE_PATH;
if (!firefox) throw new Error('MWR_FIREFOX_EXECUTABLE_PATH is required.');
await access(firefox);

const webExt = join(process.cwd(), 'node_modules', '.bin', 'web-ext');
await access(webExt);

const child = spawn(
  webExt,
  [
    'run',
    '--source-dir',
    'dist/firefox-mv3',
    '--firefox',
    firefox,
    '--no-reload',
    '--no-input',
    '--start-url',
    'about:blank',
    '--arg=-headless',
    '--arg=-no-remote',
  ],
  { cwd: process.cwd(), env: process.env, stdio: ['ignore', 'pipe', 'pipe'] },
);

let output = '';
const installed = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error(`Firefox floor install timed out.\n${output}`));
  }, 30_000);
  const inspect = (chunk) => {
    output += chunk.toString();
    if (!/Installed .+ as a temporary add-on/.test(output)) return;
    clearTimeout(timeout);
    resolve();
  };
  child.stdout.on('data', inspect);
  child.stderr.on('data', inspect);
  child.once('exit', (code, signal) => {
    clearTimeout(timeout);
    if (!/Installed .+ as a temporary add-on/.test(output)) {
      reject(new Error(`Firefox floor exited before installation (${code ?? signal}).\n${output}`));
    }
  });
  child.once('error', reject);
});

try {
  await installed;
  console.log('Firefox floor accepted the MV3 artifact as a temporary add-on.');
} finally {
  if (child.exitCode === null) child.kill('SIGINT');
}
