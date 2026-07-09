import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { analyticsApi } from "@/lib/api";
import { PageHeader, LoadingBlock, ErrorBlock, Panel, PanelHeader, StatCard } from "@/components/ui-blocks";
import { BarChart3, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({
  component: Analytics,
});

function Analytics() {
  const q = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => analyticsApi.overview(),
  });

  const byStatus: Record<string, number> = q.data?.eventsByStatus ?? {};
  const totalEvents = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Portfolio-wide performance across your events."
      />
      {q.isLoading && <LoadingBlock />}
      {q.error && <ErrorBlock error={q.error} />}
      {q.data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <StatCard label="Total events" value={totalEvents} icon={BarChart3} tone="primary" />
            <StatCard
              label="Top attendance"
              value={q.data.top5Events?.[0]?.attendance ?? 0}
              icon={TrendingUp}
              tone="success"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <PanelHeader title="Events by status" />
              <ul className="space-y-3">
                {Object.entries(byStatus).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between">
                    <span className="capitalize text-muted-foreground">{k}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${totalEvents ? ((v as number) / totalEvents) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right font-semibold">{v as number}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <PanelHeader title="Top 5 by attendance" />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={q.data.top5Events ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 260)" />
                    <XAxis
                      dataKey="title"
                      stroke="oklch(0.5 0.03 260)"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis stroke="oklch(0.5 0.03 260)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid oklch(0.92 0.012 260)",
                      }}
                    />
                    <Bar dataKey="attendance" fill="oklch(0.52 0.19 265)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel className="lg:col-span-2">
              <PanelHeader title="Event rankings" />
              <ul className="divide-y divide-border/60">
                {q.data.top5Events?.map((t, i) => (
                  <li key={t.eventId}>
                    <Link
                      to="/dashboard/events/$id"
                      params={{ id: t.eventId }}
                      className="flex items-center gap-4 py-3 transition-colors hover:text-primary"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium">{t.title}</span>
                      <span className="text-sm font-semibold text-primary">
                        {t.attendance} attendees
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
