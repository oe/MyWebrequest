import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const webExtBin = fileURLToPath(
  new URL("../node_modules/web-ext/bin/web-ext.js", import.meta.url),
);
const validatorNode = process.env.WEB_EXT_NODE || process.execPath;

const args = [
  "lint",
  "--source-dir",
  "dist/firefox-mv3",
  "--output=json",
  "--boring",
];

function runWebExtLint() {
  return spawnSync(validatorNode, [webExtBin, ...args], {
    encoding: "utf8",
  });
}

let result = runWebExtLint();

// Retry only this process-level failure; normal lint failures still fail fast.
if (result.signal === "SIGBUS" || result.status === 138) {
  console.warn("web-ext lint exited with SIGBUS; retrying once.");
  result = runWebExtLint();
}

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || "web-ext lint failed.\n");
  process.exitCode = result.status ?? 1;
} else {
  const report = JSON.parse(result.stdout);
  const expectedReactWarnings = report.warnings.filter(
    (warning) =>
      warning.code === "UNSAFE_VAR_ASSIGNMENT" &&
      /^chunks\/badge-[A-Za-z0-9_-]+\.js$/.test(warning.file),
  );
  const unexpectedWarnings = report.warnings.filter(
    (warning) => !expectedReactWarnings.includes(warning),
  );

  if (
    report.summary.errors !== 0 ||
    unexpectedWarnings.length !== 0 ||
    expectedReactWarnings.length !== 2
  ) {
    process.stderr.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = 1;
  } else {
    console.log(
      "Firefox package passed web-ext lint (2 allowlisted React runtime warnings).",
    );
  }
}
