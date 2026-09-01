import { ArchiveRestoreIcon, DatabaseBackupIcon, SettingsIcon } from 'lucide-react';

import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/ui/components/dropdown-menu';
import { useI18n } from '@/ui/i18n';
import { cn } from '@/ui/lib/utils';

type SettingsMenuProps = {
  compact?: boolean;
  migrationCount: number;
  onOpenData: () => void;
  onOpenMigration: () => void;
};

export function SettingsMenu({
  compact = false,
  migrationCount,
  onOpenData,
  onOpenMigration,
}: SettingsMenuProps) {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            compact
              ? 'size-9 p-0'
              : 'w-full justify-start max-[1049px]:size-9 max-[1049px]:justify-center max-[1049px]:p-0',
          )}
          variant={compact ? 'outline' : 'ghost'}
          aria-label={t('settings')}
        >
          <SettingsIcon data-icon="inline-start" />
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
          <DropdownMenuItem onSelect={onOpenMigration}>
            <ArchiveRestoreIcon />
            {t('legacyMigration')}
            {migrationCount > 0 ? (
              <Badge className="ml-auto" variant="warning">
                {migrationCount > 99 ? '99+' : migrationCount}
              </Badge>
            ) : null}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
