import {
  ArrowRightLeftIcon,
  BookOpenIcon,
  ListPlusIcon,
  PlusIcon,
  ShieldBanIcon,
  WandSparklesIcon,
} from 'lucide-react';

import type { StarterRuleKind } from '@/application/rule-service';
import { Button } from '@/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/components/empty';
import { helpUrl } from '@/ui/help-links';
import { useI18n } from '@/ui/i18n';

type EmptyRulesProps = {
  onCreate: () => void;
  onCreateStarter: (kind: StarterRuleKind) => void;
};

const starters = [
  {
    kind: 'block-analytics',
    icon: ShieldBanIcon,
    title: 'starterBlockTitle',
    description: 'starterBlockDescription',
  },
  {
    kind: 'redirect-local',
    icon: ArrowRightLeftIcon,
    title: 'starterRedirectTitle',
    description: 'starterRedirectDescription',
  },
  {
    kind: 'remove-referrer',
    icon: WandSparklesIcon,
    title: 'starterHeaderTitle',
    description: 'starterHeaderDescription',
  },
] as const;

export function EmptyRules({ onCreate, onCreateStarter }: EmptyRulesProps) {
  const { locale, t } = useI18n();
  return (
    <section className="col-span-2 grid place-items-center overflow-auto p-6 max-[799px]:col-span-1">
      <Empty className="max-w-2xl border-0 py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-10 rounded-xl">
            <ListPlusIcon className="size-5" aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle className="text-xl">
            <h1 id="empty-rules-title">{t('noRules')}</h1>
          </EmptyTitle>
          <EmptyDescription>{t('noRulesDescription')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-xl gap-3">
          <div className="grid w-full grid-cols-3 gap-2 max-[639px]:grid-cols-1">
            {starters.map((starter) => {
              const Icon = starter.icon;
              return (
                <Button
                  key={starter.kind}
                  className="h-auto min-h-24 flex-col items-start justify-start gap-2 p-3 text-left whitespace-normal"
                  variant="outline"
                  onClick={() => onCreateStarter(starter.kind)}
                >
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium">{t(starter.title)}</span>
                  <span className="text-xs leading-4 font-normal text-muted-foreground">
                    {t(starter.description)}
                  </span>
                </Button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1">
            <Button variant="ghost" onClick={onCreate}>
              <PlusIcon data-icon="inline-start" />
              {t('createBlankRule')}
            </Button>
            <Button asChild variant="link">
              <a href={helpUrl(locale)} target="_blank" rel="noreferrer">
                <BookOpenIcon data-icon="inline-start" />
                {t('learnRuleBasics')}
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('starterRulesDisabled')}</p>
        </EmptyContent>
      </Empty>
    </section>
  );
}
