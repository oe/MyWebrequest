export const RESOURCE_TYPES = [
  'main_frame',
  'sub_frame',
  'stylesheet',
  'script',
  'image',
  'font',
  'object',
  'xmlhttprequest',
  'ping',
  'media',
  'websocket',
  'other',
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type RuleCondition = {
  url:
    | { kind: 'url-filter'; value: string }
    | { kind: 'wildcard'; value: string }
    | { kind: 'regex'; value: string };
  resourceTypes?: ResourceType[];
  requestMethods?: Array<'connect' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put'>;
  initiatorDomains?: string[];
};

export type HeaderOperation = {
  header: string;
  operation: 'remove' | 'set';
  value?: string;
};

export type RuleAction =
  | { kind: 'block' }
  | { kind: 'redirect'; target: string }
  | { kind: 'upgrade-scheme' }
  | { kind: 'modify-request-headers'; operations: HeaderOperation[] };

export type MigrationState = 'none' | 'review-required' | 'removed' | 'unsupported';

export type Rule = {
  schemaVersion: 1;
  id: string;
  dnrId: number;
  name: string;
  enabled: boolean;
  priority: number;
  condition: RuleCondition;
  action: RuleAction;
  permissionOrigins: string[];
  migrationState: MigrationState;
  createdAt: string;
  updatedAt: string;
};

export type RuleStatus =
  'active' | 'disabled' | 'needs-permission' | 'invalid' | 'unsupported' | 'review-required' | 'removed';

export type StoredState = {
  schemaVersion: 1;
  rules: Record<string, Rule>;
  order: string[];
  settings: {
    globallyPaused: boolean;
  };
};

export type RuleDraft = Omit<Rule, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

export function actionLabel(action: RuleAction): string {
  switch (action.kind) {
    case 'block':
      return 'Block';
    case 'redirect':
      return 'Redirect';
    case 'upgrade-scheme':
      return 'Upgrade';
    case 'modify-request-headers':
      return 'Header';
  }
}

export function stableDnrId(id: string): number {
  let hash = 2166136261;
  for (const character of id) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 2_000_000_000) + 1;
}
