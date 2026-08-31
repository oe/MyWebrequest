import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const webExtBin = fileURLToPath(
  new URL("../node_modules/web-ext/bin/web-ext.js", import.meta.url),
);
const validatorNode = process.env.WEB_EXT_NODE || process.execPath;
const firefoxOutputDirectory = fileURLToPath(
  new URL("../dist/firefox-mv3/", import.meta.url),
);

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

function isVerifiedReactRuntimeWarning(warning) {
  if (
    warning.code !== "UNSAFE_VAR_ASSIGNMENT" ||
    warning.message !== "Unsafe assignment to innerHTML" ||
    !/^chunks\/[A-Za-z0-9_-]+\.js$/.test(warning.file) ||
    !Number.isInteger(warning.line) ||
    !Number.isInteger(warning.column)
  ) {
    return false;
  }

  const source = readFileSync(
    new URL(warning.file, `file://${firefoxOutputDirectory}/`),
    "utf8",
  );
  const line = source.split(/\r?\n/)[warning.line - 1];
  const column = warning.column - 1;

  if (!line || column < 0 || column >= line.length) {
    return false;
  }

  const warningContext = line.slice(
    Math.max(0, column - 80),
    Math.min(line.length, column + 80),
  );
  const hasReactDomMarkers = [
    "__reactFiber$",
    "__reactProps$",
    "react.transitional.element",
    "React has blocked a javascript: URL",
  ].every((marker) => source.includes(marker));

  return (
    hasReactDomMarkers &&
    /__html[\s\S]{0,80}children[\s\S]{0,80}\.innerHTML=/.test(warningContext)
  );
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
    isVerifiedReactRuntimeWarning,
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
