import { useState } from 'react';
import { UpgradeDialog } from '@/ui/migration/upgrade-guide';
import { upgradeCopy } from '@/ui/migration/upgrade-guide-copy';
import {
  ArchiveRestoreIcon,
  BookOpenIcon,
  DatabaseBackupIcon,
  ExternalLinkIcon,
  SettingsIcon,
} from 'lucide-react';

import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/ui/components/dropdown-menu';
import { useI18n } from '@/ui/i18n';
import { helpUrl } from '@/ui/help-links';
import { cn } from '@/ui/lib/utils';
import { ThemeMenu } from '@/ui/theme';

type SettingsMenuProps = {
  compact?: boolean;
  migrationCount: number;
  showMigration: boolean;
  onOpenData: () => void;
  onOpenMigration: () => void;
};

export function SettingsMenu({
  compact = false,
  migrationCount,
  showMigration,
  onOpenData,
  onOpenMigration,
}: SettingsMenuProps) {
  const { locale, t } = useI18n();
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <UpgradeDialog open={guideOpen} onClose={() => setGuideOpen(false)} onReview={onOpenMigration} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={cn(
              compact
                ? 'size-9 p-0'
                : 'w-full justify-start max-[1049px]:mx-auto max-[1049px]:size-9 max-[1049px]:justify-center max-[1049px]:p-0',
            )}
            variant={compact ? 'outline' : 'ghost'}
            aria-label={t('settings')}
          >
            <SettingsIcon aria-hidden="true" />
            <span className={compact ? 'sr-only' : 'truncate max-[1049px]:sr-only'}>{t('settings')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={compact ? 'bottom' : 'right'} align="end" className="w-56">
          <DropdownMenuLabel>{t('settings')}</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={onOpenData}>
              <DatabaseBackupIcon />
              {t('dataManagement')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={helpUrl(locale)} target="_blank" rel="noreferrer">
                <BookOpenIcon />
                {t('helpCenter')}
                <ExternalLinkIcon className="ml-auto size-3 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
            <ThemeMenu variant="sub" />
            {showMigration ? (
              <DropdownMenuItem onSelect={() => setGuideOpen(true)}>
                {upgradeCopy[locale].guide}
              </DropdownMenuItem>
            ) : null}
            {showMigration ? (
              <DropdownMenuItem onSelect={onOpenMigration}>
                <ArchiveRestoreIcon />
                {t('legacyMigration')}
                {migrationCount > 0 ? (
                  <Badge className="ml-auto" variant="warning">
                    {migrationCount > 99 ? '99+' : migrationCount}
                  </Badge>
                ) : null}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <a href="https://forth.ink/" target="_blank" rel="noopener noreferrer">
                <span className="text-muted-foreground">by</span>
                <span className="publisher-name">frothink</span>
                <ExternalLinkIcon className="ml-auto size-3 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
