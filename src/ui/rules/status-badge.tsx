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

const statusConfig: Record<
  RuleStatus,
  {
    label: string;
    icon: typeof CircleCheckIcon;
    variant: 'success' | 'warning' | 'destructive' | 'muted' | 'outline';
  }
> = {
  active: { label: 'Active', icon: CircleCheckIcon, variant: 'success' },
  disabled: { label: 'Disabled', icon: CircleDashedIcon, variant: 'muted' },
  'needs-permission': { label: 'Permission', icon: KeyRoundIcon, variant: 'warning' },
  invalid: { label: 'Invalid', icon: TriangleAlertIcon, variant: 'destructive' },
  unsupported: { label: 'Unsupported', icon: BanIcon, variant: 'destructive' },
  'review-required': { label: 'Needs review', icon: TriangleAlertIcon, variant: 'warning' },
  removed: { label: 'Removed', icon: CircleOffIcon, variant: 'muted' },
};

export function StatusBadge({ status }: { status: RuleStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon data-icon="inline-start" />
      {config.label}
    </Badge>
  );
}
