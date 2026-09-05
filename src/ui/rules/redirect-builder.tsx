import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createRule } from '@/application/rule-service';
import { generateRedirectRule } from '@/application/redirect-generator';
import type { Rule } from '@/domain/rules/model';
import { validateRule } from '@/domain/rules/validate';
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
  onClose,
  onSave,
  onAdvanced,
}: {
  initialFrom?: string;
  onClose: () => void;
  onSave: (rule: Rule) => Promise<void>;
  onAdvanced: () => void;
}) {
  const { locale, t } = useI18n();
  const copy = redirectBuilderCopy[locale];
  const [base] = useState(() => createRule());
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState('');
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const [pattern, setPattern] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const generated = useMemo(() => generateRedirectRule(base, from, to), [base, from, to]);
  const rule = useMemo(() => {
    if (!generated.ok) return base;
    return pattern === null
      ? generated.rule
      : {
          ...generated.rule,
          condition: { ...generated.rule.condition, url: { kind: 'regex' as const, value: pattern } },
        };
  }, [base, generated, pattern]);
  const valid = generated.ok && validateRule(rule).valid;
  const candidate = testUrl ?? (generated.ok ? generated.source : from);
  const normalizedCandidate = useMemo(() => {
    try {
      const url = new URL(candidate.trim());
      url.hash = '';
      return url.href;
    } catch {
      return candidate;
    }
  }, [candidate]);
  const preview = useMatchPreview(rule, normalizedCandidate);
  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave(rule);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, t('createRuleError')));
    } finally {
      setSaving(false);
    }
  };
  const requestClose = () => {
    if (saving) return;
    if (from || to) setDiscarding(true);
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
          <DialogTitle>{copy.title}</DialogTitle>
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
              <p className="text-sm text-muted-foreground">
                {pattern === null ? copy.scope : t('testRuleDescription')}
              </p>
              <details>
                <summary className="cursor-pointer text-sm">{copy.adjust}</summary>
                <Input
                  className="mt-2 font-mono text-xs"
                  aria-label={copy.adjust}
                  value={rule.condition.url.value}
                  disabled={saving}
                  onChange={(event) => setPattern(event.target.value)}
                />
                {pattern !== null ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => {
                      setPattern(null);
                      setTestUrl(null);
                    }}
                  >
                    {copy.reset}
                  </Button>
                ) : null}
              </details>
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
              <p className="text-xs text-muted-foreground">{copy.inactive}</p>
            </section>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={requestClose}>
            {t('cancel')}
          </Button>
          <Button disabled={!valid || saving} onClick={() => void save()}>
            {saving ? t('saving') : copy.save}
          </Button>
        </DialogFooter>
        <Button
          variant="link"
          className="justify-self-start px-0"
          disabled={saving || (generated.ok && !valid)}
          onClick={() => {
            if (valid) void save();
            else {
              onClose();
              onAdvanced();
            }
          }}
        >
          {copy.advanced}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
