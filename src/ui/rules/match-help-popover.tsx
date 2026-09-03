import { CircleHelpIcon, ExternalLinkIcon } from 'lucide-react';

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
    </div>
  );
}

function CaptureHelp({ kind, t }: { kind: Exclude<MatchKind, 'url-filter'>; t: Translate }) {
  const wildcard = kind === 'wildcard';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 rounded-md bg-muted p-2.5 text-xs">
        <code className="font-mono text-foreground">
          {wildcard ? 'https://example.com/*/file/*' : '^https://example\\.com/(users|projects)/(.+)$'}
        </code>
        <span className="text-muted-foreground">{t(wildcard ? 'wildcardExample' : 'regexExample')}</span>
      </div>
      <div className="flex flex-col gap-1 rounded-md bg-muted p-2.5 text-xs">
        <span className="text-muted-foreground">{t('redirectDestinationExample')}</span>
        <code className="font-mono text-foreground">https://new.example.com/$1/$2</code>
      </div>
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
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))]">
        <PopoverHeader>
          <PopoverTitle>{t('matchSyntaxTitle')}</PopoverTitle>
          <PopoverDescription>{description}</PopoverDescription>
        </PopoverHeader>
        {kind === 'url-filter' ? <UrlFilterHelp t={t} /> : <CaptureHelp kind={kind} t={t} />}
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
