import { LanguagesIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/ui/components/dropdown-menu';
import { useI18n, type LocalePreference } from '@/ui/i18n';
import { errorMessage } from '@/ui/lib/error-message';

const choices: Array<{ value: LocalePreference; label: string }> = [
  { value: 'system', label: '' },
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '日本語' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
];

export function LanguageMenu() {
  const { preference, setPreference, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="w-full justify-start max-[1049px]:size-9 max-[1049px]:justify-center max-[1049px]:p-0"
          variant="ghost"
          aria-label={t('language')}
        >
          <LanguagesIcon data-icon="inline-start" />
          <span className="truncate max-[1049px]:sr-only">{t('language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-52">
        <DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) =>
            void setPreference(value as LocalePreference).catch((error: unknown) =>
              toast.error(errorMessage(error, t('languageChangeError'))),
            )
          }
        >
          {choices.map((choice) => (
            <DropdownMenuRadioItem key={choice.value} value={choice.value}>
              {choice.value === 'system' ? t('systemLanguage') : choice.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
