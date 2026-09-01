import { useId } from 'react';

type PermissionScopeProps = {
  label: string;
  origins: readonly string[];
};

export function PermissionScope({ label, origins }: PermissionScopeProps) {
  const labelId = useId();

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/35 p-3">
      <p id={labelId} className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <ul aria-labelledby={labelId} className="flex flex-col gap-1.5">
        {origins.map((origin) => (
          <li key={origin} className="rounded-md border bg-background/55 px-2.5 py-2">
            <code className="block text-xs leading-5 break-all">{origin}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
