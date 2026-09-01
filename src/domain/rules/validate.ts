import type { Rule, RuleStatus } from './model';
import { requiresInitiatorPermission } from './permissions';
import { ruleSchema } from './schema';

export type ValidationIssue = {
  field: 'name' | 'match' | 'initiators' | 'destination' | 'headers' | 'permission' | 'rule';
  code:
    | 'schema-invalid'
    | 'regex-invalid'
    | 'wildcard-without-star'
    | 'redirect-scheme'
    | 'redirect-url-invalid'
    | 'redirect-self'
    | 'capture-match-required'
    | 'capture-index-invalid'
    | 'initiator-domain-invalid'
    | 'initiator-permission-required'
    | 'header-name-invalid'
    | 'header-forbidden';
  message: string;
  value?: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

const forbiddenRequestHeaders = new Set([
  'accept-charset',
  'accept-encoding',
  'access-control-request-headers',
  'access-control-request-method',
  'connection',
  'content-length',
  'cookie',
  'host',
  'origin',
  'proxy-connection',
  'sec-fetch-mode',
  'sec-fetch-site',
  'sec-fetch-user',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const headerNamePattern = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const domainPattern =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/;

export function validateRule(rule: Rule): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const parsed = ruleSchema.safeParse(rule);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const root = issue.path[0];
      const field =
        root === 'name'
          ? 'name'
          : root === 'condition'
            ? 'match'
            : root === 'action'
              ? 'destination'
              : 'rule';
      errors.push({ field, code: 'schema-invalid', message: issue.message });
    }
  }

  if (rule.condition.url.kind === 'regex') {
    try {
      new RegExp(rule.condition.url.value);
    } catch {
      errors.push({ field: 'match', code: 'regex-invalid', message: 'The regular expression is not valid.' });
    }
  }

  if (rule.condition.url.kind === 'wildcard' && !rule.condition.url.value.includes('*')) {
    warnings.push({
      field: 'match',
      code: 'wildcard-without-star',
      message: 'This wildcard rule contains no wildcard and behaves like an exact match.',
    });
  }

  for (const domain of rule.condition.initiatorDomains ?? []) {
    if (!domainPattern.test(domain)) {
      errors.push({
        field: 'initiators',
        code: 'initiator-domain-invalid',
        message: `“${domain}” is not a valid initiator domain.`,
        value: domain,
      });
    }
  }

  if (requiresInitiatorPermission(rule) && !rule.condition.initiatorDomains?.length) {
    errors.push({
      field: 'initiators',
      code: 'initiator-permission-required',
      message:
        'Redirect and header rules that can affect subresources require an initiator domain for bounded host access.',
    });
  }

  if (rule.action.kind === 'redirect') {
    const target = rule.action.target.replace(/\$\d+/g, 'capture');
    try {
      const url = new URL(target);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push({
          field: 'destination',
          code: 'redirect-scheme',
          message: 'Redirects must use HTTP or HTTPS.',
        });
      }
    } catch {
      errors.push({
        field: 'destination',
        code: 'redirect-url-invalid',
        message: 'Enter a valid redirect URL.',
      });
    }

    if (rule.condition.url.value === rule.action.target) {
      errors.push({
        field: 'destination',
        code: 'redirect-self',
        message: 'A rule cannot redirect a URL to itself.',
      });
    }

    const captureReferences = [...rule.action.target.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
    if (captureReferences.length > 0 && rule.condition.url.kind === 'url-filter') {
      errors.push({
        field: 'destination',
        code: 'capture-match-required',
        message: 'Capture references require a wildcard or regular-expression match.',
      });
    }
    if (captureReferences.some((index) => index < 1 || index > 9)) {
      errors.push({
        field: 'destination',
        code: 'capture-index-invalid',
        message: 'Chrome redirects support capture references from $1 through $9.',
      });
    }
  }

  if (rule.action.kind === 'modify-request-headers') {
    for (const operation of rule.action.operations) {
      const normalizedName = operation.header.toLowerCase();
      if (!headerNamePattern.test(operation.header)) {
        errors.push({
          field: 'headers',
          code: 'header-name-invalid',
          message: `“${operation.header}” is not a valid header name.`,
          value: operation.header,
        });
      }
      if (forbiddenRequestHeaders.has(normalizedName)) {
        errors.push({
          field: 'headers',
          code: 'header-forbidden',
          message: `Chrome does not allow this rule to modify “${operation.header}”.`,
          value: operation.header,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

type RuleRuntimeState = {
  globallyPaused?: boolean | undefined;
  isInstalled?: boolean | null | undefined;
  runtimeError?: boolean | undefined;
};

export function deriveRuleStatus(
  rule: Rule,
  hasPermission: boolean,
  runtimeState: RuleRuntimeState = {},
): RuleStatus {
  if (rule.migrationState === 'removed') return 'removed';
  if (rule.migrationState === 'unsupported') return 'unsupported';
  if (rule.migrationState === 'review-required') return 'review-required';
  if (!validateRule(rule).valid) return 'invalid';
  if (!rule.enabled) return 'disabled';
  if (runtimeState.globallyPaused) return 'paused';
  if (runtimeState.runtimeError) return 'runtime-error';
  if (!hasPermission) return 'needs-permission';
  if (runtimeState.isInstalled === false) return 'not-applied';
  return 'active';
}
