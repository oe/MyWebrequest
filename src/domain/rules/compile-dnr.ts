import type { HeaderOperation, Rule } from './model';
import { wildcardToRegExpSource } from './test-match';
import { validateRule } from './validate';

export type DnrRule = {
  id: number;
  priority: number;
  condition: {
    urlFilter?: string;
    regexFilter?: string;
    resourceTypes?: string[];
    requestMethods?: string[];
    initiatorDomains?: string[];
  };
  action:
    | { type: 'block' }
    | { type: 'upgradeScheme' }
    | { type: 'redirect'; redirect: { url: string } | { regexSubstitution: string } }
    | {
        type: 'modifyHeaders';
        requestHeaders: Array<{ header: string; operation: HeaderOperation['operation']; value?: string }>;
      };
};

export type CompileResult = { ok: true; rule: DnrRule; warnings: string[] } | { ok: false; errors: string[] };

function toDnrRegexSubstitution(target: string): string {
  return target.replace(/\$(\d)/g, '\\$1');
}

export function compileDnrRule(rule: Rule): CompileResult {
  const validation = validateRule(rule);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors.map((issue) => issue.message) };
  }

  const condition: DnrRule['condition'] = {};
  if (rule.condition.url.kind === 'url-filter') condition.urlFilter = rule.condition.url.value;
  if (rule.condition.url.kind === 'wildcard')
    condition.regexFilter = wildcardToRegExpSource(rule.condition.url.value);
  if (rule.condition.url.kind === 'regex') condition.regexFilter = rule.condition.url.value;
  if (rule.condition.resourceTypes?.length) condition.resourceTypes = rule.condition.resourceTypes;
  if (rule.condition.requestMethods?.length) condition.requestMethods = rule.condition.requestMethods;
  if (rule.condition.initiatorDomains?.length) condition.initiatorDomains = rule.condition.initiatorDomains;

  let action: DnrRule['action'];
  switch (rule.action.kind) {
    case 'block':
      action = { type: 'block' };
      break;
    case 'upgrade-scheme':
      action = { type: 'upgradeScheme' };
      break;
    case 'redirect':
      action = {
        type: 'redirect',
        redirect: /\$\d/.test(rule.action.target)
          ? { regexSubstitution: toDnrRegexSubstitution(rule.action.target) }
          : { url: rule.action.target },
      };
      break;
    case 'modify-request-headers':
      action = {
        type: 'modifyHeaders',
        requestHeaders: rule.action.operations.map((operation) => ({ ...operation })),
      };
      break;
  }

  return {
    ok: true,
    rule: { id: rule.dnrId, priority: rule.priority, condition, action },
    warnings: validation.warnings.map((issue) => issue.message),
  };
}
