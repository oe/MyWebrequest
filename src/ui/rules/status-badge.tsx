import {
  BanIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleOffIcon,
  KeyRoundIcon,
  TriangleAlertIcon,
} from 'lucide-react';

import type { RuleStatus } from '@/domain/rules/model';
import { Badge } from '@/ui/components/badge';
import { useI18n } from '@/ui/i18n';
import type { MessageKey } from '@/ui/i18n/messages';

const statusConfig: Record<
  RuleStatus,
  {
    label: MessageKey;
    icon: typeof CircleCheckIcon;
    variant: 'success' | 'warning' | 'destructive' | 'muted' | 'outline';
  }
> = {
  active: { label: 'statusActive', icon: CircleCheckIcon, variant: 'success' },
  disabled: { label: 'statusDisabled', icon: CircleDashedIcon, variant: 'muted' },
  paused: { label: 'statusPaused', icon: CircleOffIcon, variant: 'muted' },
  'needs-permission': { label: 'statusPermission', icon: KeyRoundIcon, variant: 'warning' },
  'not-applied': { label: 'statusNotApplied', icon: CircleDashedIcon, variant: 'warning' },
  'runtime-error': { label: 'statusRuntimeError', icon: TriangleAlertIcon, variant: 'destructive' },
  invalid: { label: 'statusInvalid', icon: TriangleAlertIcon, variant: 'destructive' },
  unsupported: { label: 'statusUnsupported', icon: BanIcon, variant: 'destructive' },
  'review-required': { label: 'statusNeedsReview', icon: TriangleAlertIcon, variant: 'warning' },
  removed: { label: 'statusRemoved', icon: CircleOffIcon, variant: 'muted' },
};

export function StatusBadge({ status }: { status: RuleStatus }) {
  const { t } = useI18n();
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon data-icon="inline-start" />
      {t(config.label)}
    </Badge>
  );
}
