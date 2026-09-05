import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createRule } from '@/application/rule-service';
import {
  generateRedirectRule,
  redirectBuilderState,
  type RedirectScope,
} from '@/application/redirect-generator';
import type { Rule } from '@/domain/rules/model';
import { validateRule } from '@/domain/rules/validate';
import { Switch } from '@/ui/components/switch';
import { Button } from '@/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/dialog';
import { Field, FieldLabel } from '@/ui/components/field';
import { Input } from '@/ui/components/input';
import { useMatchPreview } from '@/ui/hooks/use-match-preview';
import { useI18n } from '@/ui/i18n';
import { errorMessage } from '@/ui/lib/error-message';
import { redirectBuilderCopy } from './redirect-builder-copy';

export function RedirectBuilder({
  initialFrom = '',
  initialRule,
  onClose,
  onSave,
}: {
  initialFrom?: string;
  initialRule?: Rule;
  onClose: () => void;
  onSave: (rule: Rule) => Promise<void>;
}) {
  const { locale, t } = useI18n();
  const copy = redirectBuilderCopy[locale];
  const [base] = useState(() => initialRule ?? createRule());
  const [initial] = useState(() => (initialRule ? redirectBuilderState(initialRule) : null));
  const [scope, setScope] = useState<RedirectScope>(initial?.scope ?? 'exact');
  const [from, setFrom] = useState(initial?.source ?? initialFrom);
  const [to, setTo] = useState(initial?.target ?? '');
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(initialRule?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const exact = useMemo(() => generateRedirectRule(base, from, to), [base, from, to]);
  const generated = useMemo(
    () => (scope === 'exact' ? exact : generateRedirectRule(base, from, to, scope)),
    [base, from, to, scope, exact],
  );
  const rule = generated.ok ? generated.rule : base;
  const valid = generated.ok && validateRule(rule).valid;
  const candidate = testUrl ?? (generated.ok ? generated.source : from);
  const normalizedCandidate = normalizeTestUrl(candidate);
  const preview = useMatchPreview(rule, normalizedCandidate);
  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({ ...rule, name: initialRule?.name ?? rule.name, enabled });
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, t('createRuleError')));
    } finally {
      setSaving(false);
    }
  };
  const requestClose = () => {
    if (saving) return;
    if (
      from !== (initial?.source ?? initialFrom) ||
      to !== (initial?.target ?? '') ||
      scope !== (initial?.scope ?? 'exact') ||
      enabled !== (initialRule?.enabled ?? true)
    )
      setDiscarding(true);
    else onClose();
  };
  if (discarding)
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) setDiscarding(false);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('unsavedTitle')}</DialogTitle>
            <DialogDescription>{t('unsavedDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscarding(false)}>
              {t('keepEditing')}
            </Button>
            <Button variant="destructive" onClick={onClose}>
              {t('discardChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{initialRule ? copy.edit : copy.title}</DialogTitle>
          <DialogDescription>{copy.intro}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="redirect-from">{copy.from}</FieldLabel>
            <Input
              id="redirect-from"
              type="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://example.com/page"
              value={from}
              disabled={saving}
              onChange={(event) => setFrom(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="redirect-to">{copy.to}</FieldLabel>
            <Input
              id="redirect-to"
              type="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://other.example/page"
              value={to}
              disabled={saving}
              onChange={(event) => setTo(event.target.value)}
            />
          </Field>
          <fieldset className="flex flex-col gap-2" disabled={saving}>
            <legend className="mb-2 text-sm font-medium">{copy.matchRule}</legend>
            {(['exact', 'host'] as const).map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="redirect-scope"
                  value={value}
                  checked={scope === value}
                  disabled={value === 'host' && !(exact.ok && exact.hostAvailable) && scope !== 'host'}
                  onChange={() => setScope(value)}
                />
                {copy[value]}
                {value === 'host' && exact.ok && exact.hostAvailable ? (
                  <span className="min-w-0 break-all text-muted-foreground">
                    {new URL(exact.source).origin}
                  </span>
                ) : null}
              </label>
            ))}
          </fieldset>
          {from && to && !generated.ok ? (
            <p role="alert" className="text-sm text-destructive">
              {copy[generated.error]}
            </p>
          ) : null}
          {generated.ok ? (
            <section
              className="flex flex-col gap-3 rounded-lg border bg-muted/25 p-4"
              aria-label={copy.generated}
            >
              <h2 className="text-sm font-medium">{copy.generated}</h2>
              <p className="text-sm text-muted-foreground">{scope === 'host' ? copy.hostHelp : copy.scope}</p>
              <div className="text-sm">
                <p className="font-medium">{copy.redirectRule}</p>
                <p className="mt-1 font-mono break-all">
                  {scope === 'host'
                    ? `${new URL(generated.source).hostname} → ${new URL(generated.target).hostname}`
                    : generated.target}
                </p>
              </div>
              {initialRule && !initial ? (
                <div className="space-y-2 rounded-md border p-3 text-sm">
                  <p>{copy.replacement}</p>
                  <p className="font-medium">{copy.before}</p>
                  <pre className="text-xs break-all whitespace-pre-wrap">
                    {JSON.stringify(
                      { condition: initialRule.condition, action: initialRule.action },
                      null,
                      2,
                    )}
                  </pre>
                  <p className="font-medium">{copy.after}</p>
                  <pre className="text-xs break-all whitespace-pre-wrap">
                    {JSON.stringify({ condition: rule.condition, action: rule.action }, null, 2)}
                  </pre>
                </div>
              ) : null}
              {!valid ? (
                <p role="alert" className="text-sm text-destructive">
                  {copy.invalid}
                </p>
              ) : null}
              <Field>
                <FieldLabel htmlFor="redirect-test">{copy.test}</FieldLabel>
                <Input
                  id="redirect-test"
                  value={candidate}
                  spellCheck={false}
                  onChange={(event) => setTestUrl(event.target.value)}
                />
              </Field>
              <div role="status" className="text-sm break-all" aria-live="polite">
                {!valid ? (
                  copy.invalid
                ) : preview.status === 'ready' ? (
                  preview.result.matched ? (
                    <>
                      <span className="font-medium">{copy.match}</span>
                      <p className="mt-1 font-mono">{preview.result.result}</p>
                    </>
                  ) : (
                    copy.miss
                  )
                ) : (
                  t(
                    preview.status === 'pending'
                      ? 'previewPending'
                      : preview.status === 'timeout'
                        ? 'previewTimeout'
                        : 'previewError',
                  )
                )}
              </div>
              <details>
                <summary className="cursor-pointer text-sm">{copy.examples}</summary>
                <RedirectTestRow
                  rule={rule}
                  initialUrl={new URL('/another-page?example=1', generated.source).href}
                />
                <RedirectTestRow rule={rule} initialUrl={generated.target} />
              </details>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="redirect-enabled">{t('enabled')}</FieldLabel>
                <Switch
                  id="redirect-enabled"
                  checked={enabled}
                  disabled={saving}
                  onCheckedChange={setEnabled}
                />
              </Field>
            </section>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={requestClose}>
            {t('cancel')}
          </Button>
          <Button disabled={!valid || saving} onClick={() => void save()}>
            {saving ? t('saving') : initialRule ? copy.apply : copy.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RedirectTestRow({ rule, initialUrl }: { rule: Rule; initialUrl: string }) {
  const { locale, t } = useI18n();
  const copy = redirectBuilderCopy[locale];
  const [value, setValue] = useState<string | null>(null);
  const candidate = value ?? initialUrl;
  const preview = useMatchPreview(rule, normalizeTestUrl(candidate));
  return (
    <div className="mt-3 space-y-2">
      <Input
        aria-label={`${copy.examples}: ${initialUrl}`}
        value={candidate}
        onChange={(event) => setValue(event.target.value)}
      />
      <p className="text-sm break-all" role="status">
        {preview.status === 'ready'
          ? preview.result.matched
            ? `${copy.match}: ${preview.result.result}`
            : copy.miss
          : t(
              preview.status === 'timeout'
                ? 'previewTimeout'
                : preview.status === 'error'
                  ? 'previewError'
                  : 'previewPending',
            )}
      </p>
    </div>
  );
}

function normalizeTestUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    url.hash = '';
    return url.href;
  } catch {
    return value;
  }
}
