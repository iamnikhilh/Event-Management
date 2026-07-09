import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, eventsApi } from "@/lib/api";
import { PageHeader, LoadingBlock, ErrorBlock } from "@/components/ui-blocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarPlus, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary",
  active: "bg-green-500/10 text-green-700",
  completed: "bg-muted text-muted-foreground",
  draft: "bg-amber-500/10 text-amber-700",
  cancelled: "bg-destructive/10 text-destructive",
};

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
    draft: 0, upcoming: 0, active: 0, completed: 0, cancelled: 0,
  };
  const cards = [
    { label: "Upcoming", value: byStatus.upcoming ?? 0, tone: "text-primary" },
    { label: "Active", value: byStatus.active ?? 0, tone: "text-green-600" },
    { label: "Completed", value: byStatus.completed ?? 0, tone: "text-muted-foreground" },
    { label: "Draft", value: byStatus.draft ?? 0, tone: "text-amber-600" },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        description="A live pulse on everything you're running."
        action={
          <Button asChild>
            <Link to="/dashboard/events/new">
              <CalendarPlus className="mr-1 h-4 w-4" /> New event
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-semibold ${c.tone}`}>{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent events</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.isLoading && <LoadingBlock />}
            {recent.error && <ErrorBlock error={recent.error} />}
            {recent.data && recent.data.items.length === 0 && (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            )}
            <ul className="divide-y">
              {recent.data?.items.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <Link
                      to="/dashboard/events/$id"
                      params={{ id: e.id }}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {e.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {new Date(e.eventDate).toLocaleString()} · {e.venue || "TBD"}
                    </div>
                  </div>
                  <Badge variant="secondary" className={STATUS_COLORS[e.status]}>
                    {e.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top events</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.isLoading && <LoadingBlock />}
            {overview.error && <ErrorBlock error={overview.error} />}
            <ul className="space-y-3">
              {overview.data?.top5Events?.map((t) => (
                <li key={t.eventId} className="flex items-center justify-between">
                  <Link
                    to="/dashboard/events/$id"
                    params={{ id: t.eventId }}
                    className="truncate text-sm hover:underline"
                  >
                    {t.title}
                  </Link>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    {t.attendance}
                  </span>
                </li>
              )) ?? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
