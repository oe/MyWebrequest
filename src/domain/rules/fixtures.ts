import type { Rule, StoredState } from './model';

const createdAt = '2026-08-31T00:00:00.000Z';

export const sampleRules: Rule[] = [
  {
    schemaVersion: 1,
    id: 'mirror-api-local',
    dnrId: 1001,
    name: 'Mirror API to local',
    enabled: true,
    priority: 20,
    condition: {
      url: { kind: 'wildcard', value: 'https://api.example.com/v1/*' },
      initiatorDomains: ['app.example.com'],
    },
    action: { kind: 'redirect', target: 'http://localhost:3000/v1/$1' },
    permissionOrigins: ['https://api.example.com/*'],
    migrationState: 'none',
    createdAt,
    updatedAt: createdAt,
  },
  {
    schemaVersion: 1,
    id: 'block-analytics-beacon',
    dnrId: 1002,
    name: 'Block analytics beacon',
    enabled: true,
    priority: 10,
    condition: {
      url: { kind: 'url-filter', value: '||analytics.example.com^' },
      resourceTypes: ['ping', 'xmlhttprequest'],
    },
    action: { kind: 'block' },
    permissionOrigins: ['https://analytics.example.com/*'],
    migrationState: 'none',
    createdAt,
    updatedAt: createdAt,
  },
  {
    schemaVersion: 1,
    id: 'remove-image-referer',
    dnrId: 1003,
    name: 'Remove image referer',
    enabled: true,
    priority: 15,
    condition: {
      url: { kind: 'wildcard', value: 'https://images.example.com/*' },
      resourceTypes: ['image'],
      initiatorDomains: ['app.example.com'],
    },
    action: { kind: 'modify-request-headers', operations: [{ header: 'Referer', operation: 'remove' }] },
    permissionOrigins: ['https://images.example.com/*'],
    migrationState: 'none',
    createdAt,
    updatedAt: createdAt,
  },
  {
    schemaVersion: 1,
    id: 'legacy-search-redirect',
    dnrId: 1004,
    name: 'Legacy search redirect',
    enabled: false,
    priority: 5,
    condition: {
      url: { kind: 'wildcard', value: 'https://search.example.com/*' },
      resourceTypes: ['main_frame', 'sub_frame'],
    },
    action: { kind: 'redirect', target: 'https://www.google.com/search?q=$1' },
    permissionOrigins: ['https://search.example.com/*'],
    migrationState: 'review-required',
    createdAt,
    updatedAt: createdAt,
  },
  {
    schemaVersion: 1,
    id: 'old-cdn-mirror',
    dnrId: 1005,
    name: 'Old CDN mirror',
    enabled: false,
    priority: 1,
    condition: { url: { kind: 'wildcard', value: 'https://cdn.example.com/*' } },
    action: { kind: 'redirect', target: 'https://legacy-cdn.invalid/$1' },
    permissionOrigins: ['https://cdn.example.com/*'],
    migrationState: 'removed',
    createdAt,
    updatedAt: createdAt,
  },
];

export function createSampleState(): StoredState {
  return {
    schemaVersion: 1,
    rules: Object.fromEntries(sampleRules.map((rule) => [rule.id, rule])),
    order: sampleRules.map((rule) => rule.id),
    settings: { globallyPaused: false },
  };
}

export function createEmptyState(): StoredState {
  return { schemaVersion: 1, rules: {}, order: [], settings: { globallyPaused: false } };
}
