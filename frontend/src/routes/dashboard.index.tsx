import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, eventsApi } from "@/lib/api";
import {
  PageHeader,
  LoadingBlock,
  ErrorBlock,
  StatCard,
  Panel,
  PanelHeader,
} from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarPlus,
  TrendingUp,
  Zap,
  CheckCircle2,
  FileEdit,
  ArrowUpRight,
} from "lucide-react";
import { STATUS_STYLES, statusLabel } from "@/components/public/event-utils";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const overview = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => analyticsApi.overview(),
  });
  const recent = useQuery({
    queryKey: ["events", { page: 1, limit: 5 }],
    queryFn: () => eventsApi.list({ page: 1, limit: 5 }),
  });

  const byStatus = overview.data?.eventsByStatus ?? {
    draft: 0,
    upcoming: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  };

  return (
    <div>
      <PageHeader
        title="Overview"
        description="A live pulse on everything you're running."
        action={
          <Button asChild className="rounded-full shadow-sm shadow-primary/20">
            <Link to="/dashboard/events/new">
              <CalendarPlus className="mr-1.5 h-4 w-4" /> New event
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming" value={byStatus.upcoming ?? 0} icon={Zap} tone="primary" />
        <StatCard label="Active" value={byStatus.active ?? 0} icon={TrendingUp} tone="success" />
        <StatCard
          label="Completed"
          value={byStatus.completed ?? 0}
          icon={CheckCircle2}
          tone="muted"
        />
        <StatCard label="Draft" value={byStatus.draft ?? 0} icon={FileEdit} tone="warning" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Recent events" description="Your latest activity" />
          {recent.isLoading && <LoadingBlock />}
          {recent.error && <ErrorBlock error={recent.error} />}
          {recent.data && recent.data.items.length === 0 && (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          )}
          <ul className="divide-y divide-border/60">
            {recent.data?.items.map((e) => (
              <li key={e.id}>
                <Link
                  to="/dashboard/events/$id"
                  params={{ id: e.id }}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-xl"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium group-hover:text-primary">
                      {e.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.eventDate).toLocaleString()} · {e.venue || "TBD"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={STATUS_STYLES[e.status] ?? STATUS_STYLES.upcoming}
                    >
                      {statusLabel(e.status)}
                    </Badge>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Top events" description="By attendance" />
          {overview.isLoading && <LoadingBlock />}
          {overview.error && <ErrorBlock error={overview.error} />}
          <ul className="space-y-3">
            {overview.data?.top5Events?.map((t, i) => (
              <li key={t.eventId}>
                <Link
                  to="/dashboard/events/$id"
                  params={{ id: t.eventId }}
                  className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/40"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm group-hover:text-primary">
                    {t.title}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {t.attendance}
                  </span>
                </Link>
              </li>
            )) ?? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
