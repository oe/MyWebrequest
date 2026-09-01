import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CopyIcon,
  EllipsisIcon,
  KeyRoundIcon,
  PlusIcon,
  PlayIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { permissionOriginsFromMatch } from '@/application/rule-service';
import {
  RESOURCE_TYPES,
  type HeaderOperation,
  type ResourceType,
  type Rule,
  type RuleAction,
  type RuleStatus,
} from '@/domain/rules/model';
import type { RuleDiagnostic } from '@/domain/rules/diagnostics';
import { requiredPermissionOrigins } from '@/domain/rules/permissions';
import { matchRule, type MatchResult } from '@/domain/rules/test-match';
import { validateRule, type ValidationIssue } from '@/domain/rules/validate';
import { Alert, AlertDescription, AlertTitle } from '@/ui/components/alert';
import { Button } from '@/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/components/dropdown-menu';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/ui/components/field';
import { Input } from '@/ui/components/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/ui/components/input-group';
import { ScrollArea } from '@/ui/components/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import { Separator } from '@/ui/components/separator';
import { Switch } from '@/ui/components/switch';
import { Textarea } from '@/ui/components/textarea';
import { useI18n, type Translate } from '@/ui/i18n';
import { errorMessage } from '@/ui/lib/error-message';
import { StatusBadge } from './status-badge';

type RuleEditorProps = {
  hasPermission: boolean;
  diagnostics: RuleDiagnostic[];
  rule: Rule;
  status: RuleStatus;
  onBack: () => void;
  onCopy: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  onRestore: (rule: Rule, index: number) => Promise<void>;
  onSave: (rule: Rule) => Promise<{
    permissionGranted: boolean;
    regexSupported: boolean;
    regexReason?: string | undefined;
    quotaAvailable: boolean;
    cycleFree: boolean;
    priorityConflictFree: boolean;
  }>;
  ruleIndex: number;
};

const REQUEST_METHODS = ['connect', 'delete', 'get', 'head', 'options', 'patch', 'post', 'put'] as const;

function resourceTypeLabel(type: ResourceType, t: Translate): string {
  const keys = {
    main_frame: 'resourceMainFrame',
    sub_frame: 'resourceSubFrame',
    stylesheet: 'resourceStylesheet',
    script: 'resourceScript',
    image: 'resourceImage',
    font: 'resourceFont',
    object: 'resourceObject',
    xmlhttprequest: 'resourceXmlHttpRequest',
    ping: 'resourcePing',
    media: 'resourceMedia',
    websocket: 'resourceWebSocket',
    other: 'resourceOther',
  } as const;
  return t(keys[type]);
}

function toggleValue<T>(values: T[] | undefined, value: T): T[] {
  const current = values ?? [];
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function parseInitiatorDomains(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\s,]+/)
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

function actionFromKind(kind: RuleAction['kind'], current: RuleAction): RuleAction {
  if (kind === current.kind) return current;
  switch (kind) {
    case 'block':
      return { kind: 'block' };
    case 'redirect':
      return { kind: 'redirect', target: 'https://example.com/$1' };
    case 'upgrade-scheme':
      return { kind: 'upgrade-scheme' };
    case 'modify-request-headers':
      return { kind: 'modify-request-headers', operations: [{ header: 'Referer', operation: 'remove' }] };
  }
}

function validationMessage(issue: ValidationIssue, t: Translate): string {
  const key = {
    'schema-invalid': 'validationSchema',
    'regex-invalid': 'validationRegex',
    'wildcard-without-star': 'validationWildcard',
    'redirect-scheme': 'validationRedirectScheme',
    'redirect-url-invalid': 'validationRedirectUrl',
    'redirect-self': 'validationRedirectSelf',
    'capture-match-required': 'validationCaptureMatch',
    'capture-index-invalid': 'validationCaptureIndex',
    'initiator-domain-invalid': 'validationInitiatorDomain',
    'initiator-permission-required': 'validationInitiatorPermission',
    'header-name-invalid': 'validationHeaderName',
    'header-forbidden': 'validationHeaderForbidden',
  } as const;
  return t(key[issue.code], { value: issue.value ?? '' });
}

function matchResultText(result: MatchResult, t: Translate): string {
  if (!result.matched) {
    return t(result.reasonCode === 'invalid-rule' ? 'matchInvalidRule' : 'matchUrlMismatch');
  }
  if (result.resultCode === 'request-blocked') return t('matchRequestBlocked');
  if (result.resultCode === 'header-operations') {
    return t('matchHeaderOperations', { count: result.operationCount ?? 0 });
  }
  return result.result;
}

function exampleUrlForRule(rule: Rule): string {
  const { kind, value } = rule.condition.url;
  if (kind === 'url-filter' && value.startsWith('||')) {
    const host = value.slice(2).replace(/\^.*$/, '');
    if (host) return `https://${host}/`;
  }
  if (kind === 'wildcard') return value.replaceAll('*', 'sample');
  if (value.startsWith('http://') || value.startsWith('https://')) return value.replaceAll('*', 'sample');
  return 'https://example.com/';
}

export function RuleEditor({
  diagnostics,
  hasPermission,
  rule,
  status,
  onBack,
  onCopy,
  onDelete,
  onDirtyChange,
  onRestore,
  onSave,
  ruleIndex,
}: RuleEditorProps) {
  const { t } = useI18n();
  const initialTestUrl = exampleUrlForRule(rule);
  const [draft, setDraft] = useState(rule);
  const [advanced, setAdvanced] = useState(false);
  const [testUrl, setTestUrl] = useState(initialTestUrl);
  const [testedDraft, setTestedDraft] = useState<{ fingerprint: string; result: MatchResult } | null>(() => ({
    fingerprint: JSON.stringify(rule),
    result: matchRule(rule, initialTestUrl),
  }));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [regexRuntimeError, setRegexRuntimeError] = useState<string | null>(null);
  const [permissionOpen, setPermissionOpen] = useState(false);

  const validation = useMemo(() => validateRule(draft), [draft]);
  const draftFingerprint = useMemo(() => JSON.stringify(draft), [draft]);
  const testResult = testedDraft?.fingerprint === draftFingerprint ? testedDraft.result : null;
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(rule), [draft, rule]);
  const readOnly = draft.migrationState === 'removed' || draft.migrationState === 'unsupported';
  const matchError = validation.errors.find((issue) => issue.field === 'match');
  const destinationError = validation.errors.find((issue) => issue.field === 'destination');
  const headerError = validation.errors.find((issue) => issue.field === 'headers');
  const initiatorError = validation.errors.find((issue) => issue.field === 'initiators');
  const requiredOrigins = useMemo(() => requiredPermissionOrigins(draft), [draft]);
  const originalRequiredOrigins = useMemo(() => requiredPermissionOrigins(rule), [rule]);
  const permissionScopeChanged = useMemo(
    () => JSON.stringify(requiredOrigins) !== JSON.stringify(originalRequiredOrigins),
    [originalRequiredOrigins, requiredOrigins],
  );
  const draftHasPermission = hasPermission && !permissionScopeChanged;
  const headerOperationCount =
    draft.action.kind === 'modify-request-headers' ? draft.action.operations.length : 0;

  useEffect(() => {
    onDirtyChange(dirty);
    const preventClose = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventClose);
    return () => {
      window.removeEventListener('beforeunload', preventClose);
      onDirtyChange(false);
    };
  }, [dirty, onDirtyChange]);

  const updateMatch = (value: string) => {
    setRegexRuntimeError(null);
    setDraft((current) => ({
      ...current,
      condition: { ...current.condition, url: { ...current.condition.url, value } },
      permissionOrigins: permissionOriginsFromMatch(value),
    }));
  };

  const runTest = () => {
    setTestedDraft({ fingerprint: draftFingerprint, result: matchRule(draft, testUrl) });
  };

  const performSave = async () => {
    if (!validation.valid || saving) return;
    setSaving(true);
    try {
      const result = await onSave(draft);
      if (!result.quotaAvailable) {
        toast.error(t('quotaExceeded'));
      } else if (!result.cycleFree) {
        toast.error(t('redirectCycleBlocked'));
      } else if (!result.priorityConflictFree) {
        toast.error(t('priorityConflictBlocked'));
      } else if (!result.regexSupported) {
        const message = t('regexUnsupported', { reason: result.regexReason ?? t('unknownReason') });
        setRegexRuntimeError(message);
        toast.error(message);
      } else if (draft.enabled && !result.permissionGranted) {
        toast.warning(t('permissionDenied'));
      } else {
        toast.success(t(draft.enabled ? 'ruleSavedApplied' : 'ruleSaved'));
      }
    } catch (error) {
      toast.error(errorMessage(error, t('ruleSaveError')));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (draft.enabled && (!hasPermission || permissionScopeChanged) && requiredOrigins.length > 0) {
      setPermissionOpen(true);
      return;
    }
    void performSave();
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete(rule.id);
      setDeleteOpen(false);
      toast.success(t('ruleDeleted'), {
        action: {
          label: t('undo'),
          onClick: () => void onRestore(rule, ruleIndex).catch(() => toast.error(t('undoDeleteError'))),
        },
      });
    } catch (error) {
      toast.error(errorMessage(error, t('ruleDeleteError')));
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = async () => {
    if (copying) return;
    setCopying(true);
    try {
      await onCopy(rule.id, t('copyOfRule', { name: rule.name }));
      toast.success(t('ruleDuplicated'));
    } catch {
      toast.error(t('ruleDuplicateError'));
    } finally {
      setCopying(false);
    }
  };

  return (
    <section
      aria-label={t('editRule', { name: rule.name })}
      data-material="glass-content"
      className="flex min-h-0 min-w-0 flex-col"
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 lg:p-8">
          <div className="flex items-start gap-3">
            <Button
              className="min-[800px]:hidden"
              size="icon"
              variant="ghost"
              aria-label={t('backToRules')}
              onClick={onBack}
            >
              <ArrowLeftIcon />
            </Button>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight lg:text-3xl">{draft.name}</h1>
                <StatusBadge status={status} />
              </div>
              <p className="text-sm text-muted-foreground">{t('editorDescription')}</p>
            </div>
            <div className="flex items-center gap-3">
              <Field orientation="horizontal" className="w-auto">
                <FieldLabel htmlFor="rule-enabled">{t('enabled')}</FieldLabel>
                <Switch
                  id="rule-enabled"
                  checked={draft.enabled}
                  disabled={readOnly}
                  onCheckedChange={(checked) => setDraft((current) => ({ ...current, enabled: checked }))}
                />
              </Field>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label={t('ruleActions')}>
                    <EllipsisIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuItem disabled={copying} onSelect={() => void handleCopy()}>
                      <CopyIcon />
                      {t('duplicateRule')}
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                      <Trash2Icon />
                      {t('deleteRule')}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {draft.migrationState === 'review-required' ? (
            <Alert variant="warning">
              <CircleAlertIcon />
              <AlertTitle>{t('migratedReviewTitle')}</AlertTitle>
              <AlertDescription>{t('migratedReviewDescription')}</AlertDescription>
            </Alert>
          ) : null}
          {readOnly ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>{t('unsupportedRuleTitle')}</AlertTitle>
              <AlertDescription>{t('unsupportedRuleDescription')}</AlertDescription>
            </Alert>
          ) : null}
          {diagnostics.some((item) => item.code === 'priority-conflict') ? (
            <Alert variant="warning">
              <CircleAlertIcon />
              <AlertTitle>{t('priorityConflictTitle')}</AlertTitle>
              <AlertDescription>{t('priorityConflictDescription')}</AlertDescription>
            </Alert>
          ) : null}
          {diagnostics.some((item) => item.code === 'redirect-cycle') ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>{t('redirectCycleTitle')}</AlertTitle>
              <AlertDescription>{t('redirectCycleDescription')}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="rule-name">{t('ruleName')}</FieldLabel>
              <Input
                id="rule-name"
                value={draft.name}
                disabled={readOnly}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="rule-match-kind">{t('matchType')}</FieldLabel>
              <Select
                value={draft.condition.url.kind}
                disabled={readOnly}
                onValueChange={(kind) => {
                  setRegexRuntimeError(null);
                  setDraft((current) => ({
                    ...current,
                    condition: {
                      ...current.condition,
                      url: {
                        kind: kind as Rule['condition']['url']['kind'],
                        value: current.condition.url.value,
                      },
                    },
                  }));
                }}
              >
                <SelectTrigger id="rule-match-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="url-filter">{t('urlFilter')}</SelectItem>
                    <SelectItem value="wildcard">{t('wildcard')}</SelectItem>
                    <SelectItem value="regex">{t('regularExpression')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field data-invalid={Boolean(matchError || regexRuntimeError)}>
              <FieldLabel htmlFor="rule-match">{t('matchUrl')}</FieldLabel>
              <Input
                id="rule-match"
                className="font-mono"
                value={draft.condition.url.value}
                disabled={readOnly}
                aria-invalid={Boolean(matchError || regexRuntimeError)}
                onChange={(event) => updateMatch(event.target.value)}
              />
              <FieldDescription>
                {t(
                  draft.condition.url.kind === 'url-filter'
                    ? 'urlFilterHelp'
                    : draft.condition.url.kind === 'wildcard'
                      ? 'wildcardHelp'
                      : 'regexHelp',
                )}
              </FieldDescription>
              {matchError ? <FieldError>{validationMessage(matchError, t)}</FieldError> : null}
              {regexRuntimeError ? <FieldError>{regexRuntimeError}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel>{t('resourceTypes')}</FieldLabel>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('resourceTypes')}>
                {RESOURCE_TYPES.map((type) => {
                  const selected = draft.condition.resourceTypes?.includes(type) ?? false;
                  return (
                    <Button
                      key={type}
                      type="button"
                      size="sm"
                      variant={selected ? 'secondary' : 'outline'}
                      aria-pressed={selected}
                      disabled={readOnly}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          condition: {
                            ...current.condition,
                            resourceTypes: toggleValue(current.condition.resourceTypes, type),
                          },
                        }))
                      }
                    >
                      {resourceTypeLabel(type, t)}
                    </Button>
                  );
                })}
              </div>
              <FieldDescription>{t('resourceTypesHelp')}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="rule-action">{t('action')}</FieldLabel>
              <Select
                value={draft.action.kind}
                disabled={readOnly}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    action: actionFromKind(value as RuleAction['kind'], current.action),
                  }))
                }
              >
                <SelectTrigger id="rule-action" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="block">{t('blockRequest')}</SelectItem>
                    <SelectItem value="redirect">{t('redirect')}</SelectItem>
                    <SelectItem value="modify-request-headers">{t('modifyRequestHeader')}</SelectItem>
                    <SelectItem value="upgrade-scheme">{t('upgradeHttps')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{t('actionHelp')}</FieldDescription>
              {!advanced && initiatorError ? (
                <FieldError>{validationMessage(initiatorError, t)}</FieldError>
              ) : null}
            </Field>
            {draft.action.kind === 'redirect' ? (
              <Field data-invalid={Boolean(destinationError)}>
                <FieldLabel htmlFor="rule-destination">{t('destination')}</FieldLabel>
                <Input
                  id="rule-destination"
                  className="font-mono"
                  value={draft.action.target}
                  disabled={readOnly}
                  aria-invalid={Boolean(destinationError)}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      action: { kind: 'redirect', target: event.target.value },
                    }))
                  }
                />
                <FieldDescription>{t('destinationHelp')}</FieldDescription>
                {destinationError ? <FieldError>{validationMessage(destinationError, t)}</FieldError> : null}
              </Field>
            ) : null}
            {draft.action.kind === 'modify-request-headers' ? (
              <Field data-invalid={Boolean(headerError)}>
                <FieldLabel>{t('requestHeader')}</FieldLabel>
                <div className="flex flex-col gap-3">
                  {draft.action.operations.map((operation, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[130px_minmax(0,1fr)_auto] gap-2 max-sm:grid-cols-[110px_minmax(0,1fr)_auto]"
                    >
                      <Select
                        value={operation.operation}
                        disabled={readOnly}
                        onValueChange={(value) => {
                          const next: HeaderOperation = {
                            header: operation.header,
                            operation: value as HeaderOperation['operation'],
                            ...(value === 'set' ? { value: operation.value ?? '' } : {}),
                          };
                          setDraft((current) => ({
                            ...current,
                            action:
                              current.action.kind === 'modify-request-headers'
                                ? {
                                    ...current.action,
                                    operations: current.action.operations.map((item, itemIndex) =>
                                      itemIndex === index ? next : item,
                                    ),
                                  }
                                : current.action,
                          }));
                        }}
                      >
                        <SelectTrigger aria-label={t('headerOperation')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="remove">{t('removeHeader')}</SelectItem>
                            <SelectItem value="set">{t('setHeader')}</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Input
                        value={operation.header}
                        disabled={readOnly}
                        aria-label={t('requestHeader')}
                        aria-invalid={Boolean(headerError)}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            action:
                              current.action.kind === 'modify-request-headers'
                                ? {
                                    ...current.action,
                                    operations: current.action.operations.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, header: event.target.value } : item,
                                    ),
                                  }
                                : current.action,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={readOnly || headerOperationCount === 1}
                        aria-label={t('removeHeaderOperation', { index: index + 1 })}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            action:
                              current.action.kind === 'modify-request-headers'
                                ? {
                                    ...current.action,
                                    operations: current.action.operations.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  }
                                : current.action,
                          }))
                        }
                      >
                        <XIcon />
                      </Button>
                      {operation.operation === 'set' ? (
                        <Input
                          className="col-start-2"
                          value={operation.value ?? ''}
                          disabled={readOnly}
                          aria-label={t('headerValue')}
                          placeholder={t('headerValue')}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              action:
                                current.action.kind === 'modify-request-headers'
                                  ? {
                                      ...current.action,
                                      operations: current.action.operations.map((item, itemIndex) =>
                                        itemIndex === index ? { ...item, value: event.target.value } : item,
                                      ),
                                    }
                                  : current.action,
                            }))
                          }
                        />
                      ) : null}
                    </div>
                  ))}
                  <Button
                    type="button"
                    className="self-start"
                    size="sm"
                    variant="outline"
                    disabled={readOnly || draft.action.operations.length >= 20}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        action:
                          current.action.kind === 'modify-request-headers'
                            ? {
                                ...current.action,
                                operations: [
                                  ...current.action.operations,
                                  { header: '', operation: 'remove' },
                                ],
                              }
                            : current.action,
                      }))
                    }
                  >
                    <PlusIcon />
                    {t('addHeaderOperation')}
                  </Button>
                </div>
                <FieldDescription>{t('headerHelp')}</FieldDescription>
                {headerError ? <FieldError>{validationMessage(headerError, t)}</FieldError> : null}
              </Field>
            ) : null}
          </FieldGroup>

          <Alert
            variant={
              !initiatorError && (requiredOrigins.length === 0 || draftHasPermission) ? 'success' : 'warning'
            }
          >
            {!initiatorError && (requiredOrigins.length === 0 || draftHasPermission) ? (
              <CheckCircle2Icon />
            ) : (
              <KeyRoundIcon />
            )}
            <AlertTitle>
              {t(
                initiatorError
                  ? 'hostAccessRequired'
                  : requiredOrigins.length === 0
                    ? 'hostAccessNotNeeded'
                    : draftHasPermission
                      ? 'hostAccessGranted'
                      : 'hostAccessRequired',
              )}
            </AlertTitle>
            <AlertDescription>
              {initiatorError
                ? validationMessage(initiatorError, t)
                : requiredOrigins.length > 0
                  ? requiredOrigins.join(', ')
                  : t('noHostAccessNeeded')}
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-medium">{t('testRule')}</h2>
              <p className="text-sm text-muted-foreground">{t('testRuleDescription')}</p>
            </div>
            <Field>
              <FieldLabel htmlFor="test-url">{t('testUrl')}</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="test-url"
                  className="font-mono"
                  value={testUrl}
                  onChange={(event) => setTestUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') runTest();
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton aria-label={t('testRule')} onClick={runTest}>
                    <PlayIcon data-icon="inline-start" />
                    {t('test')}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            {testResult ? (
              <Alert variant={testResult.matched ? 'success' : 'default'}>
                {testResult.matched ? <CheckCircle2Icon /> : <CircleAlertIcon />}
                <AlertTitle>{t(testResult.matched ? 'ruleMatches' : 'noMatch')}</AlertTitle>
                <AlertDescription className="font-mono break-all">
                  {matchResultText(testResult, t)}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          {advanced ? (
            <FieldGroup>
              <Field>
                <FieldLabel>{t('requestMethods')}</FieldLabel>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t('requestMethods')}>
                  {REQUEST_METHODS.map((method) => {
                    const selected = draft.condition.requestMethods?.includes(method) ?? false;
                    return (
                      <Button
                        key={method}
                        type="button"
                        size="sm"
                        variant={selected ? 'secondary' : 'outline'}
                        aria-pressed={selected}
                        disabled={readOnly}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            condition: {
                              ...current.condition,
                              requestMethods: toggleValue(current.condition.requestMethods, method),
                            },
                          }))
                        }
                      >
                        {method.toUpperCase()}
                      </Button>
                    );
                  })}
                </div>
                <FieldDescription>{t('requestMethodsHelp')}</FieldDescription>
              </Field>
              <Field data-invalid={Boolean(initiatorError)}>
                <FieldLabel htmlFor="rule-initiators">{t('initiatorDomains')}</FieldLabel>
                <Textarea
                  id="rule-initiators"
                  className="font-mono"
                  value={draft.condition.initiatorDomains?.join('\n') ?? ''}
                  disabled={readOnly}
                  aria-invalid={Boolean(initiatorError)}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      condition: {
                        ...current.condition,
                        initiatorDomains: parseInitiatorDomains(event.target.value),
                      },
                    }))
                  }
                />
                <FieldDescription>{t('initiatorDomainsHelp')}</FieldDescription>
                {initiatorError ? <FieldError>{validationMessage(initiatorError, t)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="rule-priority">{t('priority')}</FieldLabel>
                <Input
                  id="rule-priority"
                  type="number"
                  min={1}
                  max={1_000_000}
                  value={draft.priority}
                  disabled={readOnly}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, priority: Number(event.target.value) }))
                  }
                />
                <FieldDescription>{t('priorityHelp')}</FieldDescription>
              </Field>
            </FieldGroup>
          ) : null}
        </div>
      </ScrollArea>

      <footer
        data-material="glass-toolbar"
        className="flex items-center justify-between gap-3 border-t p-4 max-[479px]:grid max-[479px]:grid-cols-2 lg:px-8"
      >
        <Button
          className="max-[479px]:w-full"
          variant="destructive"
          disabled={readOnly}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2Icon data-icon="inline-start" />
          {t('deleteRule')}
        </Button>
        <div className="flex items-center gap-2 max-[479px]:contents">
          <Button
            className="max-[479px]:w-full"
            variant="outline"
            onClick={() => setAdvanced((value) => !value)}
          >
            {t(advanced ? 'hideAdvanced' : 'advancedSettings')}
          </Button>
          <Button className="max-[479px]:w-full" variant="outline" onClick={() => setDraft(rule)}>
            {t('cancel')}
          </Button>
          <Button
            className="max-[479px]:w-full"
            disabled={readOnly || !validation.valid || saving || deleting}
            onClick={handleSave}
          >
            {saving ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </footer>

      <Dialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteRuleTitle', { name: rule.name })}</DialogTitle>
            <DialogDescription>{t('deleteRuleDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('cancel')}</Button>
            </DialogClose>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? t('deleting') : t('deleteRule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={permissionOpen} onOpenChange={(open) => !saving && setPermissionOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('permissionRequestTitle', { name: draft.name })}</DialogTitle>
            <DialogDescription>{t('permissionRequestDescription')}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/35 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">{t('permissionRequestScope')}</p>
            <p className="font-mono text-sm break-all">{requiredOrigins.join(', ')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setPermissionOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              disabled={saving}
              onClick={() => {
                setPermissionOpen(false);
                void performSave();
              }}
            >
              {saving ? t('saving') : t('requestAccess')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
