import { ListFilterIcon, ShieldCheckIcon } from 'lucide-react';

import { Button } from '@/ui/components/button';
import { Separator } from '@/ui/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/components/tooltip';

export function AppSidebar() {
  return (
    <aside
      data-material="glass-sidebar"
      className="flex min-h-0 flex-col border-r p-3 max-[1049px]:items-center max-[799px]:hidden"
    >
      <nav aria-label="Primary" className="flex w-full flex-col gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-current="page"
              className="w-full justify-start max-[1049px]:size-9 max-[1049px]:justify-center max-[1049px]:p-0"
              variant="secondary"
            >
              <ListFilterIcon data-icon="inline-start" />
              <span className="max-[1049px]:sr-only">Rules</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="min-[1050px]:hidden" side="right">
            Rules
          </TooltipContent>
        </Tooltip>
      </nav>
      <div className="mt-auto flex w-full flex-col gap-3">
        <Separator />
        <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground max-[1049px]:justify-center max-[1049px]:px-0">
          <ShieldCheckIcon className="size-4" aria-hidden="true" />
          <span className="max-[1049px]:sr-only">Manifest V3 · Local only</span>
        </div>
      </div>
    </aside>
  );
}
