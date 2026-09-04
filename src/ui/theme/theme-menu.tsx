import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/components/dropdown-menu';
import { useI18n } from '@/ui/i18n';
import type { ThemePreference } from './core';
import { useTheme } from './context';

const choices = [
  { value: 'system', label: 'systemTheme', icon: LaptopIcon },
  { value: 'light', label: 'lightTheme', icon: SunIcon },
  { value: 'dark', label: 'darkTheme', icon: MoonIcon },
] as const;

function PreferenceIcon({ preference }: { preference: ThemePreference }) {
  const Icon = preference === 'dark' ? MoonIcon : preference === 'light' ? SunIcon : LaptopIcon;
  return <Icon aria-hidden="true" />;
}

function ThemeChoices() {
  const { preference, setPreference } = useTheme();
  const { t } = useI18n();

  return (
    <DropdownMenuRadioGroup
      value={preference}
      onValueChange={(value) => {
        void setPreference(value as ThemePreference).catch(() => toast.error(t('themeChangeError')));
      }}
    >
      {choices.map((choice) => {
        const Icon = choice.icon;
        return (
          <DropdownMenuRadioItem key={choice.value} value={choice.value}>
            <Icon />
            {t(choice.label)}
          </DropdownMenuRadioItem>
        );
      })}
    </DropdownMenuRadioGroup>
  );
}

export function ThemeMenu({ variant = 'standalone' }: { variant?: 'standalone' | 'sub' }) {
  const { preference } = useTheme();
  const { t } = useI18n();

  if (variant === 'sub') {
    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-1.5">
          <PreferenceIcon preference={preference} />
          {t('theme')}
        </DropdownMenuLabel>
        <ThemeChoices />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('theme')}>
          <PreferenceIcon preference={preference} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{t('theme')}</DropdownMenuLabel>
        <ThemeChoices />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
