import { ListPlusIcon, PlusIcon } from 'lucide-react';

import { Button } from '@/ui/components/button';

type EmptyRulesProps = {
  onCreate: () => void;
};

export function EmptyRules({ onCreate }: EmptyRulesProps) {
  return (
    <section
      aria-labelledby="empty-rules-title"
      className="col-span-2 grid place-items-center p-8 text-center max-[799px]:col-span-1"
    >
      <div className="flex max-w-sm flex-col items-center gap-5">
        <div className="grid size-12 place-items-center rounded-2xl border bg-background/60 text-muted-foreground backdrop-blur-sm">
          <ListPlusIcon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 id="empty-rules-title" className="text-xl font-semibold tracking-tight">
            No rules yet
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Create your first rule to redirect, block, or modify matching requests.
          </p>
        </div>
        <Button onClick={onCreate}>
          <PlusIcon data-icon="inline-start" />
          Create first rule
        </Button>
      </div>
    </section>
  );
}
