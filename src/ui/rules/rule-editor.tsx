import { redirectBuilderState } from '@/application/redirect-generator';
import { RedirectBuilder } from './redirect-builder';
import { redirectBuilderCopy } from './redirect-builder-copy';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  CheckIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CopyIcon,
  EllipsisIcon,
  KeyRoundIcon,
  PlusIcon,
  PlayIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { permissionOriginsFromMatch } from '@/application/rule-service';
import {
  RESOURCE_TYPES,
  type HeaderOperation,
  type Rule,
  type RuleAction,
  type RuleStatus,
} from '@/domain/rules/model';
import type { RuleDiagnostic } from '@/domain/rules/diagnostics';
import { requiredPermissionOrigins } from '@/domain/rules/permissions';
import { type MatchResult } from '@/domain/rules/test-match';
import { validateRule, type ValidationIssue } from '@/domain/rules/validate';
import { Alert, AlertDescription, AlertTitle } from '@/ui/components/alert';
import { Badge } from '@/ui/components/badge';
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
import { useMatchPreview } from '@/ui/hooks/use-match-preview';
import { useI18n, type Translate } from '@/ui/i18n';
import { errorMessage } from '@/ui/lib/error-message';
import { localizedResourceTypeLabel } from './filter-rules';
import {
  convertedMatchValue,
  guidanceForMatch,
  regexWithWildcardCaptures,
  type MatchGuidance,
  suggestedMatchKind,
  type MatchKind,
} from './match-kind';
import { MatchHelpPopover } from './match-help-popover';
import { PermissionScope } from './permission-scope';
import { StatusBadge } from './status-badge';

type RuleEditorProps = {
  initiallyEnabled?: boolean;
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
    stale?: boolean;
  }>;
  ruleIndex: number;
};

const REQUEST_METHODS = ['connect', 'delete', 'get', 'head', 'options', 'patch', 'post', 'put'] as const;

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

function actionFromKind(
  kind: RuleAction['kind'],
  current: RuleAction,
  matchKind: Rule['condition']['url']['kind'],
): RuleAction {
  if (kind === current.kind) return current;
  switch (kind) {
    case 'block':
      return { kind: 'block' };
    case 'redirect':
      return {
        kind: 'redirect',
        target: matchKind === 'url-filter' ? 'https://example.com/' : 'https://example.com/$1',
      };
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
    return t(
      result.reasonCode === 'unsupported-pattern'
        ? 'previewUnsupported'
        : result.reasonCode === 'invalid-rule'
          ? 'matchInvalidRule'
          : 'matchUrlMismatch',
    );
  }
  if (result.resultCode === 'request-blocked') return t('matchRequestBlocked');
  if (result.resultCode === 'header-operations') {
    return t('matchHeaderOperations', { count: result.operationCount ?? 0 });
  }
  return result.result;
}

function matchGuidanceText(guidance: MatchGuidance, t: Translate): string {
  switch (guidance.kind) {
    case 'url-filter-domain':
      return t('urlFilterDomainGuidance');
    case 'url-filter-exact':
      return t('urlFilterExactGuidance');
    case 'url-filter-path':
      return t('urlFilterPathGuidance');
    case 'url-filter-text':
      return t('urlFilterTextGuidance');
    case 'wildcard':
      return t('wildcardGuidance', { count: guidance.captureCount });
    case 'regex-anchored':
      return t('regexAnchoredGuidance');
    case 'regex-unanchored':
      return t('regexUnanchoredGuidance');
  }
}

function exampleUrlForRule(rule: Rule): string {
  const simple = redirectBuilderState(rule);
  if (simple) return simple.source;
  const { kind, value } = rule.condition.url;
  if (kind === 'url-filter' && value.startsWith('||')) {
    const host = value.slice(2).replace(/\^.*$/, '');
    if (host) return `https://${host}/`;
  }
  if (kind === 'wildcard') return value.replaceAll('*', 'sample');
  if (value.startsWith('http://') || value.startsWith('https://')) return value.replaceAll('*', 'sample');
  return 'https://example.com/';
}

function editableFingerprint(rule: Rule): string {
  const { updatedAt, ...editable } = rule;
  void updatedAt;
  return JSON.stringify(editable);
}

export function RuleEditor({
  initiallyEnabled = false,
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
  const { t, locale } = useI18n();
  const copy = redirectBuilderCopy[locale];
  const [builderOpen, setBuilderOpen] = useState(false);
  const [rawEditor, setRawEditor] = useState(false);
  const initialTestUrl = exampleUrlForRule(rule);
  const [draft, setDraft] = useState(() => (initiallyEnabled ? { ...rule, enabled: true } : rule));
  const simpleRedirect = useMemo(() => redirectBuilderState(draft), [draft]);
  const [baseline, setBaseline] = useState(rule);
  const [externalChange, setExternalChange] = useState(false);
  if (baseline !== rule) {
    if (
      editableFingerprint(draft) === editableFingerprint(baseline) ||
      editableFingerprint(draft) === editableFingerprint(rule)
    ) {
      setDraft(rule);
      setExternalChange(false);
    } else {
      setExternalChange(true);
    }
    setBaseline(rule);
  }
  const [advanced, setAdvanced] = useState(false);
  const [testUrl, setTestUrl] = useState(initialTestUrl);
  const [confirmedPreview, setConfirmedPreview] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [regexRuntimeError, setRegexRuntimeError] = useState<string | null>(null);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [dismissedMatchSuggestion, setDismissedMatchSuggestion] = useState<string | null>(null);

  const validation = useMemo(() => validateRule(draft), [draft]);
  const draftFingerprint = useMemo(() => JSON.stringify(draft), [draft]);
  const previewFingerprint = `${draftFingerprint}:${testUrl}`;
  const preview = useMatchPreview(draft, testUrl);
  const testResult = preview.status === 'ready' ? preview.result : null;
  const previewConfirmed = confirmedPreview === previewFingerprint;
  const dirty = useMemo(() => editableFingerprint(draft) !== editableFingerprint(rule), [draft, rule]);
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
  const suggestedKind = useMemo(
    () => suggestedMatchKind(draft.condition.url.value, draft.condition.url.kind),
    [draft.condition.url.kind, draft.condition.url.value],
  );
  const matchSuggestionKey = suggestedKind
    ? `${draft.condition.url.kind}:${suggestedKind}:${draft.condition.url.value}`
    : null;
  const showMatchSuggestion = Boolean(matchSuggestionKey && matchSuggestionKey !== dismissedMatchSuggestion);
  const captureQuickFixAvailable =
    draft.condition.url.kind === 'url-filter' &&
    /^https?:\/\//.test(draft.condition.url.value) &&
    draft.condition.url.value.includes('*');
  const matchGuidance = useMemo(
    () => guidanceForMatch(draft.condition.url.kind, draft.condition.url.value),
    [draft.condition.url.kind, draft.condition.url.value],
  );
  const suggestedUrls =
    preview.status === 'ready' ? preview.suggestions : { matching: undefined, nonMatching: undefined };

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

  const changeMatchKind = (nextKind: MatchKind, reinterpret = false) => {
    setRegexRuntimeError(null);
    setDismissedMatchSuggestion(null);
    setDraft((current) => {
      const value = reinterpret
        ? current.condition.url.value
        : convertedMatchValue(current.condition.url.value, current.condition.url.kind, nextKind);
      const inferredOrigins = permissionOriginsFromMatch(value);
      return {
        ...current,
        condition: { ...current.condition, url: { kind: nextKind, value } },
        permissionOrigins: inferredOrigins.length > 0 ? inferredOrigins : current.permissionOrigins,
      };
    });
  };

  const convertUrlFilterToCapturingRegex = () => {
    setRegexRuntimeError(null);
    setDismissedMatchSuggestion(null);
    setDraft((current) => ({
      ...current,
      condition: {
        ...current.condition,
        url: {
          kind: 'regex',
          value: regexWithWildcardCaptures(current.condition.url.value),
        },
      },
    }));
  };

  const runTest = () => {
    setConfirmedPreview(previewFingerprint);
  };

  const runSuggestedTest = (url: string) => {
    setTestUrl(url);
    setConfirmedPreview(`${draftFingerprint}:${url}`);
  };

  const performSave = async () => {
    if (!validation.valid || saving || externalChange) return;
    setSaving(true);
    try {
      const result = await onSave(draft);
      if (result.stale) {
        setExternalChange(true);
      } else if (!result.quotaAvailable) {
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

          {externalChange ? (
            <Alert variant="warning" role="alert">
              <CircleAlertIcon />
              <AlertTitle>{t('draftChangedTitle')}</AlertTitle>
              <AlertDescription>
                <p>{t('draftChangedDescription')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDraft(rule);
                      setExternalChange(false);
                    }}
                  >
                    {t('reloadSavedRule')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDraft((current) => ({ ...current, updatedAt: rule.updatedAt }));
                      setExternalChange(false);
                    }}
                  >
                    {t('keepDraft')}
                  </Button>
                </div>
              </AlertDescription>
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
            {draft.action.kind === 'redirect' ? (
              <div className="space-y-3 rounded-lg border bg-muted/25 p-4">
                {simpleRedirect ? (
                  <>
                    <p className="text-sm font-medium">
                      {copy.matchRule}: {copy[simpleRedirect.scope]}
                    </p>
                    <p className="font-mono text-sm break-all">
                      {simpleRedirect.scope === 'host'
                        ? new URL(simpleRedirect.source).origin
                        : simpleRedirect.source}
                    </p>
                    <p className="text-sm font-medium">{copy.redirectRule}</p>
                    <p className="font-mono text-sm break-all">
                      {simpleRedirect.scope === 'host'
                        ? new URL(simpleRedirect.target).hostname
                        : simpleRedirect.target}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {simpleRedirect.scope === 'host' ? copy.hostHelp : copy.scope}
                    </p>
                  </>
                ) : null}
                <Button variant="outline" disabled={readOnly || saving} onClick={() => setBuilderOpen(true)}>
                  {simpleRedirect ? copy.edit : copy.assisted}
                </Button>
                {simpleRedirect ? (
                  <Button variant="ghost" aria-pressed={rawEditor} onClick={() => setRawEditor(!rawEditor)}>
                    {copy.advancedEdit}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {!simpleRedirect || rawEditor ? (
              <>
                <Field data-invalid={Boolean(matchError || regexRuntimeError)}>
                  <FieldLabel htmlFor="rule-match">{t('matchUrl')}</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="rule-match"
                      className="font-mono"
                      value={draft.condition.url.value}
                      disabled={readOnly}
                      aria-invalid={Boolean(matchError || regexRuntimeError)}
                      onChange={(event) => updateMatch(event.target.value)}
                    />
                    <InputGroupAddon align="inline-end">
                      <Select
                        value={draft.condition.url.kind}
                        disabled={readOnly}
                        onValueChange={(kind) => changeMatchKind(kind as MatchKind)}
                      >
                        <SelectTrigger
                          size="sm"
                          className="max-w-40"
                          aria-label={t('matchSyntaxSelectorLabel', {
                            syntax: t(
                              draft.condition.url.kind === 'url-filter'
                                ? 'urlFilterShort'
                                : draft.condition.url.kind === 'wildcard'
                                  ? 'wildcardShort'
                                  : 'regexShort',
                            ),
                          })}
                        >
                          <SelectValue>
                            {t(
                              draft.condition.url.kind === 'url-filter'
                                ? 'urlFilterShort'
                                : draft.condition.url.kind === 'wildcard'
                                  ? 'wildcardShort'
                                  : 'regexShort',
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectGroup>
                            <SelectItem value="url-filter">{t('urlFilter')}</SelectItem>
                            <SelectItem value="wildcard">{t('wildcard')}</SelectItem>
                            <SelectItem value="regex">{t('regularExpression')}</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <MatchHelpPopover kind={draft.condition.url.kind} />
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>
                    {t(
                      draft.condition.url.kind === 'url-filter'
                        ? 'urlFilterHelp'
                        : draft.condition.url.kind === 'wildcard'
                          ? 'wildcardHelp'
                          : 'regexHelp',
                    )}
                  </FieldDescription>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.condition.isUrlFilterCaseSensitive ?? false}
                      disabled={readOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          condition: { ...current.condition, isUrlFilterCaseSensitive: event.target.checked },
                        }))
                      }
                    />
                    {copy.caseSensitive}
                  </label>
                  <div className="rounded-lg border bg-muted/35 p-3 text-sm">
                    <p className="font-medium text-foreground">{t('matchGuidanceTitle')}</p>
                    <p className="mt-1 text-muted-foreground">{matchGuidanceText(matchGuidance, t)}</p>
                  </div>
                  {matchError ? <FieldError>{validationMessage(matchError, t)}</FieldError> : null}
                  {regexRuntimeError ? <FieldError>{regexRuntimeError}</FieldError> : null}
                  {showMatchSuggestion && suggestedKind === 'regex' ? (
                    <Alert>
                      <SparklesIcon />
                      <AlertTitle>{t('regexSuggestionTitle')}</AlertTitle>
                      <AlertDescription className="flex flex-col gap-2">
                        <span>{t('regexSuggestionDescription')}</span>
                        <span className="flex flex-wrap gap-2">
                          <Button size="xs" onClick={() => changeMatchKind('regex', true)}>
                            {t('useRegularExpression')}
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setDismissedMatchSuggestion(matchSuggestionKey)}
                          >
                            {t('keepCurrentSyntax')}
                          </Button>
                        </span>
                      </AlertDescription>
                    </Alert>
                  ) : null}
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
                          variant={selected ? 'default' : 'outline'}
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
                          {selected ? <CheckIcon aria-hidden="true" /> : null}
                          {localizedResourceTypeLabel(type, t)}
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
                        action: actionFromKind(
                          value as RuleAction['kind'],
                          current.action,
                          current.condition.url.kind,
                        ),
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
                    <FieldLabel htmlFor="rule-destination">
                      {draft.action.transform ? copy.hostTarget : t('destination')}
                    </FieldLabel>
                    <Input
                      id="rule-destination"
                      className="font-mono"
                      value={draft.action.transform?.host ?? draft.action.target}
                      disabled={readOnly}
                      aria-invalid={Boolean(destinationError)}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          action:
                            current.action.kind === 'redirect' && current.action.transform
                              ? { ...current.action, transform: { host: event.target.value } }
                              : { kind: 'redirect', target: event.target.value },
                        }))
                      }
                    />
                    <FieldDescription>
                      {draft.action.transform
                        ? copy.hostHelp
                        : t(
                            draft.condition.url.kind === 'url-filter'
                              ? 'destinationFixedHelp'
                              : 'destinationHelp',
                          )}
                    </FieldDescription>
                    {destinationError?.code === 'capture-match-required' ? (
                      <Alert variant="warning">
                        <CircleAlertIcon />
                        <AlertTitle>{t('captureModeNeededTitle')}</AlertTitle>
                        <AlertDescription className="flex flex-col gap-2">
                          <span>{t('captureModeNeededDescription')}</span>
                          {captureQuickFixAvailable ? (
                            <span className="flex flex-wrap gap-2">
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => changeMatchKind('wildcard', true)}
                              >
                                {t('useSimpleWildcard')}
                              </Button>
                              <Button size="xs" variant="outline" onClick={convertUrlFilterToCapturingRegex}>
                                {t('convertToRegularExpression')}
                              </Button>
                            </span>
                          ) : null}
                        </AlertDescription>
                      </Alert>
                    ) : destinationError ? (
                      <FieldError>{validationMessage(destinationError, t)}</FieldError>
                    ) : null}
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
                                          itemIndex === index
                                            ? { ...item, header: event.target.value }
                                            : item,
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
                                            itemIndex === index
                                              ? { ...item, value: event.target.value }
                                              : item,
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
              </>
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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium">{t('testRule')}</h2>
                <Badge variant="secondary">{t('livePreview')}</Badge>
              </div>
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
                  <InputGroupButton
                    aria-label={t('testRule')}
                    variant={previewConfirmed ? 'secondary' : 'ghost'}
                    onClick={runTest}
                  >
                    {previewConfirmed ? (
                      <CheckIcon data-icon="inline-start" />
                    ) : (
                      <PlayIcon data-icon="inline-start" />
                    )}
                    {t(previewConfirmed ? 'tested' : 'test')}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            {suggestedUrls.matching || suggestedUrls.nonMatching ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">{t('quickTestExamples')}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestedUrls.matching ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto min-w-0 justify-start py-2.5 text-left"
                      onClick={() => runSuggestedTest(suggestedUrls.matching!)}
                    >
                      <CheckCircle2Icon className="text-emerald-600" />
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">{t('ruleMatches')}</span>
                        <code className="block truncate font-mono text-xs text-foreground">
                          {suggestedUrls.matching}
                        </code>
                      </span>
                    </Button>
                  ) : null}
                  {suggestedUrls.nonMatching ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto min-w-0 justify-start py-2.5 text-left"
                      onClick={() => runSuggestedTest(suggestedUrls.nonMatching!)}
                    >
                      <CircleAlertIcon className="text-amber-600" />
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">{t('noMatch')}</span>
                        <code className="block truncate font-mono text-xs text-foreground">
                          {suggestedUrls.nonMatching}
                        </code>
                      </span>
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <Alert role="status" aria-live="polite" variant={testResult?.matched ? 'success' : 'default'}>
              {testResult?.matched ? <CheckCircle2Icon /> : <CircleAlertIcon />}
              <AlertTitle>
                {t(
                  testResult
                    ? testResult.matched
                      ? 'ruleMatches'
                      : testResult.reasonCode === 'unsupported-pattern'
                        ? 'previewUnavailable'
                        : 'noMatch'
                    : preview.status === 'pending'
                      ? 'previewPending'
                      : 'previewUnavailable',
                )}
              </AlertTitle>
              <AlertDescription>
                <span className="block font-mono break-all">
                  {testResult
                    ? matchResultText(testResult, t)
                    : t(
                        preview.status === 'timeout'
                          ? 'previewTimeout'
                          : preview.status === 'error'
                            ? 'previewError'
                            : 'previewPending',
                      )}
                </span>
                <span className="mt-1 block text-xs">
                  {t('previewUrl')}: <code className="font-mono break-all">{testUrl}</code>
                </span>
              </AlertDescription>
            </Alert>
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
          <Button
            className="max-[479px]:w-full"
            variant="outline"
            onClick={() => {
              setDraft(rule);
              setExternalChange(false);
            }}
          >
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

      {builderOpen ? (
        <RedirectBuilder
          initialRule={draft}
          onClose={() => setBuilderOpen(false)}
          onSave={async (next) => {
            setDraft(next);
            setTestUrl(next.redirectBuilder?.source ?? exampleUrlForRule(next));
            setRawEditor(false);
          }}
        />
      ) : null}
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
          <PermissionScope label={t('permissionRequestScope')} origins={requiredOrigins} />
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
