import { compileDnrRule } from '@/domain/rules/compile-dnr';
import type { MigrationState, Rule, RuleAction } from '@/domain/rules/model';
import { stableDnrId } from '@/domain/rules/model';
import { permissionOriginsFromMatch } from '@/domain/rules/permissions';

import type {
  JsonValue,
  LegacyParseIssue,
  LegacySourceEntry,
  MigrationItem,
  MigrationOutcome,
  ParsedLegacySource,
} from './model';

const ARRAY_RULE_KEYS = new Set(['block', 'hsts', 'hotlink']);
const RESERVED_HOLDERS = new Set(['p', 'h', 'm', 'r', 'q', 'u']);
const CUSTOM_PLACEHOLDER = /\{(\*?)(\w+)\}/g;

function stableToken(value: string): string {
  let first = 2166136261;
  let second = 2246822519;
  for (const character of value) {
    const code = character.charCodeAt(0);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second ^ code, 3266489917);
  }
  return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
}

function migrationId(key: string, locator: string, value: JsonValue | null): string {
  return `legacy-${key}-${stableToken(`${locator}:${JSON.stringify(value)}`)}`;
}

function makeItem(
  entry: Pick<LegacySourceEntry, 'key' | 'locator' | 'value'>,
  outcome: MigrationOutcome,
  reasonCode: string,
  explanation: string,
  enabledIntent: boolean,
  candidateRule?: Rule,
): MigrationItem {
  return {
    id: migrationId(entry.key, entry.locator, entry.value),
    sourceKey: entry.key,
    sourceLocator: entry.locator,
    sourceValue: entry.value,
    outcome,
    reasonCode,
    explanation,
    enabledIntent,
    ...(candidateRule ? { candidateRule } : {}),
  };
}

function issueItem(issue: LegacyParseIssue): MigrationItem {
  return {
    id: migrationId(issue.key, issue.locator, null),
    sourceKey: issue.key,
    sourceLocator: issue.locator,
    sourceValue: null,
    ...(issue.byteLength === undefined ? {} : { sourceByteLength: issue.byteLength }),
    outcome: 'invalid',
    reasonCode: issue.code,
    explanation: issue.message,
    enabledIntent: false,
  };
}

function isRecord(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function enabledIntents(parsed: ParsedLegacySource): Record<string, boolean> {
  return Object.fromEntries(
    parsed.entries
      .filter((entry) => entry.key === 'onoff')
      .map((entry) => [entry.locator.slice('onoff.'.length), entry.value === true]),
  );
}

function createCandidate(
  entry: LegacySourceEntry,
  now: string,
  action: RuleAction,
  migrationState: MigrationState,
  enabledIntent: boolean,
  condition: Rule['condition'],
  permissionOrigins: string[],
): Rule {
  const id = migrationId(entry.key, entry.locator, entry.value);
  return {
    schemaVersion: 1,
    id,
    dnrId: stableDnrId(id),
    name: `Legacy ${entry.key} rule`,
    enabled: false,
    priority: 1,
    condition,
    action,
    permissionOrigins,
    migrationState,
    createdAt: now,
    updatedAt: now,
  };
}

function classifySimpleRule(entry: LegacySourceEntry, enabledIntent: boolean, now: string): MigrationItem {
  if (typeof entry.value !== 'string') {
    return makeItem(
      entry,
      'invalid',
      'expected-url-pattern',
      'Legacy URL rules must be strings.',
      enabledIntent,
    );
  }

  const permissionOrigins = permissionOriginsFromMatch(entry.value);
  if (permissionOrigins.length === 0 || !/^(\*|https?):\/\/[^/]+\/.+/.test(entry.value)) {
    return makeItem(
      entry,
      'invalid',
      'invalid-url-pattern',
      'The legacy URL pattern cannot be represented safely.',
      enabledIntent,
    );
  }

  const action: RuleAction =
    entry.key === 'block'
      ? { kind: 'block' }
      : entry.key === 'hsts'
        ? { kind: 'upgrade-scheme' }
        : {
            kind: 'modify-request-headers',
            operations: [{ header: 'Referer', operation: 'remove' }],
          };
  if (entry.key === 'hotlink') {
    return makeItem(
      entry,
      'unsupported',
      'initiator-permission-unbounded',
      'The legacy header rule affected subresources from any site. Manifest V3 requires explicit initiator access, so the source is preserved for manual recreation with bounded initiator domains.',
      enabledIntent,
    );
  }
  const reviewRequired = entry.key === 'hsts' && entry.value.startsWith('*://');
  const candidate = createCandidate(
    entry,
    now,
    action,
    reviewRequired ? 'review-required' : 'none',
    enabledIntent,
    { url: { kind: 'wildcard', value: entry.value } },
    permissionOrigins,
  );
  const compiled = compileDnrRule(candidate);
  if (!compiled.ok) {
    return makeItem(entry, 'unsupported', 'dnr-compilation-failed', compiled.errors.join(' '), enabledIntent);
  }

  return makeItem(
    entry,
    reviewRequired ? 'review-required' : 'automatic',
    reviewRequired ? 'scheme-scope-review' : 'equivalent-dnr-rule',
    reviewRequired
      ? 'The wildcard-scheme HTTPS rule needs review because MV3 upgrade behavior has a different scope.'
      : 'The legacy behavior has an equivalent Manifest V3 rule.',
    enabledIntent,
    candidate,
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type CustomCompilation =
  | { ok: true; regex: string; target: string; permissionOrigins: string[]; captureCount: number }
  | { ok: false; reasonCode: string; explanation: string };

function compileCustomRule(matchUrl: string, redirectUrl: string): CustomCompilation {
  const normalizedMatch = /^(\*|https?):\/\/[^/]+$/.test(matchUrl) ? `${matchUrl}/` : matchUrl;
  const match = /^(\*|https?):\/\/([^/]+)\/([^?]*)(?:\?(.*))?$/.exec(normalizedMatch);
  if (!match) {
    return {
      ok: false,
      reasonCode: 'invalid-custom-match',
      explanation: 'The Custom URL match pattern is not a supported HTTP(S) route.',
    };
  }

  const [, scheme, host, path, query] = match;
  if (!scheme || !host || path === undefined) {
    return {
      ok: false,
      reasonCode: 'invalid-custom-match',
      explanation: 'The Custom URL route is incomplete.',
    };
  }
  if (query && /\{\w+\}/.test(query)) {
    return {
      ok: false,
      reasonCode: 'query-extraction-unsupported',
      explanation: 'MV3 cannot preserve order-independent legacy query-parameter extraction.',
    };
  }
  const literalHost = host.replace(/\{\*?\w+\}/g, '');
  const literalPath = path.replace(/\{\*?\w+\}/g, '');
  if (literalHost.includes('*') || literalPath.includes('*')) {
    return {
      ok: false,
      reasonCode: 'custom-wildcard-unsupported',
      explanation:
        'A legacy Custom URL literal wildcard cannot be converted without changing its match scope.',
    };
  }

  const params: string[] = [];
  let regexBody = '';
  const routeBody = `${host}/${path}`;
  let cursor = 0;
  for (const placeholder of routeBody.matchAll(CUSTOM_PLACEHOLDER)) {
    const token = placeholder[0];
    const splat = placeholder[1] === '*';
    const name = placeholder[2];
    const index = placeholder.index;
    if (index === undefined || !name) continue;
    if (RESERVED_HOLDERS.has(name) || params.includes(name)) {
      return {
        ok: false,
        reasonCode: RESERVED_HOLDERS.has(name) ? 'reserved-placeholder' : 'duplicate-placeholder',
        explanation: RESERVED_HOLDERS.has(name)
          ? `The placeholder “${name}” conflicts with a reserved legacy value.`
          : `The placeholder “${name}” is duplicated.`,
      };
    }
    if (splat && index + token.length !== routeBody.length) {
      return {
        ok: false,
        reasonCode: 'non-terminal-splat',
        explanation: 'Legacy splat placeholders are supported only at the end of the route.',
      };
    }
    regexBody += escapeRegex(routeBody.slice(cursor, index));
    regexBody += splat ? '([^?]*)' : '([^/?]+)';
    params.push(name);
    cursor = index + token.length;
  }
  regexBody += escapeRegex(routeBody.slice(cursor));

  const destinationHolders = [...redirectUrl.matchAll(/\{(\w+)\}/g)].map((holder) => holder[1]);
  const reservedDestination = destinationHolders.find((holder) => holder && RESERVED_HOLDERS.has(holder));
  if (reservedDestination) {
    return {
      ok: false,
      reasonCode: 'computed-placeholder-unsupported',
      explanation: `The reserved “${reservedDestination}” value requires per-request JavaScript computation.`,
    };
  }
  const undefinedHolder = destinationHolders.find((holder) => holder && !params.includes(holder));
  if (undefinedHolder) {
    return {
      ok: false,
      reasonCode: 'undefined-placeholder',
      explanation: `The redirect uses undefined placeholder “${undefinedHolder}”.`,
    };
  }
  if (params.length > 9) {
    return {
      ok: false,
      reasonCode: 'capture-limit-exceeded',
      explanation: 'The Custom URL rule needs more than nine MV3 substitution captures.',
    };
  }

  const target = redirectUrl.replace(/\{(\w+)\}/g, (token, name: string) => {
    const index = params.indexOf(name);
    return index < 0 ? token : `$${index + 1}`;
  });
  const comparableTarget = target.replace(/\$\d/g, 'capture');
  try {
    const destination = new URL(comparableTarget);
    if (!['http:', 'https:'].includes(destination.protocol)) throw new Error('unsupported scheme');
  } catch {
    return {
      ok: false,
      reasonCode: 'invalid-custom-destination',
      explanation: 'The legacy redirect destination is not a supported HTTP(S) URL.',
    };
  }

  let permissionHost = host;
  if (/\{\w+\}/.test(host)) {
    const base = host.replace(/^(?:\{\w+\}\.)+/, '');
    if (!base || /[{}]/.test(base)) {
      return {
        ok: false,
        reasonCode: 'host-placeholder-unsupported',
        explanation: 'The host placeholders cannot be represented by a bounded optional permission.',
      };
    }
    permissionHost = `*.${base}`;
  }
  const permissionOrigins = [`${scheme}://${permissionHost}/*`];
  const protocolRegex = scheme === '*' ? 'https?' : scheme;

  return {
    ok: true,
    regex: `^${protocolRegex}:\\/\\/${regexBody}`,
    target,
    permissionOrigins,
    captureCount: params.length,
  };
}

function classifyCustomRule(entry: LegacySourceEntry, enabledIntent: boolean, now: string): MigrationItem {
  if (!isRecord(entry.value)) {
    return makeItem(
      entry,
      'invalid',
      'invalid-custom-shape',
      'A legacy Custom URL rule must be an object.',
      enabledIntent,
    );
  }
  const matchUrl = entry.value.matchUrl;
  const redirectUrl = entry.value.redirectUrl;
  if (typeof matchUrl !== 'string' || typeof redirectUrl !== 'string') {
    return makeItem(
      entry,
      'invalid',
      'missing-custom-fields',
      'The Custom URL rule is missing its original match or redirect template.',
      enabledIntent,
    );
  }

  const compiled = compileCustomRule(matchUrl, redirectUrl);
  if (!compiled.ok) {
    return makeItem(entry, 'unsupported', compiled.reasonCode, compiled.explanation, enabledIntent);
  }

  const candidate = createCandidate(
    entry,
    now,
    { kind: 'redirect', target: compiled.target },
    'review-required',
    enabledIntent,
    {
      url: { kind: 'regex', value: compiled.regex },
      resourceTypes: ['main_frame', 'sub_frame'],
    },
    compiled.permissionOrigins,
  );
  const dnrResult = compileDnrRule(candidate);
  if (!dnrResult.ok) {
    return makeItem(
      entry,
      'unsupported',
      'dnr-compilation-failed',
      dnrResult.errors.join(' '),
      enabledIntent,
    );
  }

  return makeItem(
    entry,
    'review-required',
    compiled.captureCount > 0 ? 'substitution-and-navigation-scope-review' : 'navigation-scope-review',
    compiled.captureCount > 0
      ? 'The route is limited to navigations, and raw capture substitution may differ from legacy encoding behavior.'
      : 'The route is limited to top-level and frame navigations so it can use bounded Manifest V3 permissions.',
    enabledIntent,
    candidate,
  );
}

function classifyEntry(
  entry: LegacySourceEntry,
  intents: Record<string, boolean>,
  now: string,
): MigrationItem {
  const enabledIntent = intents[entry.key] === true;
  if (ARRAY_RULE_KEYS.has(entry.key)) return classifySimpleRule(entry, enabledIntent, now);
  if (entry.key === 'custom') return classifyCustomRule(entry, enabledIntent, now);
  if (entry.key === 'gsearch') {
    return makeItem(
      entry,
      'review-required',
      'dynamic-query-decoding',
      'Google redirect removal depends on order-independent query extraction and URL decoding.',
      enabledIntent,
    );
  }
  if (entry.key === 'log' || entry.key === 'gstatic') {
    return makeItem(
      entry,
      'removed-feature',
      entry.key === 'log' ? 'request-logging-removed' : 'obsolete-cdn-removed',
      entry.key === 'log'
        ? 'Request logging is intentionally not restored in V1.'
        : 'The obsolete Google-to-useso CDN rewrite is not restored.',
      enabledIntent,
    );
  }
  if (entry.key === 'onoff') {
    return makeItem(
      entry,
      'removed-feature',
      'enabled-intent-consumed',
      'The category switch was recorded as migration intent; converted rules remain disabled until review.',
      entry.value === true,
    );
  }
  if (entry.key === 'config') {
    return makeItem(
      entry,
      'removed-feature',
      'legacy-preference-removed',
      'This legacy preference has no V1 runtime equivalent and remains in the exportable snapshot.',
      false,
    );
  }
  return makeItem(
    entry,
    'unsupported',
    'unknown-legacy-key',
    'The unknown legacy key is retained in the raw snapshot and is never activated.',
    false,
  );
}

export function classifyLegacySource(parsed: ParsedLegacySource, now: string): MigrationItem[] {
  const intents = enabledIntents(parsed);
  return [
    ...parsed.entries.map((entry) => classifyEntry(entry, intents, now)),
    ...parsed.issues.map(issueItem),
  ];
}
