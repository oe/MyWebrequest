import { z } from 'zod/v3';

import type { Rule, StoredState } from '@/domain/rules/model';
import { stableDnrId } from '@/domain/rules/model';
import { permissionOriginsFromMatch } from '@/domain/rules/permissions';
import { storedStateSchema } from '@/domain/rules/schema';

const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const FORMAT = 'my-webrequest-rules' as const;

const backupEnvelopeSchema = z.object({
  format: z.literal(FORMAT),
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  state: storedStateSchema,
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
});

export type RuleBackup = {
  format: typeof FORMAT;
  version: 1;
  exportedAt: string;
  state: StoredState;
  checksum: string;
};
export type ParsedRuleBackup = {
  backup: RuleBackup;
  integrity: 'verified' | 'legacy-unverified';
};
export type RuleImportMode = 'merge' | 'replace';
export type RuleImportPreview = {
  nextState: StoredState;
  sourceRuleCount: number;
  importedRuleCount: number;
  addCount: number;
  updateCount: number;
  skipCount: number;
  deleteCount: number;
  conflictCount: number;
  mode: RuleImportMode;
  integrity: ParsedRuleBackup['integrity'];
};

function canonicalize(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(',')}}`;
}

async function sha256(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalize(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function checksumPayload(backup: Omit<RuleBackup, 'checksum'>): unknown {
  return {
    format: backup.format,
    version: backup.version,
    exportedAt: backup.exportedAt,
    state: backup.state,
  };
}

export async function createRuleBackup(state: StoredState, exportedAt: string): Promise<RuleBackup> {
  const parsedState = storedStateSchema.parse(state) as StoredState;
  const payload: Omit<RuleBackup, 'checksum'> = {
    format: FORMAT,
    version: 1,
    exportedAt,
    state: parsedState,
  };
  return { ...payload, checksum: await sha256(checksumPayload(payload)) };
}

export async function parseRuleBackup(text: string): Promise<ParsedRuleBackup> {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('Rule backups must be 5 MB or smaller.');
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(text);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  const envelope = backupEnvelopeSchema.safeParse(candidate);
  if (envelope.success) {
    const parsedBackup = envelope.data as RuleBackup;
    const { checksum, ...payload } = parsedBackup;
    if ((await sha256(checksumPayload(payload))) !== checksum) {
      throw new Error('The backup checksum does not match its contents.');
    }
    return { backup: parsedBackup, integrity: 'verified' };
  }

  const legacyState = storedStateSchema.safeParse(candidate);
  if (!legacyState.success) throw new Error('The file is not a supported rule backup.');
  const state = legacyState.data as StoredState;
  const exportedAt =
    state.order
      .map((id) => state.rules[id]?.updatedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? '1970-01-01T00:00:00.000Z';
  const backup = await createRuleBackup(state, exportedAt);
  return { backup, integrity: 'legacy-unverified' };
}

function safeImportedRule(rule: Rule, id: string, now: string): Rule {
  return {
    ...rule,
    id,
    dnrId: stableDnrId(id),
    enabled: false,
    permissionOrigins: permissionOriginsFromMatch(rule.condition.url.value),
    updatedAt: now,
  };
}

function equivalentRule(left: Rule, right: Rule): boolean {
  const comparable = (rule: Rule) => ({
    name: rule.name,
    priority: rule.priority,
    condition: rule.condition,
    action: rule.action,
    migrationState: rule.migrationState,
  });
  return canonicalize(comparable(left)) === canonicalize(comparable(right));
}

async function conflictId(
  checksum: string,
  sourceId: string,
  sourceRule: Rule,
  rules: Readonly<Record<string, Rule>>,
  occupiedIds: ReadonlySet<string>,
  occupiedDnrIds: ReadonlySet<number>,
): Promise<string | null> {
  const token = (await sha256({ checksum, sourceId })).slice(0, 20);
  for (let suffix = 0; suffix < 10_000; suffix += 1) {
    const id = `import-${token}${suffix === 0 ? '' : `-${suffix}`}`;
    const existing = rules[id];
    if (existing && equivalentRule(existing, sourceRule)) return null;
    if (!occupiedIds.has(id) && !occupiedDnrIds.has(stableDnrId(id))) return id;
  }
  throw new Error('A unique imported rule ID could not be allocated.');
}

export async function createRuleImportPreview(
  current: StoredState,
  parsed: ParsedRuleBackup,
  mode: RuleImportMode,
  now: string,
): Promise<RuleImportPreview> {
  storedStateSchema.parse(current);
  const source = parsed.backup.state;
  const rules: Record<string, Rule> = mode === 'merge' ? { ...current.rules } : {};
  const order = mode === 'merge' ? [...current.order] : [];
  const occupiedIds = new Set(Object.keys(rules));
  const occupiedDnrIds = new Set(Object.values(rules).map((rule) => rule.dnrId));
  let conflictCount = 0;
  let addCount = 0;
  let updateCount = 0;
  let skipCount = 0;

  for (const sourceId of source.order) {
    const sourceRule = source.rules[sourceId];
    if (!sourceRule) continue;
    let id = sourceId;
    if (mode === 'merge' && rules[sourceId] && equivalentRule(rules[sourceId], sourceRule)) {
      skipCount += 1;
      continue;
    }
    if (occupiedIds.has(id) || occupiedDnrIds.has(stableDnrId(id))) {
      conflictCount += 1;
      const allocated = await conflictId(
        parsed.backup.checksum,
        sourceId,
        sourceRule,
        rules,
        occupiedIds,
        occupiedDnrIds,
      );
      if (!allocated) {
        conflictCount -= 1;
        skipCount += 1;
        continue;
      }
      id = allocated;
    }
    const rule = safeImportedRule(sourceRule, id, now);
    if (mode === 'replace' && current.rules[sourceId]) updateCount += 1;
    else addCount += 1;
    rules[id] = rule;
    order.push(id);
    occupiedIds.add(id);
    occupiedDnrIds.add(rule.dnrId);
  }

  const nextState: StoredState = {
    schemaVersion: 1,
    rules,
    order,
    settings: mode === 'merge' ? current.settings : source.settings,
  };
  storedStateSchema.parse(nextState);
  return {
    nextState,
    sourceRuleCount: source.order.length,
    importedRuleCount: addCount + updateCount,
    addCount,
    updateCount,
    skipCount,
    deleteCount: mode === 'replace' ? current.order.filter((id) => !source.rules[id]).length : 0,
    conflictCount,
    mode,
    integrity: parsed.integrity,
  };
}
