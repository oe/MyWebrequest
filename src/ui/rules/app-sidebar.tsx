import { ArchiveRestoreIcon, ListFilterIcon, ShieldCheckIcon } from 'lucide-react';

import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Separator } from '@/ui/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/components/tooltip';
import { useI18n } from '@/ui/i18n';
import { LanguageMenu } from '@/ui/i18n/language-menu';
import { SettingsMenu } from '@/ui/settings/settings-menu';

export type OptionsView = 'rules' | 'migration' | 'data';

type AppSidebarProps = {
  view: OptionsView;
  migrationCount: number;
  migrationAvailable: boolean;
  showMigration: boolean;
  onViewChange: (view: OptionsView) => void;
};

export function AppSidebar({
  view,
  migrationCount,
  migrationAvailable,
  showMigration,
  onViewChange,
}: AppSidebarProps) {
  const { t } = useI18n();
  const items = [
    { id: 'rules', label: t('rules'), icon: ListFilterIcon },
    ...(showMigration
      ? ([{ id: 'migration', label: t('legacyMigration'), icon: ArchiveRestoreIcon }] as const)
      : []),
  ] as const;
  return (
    <aside
      data-material="glass-sidebar"
      className="flex min-h-0 flex-col border-r p-3 max-[1049px]:items-center max-[799px]:hidden"
    >
      <nav aria-label={t('primaryNavigation')} className="flex w-full flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          const count = item.id === 'migration' ? migrationCount : 0;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  aria-current={active ? 'page' : undefined}
                  className="relative w-full justify-start max-[1049px]:size-9 max-[1049px]:justify-center max-[1049px]:p-0"
                  variant={active ? 'secondary' : 'ghost'}
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon data-icon="inline-start" />
                  <span className="max-[1049px]:sr-only">{item.label}</span>
                  {count > 0 ? (
                    <Badge
                      className="ml-auto max-[1049px]:absolute max-[1049px]:-top-1 max-[1049px]:-right-1"
                      variant="warning"
                    >
                      {count > 99 ? '99+' : count}
                    </Badge>
                  ) : null}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="min-[1050px]:hidden" side="right">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      <div className="mt-auto flex w-full flex-col gap-3">
        <LanguageMenu />
        <SettingsMenu
          migrationCount={migrationCount}
          showMigration={migrationAvailable}
          onOpenData={() => onViewChange('data')}
          onOpenMigration={() => onViewChange('migration')}
        />
        <Separator />
        <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground max-[1049px]:justify-center max-[1049px]:px-0">
          <ShieldCheckIcon className="size-4" aria-hidden="true" />
          <span className="max-[1049px]:sr-only">{t('localOnly')}</span>
        </div>
      </div>
    </aside>
  );
}
