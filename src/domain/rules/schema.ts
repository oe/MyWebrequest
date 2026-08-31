import { z } from 'zod/v3';

import { RESOURCE_TYPES } from './model';

const headerOperationSchema = z
  .object({
    header: z.string().trim().min(1).max(256),
    operation: z.enum(['remove', 'set']),
    value: z.string().max(8_192).optional(),
  })
  .superRefine((operation, context) => {
    if (operation.operation === 'set' && operation.value === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'A value is required when setting a header.',
        path: ['value'],
      });
    }
  });

export const ruleSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1).max(128),
  dnrId: z.number().int().positive().max(2_000_000_000),
  name: z.string().trim().min(1).max(100),
  enabled: z.boolean(),
  priority: z.number().int().min(1).max(1_000_000),
  condition: z.object({
    url: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('url-filter'), value: z.string().min(1).max(2_000) }),
      z.object({ kind: z.literal('wildcard'), value: z.string().min(1).max(2_000) }),
      z.object({ kind: z.literal('regex'), value: z.string().min(1).max(2_000) }),
    ]),
    resourceTypes: z.array(z.enum(RESOURCE_TYPES)).max(RESOURCE_TYPES.length).optional(),
    requestMethods: z
      .array(z.enum(['connect', 'delete', 'get', 'head', 'options', 'patch', 'post', 'put']))
      .max(8)
      .optional(),
    initiatorDomains: z.array(z.string().trim().min(1).max(253)).max(100).optional(),
  }),
  action: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('block') }),
    z.object({ kind: z.literal('redirect'), target: z.string().min(1).max(2_000) }),
    z.object({ kind: z.literal('upgrade-scheme') }),
    z.object({
      kind: z.literal('modify-request-headers'),
      operations: z.array(headerOperationSchema).min(1).max(20),
    }),
  ]),
  permissionOrigins: z.array(z.string().min(1).max(2_000)).max(100),
  migrationState: z.enum(['none', 'review-required', 'removed', 'unsupported']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const storedStateSchema = z.object({
  schemaVersion: z.literal(1),
  rules: z.record(z.string(), ruleSchema),
  order: z.array(z.string()),
  settings: z.object({
    globallyPaused: z.boolean(),
  }),
});
