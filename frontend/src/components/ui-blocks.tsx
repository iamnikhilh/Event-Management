import { Button } from "@/components/ui/button";
import { Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "primary" | "success" | "warning" | "muted";
  className?: string;
}) {
  const tones = {
    default: "from-primary/10 to-primary/5 text-primary",
    primary: "from-primary/15 to-primary/5 text-primary",
    success: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
    warning: "from-amber-500/15 to-amber-500/5 text-amber-600",
    muted: "from-muted to-muted/50 text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl",
          tones[tone],
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={cn("rounded-xl bg-gradient-to-br p-2.5", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export function Panel({
  children,
  className,
  noPadding,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm",
        !noPadding && "p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-card/60 p-3 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card/80 p-8 text-sm text-muted-foreground backdrop-blur-sm">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card/50 px-8 py-14 text-center backdrop-blur-sm">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} className="rounded-full">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorBlock({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
      {msg}
    </div>
  );
}
