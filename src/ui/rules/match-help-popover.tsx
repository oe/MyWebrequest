import { CheckIcon, CircleHelpIcon, ExternalLinkIcon, XIcon } from 'lucide-react';

import type { Rule } from '@/domain/rules/model';
import { Button } from '@/ui/components/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/ui/components/popover';
import { helpUrl } from '@/ui/help-links';
import { useI18n, type Translate } from '@/ui/i18n';

type MatchKind = Rule['condition']['url']['kind'];

function OutcomeExamples({ matches, misses, t }: { matches: string[]; misses: string[]; t: Translate }) {
  return (
    <div className="grid gap-2 text-xs">
      <div className="grid gap-1.5">
        <span className="font-medium text-foreground">{t('ruleMatches')}</span>
        {matches.map((url) => (
          <span key={url} className="flex min-w-0 items-start gap-2 text-muted-foreground">
            <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
            <code className="font-mono break-all">{url}</code>
          </span>
        ))}
      </div>
      <div className="grid gap-1.5">
        <span className="font-medium text-foreground">{t('noMatch')}</span>
        {misses.map((url) => (
          <span key={url} className="flex min-w-0 items-start gap-2 text-muted-foreground">
            <XIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden="true" />
            <code className="font-mono break-all">{url}</code>
          </span>
        ))}
      </div>
    </div>
  );
}

function UrlFilterHelp({ t }: { t: Translate }) {
  const symbols = [
    ['||', t('urlFilterDomainAnchor')],
    ['^', t('urlFilterSeparator')],
    ['*', t('urlFilterWildcard')],
    ['|…|', t('urlFilterExact')],
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
        {symbols.map(([symbol, meaning]) => (
          <div key={symbol} className="contents">
            <dt>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold">{symbol}</code>
            </dt>
            <dd className="text-muted-foreground">{meaning}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1 rounded-md bg-muted p-2.5 text-xs">
        <code className="font-mono text-foreground">||example.com^</code>
        <span className="text-muted-foreground">{t('urlFilterExample')}</span>
      </div>
      <OutcomeExamples
        t={t}
        matches={['https://example.com/app.js', 'https://cdn.example.com/assets/app.css']}
        misses={['https://example.company/app.js', 'https://notexample.com/app.js']}
      />
      <p className="text-xs text-muted-foreground">{t('urlFilterNotPermissionPattern')}</p>
    </div>
  );
}

function WildcardHelp({ t }: { t: Translate }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 rounded-md bg-muted p-2.5 text-xs">
        <code className="font-mono break-all text-foreground">https://example.com/*/file/*</code>
        <span className="text-muted-foreground">{t('wildcardExample')}</span>
      </div>
      <div className="flex flex-col gap-1 rounded-md bg-muted p-2.5 text-xs">
        <span className="text-muted-foreground">{t('redirectDestinationExample')}</span>
        <code className="font-mono break-all text-foreground">https://new.example.com/$1/$2</code>
      </div>
      <OutcomeExamples
        t={t}
        matches={['https://example.com/users/file/42']}
        misses={['http://example.com/users/file/42', 'https://example.com/users/42']}
      />
      <p className="text-xs text-muted-foreground">{t('wildcardCaptureHelp')}</p>
    </div>
  );
}

function RegexHelp({ t }: { t: Translate }) {
  const symbols = [
    ['^', t('regexStartAnchor')],
    ['\\.', t('regexLiteralDot')],
    ['(…)', t('regexCaptureGroup')],
    ['.*', t('regexAnyText')],
    ['$', t('regexEndAnchor')],
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
        {symbols.map(([symbol, meaning]) => (
          <div key={symbol} className="contents">
            <dt>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold">{symbol}</code>
            </dt>
            <dd className="text-muted-foreground">{meaning}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1 rounded-md bg-muted p-2.5 text-xs">
        <code className="font-mono break-all text-foreground">
          ^https://api\.example\.com/v1/(users|projects)/([^?]+)$
        </code>
        <span className="text-muted-foreground">{t('regexExample')}</span>
      </div>
      <div className="flex flex-col gap-1 rounded-md bg-muted p-2.5 text-xs">
        <span className="text-muted-foreground">{t('redirectDestinationExample')}</span>
        <code className="font-mono break-all text-foreground">https://api.example.com/v2/$1/$2</code>
      </div>
      <OutcomeExamples
        t={t}
        matches={['https://api.example.com/v1/projects/alpha']}
        misses={[
          'https://api.example.com/v1/teams/alpha',
          'https://api.example.com/v1/projects/alpha?draft=1',
        ]}
      />
      <p className="text-xs text-muted-foreground">{t('captureReferenceHelp')}</p>
    </div>
  );
}

export function MatchHelpPopover({ kind }: { kind: MatchKind }) {
  const { locale, t } = useI18n();
  const description =
    kind === 'url-filter' ? t('urlFilterHelp') : kind === 'wildcard' ? t('wildcardHelp') : t('regexHelp');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-xs" aria-label={t('matchSyntaxHelpLabel')}>
          <CircleHelpIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[min(32rem,calc(100vh-2rem))] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto"
      >
        <PopoverHeader>
          <PopoverTitle>
            {t(
              kind === 'url-filter'
                ? 'urlFilterSyntaxTitle'
                : kind === 'wildcard'
                  ? 'wildcardSyntaxTitle'
                  : 'regexSyntaxTitle',
            )}
          </PopoverTitle>
          <PopoverDescription>{description}</PopoverDescription>
        </PopoverHeader>
        {kind === 'url-filter' ? (
          <UrlFilterHelp t={t} />
        ) : kind === 'wildcard' ? (
          <WildcardHelp t={t} />
        ) : (
          <RegexHelp t={t} />
        )}
        <Button asChild variant="link" size="xs" className="w-fit">
          <a href={helpUrl(locale, 'matching')} target="_blank" rel="noreferrer">
            {t('openMatchingGuide')}
            <ExternalLinkIcon data-icon="inline-end" />
          </a>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
