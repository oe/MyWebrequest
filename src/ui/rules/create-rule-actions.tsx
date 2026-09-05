import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  PlusIcon,
  ShieldBanIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import type { OtherRuleKind } from '@/application/rule-service';
import { Button } from '@/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/components/dropdown-menu';
import { useI18n } from '@/ui/i18n';

export function CreateRuleActions({
  onRedirect,
  onOther,
  disabled = false,
}: {
  onRedirect: () => void;
  onOther: (kind: OtherRuleKind) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled={disabled} onClick={onRedirect}>
        <PlusIcon data-icon="inline-start" />
        {t('newRule')}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled}>
            {t('otherRules')}
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onOther('block')}>
              <ShieldBanIcon />
              {t('blockRequest')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOther('upgrade-scheme')}>
              <ArrowUpRightIcon />
              {t('upgradeHttps')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOther('modify-request-headers')}>
              <SlidersHorizontalIcon />
              {t('modifyRequestHeader')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
